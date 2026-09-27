import { useMemo, useCallback } from "react";
import { useEntityStore } from "./useEntityStore";
import { CONSTRUCTION_STAGES } from "../data/constructionStages";

function defaultStageData(projectId, stageName) {
  return {
    projectId,
    stageName,
    currentActivity: "",
    description: "",
    assignedEngineerId: "",
    startDate: "",
    expectedCompletion: "",
    actualCompletion: "",
    progressPercent: 0,
    materialsUsed: [],
    equipmentUsed: [],
    dailyLog: [],
    siteImages: [],
    beforeImages: [],
    afterImages: [],
    documents: [],
    qualityInspection: "Pending",
    qualityChecklist: [],
    approvalStatus: "Pending",
    isComplete: false,
    notes: "",
  };
}

/**
 * Per-project construction-stage tracking. Every project starts with the
 * standard 16-stage sequence (CONSTRUCTION_STAGES) as a default, but the
 * sequence itself is editable per project — stages can be added or
 * removed. The custom order (once touched) is stored per project; a
 * stage only gets a detail record once someone actually opens and edits
 * it, so nothing here is seeded beyond the default stage names.
 */
export function useConstructionStages(projectId) {
  const { records, add, update, remove } = useEntityStore("siteflow.constructionStages", "CST");
  const { records: orderRecords, add: addOrder, update: updateOrder } = useEntityStore("siteflow.stageOrder", "SOR");

  const orderRecord = useMemo(
    () => orderRecords.find((r) => r.projectId === projectId) ?? null,
    [orderRecords, projectId]
  );
  const rawStageNames = orderRecord?.order ?? CONSTRUCTION_STAGES;
  const stageNames = useMemo(
    () => rawStageNames.filter((s) => s !== "Site Preparation"),
    [rawStageNames]
  );

  const getOrCreateOrderId = useCallback(() => {
    if (orderRecord) return orderRecord.id;
    const created = addOrder({ projectId, order: stageNames });
    return created.id;
  }, [orderRecord, addOrder, projectId, stageNames]);

  const addStage = useCallback(
    (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const current = stageNames;
      if (current.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
      const id = getOrCreateOrderId();
      updateOrder(id, { order: [...current, trimmed] });
    },
    [stageNames, getOrCreateOrderId, updateOrder]
  );

  const renameStage = useCallback(
    (oldName, newName) => {
      const trimmed = newName.trim();
      if (!trimmed) return { error: "Stage name cannot be empty." };
      if (trimmed.toLowerCase() !== oldName.toLowerCase()) {
        if (stageNames.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
          return { error: `Stage "${trimmed}" already exists.` };
        }
      }
      const newOrder = stageNames.map((s) => (s === oldName ? trimmed : s));
      const id = getOrCreateOrderId();
      updateOrder(id, { order: newOrder });

      const detail = records.find((r) => r.projectId === projectId && r.stageName === oldName);
      if (detail) {
        update(detail.id, { stageName: trimmed });
      }
      return { ok: true, newName: trimmed };
    },
    [stageNames, getOrCreateOrderId, updateOrder, records, projectId, update]
  );

  const removeStage = useCallback(
    (name) => {
      const current = stageNames;
      if (current.length <= 1) return;
      const id = getOrCreateOrderId();
      updateOrder(id, { order: current.filter((s) => s !== name) });
      const detail = records.find((r) => r.projectId === projectId && r.stageName === name);
      if (detail) remove(detail.id);
    },
    [stageNames, getOrCreateOrderId, updateOrder, records, projectId, remove]
  );

  const projectRecords = useMemo(
    () => records.filter((r) => r.projectId === projectId),
    [records, projectId]
  );

  const stages = useMemo(
    () =>
      stageNames.map((stageName, index) => {
        const record = projectRecords.find((r) => r.stageName === stageName);
        return {
          index,
          name: stageName,
          data: record ?? defaultStageData(projectId, stageName),
          recordId: record?.id ?? null,
          isComplete: !!record?.isComplete,
        };
      }),
    [stageNames, projectRecords, projectId]
  );

  const currentIndex = useMemo(() => {
    const firstIncomplete = stages.findIndex((s) => !s.isComplete);
    return firstIncomplete === -1 ? Math.max(stages.length - 1, 0) : firstIncomplete;
  }, [stages]);

  const getOrCreateRecordId = useCallback(
    (stageName) => {
      const existing = projectRecords.find((r) => r.stageName === stageName);
      if (existing) return existing.id;
      const created = add(defaultStageData(projectId, stageName));
      return created.id;
    },
    [projectRecords, add, projectId]
  );

  const updateStage = useCallback(
    (stageName, patch) => {
      const id = getOrCreateRecordId(stageName);
      update(id, patch);
    },
    [getOrCreateRecordId, update]
  );

  const addDailyProgress = useCallback(
    (stageName, entry) => {
      const id = getOrCreateRecordId(stageName);
      const current = projectRecords.find((r) => r.id === id);
      const dailyLog = current?.dailyLog ?? [];
      update(id, {
        dailyLog: [
          { id: `LOG-${Date.now()}`, date: new Date().toISOString().slice(0, 10), ...entry },
          ...dailyLog,
        ],
      });
    },
    [getOrCreateRecordId, projectRecords, update]
  );

  const approveStage = useCallback(
    (stageName) => {
      const id = getOrCreateRecordId(stageName);
      const current = projectRecords.find((r) => r.id === id);
      update(id, {
        approvalStatus: "Approved",
        isComplete: true,
        progressPercent: 100,
        actualCompletion: current?.actualCompletion || new Date().toISOString().slice(0, 10),
      });
    },
    [getOrCreateRecordId, projectRecords, update]
  );

  return { stages, currentIndex, updateStage, addDailyProgress, approveStage, addStage, removeStage, renameStage };
}
