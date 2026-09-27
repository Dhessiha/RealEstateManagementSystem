import { useMemo } from "react";
import { useEntityStore } from "./useEntityStore";

export function useIssues(projectId) {
  const { records, add, update, remove } = useEntityStore("siteflow.issues", "ISS");

  const issues = useMemo(
    () =>
      records
        .filter((r) => r.projectId === projectId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [records, projectId]
  );

  function addIssue(issue) {
    return add({ ...issue, projectId, status: "Open" });
  }

  return { issues, addIssue, updateIssue: update, removeIssue: remove };
}
