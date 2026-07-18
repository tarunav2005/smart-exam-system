import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, verifyOtp, resetPassword } from "../api/services";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = email, 2 = otp, 3 = new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("OTP sent! Check your email inbox (and spam folder).");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setSuccess("");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      alert(
        "Password reset successfully! Please log in with your new password.",
      );
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
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
          <h1>Reset your password</h1>
          <p>
            We'll send a one-time code to your email to verify it's really you
            before resetting your password.
          </p>
          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">📧</span>
              Secure email-based OTP verification
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">⏱️</span>
              Code expires in 10 minutes
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <form
          className="auth-card"
          onSubmit={
            step === 1
              ? handleSendOtp
              : step === 2
                ? handleVerifyOtp
                : handleResetPassword
          }
        >
          {/* Step indicator */}
          <div
            style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}
          >
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  height: "4px",
                  flex: 1,
                  borderRadius: "2px",
                  background: s <= step ? "var(--primary)" : "var(--border)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>

          {step === 1 && (
            <>
              <h2>Forgot password?</h2>
              <p className="auth-subtitle">
                Enter your email and we'll send you a reset code
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Enter the code</h2>
              <p className="auth-subtitle">We sent a 6-digit code to {email}</p>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Set new password</h2>
              <p className="auth-subtitle">Choose a strong new password</p>
            </>
          )}

          {error && <p className="error-text">{error}</p>}
          {success && !error && (
            <p
              style={{
                color: "#15803d",
                fontSize: "0.85rem",
                background: "#dcfce7",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
              }}
            >
              {success}
            </p>
          )}

          {step === 1 && (
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
          )}

          {step === 2 && (
            <>
              <div className="input-group">
                <label>6-digit OTP</label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{
                    letterSpacing: "4px",
                    fontSize: "1.1rem",
                    textAlign: "center",
                  }}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{
                  background: "transparent",
                  color: "var(--primary)",
                  border: "none",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                  boxShadow: "none",
                }}
              >
                Didn't get it? Resend code
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : step === 1
                ? "Send Code"
                : step === 2
                  ? "Verify Code"
                  : "Reset Password"}
          </button>

          <p className="auth-switch">
            Remembered your password? <Link to="/login">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
