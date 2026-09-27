import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useConstructionStages } from "../hooks/useConstructionStages";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../lib/apiClient";
import {
  CURRENT_ACTIVITY_OPTIONS,
  QUALITY_INSPECTION_STATUSES,
  STAGE_APPROVAL_STATUSES,
  QUALITY_CHECKLIST_ITEMS,
} from "../data/constructionStages";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import Modal from "../components/Modal";
import {
  IconBuilding,
  IconCheck,
  IconClose,
  IconClipboard,
  IconImage,
  IconFileText,
  IconShieldCheck,
  IconDownload,
  IconChevronRight,
  IconTrash,
  IconPlus,
  IconPencil,
} from "../components/Icons";
import "./ConstructionPage.css";

export default function ConstructionPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { allProjects, addProject } = useProjects();

  if (allProjects.length === 0) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h1>{t("constructionTitle")}</h1>
            <p className="page__subtitle">{t("constructionSubtitle")}</p>
          </div>
        </div>
        <NoProjectsEmptyState icon={IconBuilding} title={t("noProjectsForModuleTitle")} onQuickCreate={addProject} />
      </div>
    );
  }

  const project = allProjects.find((p) => p.id === projectId) ?? allProjects[0];
  if (!projectId || projectId !== project.id) {
    return <Navigate to={`/construction/${project.id}`} replace />;
  }

  return <ConstructionForProject key={project.id} project={project} allProjects={allProjects} navigate={navigate} t={t} />;
}

