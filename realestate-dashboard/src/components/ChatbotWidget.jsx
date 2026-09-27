import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProjects } from "../hooks/useProjects";
import { useWorkforce } from "../hooks/useWorkforce";
import { useEntityStore } from "../hooks/useEntityStore";
import "./ChatbotWidget.css";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const ROLE_GREETING = {
  admin: "the whole business — projects, crews, materials, attendance and money in one place",
  engineer: "what's happening on site — tasks, crew, materials and today's log",
  client: "your project, documents and payments",
};

const ROLE_SUGGESTIONS = {
  admin: ["Project status", "Workforce today", "Materials", "Payments received", "Add a staff login"],
  engineer: ["Construction tasks", "Workers on site", "Materials stock", "Today's attendance", "Daily log"],
  client: ["My project status", "My documents", "My payments"],
};

/**
 * A small rule-based assistant. It never asks which role you are — it
 * reads that off the signed-in account and only offers the intents that
 * role has, answering from the same live, locally-stored data the pages
 * use (no invented figures).
 */
export default function ChatbotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const { allProjects } = useProjects();
  const { summary: workforceSummary } = useWorkforce();
  const { records: materials } = useEntityStore("siteflow.materials", "MAT");
  const { records: attendance } = useEntityStore("siteflow.attendance", "ATT");
  const { records: documents } = useEntityStore("siteflow.documents", "DOC");
  const { records: payments } = useEntityStore("siteflow.payments", "PAY");
  const { records: dailyLogs } = useEntityStore("siteflow.dailyLogs", "LOG");
  const { records: tasks } = useEntityStore("siteflow.tasks", "TSK");

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      from: "bot",
      text: `Hi ${user?.name?.split(" ")[0] ?? ""}! I'm the SiteFlow assistant. Ask me about ${
        ROLE_GREETING[role] ?? "your workspace"
      }.`,
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const ctx = useMemo(
    () => ({ user, role, allProjects, workforceSummary, materials, attendance, documents, payments, dailyLogs, tasks }),
    [user, role, allProjects, workforceSummary, materials, attendance, documents, payments, dailyLogs, tasks]
  );

  const intents = useMemo(() => buildIntents(), []);

  function respond(rawText) {
    const text = rawText.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    const lower = text.toLowerCase();

    const match = intents.find(
      (intent) => intent.roles.includes(role) && intent.keywords.some((kw) => lower.includes(kw))
    );

    const reply = match ? match.respond(ctx) : fallback(role);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", ...reply }]);
    }, 220);
    setInput("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    respond(input);
  }

  return (
    <>
      <button
        type="button"
        className={`chatbot-launcher ${open ? "is-hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Open assistant"
      >
        <BotIcon />
      </button>

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-panel__header">
            <div className="chatbot-panel__title">
              <span className="chatbot-panel__avatar">
                <BotIcon />
              </span>
              <div>
                <strong>SiteFlow Assistant</strong>
                <span>Answering as {roleLabel(role)}</span>
              </div>
            </div>
            <button type="button" className="chatbot-panel__close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="chatbot-panel__messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-bubble chatbot-bubble--${m.from}`}>
                <p>{m.text}</p>
                {m.link && (
                  <button
                    type="button"
                    className="chatbot-bubble__link"
                    onClick={() => {
                      navigate(m.link.to);
                      setOpen(false);
                    }}
                  >
                    {m.link.label} →
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="chatbot-panel__suggestions">
            {(ROLE_SUGGESTIONS[role] ?? []).map((s) => (
              <button type="button" key={s} onClick={() => respond(s)}>
                {s}
              </button>
            ))}
          </div>

          <form className="chatbot-panel__input" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your workspace…"
            />
            <button type="submit" aria-label="Send">
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function roleLabel(role) {
  return { admin: "Administrator", engineer: "Site Engineer", client: "Client" }[role] ?? "you";
}

function fallback(role) {
  return {
    text: `I didn't catch that. Try one of the suggestions below — I can only answer on things ${roleLabel(
      role
    )} accounts can see.`,
  };
}

function buildIntents() {
  return [
    {
      id: "greeting",
      roles: ["admin", "engineer", "client"],
      keywords: ["hi", "hello", "hey"],
      respond: (ctx) => ({ text: `Hello ${ctx.user?.name?.split(" ")[0] ?? ""}! What would you like to check?` }),
    },
    {
      id: "help",
      roles: ["admin", "engineer", "client"],
      keywords: ["help", "what can you do", "options"],
      respond: (ctx) => ({
        text: `As ${roleLabel(ctx.role)} you can ask me about: ${(ROLE_SUGGESTIONS[ctx.role] ?? []).join(", ")}.`,
      }),
    },
    {
      id: "thanks",
      roles: ["admin", "engineer", "client"],
      keywords: ["thank"],
      respond: () => ({ text: "Anytime — glad it helped." }),
    },
    {
      id: "projects",
      roles: ["admin"],
      keywords: ["project"],
      respond: (ctx) => {
        if (!ctx.allProjects.length) {
          return { text: "No projects have been added yet.", link: { to: "/projects", label: "Add your first project" } };
        }
        const byStatus = ctx.allProjects.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] ?? 0) + 1;
          return acc;
        }, {});
        const summary = Object.entries(byStatus)
          .map(([status, count]) => `${count} ${status}`)
          .join(", ");
        return {
          text: `You have ${ctx.allProjects.length} project(s): ${summary}.`,
          link: { to: "/projects", label: "Open Projects & Units" },
        };
      },
    },
    {
      id: "workforce",
      roles: ["admin", "engineer"],
      keywords: ["worker", "workforce", "crew", "staff on"],
      respond: (ctx) => ({
        text: ctx.workforceSummary.total
          ? `${ctx.workforceSummary.total} workers on record — ${ctx.workforceSummary.onSite} currently on site, ${ctx.workforceSummary.permanent} permanent, ${ctx.workforceSummary.temporary} temporary, ${ctx.workforceSummary.contractor} contractor.`
          : "No workers have been added yet.",
        link: { to: "/workforce", label: "Open Workforce" },
      }),
    },
    {
      id: "materials",
      roles: ["admin", "engineer"],
      keywords: ["material", "stock", "supply"],
      respond: (ctx) => ({
        text: ctx.materials.length
          ? `${ctx.materials.length} material line(s) recorded across your projects.`
          : "No materials have been logged yet.",
        link: { to: "/materials", label: "Open Materials" },
      }),
    },
    {
      id: "attendance",
      roles: ["admin", "engineer"],
      keywords: ["attendance", "present", "absent"],
      respond: (ctx) => {
        const today = ctx.attendance.filter((a) => a.date === todayISO());
        const present = today.filter((a) => a.status === "Present").length;
        return {
          text: today.length
            ? `Today: ${present} present out of ${today.length} marked entries.`
            : "No attendance has been marked for today yet.",
          link: { to: "/attendance", label: "Open Attendance" },
        };
      },
    },
    {
      id: "dailylog",
      roles: ["admin", "engineer"],
      keywords: ["daily log", "site log", "log entr"],
      respond: (ctx) => ({
        text: ctx.dailyLogs.length
          ? `${ctx.dailyLogs.length} daily log entries recorded so far.`
          : "No daily log entries yet.",
        link: { to: "/daily-log", label: "Open Daily Log" },
      }),
    },
    {
      id: "tasks",
      roles: ["admin", "engineer"],
      keywords: ["task", "construction", "progress"],
      respond: (ctx) => {
        if (!ctx.tasks.length) {
          return { text: "No construction tasks logged yet.", link: { to: "/construction", label: "Open Construction" } };
        }
        const done = ctx.tasks.filter((t) => t.status === "Completed").length;
        return {
          text: `${ctx.tasks.length} construction task(s) tracked, ${done} completed.`,
          link: { to: "/construction", label: "Open Construction" },
        };
      },
    },
    {
      id: "team",
      roles: ["admin"],
      keywords: ["team", "add staff", "add engineer", "create login", "new account"],
      respond: () => ({
        text: "You can create an engineer or admin login from Team & Access — the role is fixed when you create it.",
        link: { to: "/team", label: "Open Team & Access" },
      }),
    },
    {
      id: "documents",
      roles: ["admin", "engineer", "client"],
      keywords: ["document", "file"],
      respond: (ctx) => ({
        text: ctx.documents.length
          ? `${ctx.documents.length} document(s) uploaded.`
          : "No documents uploaded yet.",
        link: { to: "/documents", label: "Open Documents" },
      }),
    },
    {
      id: "financial-admin",
      roles: ["admin"],
      keywords: ["payment", "financial", "money", "revenue"],
      respond: (ctx) => {
        const total = ctx.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return {
          text: ctx.payments.length
            ? `₹${total.toLocaleString("en-IN")} received across ${ctx.payments.length} payment(s).`
            : "No payments recorded yet.",
          link: { to: "/financial", label: "Open Financials" },
        };
      },
    },
    {
      id: "financial-client",
      roles: ["client"],
      keywords: ["payment", "due", "paid", "invoice"],
      respond: () => ({
        text: "Your payment history and outstanding balance are on the Payments page.",
        link: { to: "/financial", label: "Open Payments" },
      }),
    },
    {
      id: "my-project",
      roles: ["client"],
      keywords: ["my project", "status", "progress", "unit"],
      respond: (ctx) => {
        const mine = ctx.allProjects.find(
          (p) => p.client && ctx.user?.name && p.client.toLowerCase().trim() === ctx.user.name.toLowerCase().trim()
        );
        return mine
          ? { text: `${mine.name} is currently "${mine.status}".`, link: { to: "/client-dashboard", label: "Open My Dashboard" } }
          : {
              text: "I can't find a project linked to your name yet — check My Dashboard, or ask your site admin to confirm it's linked.",
              link: { to: "/client-dashboard", label: "Open My Dashboard" },
            };
      },
    },
  ];
}

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M9 17h6" />
      <path d="M2 12h2M20 12h2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}
