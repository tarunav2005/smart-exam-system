import { useState, useEffect } from "react";
import { SkeletonStatsGrid } from "../../components/Skeleton";
import { getDashboardStats } from "../../api/services";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>Dashboard Overview</h2>
        </div>
        <SkeletonStatsGrid count={8} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p className="page-subtitle">System-wide snapshot</p>
      </div>

      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <div className="stat-card">
          <p className="stat-label">Students</p>
          <p className="stat-value">{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Faculty</p>
          <p className="stat-value">{stats.totalFaculty}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Courses</p>
          <p className="stat-value">{stats.totalCourses}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Subjects</p>
          <p className="stat-value">{stats.totalSubjects}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Questions</p>
          <p className="stat-value">{stats.totalQuestions}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Exams</p>
          <p className="stat-value">{stats.totalExams}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Published</p>
          <p className="stat-value" style={{ color: "#16a34a" }}>
            {stats.publishedExams}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Submissions</p>
          <p className="stat-value">{stats.totalSubmissions}</p>
        </div>
      </div>

      <h3 style={{ margin: "1.8rem 0 1rem", fontSize: "1.1rem" }}>
        Recently Joined
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {stats.recentUsers.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span
                  className="badge"
                  style={{ background: "#eef2ff", color: "#4338ca" }}
                >
                  {u.role}
                </span>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
