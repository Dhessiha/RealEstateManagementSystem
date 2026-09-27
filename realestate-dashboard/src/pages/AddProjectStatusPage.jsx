import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useOptionLists } from "../hooks/useOptionLists";
import StatusPill from "../components/StatusPill";
import { IconArrowLeft, IconCheck } from "../components/Icons";
import "./ManageProjectOptionsPage.css";

// Dedicated screen for adding a project status. Kept separate from
// AddProjectOptionPage (which now only handles project types) so each
// has its own route and component instead of a shared "kind" switch.
export default function AddProjectStatusPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { projectStatuses, addProjectStatus } = useOptionLists();

  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const clean = value.trim();
    if (!clean) {
      setError(t("formRequiredFields"));
      return;
    }
    if (projectStatuses.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setError(t("duplicateOption"));
      return;
    }
    addProjectStatus(clean);
    navigate("/projects/options");
  }

  return (
    <div className="page">
      <Link to="/projects/options" className="back-link">
        <IconArrowLeft /> {t("backToManageOptions")}
      </Link>

      <div className="page__header">
        <div>
          <h1>{t("addStatus")}</h1>
          <p className="page__subtitle">{t("addStatusSubtitle")}</p>
        </div>
      </div>

      <form className="option-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-field form-field--full">
          <label htmlFor="status-value">{t("statusName")} *</label>
          <input
            id="status-value"
            autoFocus
            placeholder={t("statusNamePlaceholder")}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
          />
        </div>

        {value.trim() && (
          <div className="option-form__preview">
            <span className="option-form__preview-label">{t("preview")}</span>
            <StatusPill status={value.trim()} />
          </div>
        )}

        <div className="option-section">
          <span className="option-form__preview-label">{t("existingStatuses")}</span>
          <div className="option-form__chips">
            {projectStatuses.map((item) => (
              <StatusPill key={item} status={item} />
            ))}
          </div>
        </div>

        <div className="form-actions">
          <Link to="/projects/options" className="btn btn--ghost">
            {t("cancel")}
          </Link>
          <button type="submit" className="btn btn--primary">
            <IconCheck />
            {t("addStatus")}
          </button>
        </div>
      </form>
    </div>
  );
}
