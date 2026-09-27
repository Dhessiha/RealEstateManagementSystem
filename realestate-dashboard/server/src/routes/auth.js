import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import bcrypt from "bcryptjs";
import {
  getUsers,
  findUserByEmail,
  findUserByPhoneSuffix,
  insertUser,
  deleteUser,
  seedAdminIfEmpty,
  makeId,
  getCollection,
  insertRecord,
} from "../db.js";
import { signToken, publicUser } from "../auth.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// In-memory OTP store — a real deployment would use an SMS gateway and
// probably Redis; this is fine for a single-process dev/demo server.
const otpStore = new Map(); // phone -> { code, expiresAt }

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function genTempPassword() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 4).toUpperCase();
}

async function ensureSeedDemoData() {
  const adminHash = await bcrypt.hash("admin123", 10);
  await seedAdminIfEmpty({
    id: "USR-ADMIN-0001",
    role: "admin",
    name: "Priya Raghunathan",
    email: "admin@siteflow.demo",
    phone: "+91 90000 00001",
    password: adminHash,
    title: "Managing Director",
    createdAt: new Date().toISOString(),
    demo: true,
  });

  const clientHash = await bcrypt.hash("client123", 10);
  const demoClients = [
    {
      id: "USR-CLIENT-0001",
      role: "client",
      name: "Karthik Selvam",
      email: "karthik@client.demo",
      phone: "+91 98765 00001",
      password: clientHash,
      createdAt: new Date().toISOString(),
      demo: true,
    },
    {
      id: "USR-CLIENT-0002",
      role: "client",
      name: "Meera Iyer",
      email: "meera@client.demo",
      phone: "+91 98765 00002",
      password: clientHash,
      createdAt: new Date().toISOString(),
      demo: true,
    },
    {
      id: "USR-CLIENT-0003",
      role: "client",
      name: "Arun Kumar",
      email: "arun@client.demo",
      phone: "+91 98765 00003",
      password: clientHash,
      createdAt: new Date().toISOString(),
      demo: true,
    },
  ];

  for (const client of demoClients) {
    const existing = await findUserByEmail(client.email);
    if (!existing) {
      await insertUser(client);
    }
  }

  const existingProjects = await getCollection("siteflow.projects");
  const demoProjects = [
    {
      id: "PRJ-DEMO-001",
      name: "Greenfields Villa 402",
      location: "Whitefield, Bangalore",
      type: "Villa",
      status: "In Progress",
      client: "Karthik Selvam",
      clientEmail: "karthik@client.demo",
      clientId: "USR-CLIENT-0001",
      company: "SiteFlow Builders",
      overallProgress: 65,
      startDate: "2025-01-10",
      expectedEnd: "2025-12-15",
      materialResponsibility: "Company",
      unitsTotal: "1",
    },
    {
      id: "PRJ-DEMO-002",
      name: "Skyline Heights - Apt 12B",
      location: "Indiranagar, Bangalore",
      type: "Residential",
      status: "In Progress",
      client: "Meera Iyer",
      clientEmail: "meera@client.demo",
      clientId: "USR-CLIENT-0002",
      company: "SiteFlow Builders",
      overallProgress: 40,
      startDate: "2025-03-01",
      expectedEnd: "2026-04-30",
      materialResponsibility: "Shared",
      unitsTotal: "1",
    },
    {
      id: "PRJ-DEMO-003",
      name: "Palm Grove Residency",
      location: "OMR, Chennai",
      type: "Commercial",
      status: "Nearing Completion",
      client: "Arun Kumar",
      clientEmail: "arun@client.demo",
      clientId: "USR-CLIENT-0003",
      company: "SiteFlow Builders",
      overallProgress: 85,
      startDate: "2024-08-15",
      expectedEnd: "2025-09-30",
      materialResponsibility: "Client",
      unitsTotal: "4",
    },
  ];

  for (const proj of demoProjects) {
    if (!existingProjects.some((p) => p.id === proj.id)) {
      await insertRecord("siteflow.projects", proj);
    }
  }

  // Seed sample tasks/milestones
  const existingTasks = await getCollection("siteflow.tasks");
  const demoTasks = [
    {
      id: "TSK-DEMO-001",
      projectId: "PRJ-DEMO-001",
      title: "Ground Floor Framing & Slab",
      stage: "Foundation",
      status: "Completed",
      isMilestone: true,
      plannedEnd: "2025-03-15",
    },
    {
      id: "TSK-DEMO-002",
      projectId: "PRJ-DEMO-001",
      title: "First Floor Brickwork & Lintels",
      stage: "Structure",
      status: "In Progress",
      isMilestone: true,
      plannedEnd: "2025-06-30",
    },
    {
      id: "TSK-DEMO-003",
      projectId: "PRJ-DEMO-001",
      title: "Electrical Conduit & Piping",
      stage: "Electrical",
      status: "Not Started",
      isMilestone: false,
      plannedEnd: "2025-08-15",
    },
    {
      id: "TSK-DEMO-004",
      projectId: "PRJ-DEMO-002",
      title: "Basement Excavation & PCC",
      stage: "Foundation",
      status: "Completed",
      isMilestone: true,
      plannedEnd: "2025-04-10",
    },
    {
      id: "TSK-DEMO-005",
      projectId: "PRJ-DEMO-002",
      title: "Plinth Beam Concreting",
      stage: "Structure",
      status: "In Progress",
      isMilestone: true,
      plannedEnd: "2025-07-20",
    },
    {
      id: "TSK-DEMO-006",
      projectId: "PRJ-DEMO-003",
      title: "Structural Columns & Roof Slab",
      stage: "Structure",
      status: "Completed",
      isMilestone: true,
      plannedEnd: "2025-02-28",
    },
    {
      id: "TSK-DEMO-007",
      projectId: "PRJ-DEMO-003",
      title: "Exterior Texture & Glazing",
      stage: "Finishing",
      status: "In Progress",
      isMilestone: true,
      plannedEnd: "2025-08-10",
    },
  ];
  for (const task of demoTasks) {
    if (!existingTasks.some((t) => t.id === task.id)) {
      await insertRecord("siteflow.tasks", task);
    }
  }

  // Seed sample requests
  const existingIssues = await getCollection("siteflow.issues");
  const demoIssues = [
    {
      id: "ISS-DEMO-001",
      projectId: "PRJ-DEMO-001",
      subject: "Request for kitchen electrical point modification",
      description: "Need an extra 16A socket point near the island counter.",
      priority: "Medium",
      status: "In Review",
      date: "2025-05-10",
      raisedBy: "Karthik Selvam",
    },
    {
      id: "ISS-DEMO-002",
      projectId: "PRJ-DEMO-002",
      subject: "Balcony tile color shade confirmation",
      description: "Please share catalogue samples for anti-skid balcony tiles.",
      priority: "Low",
      status: "Open",
      date: "2025-05-12",
      raisedBy: "Meera Iyer",
    },
    {
      id: "ISS-DEMO-003",
      projectId: "PRJ-DEMO-003",
      subject: "HVAC duct layout sign-off",
      description: "Approved floor plan HVAC duct locations need final site stamp.",
      priority: "High",
      status: "Resolved",
      date: "2025-04-18",
      raisedBy: "Arun Kumar",
    },
  ];
  for (const issue of demoIssues) {
    if (!existingIssues.some((i) => i.id === issue.id)) {
      await insertRecord("siteflow.issues", issue);
    }
  }

  // Seed sample payments
  const existingPayments = await getCollection("siteflow.payments");
  const demoPayments = [
    {
      id: "PAY-DEMO-001",
      projectId: "PRJ-DEMO-001",
      date: "2025-01-15",
      payerName: "Karthik Selvam",
      amount: "1500000",
      mode: "Bank Transfer",
      note: "Initial booking & foundation milestone payment",
    },
    {
      id: "PAY-DEMO-002",
      projectId: "PRJ-DEMO-002",
      date: "2025-03-05",
      payerName: "Meera Iyer",
      amount: "800000",
      mode: "Bank Transfer",
      note: "Plinth level completion installment",
    },
    {
      id: "PAY-DEMO-003",
      projectId: "PRJ-DEMO-003",
      date: "2024-09-01",
      payerName: "Arun Kumar",
      amount: "2500000",
      mode: "Cheque",
      note: "Commercial unit milestone installment 1",
    },
  ];
  for (const pay of demoPayments) {
    if (!existingPayments.some((p) => p.id === pay.id)) {
      await insertRecord("siteflow.payments", pay);
    }
  }
}

