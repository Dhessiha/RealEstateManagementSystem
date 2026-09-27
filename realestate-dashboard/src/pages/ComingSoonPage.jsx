import EmptyState from "../components/EmptyState";
import "./ComingSoonPage.css";

export default function ComingSoonPage({ title, subtitle, icon }) {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{title}</h1>
          <p className="page__subtitle">{subtitle}</p>
        </div>
      </div>

      <EmptyState icon={icon} />
    </div>
  );
}