function ConstructionForProject({ project, allProjects, navigate, t }) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { stages, currentIndex, updateStage, addDailyProgress, approveStage, addStage, removeStage, renameStage } =
    useConstructionStages(project.id);

  const [selectedStageName, setSelectedStageName] = useState(() => stages[currentIndex]?.name ?? null);
  const selectedStage = stages.find((s) => s.name === selectedStageName) ?? stages[currentIndex] ?? null;

  const [addingStage, setAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");

  const [editingStageName, setEditingStageName] = useState(null);
  const [editDraftName, setEditDraftName] = useState("");

  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);

  const photosInputRef = useRef(null);
  const documentsInputRef = useRef(null);

  const [engineers, setEngineers] = useState([]);
  useEffect(() => {
    apiFetch("/auth/accounts")
      .then((data) => setEngineers((data.accounts ?? []).filter((a) => a.role === "engineer" || a.role === "admin")))
      .catch(() => {});
  }, []);

  function handleUploadFiles(field, fileList) {
    if (!selectedStage || !fileList?.length) return;
    const existing = selectedStage.data[field] ?? [];
    const newFiles = Array.from(fileList).map((f) => ({
      id: `F-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
    }));
    updateStage(selectedStage.name, { [field]: [...existing, ...newFiles] });
  }

  function handleRemoveFile(field, fileId) {
    if (!selectedStage) return;
    const existing = selectedStage.data[field] ?? [];
    updateStage(selectedStage.name, { [field]: existing.filter((f) => f.id !== fileId) });
  }

  function handleAddStage(e) {
    e.preventDefault();
    const trimmed = newStageName.trim();
    if (!trimmed) return;
    addStage(trimmed);
    setSelectedStageName(trimmed);
    setNewStageName("");
    setAddingStage(false);
  }

  function startEditingStage(stageName) {
    setEditingStageName(stageName);
    setEditDraftName(stageName);
  }

  function cancelEditingStage() {
    setEditingStageName(null);
    setEditDraftName("");
  }

  function handleSaveRename(e) {
    if (e) e.preventDefault();
    if (!editingStageName) return;
    const res = renameStage(editingStageName, editDraftName);
    if (res?.error) {
      alert(res.error);
      return;
    }
    if (selectedStageName === editingStageName) {
      setSelectedStageName(res.newName);
    }
    setEditingStageName(null);
    setEditDraftName("");
  }

  function handleDirectRename(oldName, newName) {
    const res = renameStage(oldName, newName);
    if (res?.error) {
      return res;
    }
    if (selectedStageName === oldName) {
      setSelectedStageName(res.newName);
    }
    return res;
  }

  function handleRemoveStage(stageName) {
    if (stages.length <= 1) return;
    const confirmed = window.confirm(
      `Delete "${stageName}"? Any activity, photos, and notes logged for this stage will be removed too.`
    );
    if (!confirmed) return;
    removeStage(stageName);
    if (selectedStageName === stageName) {
      const remaining = stages.filter((s) => s.name !== stageName);
      setSelectedStageName(remaining[0]?.name ?? null);
    }
  }

  function handleGenerateReport() {
    const lines = [
      `Construction Report — ${project.name}`,
      `Generated ${new Date().toLocaleString()}`,
      "",
      ...stages.map((s, i) => {
        const status = s.isComplete ? "Completed" : i === currentIndex ? "In Progress" : "Pending";
        return `${i + 1}. ${s.name} — ${status} (${s.data.progressPercent || 0}%)`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-")}-construction-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page construction-page">
      <div className="page__header">
        <div>
          <h1>{t("constructionTitle")}</h1>
          <p className="page__subtitle">{t("constructionSubtitle")}</p>
        </div>
      </div>

      <div className="project-tabs" role="tablist">
        {allProjects.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === project.id}
            className={`project-tabs__tab ${p.id === project.id ? "is-active" : ""}`}
            onClick={() => navigate(`/construction/${p.id}`)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="construction-layout">
        <div className="stage-rail-card">
          <h2>Construction Site Tracking</h2>
          <p className="stage-rail-card__subtitle">
            Monitor every construction site activity to project handover.
          </p>
          <ol className="stage-rail">
            {stages.map((stage, index) => {
              const status = stage.isComplete ? "done" : index === currentIndex ? "current" : "pending";
              const isSelected = selectedStage?.name === stage.name;
              const isEditing = editingStageName === stage.name;

              return (
                <li key={stage.name} className={`stage-rail__item stage-rail__item--${status}`}>
                  {isEditing ? (
                    <form className="stage-rail__rename-form" onSubmit={handleSaveRename}>
                      <span className="stage-rail__marker">
                        {stage.isComplete ? <IconCheck /> : index + 1}
                      </span>
                      <input
                        autoFocus
                        className="stage-rail__rename-input"
                        value={editDraftName}
                        onChange={(e) => setEditDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEditingStage();
                        }}
                      />
                      <button
                        type="submit"
                        className="stage-rail__action-btn stage-rail__action-btn--save"
                        title="Save name"
                        aria-label="Save name"
                      >
                        <IconCheck />
                      </button>
                      <button
                        type="button"
                        className="stage-rail__action-btn stage-rail__action-btn--cancel"
                        title="Cancel"
                        aria-label="Cancel editing"
                        onClick={cancelEditingStage}
                      >
                        <IconClose />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="stage-rail__row"
                        aria-current={isSelected}
                        onClick={() => setSelectedStageName(stage.name)}
                      >
                        <span className="stage-rail__marker">
                          {stage.isComplete ? <IconCheck /> : index + 1}
                        </span>
                        <span className={`stage-rail__label ${isSelected ? "is-selected" : ""}`}>
                          {stage.name}
                        </span>
                        <IconChevronRight className="stage-rail__chevron" />
                      </button>
                      {isAdmin && (
                        <div className="stage-rail__actions">
                          <button
                            type="button"
                            className="stage-rail__edit"
                            title="Edit stage name / spelling"
                            aria-label={`Edit ${stage.name}`}
                            onClick={() => startEditingStage(stage.name)}
                          >
                            <IconPencil />
                          </button>
                          {stages.length > 1 && (
                            <button
                              type="button"
                              className="stage-rail__delete"
                              title="Delete stage"
                              aria-label={`Delete ${stage.name}`}
                              onClick={() => handleRemoveStage(stage.name)}
                            >
                              <IconTrash />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ol>

          {isAdmin &&
            (addingStage ? (
              <form className="stage-rail__add-form" onSubmit={handleAddStage}>
                <input
                  autoFocus
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="New stage name"
                />
                <button type="submit" className="btn btn--primary btn--sm">
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setAddingStage(false);
                    setNewStageName("");
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button type="button" className="stage-rail__add-btn" onClick={() => setAddingStage(true)}>
                <IconPlus /> Add stage
              </button>
            ))}
        </div>

        {selectedStage && (
          <StageDetailPanel
            key={selectedStage.name}
            stage={selectedStage}
            engineers={engineers}
            isAdmin={isAdmin}
            onClose={() => setSelectedStageName(stages[currentIndex]?.name ?? null)}
            onUpdateProgress={(patch) => updateStage(selectedStage.name, patch)}
            onRenameStage={handleDirectRename}
            onUploadFiles={handleUploadFiles}
            onRemoveFile={handleRemoveFile}
          />
        )}
      </div>

      <div className="construction-toolbar">
        <button type="button" onClick={() => setDailyModalOpen(true)} disabled={!selectedStage}>
          <IconClipboard /> Add Daily Progress
        </button>
        <button type="button" onClick={() => photosInputRef.current?.click()} disabled={!selectedStage}>
          <IconImage /> Upload Photos
        </button>
        <button type="button" onClick={() => documentsInputRef.current?.click()} disabled={!selectedStage}>
          <IconFileText /> Upload Document
        </button>
        <button type="button" onClick={() => setChecklistModalOpen(true)} disabled={!selectedStage}>
          <IconShieldCheck /> Quality Checklist
        </button>
        {isAdmin && (
          <button
            type="button"
            className="construction-toolbar__approve"
            onClick={() => selectedStage && approveStage(selectedStage.name)}
            disabled={!selectedStage || selectedStage.isComplete}
          >
            <IconCheck /> Approve Stage
          </button>
        )}
        <button type="button" onClick={handleGenerateReport} disabled={!selectedStage}>
          <IconDownload /> Generate Report
        </button>
        <input
          ref={photosInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleUploadFiles("siteImages", e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={documentsInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            handleUploadFiles("documents", e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {dailyModalOpen && selectedStage && (
        <DailyProgressModal
          stage={selectedStage}
          onClose={() => setDailyModalOpen(false)}
          onSubmit={(entry) => {
            addDailyProgress(selectedStage.name, entry);
            setDailyModalOpen(false);
          }}
        />
      )}

      {checklistModalOpen && selectedStage && (
        <QualityChecklistModal
          stage={selectedStage}
          onClose={() => setChecklistModalOpen(false)}
          onToggleItem={(checklist) => updateStage(selectedStage.name, { qualityChecklist: checklist })}
          onMarkPassed={() => {
            updateStage(selectedStage.name, { qualityInspection: "Passed" });
            setChecklistModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function StageDetailPanel({
  stage,
  engineers,
  isAdmin,
  onClose,
  onUpdateProgress,
  onRenameStage,
  onUploadFiles,
  onRemoveFile,
}) {
  const [draft, setDraft] = useState(() => ({
    currentActivity: stage.data.currentActivity || "",
    description: stage.data.description || "",
    assignedEngineerId: stage.data.assignedEngineerId || "",
    startDate: stage.data.startDate || "",
    expectedCompletion: stage.data.expectedCompletion || "",
    actualCompletion: stage.data.actualCompletion || "",
    progressPercent: stage.data.progressPercent || 0,
    notes: stage.data.notes || "",
    qualityInspection: stage.data.qualityInspection || "Pending",
    approvalStatus: stage.data.approvalStatus || "Pending",
  }));
  const [materials, setMaterials] = useState(stage.data.materialsUsed ?? []);
  const [equipment, setEquipment] = useState(stage.data.equipmentUsed ?? []);
  const [materialInput, setMaterialInput] = useState("");
  const [equipmentInput, setEquipmentInput] = useState("");

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(stage.name);

  useEffect(() => {
    setTitleDraft(stage.name);
    setIsEditingTitle(false);
  }, [stage.name]);

  function handleSaveTitle(e) {
    if (e) e.preventDefault();
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === stage.name) {
      setIsEditingTitle(false);
      setTitleDraft(stage.name);
      return;
    }
    const res = onRenameStage?.(stage.name, trimmed);
    if (res?.error) {
      alert(res.error);
      return;
    }
    setIsEditingTitle(false);
  }

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function addTag(kind) {
    if (kind === "material") {
      const value = materialInput.trim();
      if (!value) return;
      setMaterials((m) => [...m, value]);
      setMaterialInput("");
    } else {
      const value = equipmentInput.trim();
      if (!value) return;
      setEquipment((m) => [...m, value]);
      setEquipmentInput("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onUpdateProgress({ ...draft, materialsUsed: materials, equipmentUsed: equipment });
  }

  return (
    <form className="stage-detail" onSubmit={handleSubmit}>
      <div className="stage-detail__header">
        {isEditingTitle ? (
          <div className="stage-detail__title-edit-form">
            <input
              autoFocus
              className="stage-detail__title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle(e);
                if (e.key === "Escape") {
                  setIsEditingTitle(false);
                  setTitleDraft(stage.name);
                }
              }}
            />
            <button
              type="button"
              className="stage-rail__action-btn stage-rail__action-btn--save"
              title="Save name"
              aria-label="Save name"
              onClick={handleSaveTitle}
            >
              <IconCheck />
            </button>
            <button
              type="button"
              className="stage-rail__action-btn stage-rail__action-btn--cancel"
              title="Cancel"
              aria-label="Cancel editing"
              onClick={() => {
                setIsEditingTitle(false);
                setTitleDraft(stage.name);
              }}
            >
              <IconClose />
            </button>
          </div>
        ) : (
          <div className="stage-detail__title-row">
            <h3>{stage.name}</h3>
            {isAdmin && (
              <button
                type="button"
                className="stage-detail__rename-btn"
                title="Edit stage name / spelling"
                aria-label={`Edit stage name ${stage.name}`}
                onClick={() => setIsEditingTitle(true)}
              >
                <IconPencil />
              </button>
            )}
          </div>
        )}
        <button type="button" className="stage-detail__close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
      </div>

      <div className="stage-detail__grid">
        <label className="form-field">
          <span>Current Activity</span>
          <select value={draft.currentActivity} onChange={(e) => set("currentActivity", e.target.value)}>
            <option value="">Select activity</option>
            {CURRENT_ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field stage-detail__span2">
          <span>Description</span>
          <textarea
            rows={2}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Enter description"
          />
        </label>

        <label className="form-field">
          <span>Assigned Engineer</span>
          <select value={draft.assignedEngineerId} onChange={(e) => set("assignedEngineerId", e.target.value)}>
            <option value="">Select engineer</option>
            {engineers.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Start Date</span>
          <input type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </label>
        <label className="form-field">
          <span>Expected Completion</span>
          <input
            type="date"
            value={draft.expectedCompletion}
            onChange={(e) => set("expectedCompletion", e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Actual Completion</span>
          <input
            type="date"
            value={draft.actualCompletion}
            onChange={(e) => set("actualCompletion", e.target.value)}
          />
        </label>

        <div className="form-field stage-detail__span2">
          <span>Progress % — {draft.progressPercent}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={draft.progressPercent}
            onChange={(e) => set("progressPercent", Number(e.target.value))}
          />
        </div>

        <div className="form-field">
          <span>Materials Used</span>
          <div className="tag-input">
            <input
              value={materialInput}
              onChange={(e) => setMaterialInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("material");
                }
              }}
              placeholder="Type and press Enter"
            />
            <button type="button" onClick={() => addTag("material")}>
              Add
            </button>
          </div>
          <div className="tag-list">
            {materials.map((m, i) => (
              <span key={`${m}-${i}`} className="tag-chip">
                {m}
                <button type="button" onClick={() => setMaterials((arr) => arr.filter((_, idx) => idx !== i))}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-field">
          <span>Equipment Used</span>
          <div className="tag-input">
            <input
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("equipment");
                }
              }}
              placeholder="Type and press Enter"
            />
            <button type="button" onClick={() => addTag("equipment")}>
              Add
            </button>
          </div>
          <div className="tag-list">
            {equipment.map((m, i) => (
              <span key={`${m}-${i}`} className="tag-chip">
                {m}
                <button type="button" onClick={() => setEquipment((arr) => arr.filter((_, idx) => idx !== i))}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <label className="form-field stage-detail__span2">
          <span>Daily Notes</span>
          <textarea
            rows={2}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Enter daily notes"
          />
        </label>

        <UploadBox
          label="Site Images"
          field="siteImages"
          files={stage.data.siteImages}
          onUpload={onUploadFiles}
          onRemove={onRemoveFile}
          accept="image/*"
        />
        <UploadBox
          label="Before Images"
          field="beforeImages"
          files={stage.data.beforeImages}
          onUpload={onUploadFiles}
          onRemove={onRemoveFile}
          accept="image/*"
        />
        <UploadBox
          label="After Images"
          field="afterImages"
          files={stage.data.afterImages}
          onUpload={onUploadFiles}
          onRemove={onRemoveFile}
          accept="image/*"
        />

        <UploadBox
          label="Attach Documents"
          field="documents"
          files={stage.data.documents}
          onUpload={onUploadFiles}
          onRemove={onRemoveFile}
        />

        <label className="form-field">
          <span>Quality Inspection</span>
          <select value={draft.qualityInspection} onChange={(e) => set("qualityInspection", e.target.value)}>
            {QUALITY_INSPECTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Approval Status</span>
          <select
            value={draft.approvalStatus}
            disabled={!isAdmin}
            onChange={(e) => set("approvalStatus", e.target.value)}
          >
            {STAGE_APPROVAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" className="btn btn--primary stage-detail__submit">
        Update Progress
      </button>
    </form>
  );
}

function UploadBox({ label, field, files, onUpload, onRemove, accept }) {
  const inputRef = useRef(null);
  const list = files ?? [];
  return (
    <div className="form-field">
      <span>{label}</span>
      <button type="button" className="upload-box" onClick={() => inputRef.current?.click()}>
        <IconImage /> Upload {accept ? "images" : "files"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          onUpload(field, e.target.files);
          e.target.value = "";
        }}
      />
      {list.length > 0 && (
        <div className="upload-box__files">
          {list.map((f) => (
            <span key={f.id} className="tag-chip">
              {f.name}
              <button type="button" onClick={() => onRemove(field, f.id)}>
                <IconTrash />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyProgressModal({ stage, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <Modal title={`Add Daily Progress — ${stage.name}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!note.trim()) return;
          onSubmit({ date, note: note.trim() });
        }}
      >
        <div className="form-field form-field--full">
          <label htmlFor="daily-date">Date</label>
          <input id="daily-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-field form-field--full">
          <label htmlFor="daily-note">What happened today?</label>
          <textarea
            id="daily-note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Progress made, issues faced, material movement…"
            autoFocus
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            <IconCheck /> Save entry
          </button>
        </div>
      </form>

      {stage.data.dailyLog?.length > 0 && (
        <div className="daily-log-history">
          <h4>Recent entries</h4>
          <ul>
            {stage.data.dailyLog.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <span className="mono">{entry.date}</span> — {entry.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

function QualityChecklistModal({ stage, onClose, onToggleItem, onMarkPassed }) {
  const checklist = stage.data.qualityChecklist?.length
    ? stage.data.qualityChecklist
    : QUALITY_CHECKLIST_ITEMS.map(() => false);

  function toggle(index) {
    const next = [...checklist];
    next[index] = !next[index];
    onToggleItem(next);
  }

  const allChecked = checklist.every(Boolean);

  return (
    <Modal title={`Quality Checklist — ${stage.name}`} onClose={onClose}>
      <ul className="quality-checklist">
        {QUALITY_CHECKLIST_ITEMS.map((item, index) => (
          <li key={item}>
            <label>
              <input type="checkbox" checked={!!checklist[index]} onChange={() => toggle(index)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
        <button type="button" className="btn btn--primary" disabled={!allChecked} onClick={onMarkPassed}>
          <IconCheck /> Mark Quality: Passed
        </button>
      </div>
    </Modal>
  );
}
