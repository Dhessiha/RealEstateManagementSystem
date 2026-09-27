import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useOptionLists } from "../hooks/useOptionLists";
import { IconArrowLeft, IconCheck } from "../components/Icons";
import "./ManageProjectOptionsPage.css";

// Dedicated screen for adding a project type.
// (Adding a status has its own separate screen: AddProjectStatusPage.)
export default function AddProjectOptionPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { projectTypes, addProjectType } = useOptionLists();

  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const clean = value.trim();
    if (!clean) {
      setError(t("formRequiredFields"));
      return;
    }
    if (projectTypes.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setError(t("duplicateOption"));
      return;
    }
    addProjectType(clean);
    navigate("/projects/options");
  }

  return (
    <div className="page">
      <Link to="/projects/options" className="back-link">
        <IconArrowLeft /> {t("backToManageOptions")}
      </Link>

      <div className="page__header">
        <div>
          <h1>{t("addType")}</h1>
          <p className="page__subtitle">{t("addTypeSubtitle")}</p>
        </div>
      </div>

      <form className="option-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-field form-field--full">
          <label htmlFor="option-value">{t("typeName")} *</label>
          <input
            id="option-value"
            autoFocus
            placeholder={t("typeNamePlaceholder")}
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
            <span className="project-card__type">{value.trim()}</span>
          </div>
        )}

        <div className="option-section">
          <span className="option-form__preview-label">{t("existingTypes")}</span>
          <div className="option-form__chips">
            {projectTypes.map((item) => (
              <span key={item} className="project-card__type">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <Link to="/projects/options" className="btn btn--ghost">
            {t("cancel")}
          </Link>
          <button type="submit" className="btn btn--primary">
            <IconCheck />
            {t("addType")}
          </button>
        </div>
      </form>
    </div>
  );
}
