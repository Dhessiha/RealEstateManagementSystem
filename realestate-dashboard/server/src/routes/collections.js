import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { getCollection, insertRecord, patchRecord, deleteRecord, makeId } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// One generic REST surface for every entity store the frontend uses
// (projects, units, materials, attendance, documents, payments, daily
// logs, construction stages, workforce…). Every one of the frontend's
// entity hooks funnels through the same `useEntityStore` hook, so a
// single generic collection API here is enough to back all of them —
// no per-entity route needed. Each store maps to records in the MySQL
// collections table, keyed by store name (e.g. "siteflow.projects").
router.use(requireAuth);

router.get("/:store", asyncHandler(async (req, res) => {
  res.json({ records: await getCollection(req.params.store) });
}));

router.post("/:store", asyncHandler(async (req, res) => {
  const { _idPrefix, id, ...fields } = req.body ?? {};
  const record = { id: id || makeId(_idPrefix || "REC"), ...fields };
  const saved = await insertRecord(req.params.store, record);
  res.status(201).json({ record: saved });
}));

router.patch("/:store/:id", asyncHandler(async (req, res) => {
  const updated = await patchRecord(req.params.store, req.params.id, req.body ?? {});
  if (!updated) return res.status(404).json({ error: "Record not found." });
  res.json({ record: updated });
}));

router.delete("/:store/:id", asyncHandler(async (req, res) => {
  await deleteRecord(req.params.store, req.params.id);
  res.status(204).end();
}));

export default router;
