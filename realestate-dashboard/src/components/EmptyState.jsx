import "./EmptyState.css";

export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty-block">
      {Icon && (
        <div className="empty-block__icon">
          <Icon />
        </div>
      )}
      {title && <h3>{title}</h3>}
      {body && <p>{body}</p>}
      {action && <div className="empty-block__action">{action}</div>}
    </div>
  );
}
