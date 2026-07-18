import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.role === "admin") navigate("/admin");
      else if (data.role === "faculty") navigate("/faculty");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-brand">
            <span className="auth-brand-icon">🎓</span>
            ExamSphere
          </div>
          <h1>Smart Online Examination & Assessment System</h1>
          <p>
            Secure, randomized, and intelligently monitored assessments — built
            for institutions that take academic integrity seriously.
          </p>
          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🔀</span>
              Randomized question papers per student
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🛡️</span>
              Real-time anti-cheat monitoring
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">📊</span>
              Instant analytics for faculty
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Log in to continue to your dashboard</p>
          {error && <p className="error-text">{error}</p>}

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Link
            to="/forgot-password"
            style={{
              fontSize: "0.82rem",
              color: "var(--primary)",
              textDecoration: "none",
              alignSelf: "flex-end",
              fontWeight: 600,
            }}
          >
            Forgot password?
          </Link>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
