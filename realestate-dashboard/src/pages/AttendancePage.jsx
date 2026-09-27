import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useWorkforce } from "../hooks/useWorkforce";
import { useAttendance } from "../hooks/useAttendance";
import { ATTENDANCE_STATUSES } from "../data/constants";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import NoProjectsEmptyState from "../components/NoProjectsEmptyState";
import { IconCalendar, IconPlus, IconBuilding, IconCheck, IconAlert } from "../components/Icons";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  date: todayISO(),
  workerId: "",
  status: ATTENDANCE_STATUSES[0],
  checkIn: "",
  note: "",
};

export default function AttendancePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { allProjects, addProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (allProjects.length === 0) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h1>{t("nav_attendance")}</h1>
            <p className="page__subtitle">{t("attendanceSubtitle")}</p>
          </div>
        </div>
        <NoProjectsEmptyState icon={IconBuilding} title={t("noProjectsForModuleTitle")} onQuickCreate={addProject} />
      </div>
    );
  }

  const project = allProjects.find((p) => p.id === projectId) ?? allProjects[0];
  if (!projectId || projectId !== project.id) {
    return <Navigate to={`/attendance/${project.id}`} replace />;
  }

  return (
    <AttendanceForProject
      project={project}
      allProjects={allProjects}
      navigate={navigate}
      t={t}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
    />
  );
}

function AttendanceForProject({ project, allProjects, navigate, t, isModalOpen, setIsModalOpen }) {
  const { allWorkers } = useWorkforce();
  const { entries, addEntry } = useAttendance(project.id);
  const [dateFilter, setDateFilter] = useState(todayISO());

  const projectWorkers = useMemo(
    () => allWorkers.filter((w) => w.currentProjectId === project.id),
    [allWorkers, project.id]
  );

  const workerName = (id) => allWorkers.find((w) => w.id === id)?.name ?? "—";

  const todaysEntries = useMemo(
    () => entries.filter((e) => e.date === dateFilter),
    [entries, dateFilter]
  );

  const summary = useMemo(
    () => ({
      present: todaysEntries.filter((e) => e.status === "Present").length,
      absent: todaysEntries.filter((e) => e.status === "Absent").length,
      halfDay: todaysEntries.filter((e) => e.status === "Half Day").length,
      onLeave: todaysEntries.filter((e) => e.status === "On Leave").length,
    }),
    [todaysEntries]
  );

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{t("nav_attendance")}</h1>
          <p className="page__subtitle">{t("attendanceSubtitle")}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus />
          {t("markAttendance")}
        </button>
      </div>

      <div className="project-tabs" role="tablist">
        {allProjects.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === project.id}
            className={`project-tabs__tab ${p.id === project.id ? "is-active" : ""}`}
            onClick={() => navigate(`/attendance/${p.id}`)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {entries.length > 0 && (
        <>
          <div className="toolbar">
            <div className="form-field">
              <label htmlFor="att-date-filter">{t("date")}</label>
              <input
                id="att-date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="stat-cards">
            <div className="stat-card stat-card--success">
              <IconCheck />
              <div>
                <strong>{summary.present}</strong>
                <span>{t("statusPresent")}</span>
              </div>
            </div>
            <div className="stat-card stat-card--danger">
              <IconAlert />
              <div>
                <strong>{summary.absent}</strong>
                <span>{t("statusAbsent")}</span>
              </div>
            </div>
            <div className="stat-card stat-card--warning">
              <IconCalendar />
              <div>
                <strong>{summary.halfDay}</strong>
                <span>{t("statusHalfDay")}</span>
              </div>
            </div>
            <div className="stat-card stat-card--info">
              <IconCalendar />
              <div>
                <strong>{summary.onLeave}</strong>
                <span>{t("statusOnLeave")}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={IconCalendar}
          title={t("noAttendanceYetTitle")}
          body={t("noAttendanceYetBody")}
          action={
            <button type="button" className="btn btn--primary" onClick={() => setIsModalOpen(true)}>
              <IconPlus />
              {t("markAttendance")}
            </button>
          }
        />
      ) : todaysEntries.length === 0 ? (
        <div className="empty-state">{t("noAttendanceForDate")}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("workerName")}</th>
                <th>{t("status")}</th>
                <th>{t("checkInTime")}</th>
                <th>{t("note")}</th>
              </tr>
            </thead>
            <tbody>
              {todaysEntries.map((e) => (
                <tr key={e.id}>
                  <td>{workerName(e.workerId)}</td>
                  <td>
                    <StatusPill
                      status={e.status}
                      tone={
                        e.status === "Present"
                          ? "success"
                          : e.status === "Absent"
                          ? "danger"
                          : e.status === "Half Day"
                          ? "warning"
                          : "info"
                      }
                    />
                  </td>
                  <td className="mono">{e.checkIn || "—"}</td>
                  <td>{e.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title={t("markAttendance")} onClose={() => setIsModalOpen(false)}>
          <NewAttendanceForm
            t={t}
            workers={projectWorkers.length > 0 ? projectWorkers : allWorkers}
            onCancel={() => setIsModalOpen(false)}
            onSubmit={(values) => {
              addEntry(values);
              setIsModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NewAttendanceForm({ t, workers, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...emptyForm, workerId: workers[0]?.id ?? "" });
  const [error, setError] = useState("");

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.workerId || !values.date) {
      setError(t("formRequiredFields"));
      return;
    }
    onSubmit(values);
  }

  if (workers.length === 0) {
    return <p className="page__subtitle">{t("noWorkersForAttendance")}</p>;
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-field form-field--full">
        <label htmlFor="a-worker">{t("workerName")} *</label>
        <select id="a-worker" value={values.workerId} onChange={(e) => set("workerId", e.target.value)}>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="a-date">{t("date")} *</label>
        <input id="a-date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="a-status">{t("status")}</label>
        <select id="a-status" value={values.status} onChange={(e) => set("status", e.target.value)}>
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="a-checkin">{t("checkInTime")}</label>
        <input id="a-checkin" type="time" value={values.checkIn} onChange={(e) => set("checkIn", e.target.value)} />
      </div>

      <div className="form-field form-field--full">
        <label htmlFor="a-note">{t("note")}</label>
        <input id="a-note" value={values.note} onChange={(e) => set("note", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn btn--primary">
          {t("markAttendance")}
        </button>
      </div>
    </form>
  );
}
