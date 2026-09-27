import { useMemo, useState } from "react";
import { useEntityStore } from "./useEntityStore";

export function useWorkforce() {
  const { records: workers, add, update, remove } = useEntityStore("siteflow.workers", "WRK");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchesQuery =
        query.trim().length === 0 || w.name.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === "all" || w.workerType === typeFilter;
      const matchesProject = projectFilter === "all" || w.currentProjectId === projectFilter;
      return matchesQuery && matchesType && matchesProject;
    });
  }, [workers, query, typeFilter, projectFilter]);

  const summary = useMemo(
    () => ({
      total: workers.length,
      permanent: workers.filter((w) => w.workerType === "Permanent").length,
      temporary: workers.filter((w) => w.workerType === "Temporary").length,
      contractor: workers.filter((w) => w.workerType === "Contractor").length,
      onSite: workers.filter((w) => w.availability === "On Site").length,
    }),
    [workers]
  );

  return {
    workers: filtered,
    allWorkers: workers,
    summary,
    addWorker: add,
    updateWorker: update,
    removeWorker: remove,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    projectFilter,
    setProjectFilter,
  };
}
