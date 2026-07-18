const express = require("express");
const router = express.Router();
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getSubjects);
router.get("/:id", protect, getSubjectById);
router.post("/", protect, authorize("admin"), createSubject);
router.put("/:id", protect, authorize("admin"), updateSubject);
router.delete("/:id", protect, authorize("admin"), deleteSubject);

module.exports = router;
