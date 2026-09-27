import { useMemo } from "react";
import { useEntityStore } from "./useEntityStore";

export function useConstructionTasks(projectId) {
  const { records, add, update, remove } = useEntityStore("siteflow.tasks", "TSK");

  const tasks = useMemo(
    () => records.filter((task) => task.projectId === projectId),
    [records, projectId]
  );

  function addTask(task) {
    return add({ ...task, projectId });
  }

  return { tasks, addTask, updateTask: update, removeTask: remove };
}
