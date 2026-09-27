import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useMaterials } from "../hooks/useMaterials";
import { MATERIAL_CATEGORIES, SUPPLIER_TYPES, UOM_UNITS } from "../data/constants";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import { IconBox, IconPlus, IconBuilding } from "../components/Icons";
import "./MaterialsPage.css";

const SUPPLIER_KEY = {
  Company: "company_supplied",
  Client: "client_supplied",
  Vendor: "vendor_supplied",
};

const emptyForm = {
  material: "",
  category: MATERIAL_CATEGORIES[0],
  required: "",
  uom: UOM_UNITS[0],
  suppliedBy: SUPPLIER_TYPES[0],
  allocated: "",
};

export default function MaterialsPage() {
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
            <h1>{t("materialsTitle")}</h1>
            <p className="page__subtitle">{t("materialsSubtitle")}</p>
          </div>
        </div>
        <NoProjectsEmptyState icon={IconBuilding} title={t("noProjectsForModuleTitle")} onQuickCreate={addProject} />
      </div>
    );
  }

  const project = allProjects.find((p) => p.id === projectId) ?? allProjects[0];
  if (!projectId || projectId !== project.id) {
    return <Navigate to={`/materials/${project.id}`} replace />;
  }

  return (
    <MaterialsForProject
      project={project}
      allProjects={allProjects}
      navigate={navigate}
      t={t}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
    />
  );
}

function MaterialsForProject({ project, allProjects, navigate, t, isModalOpen, setIsModalOpen }) {
  const { materials, addMaterial } = useMaterials(project.id);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("materialsTitle")}</h1>
          <p className="page__subtitle">{t("materialsSubtitle")}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus />
          {t("newMaterial")}
        </button>
      </div>

      <div className="project-tabs" role="tablist">
        {allProjects.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === project.id}
            className={`project-tabs__tab ${p.id === project.id ? "is-active" : ""}`}
            onClick={() => navigate(`/materials/${p.id}`)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {materials.length === 0 ? (
        <EmptyState
          icon={IconBox}
          title={t("noMaterialsYetTitle")}
          body={t("noMaterialsYetBody")}
          action={
            <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
              <IconPlus />
              {t("newMaterial")}
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("materials")}</th>
                <th>{t("required")}</th>
                <th>{t("supplier")}</th>
                <th>{t("allocated")}</th>
                <th>{t("remaining")}</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const required = Number(m.required) || 0;
                const allocated = Number(m.allocated) || 0;
                const remaining = Math.max(required - allocated, 0);
                return (
                  <tr key={m.id}>
                    <td>
                      {m.material}
                      <div className="table-subtext">{m.category}</div>
                    </td>
                    <td className="mono">
                      {required.toLocaleString()} {m.uom}
                    </td>
                    <td>{t(SUPPLIER_KEY[m.suppliedBy]) || m.suppliedBy}</td>
                    <td className="mono">
                      {allocated.toLocaleString()} {m.uom}
                    </td>
                    <td className="mono">
                      {remaining.toLocaleString()} {m.uom}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title={t("newMaterial")} onClose={() => setIsModalOpen(false)}>
          <NewMaterialForm
            t={t}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addMaterial({
                ...values,
                required: Number(values.required) || 0,
                allocated: Number(values.allocated) || 0,
              });
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewMaterialForm({ t, onSubmit, onCancel }) {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.material.trim() || !values.required) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field form-field--full">
        <label htmlFor="m-name">{t("materialName")} *</label>
        <input id="m-name" value={values.material} onChange={(e) => set("material", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="m-category">{t("category")}</label>
        <select id="m-category" value={values.category} onChange={(e) => set("category", e.target.value)}>
          {MATERIAL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="m-supplier">{t("supplier")}</label>
        <select id="m-supplier" value={values.suppliedBy} onChange={(e) => set("suppliedBy", e.target.value)}>
          {SUPPLIER_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="m-required">{t("required")} *</label>
        <input id="m-required" type="number" min="0" value={values.required} onChange={(e) => set("required", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="m-uom">{t("unitOfMeasure")}</label>
        <select id="m-uom" value={values.uom} onChange={(e) => set("uom", e.target.value)}>
          {UOM_UNITS.map((uom) => (
            <option key={uom} value={uom}>
              {uom}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="m-allocated">{t("allocated")}</label>
        <input id="m-allocated" type="number" min="0" value={values.allocated} onChange={(e) => set("allocated", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("addMaterial")}
        </button>
      </div>
    </form>
  );
}
