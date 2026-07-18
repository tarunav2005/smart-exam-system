import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import StudentExams from "./StudentExams";
import StudentDashboard from "./StudentDashboard";
import NotificationBell from "../../components/NotificationBell";

const StudentLayout = () => {
  const [activeTab, setActiveTab] = useState("exams");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div
          className="sidebar-brand"
          style={{ justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <img
              src="/logo.png"
              alt="ExamSphere Logo"
              className="sidebar-logo"
            />

            <h3 className="brand-title">ExamSphere</h3>
          </div>

          <NotificationBell />
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="sidebar-nav-label">Workspace</div>
        <button
          className={activeTab === "exams" ? "active" : ""}
          onClick={() => setActiveTab("exams")}
        >
          📝 My Exams
        </button>
        <button
          className={activeTab === "performance" ? "active" : ""}
          onClick={() => setActiveTab("performance")}
        >
          📊 My Performance
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
      <div className="main-content">
        {activeTab === "exams" && <StudentExams />}
        {activeTab === "performance" && <StudentDashboard />}
      </div>
    </div>
  );
};

export default StudentLayout;
