import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useWorkforce } from "../hooks/useWorkforce";
import { WORKER_TYPES, AVAILABILITY_STATUSES } from "../data/constants";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { IconSearch, IconPlus, IconUsers } from "../components/Icons";
import "./WorkforcePage.css";

const emptyForm = {
  name: "",
  workerType: WORKER_TYPES[0],
  contractorCompany: "",
  currentProjectId: "",
  currentAssignment: "",
  availability: AVAILABILITY_STATUSES[0],
};

export default function WorkforcePage() {
  const { t } = useLanguage();
  const { allProjects } = useProjects();
  const {
    workers,
    allWorkers,
    summary,
    addWorker,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    projectFilter,
    setProjectFilter,
  } = useWorkforce();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const projectName = (id) => allProjects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("workforceTitle")}</h1>
          <p className="page__subtitle">{t("workforceSubtitle")}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus />
          {t("newWorker")}
        </button>
      </div>

      {allWorkers.length > 0 && (
        <div className="workforce-cards">
          <div className="workforce-card">
            <IconUsers />
            <div>
              <strong>{summary.permanent}</strong>
              <span>{t("permanentWorkers")}</span>
            </div>
          </div>
          <div className="workforce-card">
            <IconUsers />
            <div>
              <strong>{summary.temporary}</strong>
              <span>{t("temporaryWorkers")}</span>
            </div>
          </div>
          <div className="workforce-card">
            <IconUsers />
            <div>
              <strong>{summary.contractor}</strong>
              <span>{t("contractorWorkers")}</span>
            </div>
          </div>
          <div className="workforce-card workforce-card--accent">
            <IconUsers />
            <div>
              <strong>{summary.onSite}</strong>
              <span>{t("onSiteNow")}</span>
            </div>
          </div>
        </div>
      )}

      {allWorkers.length > 0 && (
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
            {WORKER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="all">{t("allProjects")}</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {allWorkers.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title={t("noWorkersYetTitle")}
          body={t("noWorkersYetBody")}
          action={
            <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
              <IconPlus />
              {t("newWorker")}
            </button>
          }
        />
      ) : workers.length === 0 ? (
        <div className="empty-state">{t("noWorkersMatch")}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("workerName")}</th>
                <th>{t("workerType")}</th>
                <th>{t("currentProject")}</th>
                <th>{t("currentAssignment")}</th>
                <th>{t("availability")}</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}>
                  <td>
                    {w.name}
                    {w.workerType === "Contractor" && w.contractorCompany && (
                      <div className="table-subtext">{w.contractorCompany}</div>
                    )}
                  </td>
                  <td>{w.workerType}</td>
                  <td>{w.currentProjectId ? projectName(w.currentProjectId) : "—"}</td>
                  <td>{w.currentAssignment || "—"}</td>
                  <td>
                    <StatusPill status={w.availability} tone={w.availability === "On Site" ? "info" : undefined} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title={t("newWorker")} onClose={() => setIsModalOpen(false)}>
          <NewWorkerForm
            t={t}
            projects={allProjects}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addWorker(values);
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewWorkerForm({ t, projects, onSubmit, onCancel }) {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field form-field--full">
        <label htmlFor="w-name">{t("workerName")} *</label>
        <input id="w-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="w-type">{t("workerType")}</label>
        <select id="w-type" value={values.workerType} onChange={(e) => set("workerType", e.target.value)}>
          {WORKER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="w-availability">{t("availability")}</label>
        <select id="w-availability" value={values.availability} onChange={(e) => set("availability", e.target.value)}>
          {AVAILABILITY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {values.workerType === "Contractor" && (
        <div className="form-field form-field--full">
          <label htmlFor="w-contractor">{t("contractorCompany")}</label>
          <input
            id="w-contractor"
            value={values.contractorCompany}
            onChange={(e) => set("contractorCompany", e.target.value)}
          />
        </div>
      )}

      <div className="form-field">
        <label htmlFor="w-project">{t("currentProject")}</label>
        <select id="w-project" value={values.currentProjectId} onChange={(e) => set("currentProjectId", e.target.value)}>
          <option value="">{t("unassigned")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="w-assignment">{t("currentAssignment")}</label>
        <input
          id="w-assignment"
          value={values.currentAssignment}
          onChange={(e) => set("currentAssignment", e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("addWorker")}
        </button>
      </div>
    </form>
  );
}
