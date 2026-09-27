import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useEntityStore } from "../hooks/useEntityStore";
import StatusPill from "../components/StatusPill";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import { IconCrane, IconAlert, IconUsers, IconWallet, IconBuilding } from "../components/Icons";

function formatCurrency(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { allProjects } = useProjects();
  const { records: tasks } = useEntityStore("siteflow.tasks", "TSK");
  const { records: workers } = useEntityStore("siteflow.workers", "WRK");
  const { records: budgets } = useEntityStore("siteflow.budgets", "BUD");
  const { records: payments } = useEntityStore("siteflow.payments", "PAY");

  const totals = useMemo(() => {
    const delayedTasks = tasks.filter((task) => task.taskStatus === "Delayed").length;
    const activeTasks = tasks.filter((task) => task.taskStatus === "In Progress").length;
    const onSiteWorkers = workers.filter((w) => w.availability === "On Site").length;
    const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { delayedTasks, activeTasks, onSiteWorkers, totalReceived };
  }, [tasks, workers, payments]);

  const rows = useMemo(
    () =>
      allProjects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const delayed = projectTasks.filter((task) => task.taskStatus === "Delayed").length;
        const assignedWorkers = workers.filter((w) => w.currentProjectId === project.id).length;
        const budget = budgets.find((b) => b.projectId === project.id);
        const received = payments
          .filter((p) => p.projectId === project.id)
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return {
          project,
          delayed,
          assignedWorkers,
          estimatedCost: Number(budget?.estimatedCost) || 0,
          actualCost: Number(budget?.actualCost) || 0,
          received,
        };
      }),
    [allProjects, tasks, workers, budgets, payments]
  );

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("nav_reports")}</h1>
          <p className="page__subtitle">{t("reportsSubtitle")}</p>
        </div>
      </div>

      {allProjects.length === 0 ? (
        <EmptyState
          icon={IconBuilding}
          title={t("noProjectsForModuleTitle")}
          body={t("noProjectsForModuleBody")}
          action={
            <button type="button" className="btn btn--primary" onClick={() => navigate("/projects")}>
              {t("goToProjects")}
            </button>
          }
        />
      ) : (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <IconBuilding />
              <div>
                <strong>{allProjects.length}</strong>
                <span>{t("totalProjects")}</span>
              </div>
            </div>
            <div className="stat-card stat-card--info">
              <IconCrane />
              <div>
                <strong>{totals.activeTasks}</strong>
                <span>{t("activeTasks")}</span>
              </div>
            </div>
            <div className="stat-card stat-card--danger">
              <IconAlert />
              <div>
                <strong>{totals.delayedTasks}</strong>
                <span>{t("delayedTasks")}</span>
              </div>
            </div>
            <div className="stat-card stat-card--success">
              <IconUsers />
              <div>
                <strong>{totals.onSiteWorkers}</strong>
                <span>{t("onSiteNow")}</span>
              </div>
            </div>
            <div className="stat-card stat-card--warning">
              <IconWallet />
              <div>
                <strong>{formatCurrency(totals.totalReceived)}</strong>
                <span>{t("totalReceived")}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="section-title">{t("projectPerformance")}</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("projectName")}</th>
                    <th>{t("status")}</th>
                    <th>{t("progress")}</th>
                    <th>{t("delayedTasks")}</th>
                    <th>{t("workersAssigned")}</th>
                    <th>{t("estimatedCost")}</th>
                    <th>{t("actualCost")}</th>
                    <th>{t("totalReceived")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ project, delayed, assignedWorkers, estimatedCost, actualCost, received }) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>
                        <StatusPill status={project.status} />
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <ProgressBar value={Number(project.overallProgress) || 0} />
                      </td>
                      <td className="mono">{delayed}</td>
                      <td className="mono">{assignedWorkers}</td>
                      <td className="mono">{formatCurrency(estimatedCost)}</td>
                      <td className="mono">{formatCurrency(actualCost)}</td>
                      <td className="mono">{formatCurrency(received)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
