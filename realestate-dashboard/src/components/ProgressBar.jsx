import "./ProgressBar.css";

export default function ProgressBar({ value, tone = "accent", label }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill progress-bar__fill--${tone}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label !== false && <span className="progress-bar__value mono">{clamped}%</span>}
    </div>
  );
}
