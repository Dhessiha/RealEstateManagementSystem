import "./StatusPill.css";

const TONE_BY_STATUS = {
  Completed: "success",
  Sold: "success",
  "In Progress": "info",
  Booked: "info",
  "Not Started": "neutral",
  Available: "neutral",
  Planning: "neutral",
  Delayed: "danger",
  "On Hold": "warning",
  "Nearing Completion": "info",
};

export default function StatusPill({ status, tone }) {
  const resolvedTone = tone ?? TONE_BY_STATUS[status] ?? "neutral";
  return <span className={`status-pill status-pill--${resolvedTone}`}>{status}</span>;
}
