import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Questions from "../admin/Questions";
import FacultyAnalytics from "./FacultyAnalytics";
import ExamManagement from "./ExamManagement";
import ManualEvaluation from "./ManualEvaluation";
import NotificationBell from "../../components/NotificationBell";
import LiveExamStatus from "./LiveExamStatus";

const FacultyLayout = () => {
  const [activeTab, setActiveTab] = useState("analytics");
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span className="sidebar-brand-icon">🎓</span>
            <h3>ExamSphere</h3>
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
          className={activeTab === "analytics" ? "active" : ""}
          onClick={() => setActiveTab("analytics")}
        >
          📊 Analytics
        </button>

        <button
          className={activeTab === "grading" ? "active" : ""}
          onClick={() => setActiveTab("grading")}
        >
          ✍️ Manual Evaluation
        </button>

        <button
          className={activeTab === "questions" ? "active" : ""}
          onClick={() => setActiveTab("questions")}
        >
          ❓ Question Bank
        </button>

        <button
          className={activeTab === "exams" ? "active" : ""}
          onClick={() => setActiveTab("exams")}
        >
          📋 Exams
        </button>

        <button
          className={activeTab === "live" ? "active" : ""}
          onClick={() => setActiveTab("live")}
        >
          🔴 Live Status
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
      <div className="main-content">
        {activeTab === "analytics" && <FacultyAnalytics />}
        {activeTab === "questions" && <Questions />}
        {activeTab === "exams" && <ExamManagement />}
        {activeTab === "grading" && <ManualEvaluation />}
        {activeTab === "live" && <LiveExamStatus />}
      </div>
    </div>
  );
};

export default FacultyLayout;
