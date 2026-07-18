const Question = require("../models/Question");
const Subject = require("../models/Subject");
const ExcelJS = require("exceljs");

// @route  POST /api/questions  (Admin or Faculty)
exports.createQuestion = async (req, res) => {
  try {
    const {
      subject,
      type,
      questionText,
      options,
      correctAnswer,
      correctAnswers,
      numericalTolerance,
      difficulty,
      marks,
      negativeMarks,
      chapter,
      explanation,
      tags,
      testCases,
      languageId,
    } = req.body;

    if (!subject || !type || !questionText) {
      return res.status(400).json({
        message: "Please provide subject, type, and questionText",
      });
    }
    if (
      type !== "short_answer" &&
      type !== "programming" &&
      !correctAnswer &&
      (!correctAnswers || correctAnswers.length === 0)
    ) {
      return res
        .status(400)
        .json({ message: "Please provide the correct answer" });
    }

    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const question = await Question.create({
      subject,
      type,
      questionText,
      options: options || [],
      correctAnswer: correctAnswer || "",
      correctAnswers: correctAnswers || [],
      numericalTolerance: numericalTolerance || 0,
      difficulty,
      marks,
      negativeMarks: negativeMarks || 0,
      chapter: chapter || "",
      explanation: explanation || "",
      tags: tags || [],
      testCases: testCases || [],
      languageId: languageId || 71,
      createdBy: req.user._id,
    });
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/questions?subject=xxx&type=mcq&difficulty=easy
exports.getQuestions = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const questions = await Question.find(filter)
      .populate("subject", "name code")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/questions/:id
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate(
      "subject",
      "name code",
    );
    if (!question)
      return res.status(404).json({ message: "Question not found" });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/questions/:id  (Admin or the Faculty who created it)
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    // Faculty can only edit their own questions; Admin can edit any
    if (
      req.user.role === "faculty" &&
      question.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You can only edit your own questions" });
    }

    const {
      questionText,
      options,
      correctAnswer,
      difficulty,
      marks,
      negativeMarks,
      chapter,
      explanation,
      tags,
      isActive,
    } = req.body;

    if (questionText) question.questionText = questionText;
    if (options) question.options = options;
    if (correctAnswer) question.correctAnswer = correctAnswer;
    if (difficulty) question.difficulty = difficulty;
    if (marks) question.marks = marks;
    if (negativeMarks !== undefined) question.negativeMarks = negativeMarks;
    if (chapter !== undefined) question.chapter = chapter;
    if (explanation !== undefined) question.explanation = explanation;
    if (tags !== undefined) question.tags = tags;
    if (typeof isActive === "boolean") question.isActive = isActive;

    const updated = await question.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/questions/:id  (Admin or the Faculty who created it)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    if (
      req.user.role === "faculty" &&
      question.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You can only delete your own questions" });
    }

    await question.deleteOne();
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/questions/stats/:subjectId  (question count by type/difficulty — useful for paper generation later)
exports.getQuestionStats = async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $match: {
          subject: new (require("mongoose").Types.ObjectId)(
            req.params.subjectId,
          ),
          isActive: true,
        },
      },
      {
        $group: {
          _id: { type: "$type", difficulty: "$difficulty" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/questions/import  (Admin/Faculty) — bulk import from Excel
// Expects an uploaded .xlsx file with columns: subject_code, type, questionText, option1-4, correctAnswer, difficulty, marks, negativeMarks, chapter, explanation, tags
exports.importQuestionsFromExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    const Subject = require("../models/Subject");
    const subjectCache = {};

    let created = 0;
    let failed = [];

    for (let i = 2; i <= sheet.rowCount; i++) {
      // row 1 = headers
      const row = sheet.getRow(i);
      if (!row.getCell(1).value) continue; // skip empty rows

      try {
        const subjectCode = String(row.getCell(1).value).trim().toUpperCase();
        const type = String(row.getCell(2).value).trim();
        const questionText = String(row.getCell(3).value).trim();
        const options = [4, 5, 6, 7]
          .map((c) => row.getCell(c).value)
          .filter((v) => v)
          .map(String);
        const correctAnswer = row.getCell(8).value
          ? String(row.getCell(8).value).trim()
          : "";
        const difficulty = row.getCell(9).value
          ? String(row.getCell(9).value).trim().toLowerCase()
          : "medium";
        const marks = Number(row.getCell(10).value) || 1;
        const negativeMarks = Number(row.getCell(11).value) || 0;
        const chapter = row.getCell(12).value
          ? String(row.getCell(12).value).trim()
          : "";
        const explanation = row.getCell(13).value
          ? String(row.getCell(13).value).trim()
          : "";
        const tagsRaw = row.getCell(14).value
          ? String(row.getCell(14).value)
          : "";
        const tags = tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        if (!subjectCache[subjectCode]) {
          const subj = await Subject.findOne({ code: subjectCode });
          if (!subj) throw new Error(`Subject code "${subjectCode}" not found`);
          subjectCache[subjectCode] = subj._id;
        }

        await Question.create({
          subject: subjectCache[subjectCode],
          type,
          questionText,
          options: type === "mcq" || type === "multiple_correct" ? options : [],
          correctAnswer,
          correctAnswers:
            type === "multiple_correct"
              ? correctAnswer.split(",").map((s) => s.trim())
              : [],
          difficulty,
          marks,
          negativeMarks,
          chapter,
          explanation,
          tags,
          createdBy: req.user._id,
        });
        created += 1;
      } catch (rowErr) {
        failed.push({ row: i, error: rowErr.message });
      }
    }

    res.json({
      message: `Import complete: ${created} questions created`,
      created,
      failed,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
