import { IconCheck } from "./Icons";
import "./StageTracker.css";

/**
 * A checklist of construction stages for one project. Checking a stage
 * marks it complete; the first unchecked stage is highlighted as the
 * stage currently underway — this is what answers "which stage are we
 * in" at a glance, without opening any task.
 */
export default function StageTracker({ stages, completed, onToggle, t }) {
  const currentIndex = stages.findIndex((s) => !completed.includes(s));
  const doneCount = completed.length;

  return (
    <div className="stage-tracker">
      <div className="stage-tracker__header">
        <h3 className="section-title">{t ? t("constructionStagesTitle") : "Construction stages"}</h3>
        <span className="stage-tracker__count">
          {doneCount} of {stages.length} complete
        </span>
      </div>
      <ol className="stage-tracker__list">
        {stages.map((stage, index) => {
          const isDone = completed.includes(stage);
          const isCurrent = !isDone && index === currentIndex;
          return (
            <li
              key={stage}
              className={`stage-tracker__item ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
            >
              <button
                type="button"
                className="stage-tracker__checkbox"
                role="checkbox"
                aria-checked={isDone}
                onClick={() => onToggle(stage)}
              >
                {isDone && <IconCheck />}
              </button>
              <span className="stage-tracker__label">{stage}</span>
              {isCurrent && <span className="stage-tracker__badge">Current stage</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
