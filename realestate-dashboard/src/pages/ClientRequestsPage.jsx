import { useMemo, useState } from "react";
import { useProjects } from "../hooks/useProjects";
import { useEntityStore } from "../hooks/useEntityStore";
import { ISSUE_STATUSES } from "../data/constants";
import StatusPill from "../components/StatusPill";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import { IconAlert, IconBuilding, IconMapPin, IconClipboard } from "../components/Icons";
import "./ClientRequestsPage.css";

const PRIORITY_TONE = { Low: "neutral", Medium: "info", High: "warning", Urgent: "danger" };
const STATUS_TONE = { Open: "warning", "In Review": "info", Resolved: "success", Closed: "neutral" };

// Admin-only screen. Every request a client raises from their dashboard
// lands in the shared "siteflow.issues" collection — this page reads
// that same collection across every project (instead of one project at
// a time, like the client's own view does) so staff can see and action
// requests without needing to open each project individually.
export default function ClientRequestsPage() {
  const { allProjects, addProject } = useProjects();
  const { records: issues, update: updateIssue } = useEntityStore("siteflow.issues", "ISS");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const projectsById = useMemo(() => {
    const map = new Map();
    allProjects.forEach((p) => map.set(p.id, p));
    return map;
  }, [allProjects]);

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => projectFilter === "all" || issue.projectId === projectFilter)
      .filter((issue) => statusFilter === "all" || issue.status === statusFilter)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [issues, projectFilter, statusFilter]);

  const openCount = issues.filter((i) => i.status === "Open").length;
  const inReviewCount = issues.filter((i) => i.status === "In Review").length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved" || i.status === "Closed").length;

  if (allProjects.length === 0) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h1>Client Requests</h1>
            <p className="page__subtitle">Requests clients raise from their dashboard, in one place.</p>
          </div>
        </div>
        <NoProjectsEmptyState icon={IconBuilding} title="No projects yet" onQuickCreate={addProject} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Client Requests</h1>
          <p className="page__subtitle">Requests clients raise from their dashboard, across every project.</p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card--warning">
          <IconAlert />
          <div>
            <strong>{openCount}</strong>
            <span>Open</span>
          </div>
        </div>
        <div className="stat-card stat-card--info">
          <IconClipboard />
          <div>
            <strong>{inReviewCount}</strong>
            <span>In review</span>
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <IconAlert />
          <div>
            <strong>{resolvedCount}</strong>
            <span>Resolved / closed</span>
          </div>
        </div>
      </div>

      <div className="client-requests__filters">
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="all">All projects</option>
          {allProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filteredIssues.length === 0 ? (
        <EmptyState
          icon={IconAlert}
          title="No requests match this filter"
          body="Once a client raises a request from their dashboard, it'll show up here."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Raised by</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => {
                const project = projectsById.get(issue.projectId);
                return (
                  <tr key={issue.id}>
                    <td>
                      {project?.name ?? "—"}
                      {project?.location && (
                        <div className="table-subtext">
                          <IconMapPin /> {project.location}
                        </div>
                      )}
                    </td>
                    <td>{project?.client || "—"}</td>
                    <td>
                      {issue.subject}
                      {issue.description && <div className="table-subtext">{issue.description}</div>}
                    </td>
                    <td>
                      <StatusPill status={issue.priority} tone={PRIORITY_TONE[issue.priority] ?? "neutral"} />
                    </td>
                    <td>{issue.raisedBy || "—"}</td>
                    <td className="mono">{issue.date}</td>
                    <td>
                      <select
                        className="client-requests__status-select"
                        value={issue.status}
                        onChange={(e) => updateIssue(issue.id, { status: e.target.value })}
                      >
                        {ISSUE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <StatusPill status={issue.status} tone={STATUS_TONE[issue.status] ?? "neutral"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="section-title">Client projects</h3>
        <div className="client-requests__project-grid">
          {allProjects.map((project) => {
            const projectIssues = issues.filter((i) => i.projectId === project.id);
            const openForProject = projectIssues.filter((i) => i.status === "Open").length;
            return (
              <div key={project.id} className="section-card client-requests__project-card">
                <div className="section-card__header">
                  <div>
                    <h3 className="section-title">{project.name}</h3>
                    {project.location && (
                      <p className="page__subtitle">
                        <IconMapPin /> {project.location}
                      </p>
                    )}
                    <p className="page__subtitle">Client: {project.client || "—"}</p>
                  </div>
                  <StatusPill status={project.status} />
                </div>
                <ProgressBar value={Number(project.overallProgress) || 0} />
                <p className="table-subtext">
                  {projectIssues.length} request{projectIssues.length === 1 ? "" : "s"}
                  {openForProject > 0 ? ` · ${openForProject} open` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
