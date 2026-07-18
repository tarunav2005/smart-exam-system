import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="not-found-page">
    <div className="not-found-code">404</div>
    <h2 className="not-found-title">Page not found</h2>
    <p className="not-found-subtitle">
      The page you're looking for doesn't exist or you don't have access to it.
    </p>
    <Link
      to="/login"
      className="btn-primary"
      style={{ textDecoration: "none", marginTop: "0.5rem" }}
    >
      Back to Login
    </Link>
  </div>
);

export default NotFound;
