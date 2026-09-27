import { useMemo } from "react";
import { useEntityStore } from "./useEntityStore";

export function useFinancials(projectId) {
  const { records: budgets, add: addBudget, update: updateBudget } = useEntityStore("siteflow.budgets", "BUD");
  const { records: payments, add: addPaymentRecord, remove: removePayment } = useEntityStore(
    "siteflow.payments",
    "PAY"
  );

  const budget = useMemo(() => budgets.find((b) => b.projectId === projectId) ?? null, [budgets, projectId]);

  const projectPayments = useMemo(
    () =>
      payments
        .filter((p) => p.projectId === projectId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [payments, projectId]
  );

  const totalReceived = useMemo(
    () => projectPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [projectPayments]
  );

  function saveBudget({ estimatedCost, actualCost }) {
    if (budget) {
      updateBudget(budget.id, { estimatedCost, actualCost });
    } else {
      addBudget({ projectId, estimatedCost, actualCost });
    }
  }

  function addPayment(payment) {
    return addPaymentRecord({ ...payment, projectId });
  }

  return {
    budget,
    saveBudget,
    payments: projectPayments,
    addPayment,
    removePayment,
    totalReceived,
  };
}
