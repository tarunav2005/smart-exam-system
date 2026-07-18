const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionStats,
  importQuestionsFromExcel,
} = require("../controllers/questionController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getQuestions);
router.get(
  "/stats/:subjectId",
  protect,
  authorize("admin", "faculty"),
  getQuestionStats,
);
router.get("/:id", protect, getQuestionById);
router.post("/", protect, authorize("admin", "faculty"), createQuestion);
router.put("/:id", protect, authorize("admin", "faculty"), updateQuestion);
router.delete("/:id", protect, authorize("admin", "faculty"), deleteQuestion);
router.post(
  "/import",
  protect,
  authorize("admin", "faculty"),
  upload.single("file"),
  importQuestionsFromExcel,
);

module.exports = router;
