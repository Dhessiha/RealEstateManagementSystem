import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useDocuments } from "../hooks/useDocuments";
import { useAuth } from "../hooks/useAuth";
import { DOCUMENT_CATEGORIES } from "../data/constants";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import { IconFolder, IconPlus, IconBuilding } from "../components/Icons";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const CATEGORY_TONE = {
  Plan: "info",
  Approval: "success",
  Contract: "warning",
  "Customer Document": "neutral",
  Other: "neutral",
};

const emptyForm = { title: "", category: DOCUMENT_CATEGORIES[0], note: "" };

export default function DocumentsPage() {
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
            <h1>{t("nav_documents")}</h1>
            <p className="page__subtitle">{t("documentsSubtitle")}</p>
          </div>
        </div>
        <NoProjectsEmptyState icon={IconBuilding} title={t("noProjectsForModuleTitle")} onQuickCreate={addProject} />
      </div>
    );
  }

  const project = allProjects.find((p) => p.id === projectId) ?? allProjects[0];
  if (!projectId || projectId !== project.id) {
    return <Navigate to={`/documents/${project.id}`} replace />;
  }

  return (
    <DocumentsForProject
      project={project}
      allProjects={allProjects}
      navigate={navigate}
      t={t}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
    />
  );
}

function DocumentsForProject({ project, allProjects, navigate, t, isModalOpen, setIsModalOpen }) {
  const { documents, allDocuments, addDocument, categoryFilter, setCategoryFilter } = useDocuments(project.id);
  const { user } = useAuth();
  const canUpload = user?.role === "admin" || user?.role === "engineer";

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("nav_documents")}</h1>
          <p className="page__subtitle">
            {user?.role === "client"
              ? "Documents your site team has shared for this project."
              : t("documentsSubtitle")}
          </p>
        </div>
        {canUpload && (
          <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
            <IconPlus />
            {t("newDocument")}
          </button>
        )}
      </div>

      {allProjects.length > 1 && (
        <div className="project-tabs" role="tablist">
          {allProjects.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === project.id}
              className={`project-tabs__tab ${p.id === project.id ? "is-active" : ""}`}
              onClick={() => navigate(`/documents/${p.id}`)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {allDocuments.length > 0 && (
        <div className="toolbar">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{t("allCategories")}</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {allDocuments.length === 0 ? (
        <EmptyState
          icon={IconFolder}
          title={t("noDocumentsYetTitle")}
          body={t("noDocumentsYetBody")}
          action={
            canUpload ? (
              <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
                <IconPlus />
                {t("newDocument")}
              </button>
            ) : null
          }
        />
      ) : documents.length === 0 ? (
        <div className="empty-state">{t("noDocumentsMatch")}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("documentTitle")}</th>
                <th>{t("category")}</th>
                <th>{t("addedBy")}</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.title}
                    {d.note && <div className="table-subtext">{d.note}</div>}
                  </td>
                  <td>
                    <StatusPill status={d.category} tone={CATEGORY_TONE[d.category] ?? "neutral"} />
                  </td>
                  <td>{d.addedBy || "—"}</td>
                  <td className="mono">{d.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title={t("newDocument")} onClose={() => setIsModalOpen(false)}>
          <NewDocumentForm
            t={t}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addDocument({ ...values, addedBy: user?.name ?? "", date: todayISO() });
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewDocumentForm({ t, onSubmit, onCancel }) {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.title.trim()) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field form-field--full">
        <label htmlFor="d-title">{t("documentTitle")} *</label>
        <input id="d-title" value={values.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div className="form-field form-field--full">
        <label htmlFor="d-category">{t("category")}</label>
        <select id="d-category" value={values.category} onChange={(e) => set("category", e.target.value)}>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field form-field--full">
        <label htmlFor="d-note">{t("documentNote")}</label>
        <input id="d-note" value={values.note} onChange={(e) => set("note", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("addDocument")}
        </button>
      </div>
    </form>
  );
}
