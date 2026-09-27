import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useDailyLog } from "../hooks/useDailyLog";
import { useAuth } from "../hooks/useAuth";
import { LOG_CATEGORIES } from "../data/constants";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import { IconClipboard, IconPlus, IconBuilding } from "../components/Icons";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const CATEGORY_TONE = {
  "Progress Update": "info",
  "Material Movement": "neutral",
  "Site Observation": "neutral",
  Safety: "warning",
  Issue: "danger",
};

const emptyForm = { date: todayISO(), category: LOG_CATEGORIES[0], note: "" };

export default function DailyLogPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { allProjects, addProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (allProjects.length === 0) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h1>{t("nav_dailyLog")}</h1>
            <p className="page__subtitle">{t("dailyLogSubtitle")}</p>
          </div>
        </div>
        <NoProjectsEmptyState icon={IconBuilding} title={t("noProjectsForModuleTitle")} onQuickCreate={addProject} />
      </div>
    );
  }

  const project = allProjects.find((p) => p.id === projectId) ?? allProjects[0];
  if (!projectId || projectId !== project.id) {
    return <Navigate to={`/daily-log/${project.id}`} replace />;
  }

  return (
    <DailyLogForProject
      project={project}
      allProjects={allProjects}
      navigate={navigate}
      t={t}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
    />
  );
}

function DailyLogForProject({ project, allProjects, navigate, t, isModalOpen, setIsModalOpen }) {
  const { entries, addEntry } = useDailyLog(project.id);
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("nav_dailyLog")}</h1>
          <p className="page__subtitle">{t("dailyLogSubtitle")}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus />
          {t("newLogEntry")}
        </button>
      </div>

      <div className="project-tabs" role="tablist">
        {allProjects.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === project.id}
            className={`project-tabs__tab ${p.id === project.id ? "is-active" : ""}`}
            onClick={() => navigate(`/daily-log/${p.id}`)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={IconClipboard}
          title={t("noLogEntriesYetTitle")}
          body={t("noLogEntriesYetBody")}
          action={
            <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
              <IconPlus />
              {t("newLogEntry")}
            </button>
          }
        />
      ) : (
        <div className="log-feed">
          {entries.map((entry) => (
            <article key={entry.id} className="log-card">
              <div className="log-card__top">
                <span className="log-card__date mono">{entry.date}</span>
                <StatusPill status={entry.category} tone={CATEGORY_TONE[entry.category] ?? "neutral"} />
              </div>
              <p className="log-card__note">{entry.note}</p>
              {entry.reportedBy && <span className="log-card__by">{t("reportedBy")}: {entry.reportedBy}</span>}
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal title={t("newLogEntry")} onClose={() => setIsModalOpen(false)}>
          <NewLogForm
            t={t}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addEntry({ ...values, reportedBy: user?.name ?? "" });
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewLogForm({ t, onSubmit, onCancel }) {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.note.trim()) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field">
        <label htmlFor="l-date">{t("date")} *</label>
        <input id="l-date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="l-category">{t("category")}</label>
        <select id="l-category" value={values.category} onChange={(e) => set("category", e.target.value)}>
          {LOG_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field form-field--full">
        <label htmlFor="l-note">{t("logNote")} *</label>
        <textarea id="l-note" rows={3} value={values.note} onChange={(e) => set("note", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("addLogEntry")}
        </button>
      </div>
    </form>
  );
}
