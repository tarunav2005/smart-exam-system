const sendEmail = require("../utils/sendEmail");
const notify = require("../utils/notify");

const jwt = require("jsonwebtoken");
const User = require("../models/user");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

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
} = require("../controllers/authController");

// @route  POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// @route  GET /api/auth/students  (Admin/Faculty) — list all students for exam assignment
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      isActive: true,
    }).select("name email");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always return the same success message whether or not the email exists —
    // prevents attackers from using this endpoint to discover which emails are registered.
    if (!user) {
      return res.json({
        message: "If that email is registered, an OTP has been sent.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes
    await user.save();

    await sendEmail(
      user.email,
      "Password Reset OTP — Smart Exam System",
      `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>Your OTP to reset your password is:</p>
        <div style="background: #eef2ff; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #4338ca;">
          ${otp}
        </div>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    );

    res.json({ message: "If that email is registered, an OTP has been sent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email }).select(
      "+resetOtp +resetOtpExpires",
    );
    if (!user || !user.resetOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    if (user.resetOtpExpires < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email }).select(
      "+resetOtp +resetOtpExpires",
    );
    if (!user || !user.resetOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }
    if (user.resetOtpExpires < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    user.password = newPassword; // pre('save') hook will hash it automatically
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    await notify(user._id, {
      title: "Password Changed",
      message:
        "Your password was successfully reset. If this wasn't you, contact support immediately.",
      type: "general",
      link: "/login",
    });

    res.json({ message: "Password reset successfully. You can now log in." });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/auth/users  (Admin only) — list all users with optional role filter
exports.getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/auth/users/:id/status  (Admin only) — activate/deactivate a user
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }

    user.isActive = !user.isActive;
    await user.save();
    res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/auth/users/:id/role  (Admin only) — change a user's role
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "faculty", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }

    user.role = role;
    await user.save();
    res.json({ message: "Role updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/auth/users/:id  (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/auth/dashboard-stats  (Admin only) — system-wide overview
exports.getDashboardStats = async (req, res) => {
  try {
    const Course = require("../models/Course");
    const Subject = require("../models/Subject");
    const Question = require("../models/Question");
    const Exam = require("../models/Exam");
    const ExamPaper = require("../models/ExamPaper");

    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      totalSubjects,
      totalQuestions,
      totalExams,
      publishedExams,
      totalSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "faculty" }),
      Course.countDocuments(),
      Subject.countDocuments(),
      Question.countDocuments({ isActive: true }),
      Exam.countDocuments(),
      Exam.countDocuments({ status: "published" }),
      ExamPaper.countDocuments({
        status: { $in: ["submitted", "auto_submitted"] },
      }),
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt");

    res.json({
      totalStudents,
      totalFaculty,
      totalCourses,
      totalSubjects,
      totalQuestions,
      totalExams,
      publishedExams,
      totalSubmissions,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
