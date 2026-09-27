import { useMemo, useState } from "react";
import { useEntityStore } from "./useEntityStore";

export function useDocuments(projectId) {
  const { records, add, update, remove } = useEntityStore("siteflow.documents", "DOC");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const allDocuments = useMemo(() => records.filter((r) => r.projectId === projectId), [records, projectId]);

  const documents = useMemo(
    () => allDocuments.filter((d) => categoryFilter === "all" || d.category === categoryFilter),
    [allDocuments, categoryFilter]
  );

  function addDocument(doc) {
    return add({ ...doc, projectId });
  }

  return {
    documents,
    allDocuments,
    addDocument,
    updateDocument: update,
    removeDocument: remove,
    categoryFilter,
    setCategoryFilter,
  };
}
