import { useMemo } from "react";
import { useEntityStore } from "./useEntityStore";

export function useDailyLog(projectId) {
  const { records, add, update, remove } = useEntityStore("siteflow.dailyLogs", "LOG");

  const entries = useMemo(
    () =>
      records
        .filter((r) => r.projectId === projectId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [records, projectId]
  );

  function addEntry(entry) {
    return add({ ...entry, projectId });
  }

  return { entries, addEntry, updateEntry: update, removeEntry: remove };
}
