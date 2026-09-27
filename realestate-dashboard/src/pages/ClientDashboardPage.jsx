import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useConstructionTasks } from "../hooks/useConstructionTasks";
import { useIssues } from "../hooks/useIssues";
import { useAuth } from "../hooks/useAuth";
import { ISSUE_PRIORITIES } from "../data/constants";
import StatusPill from "../components/StatusPill";
import ProgressBar from "../components/ProgressBar";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import { IconPlus, IconBuilding, IconAlert, IconMapPin } from "../components/Icons";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const PRIORITY_TONE = { Low: "neutral", Medium: "info", High: "warning", Urgent: "danger" };
const ISSUE_STATUS_TONE = { Open: "warning", "In Review": "info", Resolved: "success", Closed: "neutral" };

const emptyForm = { subject: "", description: "", priority: ISSUE_PRIORITIES[0] };

export default function ClientDashboardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { allProjects } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (allProjects.length === 0) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h1>{t("nav_clientDashboard")}</h1>
            <p className="page__subtitle">{t("clientDashboardSubtitle")}</p>
          </div>
        </div>
        <NoProjectsEmptyState
          icon={IconBuilding}
          title="No project linked to your account yet"
          body="Your administrator has not assigned a project to your account yet. Please contact the site administrator."
        />
      </div>
    );
  }

  const project = allProjects.find((p) => p.id === projectId) ?? allProjects[0];
  if (!projectId || projectId !== project.id) {
    return <Navigate to={`/client-dashboard/${project.id}`} replace />;
  }

  return (
    <ClientDashboardForProject
      project={project}
      allProjects={allProjects}
      navigate={navigate}
      t={t}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
    />
  );
}

function ClientDashboardForProject({ project, allProjects, navigate, t, isModalOpen, setIsModalOpen }) {
  const { tasks } = useConstructionTasks(project.id);
  const { issues, addIssue } = useIssues(project.id);
  const { user } = useAuth();

  const milestones = useMemo(() => tasks.filter((task) => task.isMilestone), [tasks]);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("nav_clientDashboard")}</h1>
          <p className="page__subtitle">{t("clientDashboardSubtitle")}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus />
          {t("raiseRequest")}
        </button>
      </div>

      {allProjects.length > 1 && (
        <div className="project-tabs" role="tablist">
          {allProjects.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === project.id}
              className={`project-tabs__tab ${p.id === project.id ? "is-active" : ""}`}
              onClick={() => navigate(`/client-dashboard/${p.id}`)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="section-card">
        <div className="section-card__header">
          <div>
            <h3 className="section-title">{project.name}</h3>
            {project.location && (
              <p className="page__subtitle">
                <IconMapPin /> {project.location}
              </p>
            )}
          </div>
          <StatusPill status={project.status} />
        </div>
        <ProgressBar value={Number(project.overallProgress) || 0} />
      </div>

      <div>
        <h3 className="section-title">{t("milestones")}</h3>
        {milestones.length === 0 ? (
          <div className="empty-state">{t("noMilestonesYet")}</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("taskDescription")}</th>
                  <th>{t("stage")}</th>
                  <th>{t("plannedEnd")}</th>
                  <th>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.description}</td>
                    <td>{m.stage}</td>
                    <td className="mono">{m.plannedEnd || "—"}</td>
                    <td>
                      <StatusPill status={m.taskStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="section-title">{t("myRequests")}</h3>
        {issues.length === 0 ? (
          <EmptyState
            icon={IconAlert}
            title={t("noRequestsYetTitle")}
            body={t("noRequestsYetBody")}
            action={
              <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
                <IconPlus />
                {t("raiseRequest")}
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("subject")}</th>
                  <th>{t("priority")}</th>
                  <th>{t("status")}</th>
                  <th>{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      {issue.subject}
                      {issue.description && <div className="table-subtext">{issue.description}</div>}
                    </td>
                    <td>
                      <StatusPill status={issue.priority} tone={PRIORITY_TONE[issue.priority] ?? "neutral"} />
                    </td>
                    <td>
                      <StatusPill status={issue.status} tone={ISSUE_STATUS_TONE[issue.status] ?? "neutral"} />
                    </td>
                    <td className="mono">{issue.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal title={t("raiseRequest")} onClose={() => setIsModalOpen(false)}>
          <NewIssueForm
            t={t}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addIssue({ ...values, raisedBy: user?.name ?? "", date: todayISO() });
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewIssueForm({ t, onSubmit, onCancel }) {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.subject.trim()) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field form-field--full">
        <label htmlFor="i-subject">{t("subject")} *</label>
        <input id="i-subject" value={values.subject} onChange={(e) => set("subject", e.target.value)} />
      </div>

      <div className="form-field form-field--full">
        <label htmlFor="i-description">{t("description")}</label>
        <textarea
          id="i-description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="i-priority">{t("priority")}</label>
        <select id="i-priority" value={values.priority} onChange={(e) => set("priority", e.target.value)}>
          {ISSUE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("submitRequest")}
        </button>
      </div>
    </form>
  );
}