// Seeds on first request rather than at import time, so a MySQL
// connection error surfaces as a normal failed request instead of
// crashing the whole process before it can even start listening.
let seeded = false;
router.use(async (req, res, next) => {
  if (!seeded) {
    seeded = true;
    await ensureSeedDemoData().catch((err) => {
      seeded = false;
      console.error("Could not seed demo accounts and projects:", err.message);
    });
  }
  next();
});

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await findUserByEmail(normalizeEmail(email));
  if (!user) return res.status(401).json({ error: "No account matches that email and password." });
  const ok = await bcrypt.compare(password ?? "", user.password);
  if (!ok) return res.status(401).json({ error: "No account matches that email and password." });
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.post("/signup", asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || "") || !password || password.length < 4) {
    return res.status(400).json({ error: "Check the details and try again." });
  }
  if (await findUserByEmail(normalizeEmail(email))) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  const user = {
    id: makeId("USR"),
    role: "client",
    name: name.trim(),
    email: normalizeEmail(email),
    phone: phone?.trim() || "",
    password: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  await insertUser(user);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

// Demo Google continuation — a real integration verifies an ID token
// from Google server-side. This trusts the client-supplied profile
// instead, since there's no OAuth client configured for this project.
router.post("/google", asyncHandler(async (req, res) => {
  const { name, email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "Missing Google profile." });
  let user = await findUserByEmail(normalizeEmail(email));
  if (!user) {
    user = {
      id: makeId("USR"),
      role: "client",
      name: name || email.split("@")[0],
      email: normalizeEmail(email),
      phone: "",
      provider: "google",
      password: await bcrypt.hash(makeId("PW"), 10),
      createdAt: new Date().toISOString(),
    };
    await insertUser(user);
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.post("/otp/request", (req, res) => {
  const { phone } = req.body ?? {};
  if (!/^\+?[0-9\s]{10,15}$/.test(phone || "")) {
    return res.status(400).json({ error: "Enter a valid mobile number." });
  }
  const code = String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  // No SMS gateway wired up — the code is handed back in the response so
  // the frontend can show it on-screen ("Demo OTP") instead of texting it.
  res.json({ code });
});

router.post("/otp/verify", asyncHandler(async (req, res) => {
  const { phone, code, name } = req.body ?? {};
  const entry = otpStore.get(phone);
  if (!entry || Date.now() > entry.expiresAt) {
    return res.status(400).json({ error: "That code expired — request a new one." });
  }
  if (entry.code !== code) {
    return res.status(400).json({ error: "That code doesn't match." });
  }
  otpStore.delete(phone);
  let user = await findUserByPhoneSuffix((phone || "").replace(/\D/g, "").slice(-10));
  if (!user) {
    user = {
      id: makeId("USR"),
      role: "client",
      name: name?.trim() || `Client ${phone.slice(-4)}`,
      email: "",
      phone,
      provider: "otp",
      password: await bcrypt.hash(makeId("PW"), 10),
      createdAt: new Date().toISOString(),
    };
    await insertUser(user);
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Admin-only: create an engineer/admin login. The role is fixed by the
// admin here — the account holder never chooses it at sign-in.
router.post("/staff", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { name, email, phone, role } = req.body ?? {};
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || "") || !["engineer", "admin"].includes(role)) {
    return res.status(400).json({ error: "Enter a name, a valid email, and a role." });
  }
  if (await findUserByEmail(normalizeEmail(email))) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  const tempPassword = genTempPassword();
  const user = {
    id: makeId("USR"),
    role,
    name: name.trim(),
    email: normalizeEmail(email),
    phone: phone?.trim() || "",
    password: await bcrypt.hash(tempPassword, 10),
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  await insertUser(user);
  // Temp password is only ever shown here, once, to the admin creating it.
  res.status(201).json({ user: { ...publicUser(user), tempPassword } });
}));

// Any signed-in user can read the roster (needed for "assigned engineer"
// dropdowns on pages engineers use too) — only creating/removing logins
// stays admin-only, on the routes below.
router.get("/accounts", requireAuth, asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json({ accounts: users.map(publicUser) });
}));

router.delete("/accounts/:id", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You can't remove your own login." });
  }
  await deleteUser(req.params.id);
  res.status(204).end();
}));

export default router;
