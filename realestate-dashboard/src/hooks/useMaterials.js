import { useMemo } from "react";
import { useEntityStore } from "./useEntityStore";

export function useMaterials(projectId) {
  const { records, add, update, remove } = useEntityStore("siteflow.materials", "MAT");

  const materials = useMemo(
    () => records.filter((m) => m.projectId === projectId),
    [records, projectId]
  );

  function addMaterial(material) {
    return add({ ...material, projectId });
  }

  return { materials, addMaterial, updateMaterial: update, removeMaterial: remove };
}
