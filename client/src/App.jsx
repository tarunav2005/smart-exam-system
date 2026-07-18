import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";
import Courses from "./pages/admin/Courses";
import AdminLayout from "./pages/admin/AdminLayout";
import StudentLayout from "./pages/student/StudentLayout";
import TakeExam from "./pages/student/TakeExam";
import FacultyLayout from "./pages/faculty/FacultyLayout";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResultReview from "./pages/student/ResultReview";

// Simple placeholder dashboards for now — we'll build these out properly on Day 2+
const Dashboard = ({ title }) => {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: "2rem" }}>
      <h1>{title}</h1>
      <p>
        Welcome, {user?.name} ({user?.role})
      </p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading)
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </PrivateRoute>
        }
      />
      <Route
        path="/faculty"
        element={
          <PrivateRoute allowedRoles={["faculty"]}>
            <FacultyLayout />{" "}
          </PrivateRoute>
        }
      />
      <Route
        path="/student"
        element={
          <PrivateRoute allowedRoles={["student"]}>
            <StudentLayout />
          </PrivateRoute>
        }
      />
      <Route
        path="/student/exam/:examId"
        element={
          <PrivateRoute allowedRoles={["student"]}>
            <TakeExam />
          </PrivateRoute>
        }
      />
      <Route
        path="/student/review/:paperId"
        element={
          <PrivateRoute allowedRoles={["student"]}>
            <ResultReview />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
