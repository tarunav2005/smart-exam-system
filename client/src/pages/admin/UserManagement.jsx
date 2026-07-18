import { useState, useEffect } from "react";
import { SkeletonTable } from "../../components/Skeleton";
import {
  getAllUsers,
  toggleUserStatus,
  changeUserRole,
  deleteUserAPI,
} from "../../api/services";
import { useAuth } from "../../context/AuthContext";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const { user: currentUser } = useAuth();

  const loadUsers = async (role) => {
    setLoading(true);
    try {
      const res = await getAllUsers(role);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(roleFilter);
  }, [roleFilter]);

  const handleToggleStatus = async (userId) => {
    setActioningId(userId);
    try {
      await toggleUserStatus(userId);
      loadUsers(roleFilter);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setActioningId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    setActioningId(userId);
    try {
      await changeUserRole(userId, newRole);
      loadUsers(roleFilter);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Permanently delete this user? This cannot be undone."))
      return;
    setActioningId(userId);
    try {
      await deleteUserAPI(userId);
      loadUsers(roleFilter);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActioningId(null);
    }
  };

  const roleBadge = (role) => {
    const map = {
      admin: { bg: "#fef3c7", color: "#92400e" },
      faculty: { bg: "#dbeafe", color: "#1d4ed8" },
      student: { bg: "#eef2ff", color: "#4338ca" },
    };
    const s = map[role] || map.student;
    return (
      <span className="badge" style={{ background: s.bg, color: s.color }}>
        {role}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
      </div>

      <select
        className="filter-select"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="faculty">Faculty</option>
        <option value="student">Student</option>
      </select>

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No users found</div>
          <p>No users match this filter.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;
                return (
                  <tr key={u._id}>
                    <td>
                      {u.name}{" "}
                      {isSelf && (
                        <span style={{ color: "#888", fontSize: "0.78rem" }}>
                          (you)
                        </span>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: u.isActive ? "#dcfce7" : "#fee2e2",
                          color: u.isActive ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {!isSelf && (
                        <>
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u._id, e.target.value)
                            }
                            disabled={actioningId === u._id}
                            style={{
                              padding: "0.35rem 0.5rem",
                              fontSize: "0.8rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            className="btn-secondary"
                            style={{
                              padding: "0.35rem 0.7rem",
                              fontSize: "0.8rem",
                            }}
                            disabled={actioningId === u._id}
                            onClick={() => handleToggleStatus(u._id)}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="btn-danger"
                            disabled={actioningId === u._id}
                            onClick={() => handleDelete(u._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
