const express = require("express");
const router = express.Router();
const {
  createExam,
  getExams,
  getExamById,
  publishExam,
  startExam,
  deleteExam,
  saveAnswer,
  submitExam,
  recordTabSwitch,
  getMyResults,
  getExamAnalytics,
  getPendingGrading,
  gradeManually,
  downloadScorecard,
  exportExamResults,
  getLiveExamStatus,
  exportExamSummary,
  exportAttendanceReport,
  exportSubjectAnalysis,
  exportTop10,
  exportQuestionAnalysis,
  recordRefresh,
  getResultReview,
  exportMarksheet,
} = require("../controllers/examController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getExams);
router.get("/results/my", protect, authorize("student"), getMyResults);
router.get(
  "/:id/analytics",
  protect,
  authorize("admin", "faculty"),
  getExamAnalytics,
);
router.get(
  "/:id/pending-grading",
  protect,
  authorize("admin", "faculty"),
  getPendingGrading,
);
router.put(
  "/paper/:paperId/grade",
  protect,
  authorize("admin", "faculty"),
  gradeManually,
);

router.get("/results/:paperId/pdf", protect, downloadScorecard);
router.get(
  "/:id/export",
  protect,
  authorize("admin", "faculty"),
  exportExamResults,
);

router.get(
  "/:id/live-status",
  protect,
  authorize("admin", "faculty"),
  getLiveExamStatus,
);

router.get(
  "/:id/report/summary",
  protect,
  authorize("admin", "faculty"),
  exportExamSummary,
);
router.get(
  "/:id/report/attendance",
  protect,
  authorize("admin", "faculty"),
  exportAttendanceReport,
);
router.get(
  "/:id/report/top10",
  protect,
  authorize("admin", "faculty"),
  exportTop10,
);
router.get(
  "/:id/report/question-analysis",
  protect,
  authorize("admin", "faculty"),
  exportQuestionAnalysis,
);
router.get(
  "/subject-analysis/:subjectId",
  protect,
  authorize("admin", "faculty"),
  exportSubjectAnalysis,
);
router.put(
  "/:id/refresh-detected",
  protect,
  authorize("student"),
  recordRefresh,
);
router.get(
  "/marksheet/:subjectId",
  protect,
  authorize("admin", "faculty"),
  exportMarksheet,
);
router.get("/results/:paperId/review", protect, getResultReview);
router.get("/:id", protect, getExamById);
router.post("/", protect, authorize("admin", "faculty"), createExam);
router.put("/:id/publish", protect, authorize("admin", "faculty"), publishExam);
router.post("/:id/start", protect, authorize("student"), startExam);
router.delete("/:id", protect, authorize("admin", "faculty"), deleteExam);
router.put("/:id/answer", protect, authorize("student"), saveAnswer);
router.put("/:id/submit", protect, authorize("student"), submitExam);
router.put("/:id/tab-switch", protect, authorize("student"), recordTabSwitch);

module.exports = router;
