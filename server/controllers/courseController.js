const Course = require("../models/Course");

// @route  POST /api/courses  (Admin only)
exports.createCourse = async (req, res) => {
  try {
    const { name, code, semester, institute } = req.body;
    if (!name || !code || !semester) {
      return res
        .status(400)
        .json({ message: "Please provide name, code, and semester" });
    }

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    const course = await Course.create({
      name,
      code,
      semester,
      institute: institute || null,
      createdBy: req.user._id,
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/courses  (any logged-in user)
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/courses/:id
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/courses/:id  (Admin only)
exports.updateCourse = async (req, res) => {
  try {
    const { name, code, semester, institute } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (name) course.name = name;
    if (code) course.code = code;
    if (semester) course.semester = semester;
    if (institute !== undefined) course.institute = institute;

    const updated = await course.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/courses/:id  (Admin only)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    await course.deleteOne();
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
