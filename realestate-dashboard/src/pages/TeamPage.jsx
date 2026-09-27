import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { IconPlus, IconUsers, IconHardHat, IconTrash, IconCheck } from "../components/Icons";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../lib/apiClient";
import "./TeamPage.css";

const ROLE_META = {
  admin: { label: "Administrator", chip: "chip--admin" },
  engineer: { label: "Site Engineer", chip: "chip--engineer" },
  client: { label: "Client", chip: "chip--client" },
};

// Admin-only screen. This is the ONLY place a role is ever chosen — and
// it's the admin choosing it for someone else's login, at the moment the
// account is created. The person who signs in with it is never asked.
export default function TeamPage() {
  const { addStaffMember, user: currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "engineer" });
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const staff = accounts.filter((a) => a.role !== "client");
  const clients = accounts.filter((a) => a.role === "client");

  function refresh() {
    apiFetch("/auth/accounts")
      .then((data) => setAccounts(data.accounts ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Enter a name and a valid email address.");
      return;
    }
    try {
      const account = await addStaffMember(form);
      setCreated(account);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    if (id === currentUser?.id) return;
    try {
      await apiFetch(`/auth/accounts/${id}`, { method: "DELETE" });
      refresh();
    } catch {
      /* ignore — list stays as-is if the request failed */
    }
  }

  function closeForm() {
    setShowForm(false);
    setCreated(null);
    setForm({ name: "", email: "", phone: "", role: "engineer" });
    setError("");
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Team &amp; Access</h1>
          <p className="page__subtitle">Create and manage engineer and admin logins for your team.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)}>
          <IconPlus /> New staff login
        </button>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card--info">
          <IconHardHat />
          <div>
            <strong>{staff.length}</strong>
            <span>Staff logins (admin + engineers)</span>
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <IconUsers />
          <div>
            <strong>{clients.length}</strong>
            <span>Client logins (self-registered)</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card__header">
          <h2 className="section-title">Staff logins</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>
                    <span className={`role-chip ${ROLE_META[a.role]?.chip ?? ""}`}>
                      {ROLE_META[a.role]?.label ?? a.role}
                    </span>
                  </td>
                  <td>{a.email || "—"}</td>
                  <td>{a.phone || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="team-remove"
                      disabled={a.id === currentUser?.id}
                      onClick={() => handleRemove(a.id)}
                      aria-label="Remove login"
                      title={a.id === currentUser?.id ? "You can't remove your own login" : "Remove login"}
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {clients.length > 0 && (
        <div className="section-card">
          <div className="section-card__header">
            <h2 className="section-title">Client logins</h2>
            <span className="table-subtext">Created automatically when a client signs up or continues with Google/OTP</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Signed up via</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.email || "—"}</td>
                    <td>{a.phone || "—"}</td>
                    <td className="mono">{a.provider ?? "password"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="Create a staff login" onClose={closeForm}>
          {created ? (
            <div className="team-created">
              <p>
                <strong>{created.name}</strong>'s login has been created as{" "}
                <span className={`role-chip ${ROLE_META[created.role]?.chip}`}>
                  {ROLE_META[created.role]?.label}
                </span>
                .
              </p>
              <p className="team-created__note">
                Share these sign-in details — the role is already attached, so they'll never be
                asked to choose one.
              </p>
              <div className="team-created__creds mono">
                <div>Email: {created.email}</div>
                <div>Temporary password: {created.tempPassword}</div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--primary" onClick={closeForm}>
                  <IconCheck /> Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              {error && <div className="form-error">{error}</div>}

              <div className="form-field form-field--full">
                <label htmlFor="staff-role">Role</label>
                <select
                  id="staff-role"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="engineer">Site Engineer / Worker</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="form-field form-field--full">
                <label htmlFor="staff-name">Full name *</label>
                <input
                  id="staff-name"
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Arun Kumar"
                />
              </div>

              <div className="form-field form-field--full">
                <label htmlFor="staff-email">Email *</label>
                <input
                  id="staff-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@company.com"
                />
              </div>

              <div className="form-field form-field--full">
                <label htmlFor="staff-phone">Phone</label>
                <input
                  id="staff-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn--ghost" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  <IconCheck /> Create login
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
