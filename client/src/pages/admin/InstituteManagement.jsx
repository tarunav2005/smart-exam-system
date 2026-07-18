import { useState, useEffect, useMemo } from "react";
import { SkeletonStatsGrid } from "../../components/Skeleton";
import {
  getInstitutes,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  getAllUsers,
  getCourses,
} from "../../api/services";

const InstituteManagement = () => {
  const [institutes, setInstitutes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [instRes, courseRes, userRes] = await Promise.all([
        getInstitutes(),
        getCourses(),
        getAllUsers(),
      ]);
      setInstitutes(instRes.data);
      setCourses(courseRes.data);
      setUsers(userRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
    });
    setEditingId(null);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };
  const openEdit = (inst) => {
    setForm({
      name: inst.name,
      address: inst.address || "",
      contactEmail: inst.contactEmail || "",
      contactPhone: inst.contactPhone || "",
      code: inst.code,
    });
    setEditingId(inst._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await updateInstitute(editingId, form);
      } else {
        await createInstitute(form);
      }
      setShowModal(false);
      resetForm();
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save institute");
    }
  };

  const handleToggleActive = async (inst) => {
    try {
      await updateInstitute(inst._id, { isActive: !inst.isActive });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this institute? Linked courses will remain but lose their institute reference.",
      )
    )
      return;
    try {
      await deleteInstitute(id);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const getStatsFor = (instId) => {
    const courseCount = courses.filter(
      (c) => c.institute === instId || c.institute?._id === instId,
    ).length;
    const userCount = users.filter(
      (u) => u.institute === instId || u.institute?._id === instId,
    ).length;
    return { courseCount, userCount };
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return institutes;
    const q = search.toLowerCase();
    return institutes.filter(
      (i) =>
        i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q),
    );
  }, [institutes, search]);

  const totalActive = institutes.filter((i) => i.isActive).length;

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>Institutes</h2>
        </div>
        <SkeletonStatsGrid count={3} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Institutes</h2>
          <p className="page-subtitle">
            Manage affiliated institutions across the platform
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Add Institute
        </button>
      </div>

      <div
        className="stats-grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: "1.5rem",
        }}
      >
        <div className="stat-card">
          <p className="stat-label">Total Institutes</p>
          <p className="stat-value">{institutes.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active</p>
          <p className="stat-value" style={{ color: "#16a34a" }}>
            {totalActive}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Inactive</p>
          <p className="stat-value" style={{ color: "#dc2626" }}>
            {institutes.length - totalActive}
          </p>
        </div>
      </div>

      <div className="institute-search-bar">
        <input
          placeholder="Search institutes by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏛️</div>
          <div className="empty-state-title">
            {institutes.length === 0 ? "No institutes yet" : "No matches found"}
          </div>
          <p>
            {institutes.length === 0
              ? "Add your first institute to get started."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="institute-grid">
          {filtered.map((inst) => {
            const stats = getStatsFor(inst._id);
            return (
              <div className="institute-card" key={inst._id}>
                <div
                  className={`institute-card-banner ${!inst.isActive ? "inactive" : ""}`}
                >
                  <span
                    className={`institute-status-pill ${inst.isActive ? "active" : "inactive"}`}
                  >
                    {inst.isActive ? "● Active" : "● Inactive"}
                  </span>
                  <div className="institute-card-icon">🏛️</div>
                </div>
                <div className="institute-card-body">
                  <div className="institute-card-name">{inst.name}</div>
                  <span className="institute-card-code">{inst.code}</span>

                  <div className="institute-card-meta">
                    {inst.address && <span>📍 {inst.address}</span>}
                    {inst.contactEmail && <span>✉️ {inst.contactEmail}</span>}
                    {inst.contactPhone && <span>📞 {inst.contactPhone}</span>}
                    {!inst.address &&
                      !inst.contactEmail &&
                      !inst.contactPhone && (
                        <span style={{ color: "#ccc" }}>
                          No contact details added
                        </span>
                      )}
                  </div>

                  <div className="institute-card-stats">
                    <div className="institute-stat-mini">
                      <div className="num">{stats.courseCount}</div>
                      <div className="lbl">Courses</div>
                    </div>
                    <div className="institute-stat-mini">
                      <div className="num">{stats.userCount}</div>
                      <div className="lbl">Members</div>
                    </div>
                  </div>

                  <div className="institute-card-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => openEdit(inst)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleToggleActive(inst)}
                    >
                      {inst.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(inst._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Institute" : "Add New Institute"}</h3>
            {error && <p className="error-text">{error}</p>}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <input
                placeholder="Institute Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                placeholder="Institute Code (e.g. GITM)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={!!editingId}
                required
              />
              <input
                placeholder="Address (optional)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                type="email"
                placeholder="Contact Email (optional)"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
              />
              <input
                placeholder="Contact Phone (optional)"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Save Changes" : "Create Institute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteManagement;
