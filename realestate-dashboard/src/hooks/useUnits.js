import { useMemo } from "react";
import { useEntityStore } from "./useEntityStore";

export function useUnits(projectId) {
  const { records, add, update, remove } = useEntityStore("siteflow.units", "UNT");

  const units = useMemo(
    () => records.filter((u) => u.projectId === projectId),
    [records, projectId]
  );

  function addUnit(unit) {
    return add({ ...unit, projectId });
  }

  return { units, addUnit, updateUnit: update, removeUnit: remove };
}
