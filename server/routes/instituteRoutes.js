const express = require("express");
const router = express.Router();
const {
  createInstitute,
  getInstitutes,
  updateInstitute,
  deleteInstitute,
} = require("../controllers/instituteController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getInstitutes);
router.post("/", protect, authorize("admin"), createInstitute);
router.put("/:id", protect, authorize("admin"), updateInstitute);
router.delete("/:id", protect, authorize("admin"), deleteInstitute);

module.exports = router;
