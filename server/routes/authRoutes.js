const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  getStudents,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getAllUsers,
  toggleUserStatus,
  changeUserRole,
  deleteUser,
  getDashboardStats,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

router.get("/users", protect, authorize("admin"), getAllUsers);
router.put("/users/:id/status", protect, authorize("admin"), toggleUserStatus);
router.put("/users/:id/role", protect, authorize("admin"), changeUserRole);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);
router.get("/dashboard-stats", protect, authorize("admin"), getDashboardStats);

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/students", protect, authorize("admin", "faculty"), getStudents);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
module.exports = router;
