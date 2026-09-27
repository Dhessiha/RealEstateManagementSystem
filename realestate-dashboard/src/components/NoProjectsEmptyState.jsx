import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useOptionLists } from "../hooks/useOptionLists";
import EmptyState from "./EmptyState";
import { IconBuilding, IconCheck } from "./Icons";
import "./NoProjectsEmptyState.css";

/**
 * The "no projects yet" state, shown on every module page. Rather than
 * sending an admin away to a separate Projects screen, it lets them add
 * a project right here — the module's real content (task checklist,
 * attendance grid, etc.) then renders on this same screen immediately,
 * because the project was added through this page's own data hook.
 *
 * Engineers and clients can't create projects, so they see a plain
 * message instead of the form.
 */
export default function NoProjectsEmptyState({ icon = IconBuilding, title, onQuickCreate }) {
  const { role } = useAuth();
  const { projectTypes } = useOptionLists();
  const isAdmin = role === "admin";

  const [form, setForm] = useState({ name: "", client: "", location: "" });
  const [error, setError] = useState("");

  if (!isAdmin || !onQuickCreate) {
    return (
      <EmptyState
        icon={icon}
        title={title ?? "No projects yet"}
        body="No projects have been added yet. Once your admin creates one, it'll show up here automatically."
      />
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Enter a project name to continue.");
      return;
    }
    setError("");
    onQuickCreate({
      name: form.name.trim(),
      client: form.client.trim(),
      location: form.location.trim(),
      type: projectTypes[0] ?? "Residential",
      company: "",
      status: "Planning",
      materialResponsibility: "Company",
      startDate: new Date().toISOString().slice(0, 10),
      expectedEnd: "",
      unitsTotal: "",
    });
  }

  return (
    <EmptyState
      icon={icon}
      title={title ?? "No projects yet"}
      body="Add your first project below — this opens right here, no other screen needed."
      action={
        <form className="quick-project-form" onSubmit={handleSubmit} noValidate>
          <input
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (error) setError("");
            }}
            placeholder="Project name *"
            autoFocus
          />
          <input
            value={form.client}
            onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
            placeholder="Client"
          />
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Location"
          />
          {error && <p className="quick-project-form__error">{error}</p>}
          <button type="submit" className="btn btn--primary">
            <IconCheck /> Create &amp; continue
          </button>
        </form>
      }
    />
  );
}
