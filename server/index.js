require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const startReminderJob = require("./utils/examReminderJob");

connectDB();
startReminderJob();
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://smart-exam-system-eight.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.get("/", (req, res) => res.send("Smart Exam System API running"));
app.use("/api/institutes", require("./routes/instituteRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
