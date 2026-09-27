import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProject } from "../hooks/useProjects";
import { useUnits } from "../hooks/useUnits";
import { UNIT_STATUSES } from "../data/constants";
import ProgressBar from "../components/ProgressBar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { IconArrowLeft, IconMapPin, IconPlus, IconGrid } from "../components/Icons";
import "./ProjectDetailPage.css";

const emptyForm = { building: "", floor: "", unitNumber: "", area: "", price: "", status: UNIT_STATUSES[0] };

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { t } = useLanguage();
  const project = useProject(projectId);
  const { units, addUnit } = useUnits(projectId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="page">
      <Link to="/projects" className="back-link">
        <IconArrowLeft /> {t("backToProjects")}
      </Link>

      <div className="detail-header">
        <div>
          <div className="detail-header__badges">
            <span className="project-card__type">{project.type}</span>
            <StatusPill status={project.status} />
          </div>
          <h1>{project.name}</h1>
          <p className="page__subtitle">
            <IconMapPin /> {project.location}
          </p>
        </div>
        <div className="detail-header__progress">
          <span>{t("overallProgress")}</span>
          <ProgressBar value={Number(project.overallProgress) || 0} />
        </div>
      </div>

      <div className="detail-meta">
        <div>
          <dt>{t("client")}</dt>
          <dd>{project.client || "—"}</dd>
        </div>
        <div>
          <dt>{t("company")}</dt>
          <dd>{project.company || "—"}</dd>
        </div>
        <div>
          <dt>{t("startDate")}</dt>
          <dd className="mono">{project.startDate || "—"}</dd>
        </div>
        <div>
          <dt>{t("expectedEnd")}</dt>
          <dd className="mono">{project.expectedEnd || "—"}</dd>
        </div>
        <div>
          <dt>{t("materialResponsibility")}</dt>
          <dd>{project.materialResponsibility}</dd>
        </div>
        <div>
          <dt>{t("units")}</dt>
          <dd>
            {units.length} / {project.unitsTotal || 0}
          </dd>
        </div>
      </div>

      <div className="page__header">
        <h2 className="section-title">{t("units")}</h2>
        <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus />
          {t("newUnit")}
        </button>
      </div>

      {units.length === 0 ? (
        <EmptyState icon={IconGrid} title={t("noUnitsYetTitle")} body={t("noUnitsYetBody")} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("building")}</th>
                <th>{t("floor")}</th>
                <th>{t("unit")}</th>
                <th>{t("area")}</th>
                <th>{t("price")}</th>
                <th>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.building}</td>
                  <td className="mono">{unit.floor}</td>
                  <td className="mono">{unit.unitNumber}</td>
                  <td className="mono">{Number(unit.area).toLocaleString()} sqft</td>
                  <td className="mono">₹{Number(unit.price).toLocaleString("en-IN")}</td>
                  <td>
                    <StatusPill status={unit.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title={t("newUnit")} onClose={() => setIsModalOpen(false)}>
          <NewUnitForm
            t={t}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addUnit({
                ...values,
                area: Number(values.area) || 0,
                price: Number(values.price) || 0,
              });
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewUnitForm({ t, onSubmit, onCancel }) {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.unitNumber.trim() || !values.building.trim()) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field">
        <label htmlFor="u-building">{t("building")} *</label>
        <input id="u-building" value={values.building} onChange={(e) => set("building", e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="u-floor">{t("floor")}</label>
        <input id="u-floor" value={values.floor} onChange={(e) => set("floor", e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="u-number">{t("unit")} *</label>
        <input id="u-number" value={values.unitNumber} onChange={(e) => set("unitNumber", e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="u-status">{t("status")}</label>
        <select id="u-status" value={values.status} onChange={(e) => set("status", e.target.value)}>
          {UNIT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="u-area">{t("area")} (sqft)</label>
        <input id="u-area" type="number" min="0" value={values.area} onChange={(e) => set("area", e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="u-price">{t("price")} (₹)</label>
        <input id="u-price" type="number" min="0" value={values.price} onChange={(e) => set("price", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("addUnit")}
        </button>
      </div>
    </form>
  );
}
