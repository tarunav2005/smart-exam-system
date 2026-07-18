import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Courses from "./Courses";
import Subjects from "./Subjects";
import Questions from "./Questions";
import ExamManagement from "../faculty/ExamManagement";
import UserManagement from "./UserManagement";
import NotificationBell from "../../components/NotificationBell";
import AdminDashboard from "./AdminDashboard";
import SystemSettings from "./SystemSettings";
import InstituteManagement from "./InstituteManagement";

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
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

        <div className="sidebar-nav-label">Management</div>

        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          🏠 Dashboard
        </button>

        <button
          className={activeTab === "institutes" ? "active" : ""}
          onClick={() => setActiveTab("institutes")}
        >
          🏛️ Institutes
        </button>

        <button
          className={activeTab === "courses" ? "active" : ""}
          onClick={() => setActiveTab("courses")}
        >
          📚 Courses
        </button>
        <button
          className={activeTab === "subjects" ? "active" : ""}
          onClick={() => setActiveTab("subjects")}
        >
          📖 Subjects
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
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>

        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ Settings
        </button>
      </div>
      <div className="main-content">
        {activeTab === "courses" && <Courses />}
        {activeTab === "subjects" && <Subjects />}
        {activeTab === "questions" && <Questions />}
        {activeTab === "exams" && <ExamManagement />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "dashboard" && <AdminDashboard />}
        {activeTab === "settings" && <SystemSettings />}
        {activeTab === "institutes" && <InstituteManagement />}
      </div>
    </div>
  );
};

export default AdminLayout;
