import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import StatusPill from "../components/StatusPill";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import { IconArrowLeft, IconListChecks } from "../components/Icons";
import "./ProjectStatusPage.css";

// Read-only overview of every project's current status and progress.
// Pulls straight from the live project records — no placeholder data.
export default function ProjectStatusPage() {
  const { t } = useLanguage();
  const { allProjects } = useProjects();

  return (
    <div className="page">
      <Link to="/projects" className="back-link">
        <IconArrowLeft /> {t("backToProjects")}
      </Link>

      <div className="page__header">
        <div>
          <h1>{t("projectStatusOverviewTitle")}</h1>
          <p className="page__subtitle">{t("projectStatusOverviewSubtitle")}</p>
        </div>
      </div>

      {allProjects.length === 0 ? (
        <EmptyState icon={IconListChecks} title={t("noProjectsForStatusOverview")} />
      ) : (
        <div className="status-table-wrap">
          <table className="status-table">
            <thead>
              <tr>
                <th>{t("projectName")}</th>
                <th>{t("projectType")}</th>
                <th>{t("status")}</th>
                <th>{t("progress")}</th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link to={`/projects/${project.id}`} className="status-table__project-link">
                      {project.name}
                    </Link>
                  </td>
                  <td>
                    <span className="project-card__type">{project.type}</span>
                  </td>
                  <td>
                    <StatusPill status={project.status} />
                  </td>
                  <td>
                    <ProgressBar value={Number(project.overallProgress) || 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
