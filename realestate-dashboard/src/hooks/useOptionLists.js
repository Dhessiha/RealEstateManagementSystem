import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { PROJECT_TYPES, PROJECT_STATUSES } from "../data/constants";

/**
 * useOptionLists
 * Project types and project statuses used to be fixed arrays in
 * data/constants.js. They're now editable, persisted lists (seeded from
 * those same defaults) so new options added from the "Manage project
 * options" screen show up everywhere types/statuses are used —
 * the Projects filters, the New Project form, and status pills.
 */
export function useOptionLists() {
  const [projectTypes, setProjectTypes] = useLocalStorage("siteflow.projectTypes", PROJECT_TYPES);
  const [projectStatuses, setProjectStatuses] = useLocalStorage("siteflow.projectStatuses", PROJECT_STATUSES);

  const addProjectType = useCallback(
    (label) => {
      const clean = label.trim();
      if (!clean) return { ok: false, reason: "empty" };
      setProjectTypes((prev) => {
        if (prev.some((item) => item.toLowerCase() === clean.toLowerCase())) return prev;
        return [...prev, clean];
      });
      return { ok: true };
    },
    [setProjectTypes]
  );

  const removeProjectType = useCallback(
    (label) => {
      setProjectTypes((prev) => (prev.length > 1 ? prev.filter((item) => item !== label) : prev));
    },
    [setProjectTypes]
  );

  const addProjectStatus = useCallback(
    (label) => {
      const clean = label.trim();
      if (!clean) return { ok: false, reason: "empty" };
      setProjectStatuses((prev) => {
        if (prev.some((item) => item.toLowerCase() === clean.toLowerCase())) return prev;
        return [...prev, clean];
      });
      return { ok: true };
    },
    [setProjectStatuses]
  );

  const removeProjectStatus = useCallback(
    (label) => {
      setProjectStatuses((prev) => (prev.length > 1 ? prev.filter((item) => item !== label) : prev));
    },
    [setProjectStatuses]
  );

  return {
    projectTypes,
    addProjectType,
    removeProjectType,
    projectStatuses,
    addProjectStatus,
    removeProjectStatus,
  };
}
