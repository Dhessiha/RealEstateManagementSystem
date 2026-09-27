import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useOptionLists } from "../hooks/useOptionLists";
import { MATERIAL_RESPONSIBILITY } from "../data/constants";
import ProgressBar from "../components/ProgressBar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { IconSearch, IconPlus, IconMapPin, IconGrid, IconBuilding, IconSettings, IconListChecks, IconTrash } from "../components/Icons";
import "./ProjectsPage.css";

function buildEmptyForm(projectTypes, projectStatuses) {
  return {
    name: "",
    location: "",
    type: projectTypes[0] ?? "",
    company: "",
    client: "",
    status: projectStatuses[0] ?? "",
    materialResponsibility: MATERIAL_RESPONSIBILITY[0],
    startDate: "",
    expectedEnd: "",
    unitsTotal: "",
  };
}

export default function ProjectsPage() {
  const { t } = useLanguage();
  const {
    projects,
    allProjects,
    addProject,
    removeProject,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
  } = useProjects();
  const { projectTypes, projectStatuses } = useOptionLists();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("projectsTitle")}</h1>
          <p className="page__subtitle">{t("projectsSubtitle")}</p>
        </div>
        <div className="page__header-actions">
          <Link to="/projects/status" className="btn btn--ghost">
            <IconListChecks />
            {t("projectStatusOverview")}
          </Link>
          <Link to="/projects/options" className="btn btn--ghost">
            <IconSettings />
            {t("manageOptions")}
          </Link>
          <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
            <IconPlus />
            {t("newProject")}
          </button>
        </div>
      </div>

      {allProjects.length > 0 && (
        <div className="toolbar">
          <div className="toolbar__search">
            <IconSearch />
            <input
              type="text"
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">{t("allTypes")}</option>
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t("allStatuses")}</option>
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      {allProjects.length === 0 ? (
        <EmptyState
          icon={IconBuilding}
          title={t("noProjectsYetTitle")}
          body={t("noProjectsYetBody")}
          action={
            <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
              <IconPlus />
              {t("newProject")}
            </button>
          }
        />
      ) : projects.length === 0 ? (
        <div className="empty-state">{t("noProjects")}</div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card__top">
                <div className="project-card__top-tags">
                  <span className="project-card__type">{project.type}</span>
                  <StatusPill status={project.status} />
                </div>
                <button
                  type="button"
                  className="project-card__delete"
                  onClick={() => setDeleteTarget(project)}
                  aria-label={`${t("deleteProject")} ${project.name}`}
                >
                  <IconTrash />
                </button>
              </div>

              <h3>{project.name}</h3>
              <p className="project-card__location">
                <IconMapPin /> {project.location}
              </p>

              <dl className="project-card__meta">
                <div>
                  <dt>{t("client")}</dt>
                  <dd>{project.client || "—"}</dd>
                </div>
                <div>
                  <dt>{t("company")}</dt>
                  <dd>{project.company || "—"}</dd>
                </div>
                <div>
                  <dt>{t("materialResponsibility")}</dt>
                  <dd>{project.materialResponsibility}</dd>
                </div>
                <div>
                  <dt>{t("expectedEnd")}</dt>
                  <dd>{project.expectedEnd || "—"}</dd>
                </div>
              </dl>

              <div className="project-card__progress">
                <span>{t("overallProgress")}</span>
                <ProgressBar value={Number(project.overallProgress) || 0} />
              </div>

              <Link to={`/projects/${project.id}`} className="project-card__link">
                <IconGrid />
                {t("viewUnits")} ({project.unitsTotal || 0})
              </Link>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal title={t("newProject")} onClose={() => setIsModalOpen(false)}>
          <NewProjectForm
            t={t}
            projectTypes={projectTypes}
            projectStatuses={projectStatuses}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addProject({
                ...values,
                unitsTotal: Number(values.unitsTotal) || 0,
                unitsSold: 0,
                overallProgress: 0,
              });
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title={t("deleteProjectConfirmTitle")} onClose={() => setDeleteTarget(null)}>
          <p className="modal__confirm-body">{t("deleteProjectConfirmBody")}</p>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setDeleteTarget(null)}>
              {t("cancel")}
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                removeProject(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              <IconTrash />
              {t("deleteProjectConfirmCta")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NewProjectForm({ t, projectTypes, projectStatuses, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => buildEmptyForm(projectTypes, projectStatuses));
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.name.trim() || !values.location.trim()) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field form-field--full">
        <label htmlFor="p-name">{t("projectName")} *</label>
        <input id="p-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="form-field form-field--full">
        <label htmlFor="p-location">{t("location")} *</label>
        <input id="p-location" value={values.location} onChange={(e) => set("location", e.target.value)} />
      </div>

      <div className="form-field">
        <div className="form-field__label-row">
          <label htmlFor="p-type">{t("projectType")}</label>
          <Link to="/projects/options/types/new" className="form-field__add-link">
            + {t("addType")}
          </Link>
        </div>
        <select id="p-type" value={values.type} onChange={(e) => set("type", e.target.value)}>
          {projectTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <div className="form-field__label-row">
          <label htmlFor="p-status">{t("status")}</label>
          <Link to="/projects/options/statuses/new" className="form-field__add-link">
            + {t("addStatus")}
          </Link>
        </div>
        <select id="p-status" value={values.status} onChange={(e) => set("status", e.target.value)}>
          {projectStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="p-company">{t("company")}</label>
        <input id="p-company" value={values.company} onChange={(e) => set("company", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="p-client">{t("client")}</label>
        <input id="p-client" value={values.client} onChange={(e) => set("client", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="p-material">{t("materialResponsibility")}</label>
        <select
          id="p-material"
          value={values.materialResponsibility}
          onChange={(e) => set("materialResponsibility", e.target.value)}
        >
          {MATERIAL_RESPONSIBILITY.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="p-units">{t("unitsTotal")}</label>
        <input
          id="p-units"
          type="number"
          min="0"
          value={values.unitsTotal}
          onChange={(e) => set("unitsTotal", e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="p-start">{t("startDate")}</label>
        <input id="p-start" type="date" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="p-end">{t("expectedEnd")}</label>
        <input id="p-end" type="date" value={values.expectedEnd} onChange={(e) => set("expectedEnd", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("createProject")}
        </button>
      </div>
    </form>
  );
}
