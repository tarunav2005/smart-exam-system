const Subject = require("../models/Subject");
const Course = require("../models/Course");

// @route  POST /api/subjects  (Admin only)
exports.createSubject = async (req, res) => {
  try {
    const { name, code, course } = req.body;

    if (!name || !code || !course) {
      return res
        .status(400)
        .json({ message: "Please provide name, code, and course" });
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: "Course not found" });
    }

    const subject = await Subject.create({
      name,
      code,
      course,
      createdBy: req.user._id,
    });

    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/subjects  (any logged-in user, optionally filter by course)
exports.getSubjects = async (req, res) => {
  try {
    const filter = {};
    if (req.query.course) filter.course = req.query.course;

    const subjects = await Subject.find(filter)
      .populate("course", "name code semester")
      .populate("facultyAssigned", "name email")
      .sort({ createdAt: -1 });

    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/subjects/:id
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate("course", "name code semester")
      .populate("facultyAssigned", "name email");
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/subjects/:id  (Admin only)
exports.updateSubject = async (req, res) => {
  try {
    const { name, code, facultyAssigned } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    if (name) subject.name = name;
    if (code) subject.code = code;
    if (facultyAssigned) subject.facultyAssigned = facultyAssigned;

    const updated = await subject.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/subjects/:id  (Admin only)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    await subject.deleteOne();
    res.json({ message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
