import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useFinancials } from "../hooks/useFinancials";
import { useAuth } from "../hooks/useAuth";
import { PAYMENT_MODES } from "../data/constants";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import { IconWallet, IconPlus, IconBuilding } from "../components/Icons";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

const emptyPaymentForm = { date: todayISO(), payerName: "", amount: "", mode: PAYMENT_MODES[0], note: "" };

export default function FinancialPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { allProjects, addProject } = useProjects();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  if (allProjects.length === 0) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h1>{t("nav_financial")}</h1>
            <p className="page__subtitle">{t("financialSubtitle")}</p>
          </div>
        </div>
        <NoProjectsEmptyState icon={IconBuilding} title={t("noProjectsForModuleTitle")} onQuickCreate={addProject} />
      </div>
    );
  }

  const project = allProjects.find((p) => p.id === projectId) ?? allProjects[0];
  if (!projectId || projectId !== project.id) {
    return <Navigate to={`/financial/${project.id}`} replace />;
  }

  return (
    <FinancialForProject
      project={project}
      allProjects={allProjects}
      navigate={navigate}
      t={t}
      isPaymentModalOpen={isPaymentModalOpen}
      setIsPaymentModalOpen={setIsPaymentModalOpen}
      isBudgetModalOpen={isBudgetModalOpen}
      setIsBudgetModalOpen={setIsBudgetModalOpen}
    />
  );
}

function FinancialForProject({
  project,
  allProjects,
  navigate,
  t,
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  isBudgetModalOpen,
  setIsBudgetModalOpen,
}) {
  const { budget, saveBudget, payments, addPayment, totalReceived } = useFinancials(project.id);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const estimated = Number(budget?.estimatedCost) || 0;
  const actual = Number(budget?.actualCost) || 0;
  const variance = estimated - actual;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("nav_financial")}</h1>
          <p className="page__subtitle">
            {isAdmin ? t("financialSubtitle") : "Your budget summary and payment history for this project."}
          </p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn--primary" onClick={() => setIsPaymentModalOpen(true)}>
            <IconPlus />
            {t("recordPayment")}
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
              onClick={() => navigate(`/financial/${p.id}`)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="section-card">
        <div className="section-card__header">
          <h3 className="section-title">{t("budget")}</h3>
          {isAdmin && (
            <button type="button" className="btn btn--ghost" onClick={() => setIsBudgetModalOpen(true)}>
              {t("editBudget")}
            </button>
          )}
        </div>
        <div className="stat-cards">
          <div className="stat-card">
            <IconWallet />
            <div>
              <strong>{formatCurrency(estimated)}</strong>
              <span>{t("estimatedCost")}</span>
            </div>
          </div>
          <div className="stat-card">
            <IconWallet />
            <div>
              <strong>{formatCurrency(actual)}</strong>
              <span>{t("actualCost")}</span>
            </div>
          </div>
          <div className={`stat-card ${variance >= 0 ? "stat-card--success" : "stat-card--danger"}`}>
            <IconWallet />
            <div>
              <strong>{formatCurrency(Math.abs(variance))}</strong>
              <span>{variance >= 0 ? t("underBudget") : t("overBudget")}</span>
            </div>
          </div>
          <div className="stat-card stat-card--info">
            <IconWallet />
            <div>
              <strong>{formatCurrency(totalReceived)}</strong>
              <span>{t("totalReceived")}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="section-title">{t("customerPayments")}</h3>
        {payments.length === 0 ? (
          <EmptyState
            icon={IconWallet}
            title={t("noPaymentsYetTitle")}
            body={t("noPaymentsYetBody")}
            action={
              isAdmin ? (
                <button type="button" className="btn btn--primary" onClick={() => setIsPaymentModalOpen(true)}>
                  <IconPlus />
                  {t("recordPayment")}
                </button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("payerName")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("paymentMode")}</th>
                  <th>{t("note")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.date}</td>
                    <td>{p.payerName}</td>
                    <td className="mono">{formatCurrency(p.amount)}</td>
                    <td>{p.mode}</td>
                    <td>{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isPaymentModalOpen && (
        <Modal title={t("recordPayment")} onClose={() => setIsPaymentModalOpen(false)}>
          <NewPaymentForm
            t={t}
            onCancel={() => setIsPaymentModalOpen(false)}
            onSubmit={(values) => {
              addPayment({ ...values, amount: Number(values.amount) || 0 });
              setIsPaymentModalOpen(false);
            }}
          />
        </Modal>
      )}

      {isBudgetModalOpen && (
        <Modal title={t("editBudget")} onClose={() => setIsBudgetModalOpen(false)}>
          <BudgetForm
            t={t}
            budget={budget}
            onCancel={() => setIsBudgetModalOpen(false)}
            onSubmit={(values) => {
              saveBudget(values);
              setIsBudgetModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewPaymentForm({ t, onSubmit, onCancel }) {
  const [values, setValues] = useState(emptyPaymentForm);
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.payerName.trim() || !values.amount) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field form-field--full">
        <label htmlFor="p-payer">{t("payerName")} *</label>
        <input id="p-payer" value={values.payerName} onChange={(e) => set("payerName", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="p-date">{t("date")}</label>
        <input id="p-date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="p-amount">{t("amount")} *</label>
        <input id="p-amount" type="number" min="0" value={values.amount} onChange={(e) => set("amount", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="p-mode">{t("paymentMode")}</label>
        <select id="p-mode" value={values.mode} onChange={(e) => set("mode", e.target.value)}>
          {PAYMENT_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field form-field--full">
        <label htmlFor="p-note">{t("note")}</label>
        <input id="p-note" value={values.note} onChange={(e) => set("note", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("recordPayment")}
        </button>
      </div>
    </form>
  );
}

function BudgetForm({ t, budget, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    estimatedCost: budget?.estimatedCost ?? "",
    actualCost: budget?.actualCost ?? "",
  });

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      estimatedCost: Number(values.estimatedCost) || 0,
      actualCost: Number(values.actualCost) || 0,
    });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="b-estimated">{t("estimatedCost")}</label>
        <input
          id="b-estimated"
          type="number"
          min="0"
          value={values.estimatedCost}
          onChange={(e) => set("estimatedCost", e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="b-actual">{t("actualCost")}</label>
        <input
          id="b-actual"
          type="number"
          min="0"
          value={values.actualCost}
          onChange={(e) => set("actualCost", e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("saveBudget")}
        </button>
      </div>
    </form>
  );
}
