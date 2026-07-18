import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const SystemSettings = () => {
  const { user } = useAuth();
  const [passMode, setPassMode] = useState(false);

  return (
    <div>
      <div className="page-header">
        <h2>System Settings</h2>
      </div>

      <div className="chart-card">
        <h3>Account Information</h3>
        <p style={{ fontSize: "0.88rem", color: "#555", marginTop: "0.5rem" }}>
          Name: {user?.name}
        </p>
        <p style={{ fontSize: "0.88rem", color: "#555" }}>
          Email: {user?.email}
        </p>
        <p style={{ fontSize: "0.88rem", color: "#555" }}>Role: {user?.role}</p>
      </div>

      <div className="chart-card">
        <h3>Password</h3>
        <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.5rem" }}>
          Use the "Forgot Password" flow from the login page to reset your
          password via email OTP.
        </p>
      </div>

      <div className="chart-card">
        <h3>Application Info</h3>
        <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.5rem" }}>
          ExamSphere — Smart Online Examination & Assessment System
        </p>
        <p style={{ fontSize: "0.85rem", color: "#888" }}>Version 1.0</p>
      </div>
    </div>
  );
};

export default SystemSettings;
