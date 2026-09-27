import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useOptionLists } from "../hooks/useOptionLists";
import StatusPill from "../components/StatusPill";
import { IconArrowLeft, IconPlus, IconClose, IconType, IconBlueprint } from "../components/Icons";
import "./ManageProjectOptionsPage.css";

export default function ManageProjectOptionsPage() {
  const { t } = useLanguage();
  const { projectTypes, removeProjectType, projectStatuses, removeProjectStatus } = useOptionLists();

  return (
    <div className="page">
      <Link to="/projects" className="back-link">
        <IconArrowLeft /> {t("backToProjects")}
      </Link>

      <div className="page__header">
        <div>
          <h1>{t("manageOptionsTitle")}</h1>
          <p className="page__subtitle">{t("manageOptionsSubtitle")}</p>
        </div>
      </div>

      <section className="option-section">
        <div className="option-section__header">
          <h2 className="section-title">
            <IconBlueprint /> {t("projectTypes")}
          </h2>
          <Link to="/projects/options/types/new" className="btn btn--primary">
            <IconPlus />
            {t("addType")}
          </Link>
        </div>
        <ul className="option-list">
          {projectTypes.map((type) => (
            <li key={type} className="option-list__row">
              <span className="project-card__type">{type}</span>
              <button
                type="button"
                className="option-list__remove"
                onClick={() => removeProjectType(type)}
                disabled={projectTypes.length <= 1}
                aria-label={`${t("remove")} ${type}`}
                title={projectTypes.length <= 1 ? t("keepAtLeastOne") : t("remove")}
              >
                <IconClose />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="option-section">
        <div className="option-section__header">
          <h2 className="section-title">
            <IconType /> {t("projectStatuses")}
          </h2>
          <Link to="/projects/options/statuses/new" className="btn btn--primary">
            <IconPlus />
            {t("addStatus")}
          </Link>
        </div>
        <ul className="option-list">
          {projectStatuses.map((status) => (
            <li key={status} className="option-list__row">
              <StatusPill status={status} />
              <button
                type="button"
                className="option-list__remove"
                onClick={() => removeProjectStatus(status)}
                disabled={projectStatuses.length <= 1}
                aria-label={`${t("remove")} ${status}`}
                title={projectStatuses.length <= 1 ? t("keepAtLeastOne") : t("remove")}
              >
                <IconClose />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
