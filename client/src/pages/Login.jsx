import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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

  const featureVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: 0.5 + i * 0.12, duration: 0.4, ease: "easeOut" },
    }),
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-visual"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Floating decorative blobs */}
        <motion.div
          className="auth-blob auth-blob-1"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="auth-blob auth-blob-2"
          animate={{ y: [0, 15, 0], x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="auth-visual-content">
          <motion.div
            className="auth-brand"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src="/logo.png"
              alt="ExamSphere"
              className="auth-logo"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.15,
              }}
            />
            <div className="brand-content">
              <h2 className="brand-title">ExamSphere</h2>
              <span className="brand-tagline">
                Smart Online Examination Platform
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            Smart Online Examination & Assessment System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            Secure, randomized, and intelligently monitored assessments — built
            for institutions that take academic integrity seriously.
          </motion.p>

          <div className="auth-feature-list">
            {[
              { icon: "🔀", text: "Randomized question papers per student" },
              { icon: "🛡️", text: "Real-time anti-cheat monitoring" },
              { icon: "📊", text: "Instant analytics for faculty" },
            ].map((f, i) => (
              <motion.div
                className="auth-feature-item"
                key={i}
                custom={i}
                variants={featureVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ x: 6 }}
              >
                <span className="auth-feature-icon">{f.icon}</span>
                {f.text}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="auth-form-side">
        <motion.form
          className="auth-card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back
          </motion.h2>
          <p className="auth-subtitle">Log in to continue to your dashboard</p>

          {error && (
            <motion.p
              className="error-text"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {error}
            </motion.p>
          )}

          <motion.div
            className="input-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>

          <motion.div
            className="input-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </motion.div>

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

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              >
                Logging in...
              </motion.span>
            ) : (
              "Log In"
            )}
          </motion.button>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;
