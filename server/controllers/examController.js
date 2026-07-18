const Exam = require("../models/Exam");
const ExamPaper = require("../models/ExamPaper");
const User = require("../models/User");
const Subject = require("../models/Subject");
const { evaluateProgrammingSubmission } = require("../utils/judge0");
const {
  generatePaperForStudent,
  generatePaperSets,
} = require("../utils/paperGenerator");
const notify = require("../utils/notify");

// @route  POST /api/exams  (Admin/Faculty)
exports.createExam = async (req, res) => {
  try {
    const {
      title,
      subject,
      duration,
      totalMarks,
      paperConfig,
      startTime,
      endTime,
      assignedStudents,
      numberOfSets,
    } = req.body;

    if (
      !title ||
      !subject ||
      !duration ||
      !totalMarks ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const subjectExists = await Subject.findById(subject);
    if (!subjectExists)
      return res.status(404).json({ message: "Subject not found" });

    const exam = await Exam.create({
      title,
      subject,
      duration,
      totalMarks,
      paperConfig,
      startTime,
      endTime,
      assignedStudents: assignedStudents || [],
      numberOfSets: numberOfSets || 0,
      createdBy: req.user._id,
    });

    if (exam.assignedStudents.length > 0) {
      await notify(exam.assignedStudents, {
        title: "New Exam Assigned",
        message: `You have been assigned to "${exam.title}". It will be available once published.`,
        type: "general",
        link: "/student",
      });
    }

    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const filter = {};
    // Students only see exams assigned to them
    if (req.user.role === "student") {
      filter.assignedStudents = req.user._id;
      filter.status = "published";
    }

    const exams = await Exam.find(filter)
      .populate("subject", "name code")
      .populate("createdBy", "name")
      .sort({ startTime: -1 });

    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/:id
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("subject", "name code")
      .populate("assignedStudents", "name email");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/exams/:id/publish  (Admin/Faculty) — validates config BEFORE going live
exports.publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (!exam.assignedStudents.length) {
      return res
        .status(400)
        .json({ message: "Assign at least one student before publishing" });
    }

    // Dry-run: try generating one paper to confirm the question bank has enough questions
    try {
      await generatePaperForStudent(exam);
    } catch (err) {
      return res
        .status(400)
        .json({ message: `Cannot publish: ${err.message}` });
    }

    // If fixed paper sets are configured, generate them once now (at publish time)
    if (exam.numberOfSets && exam.numberOfSets > 0) {
      exam.paperSets = await generatePaperSets(exam, exam.numberOfSets);
    }

    exam.status = "published";
    await exam.save();
    // Notify all assigned students
    await notify(exam.assignedStudents, {
      title: "New Exam Scheduled",
      message: `"${exam.title}" has been scheduled. Check your exam list for details.`,
      type: "exam_published",
      link: "/student",
    });

    res.json({ message: "Exam published successfully", exam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/exams/:id/start  (Student) — generates (or resumes) the student's paper
exports.startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.status !== "published") {
      return res.status(400).json({ message: "Exam is not published yet" });
    }

    const now = new Date();
    if (now < exam.startTime) {
      return res.status(400).json({ message: "Exam has not started yet" });
    }
    if (now > exam.endTime) {
      return res.status(400).json({ message: "Exam window has closed" });
    }

    if (
      !exam.assignedStudents.some(
        (id) => id.toString() === req.user._id.toString(),
      )
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this exam" });
    }

    // Check if a paper already exists (resume case — e.g. page refresh)
    let paper = await ExamPaper.findOne({
      exam: exam._id,
      student: req.user._id,
    }).populate("questions.question");

    if (paper) {
      if (paper.status === "submitted" || paper.status === "auto_submitted") {
        return res
          .status(400)
          .json({ message: "You have already submitted this exam" });
      }
      return res.json(paper); // resume existing paper
    }

    // First time starting — generate a fresh randomized paper,
    // or pull from a fixed set if the exam uses paper sets
    try {
      let questions;
      let assignedSetLabel = null;

      if (
        exam.numberOfSets &&
        exam.numberOfSets > 0 &&
        exam.paperSets.length > 0
      ) {
        const randomSet =
          exam.paperSets[Math.floor(Math.random() * exam.paperSets.length)];
        questions = randomSet.questions;
        assignedSetLabel = randomSet.setLabel;
      } else {
        questions = await generatePaperForStudent(exam);
      }

      paper = await ExamPaper.create({
        exam: exam._id,
        student: req.user._id,
        questions,
        assignedSetLabel,
        answers: questions.map((q) => ({
          question: q.question,
          selectedAnswer: "",
          markedForReview: false,
        })),
        status: "in_progress",
        startedAt: new Date(),
      });

      paper = await ExamPaper.findById(paper._id).populate(
        "questions.question",
      );
      return res.status(201).json(paper);
    } catch (err) {
      // Race condition: two near-simultaneous requests both tried to create a paper.
      // The unique index (exam + student) rejected the second one — just fetch the
      // one that succeeded instead of erroring out.
      if (err.code === 11000) {
        const existingPaper = await ExamPaper.findOne({
          exam: exam._id,
          student: req.user._id,
        }).populate("questions.question");
        return res.json(existingPaper);
      }
      throw err;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/exams/:id  (Admin/Faculty, only if draft)
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft exams can be deleted" });
    }

    await exam.deleteOne();
    res.json({ message: "Exam deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/exams/:id/answer  (Student) — auto-save a single answer
exports.saveAnswer = async (req, res) => {
  try {
    const { questionId, selectedAnswer, selectedAnswers, markedForReview } =
      req.body;

    const paper = await ExamPaper.findOne({
      exam: req.params.id,
      student: req.user._id,
    });
    if (!paper)
      return res.status(404).json({ message: "Exam paper not found" });

    if (paper.status === "submitted" || paper.status === "auto_submitted") {
      return res.status(400).json({ message: "Exam already submitted" });
    }

    const answer = paper.answers.find(
      (a) => a.question.toString() === questionId,
    );
    if (!answer)
      return res
        .status(404)
        .json({ message: "Question not part of this paper" });

    if (selectedAnswer !== undefined) answer.selectedAnswer = selectedAnswer;
    if (selectedAnswers !== undefined) answer.selectedAnswers = selectedAnswers;
    if (markedForReview !== undefined) answer.markedForReview = markedForReview;

    await paper.save();
    res.json({ message: "Answer saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/exams/:id/submit  (Student) — final submit + auto-evaluation
exports.submitExam = async (req, res) => {
  try {
    const { autoSubmitted } = req.body; // true if triggered by timer/anti-cheat, false if manual

    const paper = await ExamPaper.findOne({
      exam: req.params.id,
      student: req.user._id,
    }).populate("questions.question");

    if (!paper)
      return res.status(404).json({ message: "Exam paper not found" });

    if (paper.status === "submitted" || paper.status === "auto_submitted") {
      return res.status(400).json({ message: "Exam already submitted" });
    }

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let pendingManualCount = 0;

    for (const qEntry of paper.questions) {
      const q = qEntry.question;
      const answer = paper.answers.find(
        (a) => a.question.toString() === q._id.toString(),
      );
      if (q.type === "programming") {
        const isSkipped =
          !answer ||
          !answer.selectedAnswer ||
          answer.selectedAnswer.trim() === "";
        if (isSkipped) {
          skippedCount += 1;
          continue;
        }

        try {
          const evalResult = await evaluateProgrammingSubmission(
            answer.selectedAnswer,
            q.languageId,
            q.testCases,
          );
          const passRatio =
            evalResult.total > 0 ? evalResult.passed / evalResult.total : 0;
          const earnedMarks = Math.round(qEntry.marks * passRatio * 100) / 100;

          score += earnedMarks;
          if (passRatio === 1) correctCount += 1;
          else if (passRatio > 0) correctCount += 1;
          else wrongCount += 1;

          answer.manualFeedback = `Passed ${evalResult.passed}/${evalResult.total} test cases`;
        } catch (err) {
          wrongCount += 1;
          answer.manualFeedback = "Code execution failed";
        }
        continue;
      }

      if (q.type === "short_answer") {
        const isSkipped =
          !answer ||
          !answer.selectedAnswer ||
          answer.selectedAnswer.trim() === "";
        if (isSkipped) skippedCount += 1;
        else pendingManualCount += 1;
        continue;
      }

      if (q.type === "multiple_correct") {
        const selected = (answer?.selectedAnswers || [])
          .map((s) => s.trim().toLowerCase())
          .sort();
        const isSkipped = selected.length === 0;
        if (isSkipped) {
          skippedCount += 1;
          continue;
        }

        const correct = (q.correctAnswers || [])
          .map((s) => s.trim().toLowerCase())
          .sort();
        const isExactMatch =
          selected.length === correct.length &&
          selected.every((v, i) => v === correct[i]);

        if (isExactMatch) {
          score += qEntry.marks;
          correctCount += 1;
        } else {
          score -= q.negativeMarks || 0;
          wrongCount += 1;
        }
        continue;
      }

      if (q.type === "numerical") {
        const isSkipped =
          !answer ||
          !answer.selectedAnswer ||
          answer.selectedAnswer.trim() === "";
        if (isSkipped) {
          skippedCount += 1;
          continue;
        }

        const given = parseFloat(answer.selectedAnswer);
        const correct = parseFloat(q.correctAnswer);
        const tolerance = q.numericalTolerance || 0;
        const isCorrect =
          !isNaN(given) && Math.abs(given - correct) <= tolerance;

        if (isCorrect) {
          score += qEntry.marks;
          correctCount += 1;
        } else {
          score -= q.negativeMarks || 0;
          wrongCount += 1;
        }
        continue;
      }

      const isSkipped =
        !answer ||
        !answer.selectedAnswer ||
        answer.selectedAnswer.trim() === "";
      if (isSkipped) {
        skippedCount += 1;
        continue;
      }

      const isCorrect =
        answer.selectedAnswer.trim().toLowerCase() ===
        q.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        score += qEntry.marks;
        correctCount += 1;
      } else {
        score -= q.negativeMarks || 0;
        wrongCount += 1;
      }
    }

    score = Math.max(0, score);
    const totalMarks = paper.questions.reduce((sum, q) => sum + q.marks, 0);
    const timeTakenSeconds = paper.startedAt
      ? Math.round((new Date() - paper.startedAt) / 1000)
      : null;

    paper.score = score;
    paper.correctCount = correctCount;
    paper.wrongCount = wrongCount;
    paper.skippedCount = skippedCount;
    paper.status = autoSubmitted ? "auto_submitted" : "submitted";
    paper.submittedAt = new Date();
    paper.hasPendingManualGrading = pendingManualCount > 0;

    await paper.save();
    res.json({
      message: "Exam submitted successfully",
      score,
      totalMarks,
      correctCount,
      wrongCount,
      skippedCount,
      pendingManualCount,
      timeTakenSeconds,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/exams/:id/tab-switch  (Student) — anti-cheat tracking
exports.recordTabSwitch = async (req, res) => {
  try {
    const paper = await ExamPaper.findOne({
      exam: req.params.id,
      student: req.user._id,
    }).populate("questions.question");
    if (!paper)
      return res.status(404).json({ message: "Exam paper not found" });

    if (paper.status === "submitted" || paper.status === "auto_submitted") {
      return res.json({
        tabSwitchCount: paper.tabSwitchCount,
        autoSubmitted: false,
        maxViolations: 3,
      });
    }

    paper.tabSwitchCount += 1;

    const MAX_VIOLATIONS = 3;
    let autoSubmitted = false;
    let score = null;
    let totalMarks = null;

    if (paper.tabSwitchCount >= MAX_VIOLATIONS) {
      score = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;

      for (const qEntry of paper.questions) {
        const answer = paper.answers.find(
          (a) => a.question.toString() === qEntry.question._id.toString(),
        );
        const isSkipped =
          !answer ||
          !answer.selectedAnswer ||
          answer.selectedAnswer.trim() === "";

        if (isSkipped) {
          skippedCount += 1;
          continue;
        }

        const isCorrect =
          answer.selectedAnswer.trim().toLowerCase() ===
          qEntry.question.correctAnswer.trim().toLowerCase();

        if (isCorrect) {
          score += qEntry.marks;
          correctCount += 1;
        } else {
          score -= qEntry.question.negativeMarks || 0;
          wrongCount += 1;
        }
      }

      score = Math.max(0, score);
      totalMarks = paper.questions.reduce((sum, q) => sum + q.marks, 0);

      paper.score = score;
      paper.correctCount = correctCount;
      paper.wrongCount = wrongCount;
      paper.skippedCount = skippedCount;
      paper.status = "auto_submitted";
      paper.submittedAt = new Date();
      autoSubmitted = true;
    }

    await paper.save();
    res.json({
      tabSwitchCount: paper.tabSwitchCount,
      autoSubmitted,
      maxViolations: MAX_VIOLATIONS,
      score,
      totalMarks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/results/my  (Student) — all of the logged-in student's completed papers
exports.getMyResults = async (req, res) => {
  try {
    const papers = await ExamPaper.find({
      student: req.user._id,
      status: { $in: ["submitted", "auto_submitted"] },
    })
      .populate({
        path: "exam",
        select: "title subject totalMarks",
        populate: { path: "subject", select: "name code" },
      })
      .populate("questions.question")
      .sort({ submittedAt: -1 });
    const getGrade = (percentage) => {
      if (percentage >= 90) return "A+";
      if (percentage >= 80) return "A";
      if (percentage >= 70) return "B";
      if (percentage >= 60) return "C";
      if (percentage >= 40) return "D";
      return "F";
    };

    // Difficulty-wise accuracy accumulator across all exams
    const difficultyStats = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };
    // Subject-wise accumulator
    const subjectStats = {};

    const results = await Promise.all(
      papers.map(async (p) => {
        const percentage = p.exam?.totalMarks
          ? Math.round((p.score / p.exam.totalMarks) * 100)
          : 0;

        const higherScores = await ExamPaper.countDocuments({
          exam: p.exam._id,
          status: { $in: ["submitted", "auto_submitted"] },
          score: { $gt: p.score },
        });
        const rank = higherScores + 1;
        const totalAttempts = await ExamPaper.countDocuments({
          exam: p.exam._id,
          status: { $in: ["submitted", "auto_submitted"] },
        });

        const timeTakenSeconds =
          p.startedAt && p.submittedAt
            ? Math.round((p.submittedAt - p.startedAt) / 1000)
            : null;
        const totalQuestions = p.questions.length;
        const accuracy =
          totalQuestions > 0
            ? Math.round((p.correctCount / totalQuestions) * 100)
            : 0;
        // Speed: average seconds spent per question — lower is faster
        const speedPerQuestion =
          timeTakenSeconds && totalQuestions > 0
            ? Math.round(timeTakenSeconds / totalQuestions)
            : null;

        // Accumulate subject stats
        const subjName = p.exam?.subject?.name || "Unknown";
        if (!subjectStats[subjName])
          subjectStats[subjName] = { totalScore: 0, totalMax: 0, count: 0 };
        subjectStats[subjName].totalScore += p.score;
        subjectStats[subjName].totalMax += p.exam?.totalMarks || 0;
        subjectStats[subjName].count += 1;

        // Accumulate difficulty stats — need to know which answers were correct per difficulty
        p.questions.forEach((qEntry) => {
          const diff = qEntry.question?.difficulty;
          if (!diff || !difficultyStats[diff]) return;
          difficultyStats[diff].total += 1;

          const ans = p.answers.find(
            (a) => a.question.toString() === qEntry.question._id.toString(),
          );
          const q = qEntry.question;
          let isCorrect = false;

          if (q.type === "multiple_correct") {
            const selected = (ans?.selectedAnswers || [])
              .map((s) => s.trim().toLowerCase())
              .sort();
            const correct = (q.correctAnswers || [])
              .map((s) => s.trim().toLowerCase())
              .sort();
            isCorrect =
              selected.length > 0 &&
              selected.length === correct.length &&
              selected.every((v, i) => v === correct[i]);
          } else if (q.type === "numerical") {
            const given = parseFloat(ans?.selectedAnswer);
            isCorrect =
              !isNaN(given) &&
              Math.abs(given - parseFloat(q.correctAnswer)) <=
                (q.numericalTolerance || 0);
          } else if (q.type === "short_answer" || q.type === "programming") {
            isCorrect = (ans?.manualScore || 0) >= qEntry.marks * 0.5;
          } else {
            isCorrect =
              ans?.selectedAnswer?.trim().toLowerCase() ===
              q.correctAnswer?.trim().toLowerCase();
          }

          if (isCorrect) difficultyStats[diff].correct += 1;
        });

        return {
          _id: p._id,
          examTitle: p.exam?.title,
          subject: subjName,
          score: p.score,
          totalMarks: p.exam?.totalMarks,
          percentage,
          grade: getGrade(percentage),
          passFail: percentage >= 40 ? "Pass" : "Fail",
          correctCount: p.correctCount,
          wrongCount: p.wrongCount,
          skippedCount: p.skippedCount,
          accuracy,
          speedPerQuestion,
          rank,
          totalAttempts,
          timeTakenSeconds,
          status: p.status,
          submittedAt: p.submittedAt,
          tabSwitchCount: p.tabSwitchCount,
        };
      }),
    );

    // Build subject-wise summary array
    const subjectWise = Object.entries(subjectStats).map(([name, s]) => ({
      subject: name,
      averagePercentage:
        s.totalMax > 0 ? Math.round((s.totalScore / s.totalMax) * 100) : 0,
      examsCount: s.count,
    }));

    // Build difficulty-wise summary — note: correct-count per difficulty needs answer-level detail,
    // approximated here using overall correctCount ratio applied proportionally per difficulty bucket
    const difficultyWise = Object.entries(difficultyStats)
      .filter(([, v]) => v.total > 0)
      .map(([diff, v]) => ({
        difficulty: diff,
        totalQuestions: v.total,
        accuracy: Math.round((v.correct / v.total) * 100),
      }));

    res.json({ results, subjectWise, difficultyWise });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route  GET /api/exams/:id/analytics  (Admin/Faculty) — class performance for one exam
exports.getExamAnalytics = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("subject", "name");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const papers = await ExamPaper.find({
      exam: exam._id,
      status: { $in: ["submitted", "auto_submitted"] },
    })
      .populate("student", "name email")
      .populate("questions.question");

    if (papers.length === 0) {
      return res.json({
        examTitle: exam.title,
        subject: exam.subject?.name,
        totalMarks: exam.totalMarks,
        attempted: 0,
        assigned: exam.assignedStudents.length,
        average: 0,
        highest: 0,
        lowest: 0,
        passRate: 0,
        studentScores: [],
        questionAccuracy: [],
        topPerformers: [],
        weakStudents: [],
      });
    }

    const scores = papers.map((p) => p.score);
    const average =
      Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passThreshold = exam.totalMarks * 0.4;
    const passCount = scores.filter((s) => s >= passThreshold).length;
    const passRate = Math.round((passCount / scores.length) * 100);

    const studentScores = papers
      .map((p) => ({
        studentName: p.student?.name,
        studentEmail: p.student?.email,
        score: p.score,
        percentage: Math.round((p.score / exam.totalMarks) * 100),
        tabSwitchCount: p.tabSwitchCount,
        refreshCount: p.refreshCount,
        status: p.status,
      }))
      .sort((a, b) => b.score - a.score);

    const sortedByScore = [...studentScores].sort(
      (a, b) => b.percentage - a.percentage,
    );
    const topPerformers = sortedByScore.slice(0, 5);
    const weakStudents = sortedByScore
      .filter((s) => s.percentage < 40)
      .slice(-5)
      .reverse();

    const questionStats = {};
    papers.forEach((paper) => {
      paper.questions.forEach((qEntry) => {
        const qId = qEntry.question._id.toString();
        if (!questionStats[qId]) {
          questionStats[qId] = {
            questionText: qEntry.question.questionText,
            difficulty: qEntry.question.difficulty,
            correct: 0,
            total: 0,
          };
        }
        const answer = paper.answers.find((a) => a.question.toString() === qId);
        questionStats[qId].total += 1;
        if (
          answer &&
          answer.selectedAnswer &&
          answer.selectedAnswer.trim().toLowerCase() ===
            qEntry.question.correctAnswer.trim().toLowerCase()
        ) {
          questionStats[qId].correct += 1;
        }
      });
    });

    const questionAccuracy = Object.values(questionStats).map((q) => ({
      ...q,
      accuracy: Math.round((q.correct / q.total) * 100),
    }));

    res.json({
      examTitle: exam.title,
      subject: exam.subject?.name,
      totalMarks: exam.totalMarks,
      attempted: papers.length,
      assigned: exam.assignedStudents.length,
      average,
      highest,
      lowest,
      passRate,
      studentScores,
      questionAccuracy,
      topPerformers,
      weakStudents,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/:id/pending-grading  (Admin/Faculty) — list all submitted papers with ungraded short-answer questions for this exam
exports.getPendingGrading = async (req, res) => {
  try {
    const papers = await ExamPaper.find({
      exam: req.params.id,
      status: { $in: ["submitted", "auto_submitted"] },
      hasPendingManualGrading: true,
    })
      .populate("student", "name email")
      .populate("questions.question");

    const result = papers.map((paper) => {
      const shortAnswerItems = paper.questions
        .filter((qEntry) => qEntry.question.type === "short_answer")
        .map((qEntry) => {
          const answer = paper.answers.find(
            (a) => a.question.toString() === qEntry.question._id.toString(),
          );
          return {
            questionId: qEntry.question._id,
            questionText: qEntry.question.questionText,
            maxMarks: qEntry.marks,
            studentAnswer: answer?.selectedAnswer || "",
            manualScore: answer?.manualScore,
            manualFeedback: answer?.manualFeedback || "",
            alreadyGraded:
              answer?.manualScore !== null && answer?.manualScore !== undefined,
          };
        });

      return {
        paperId: paper._id,
        studentName: paper.student?.name,
        studentEmail: paper.student?.email,
        currentScore: paper.score,
        shortAnswerItems,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/exams/paper/:paperId/grade  (Admin/Faculty) — submit manual scores for one student's short-answer questions
exports.gradeManually = async (req, res) => {
  try {
    const { grades } = req.body; // array of { questionId, manualScore, manualFeedback }

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ message: "Grades array is required" });
    }

    const paper = await ExamPaper.findById(req.params.paperId).populate(
      "questions.question",
    );
    if (!paper)
      return res.status(404).json({ message: "Exam paper not found" });

    for (const g of grades) {
      const answer = paper.answers.find(
        (a) => a.question.toString() === g.questionId,
      );
      const qEntry = paper.questions.find(
        (q) => q.question._id.toString() === g.questionId,
      );
      if (!answer || !qEntry) continue;

      const clampedScore = Math.max(
        0,
        Math.min(qEntry.marks, Number(g.manualScore) || 0),
      );
      answer.manualScore = clampedScore;
      answer.manualFeedback = g.manualFeedback || "";
    }

    // Recompute total score: auto-graded portion (already in paper.score minus previous manual contributions)
    // Simplest correct approach: recompute from scratch using both auto-eval logic + manual scores together.
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let stillPendingCount = 0;

    for (const qEntry of paper.questions) {
      const q = qEntry.question;
      const answer = paper.answers.find(
        (a) => a.question.toString() === q._id.toString(),
      );

      if (q.type === "short_answer") {
        const isSkipped =
          !answer ||
          !answer.selectedAnswer ||
          answer.selectedAnswer.trim() === "";
        if (isSkipped) {
          skippedCount += 1;
          continue;
        }
        if (answer.manualScore === null || answer.manualScore === undefined) {
          stillPendingCount += 1;
          continue;
        }
        score += answer.manualScore;
        if (answer.manualScore >= qEntry.marks * 0.5)
          correctCount += 1; // treat half-or-more as "correct" for stats purposes
        else wrongCount += 1;
        continue;
      }

      if (q.type === "multiple_correct") {
        const selected = (answer?.selectedAnswers || [])
          .map((s) => s.trim().toLowerCase())
          .sort();
        if (selected.length === 0) {
          skippedCount += 1;
          continue;
        }
        const correct = (q.correctAnswers || [])
          .map((s) => s.trim().toLowerCase())
          .sort();
        const isExactMatch =
          selected.length === correct.length &&
          selected.every((v, i) => v === correct[i]);
        if (isExactMatch) {
          score += qEntry.marks;
          correctCount += 1;
        } else {
          score -= q.negativeMarks || 0;
          wrongCount += 1;
        }
        continue;
      }

      if (q.type === "numerical") {
        const isSkipped =
          !answer ||
          !answer.selectedAnswer ||
          answer.selectedAnswer.trim() === "";
        if (isSkipped) {
          skippedCount += 1;
          continue;
        }
        const given = parseFloat(answer.selectedAnswer);
        const correct = parseFloat(q.correctAnswer);
        const isCorrect =
          !isNaN(given) &&
          Math.abs(given - correct) <= (q.numericalTolerance || 0);
        if (isCorrect) {
          score += qEntry.marks;
          correctCount += 1;
        } else {
          score -= q.negativeMarks || 0;
          wrongCount += 1;
        }
        continue;
      }

      const isSkipped =
        !answer ||
        !answer.selectedAnswer ||
        answer.selectedAnswer.trim() === "";
      if (isSkipped) {
        skippedCount += 1;
        continue;
      }
      const isCorrect =
        answer.selectedAnswer.trim().toLowerCase() ===
        q.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        score += qEntry.marks;
        correctCount += 1;
      } else {
        score -= q.negativeMarks || 0;
        wrongCount += 1;
      }
    }

    score = Math.max(0, score);
    paper.score = score;
    paper.correctCount = correctCount;
    paper.wrongCount = wrongCount;
    paper.skippedCount = skippedCount;
    paper.hasPendingManualGrading = stillPendingCount > 0;

    await paper.save();
    if (stillPendingCount === 0) {
      await notify(paper.student, {
        title: "Exam Graded",
        message: `Your exam has been fully graded. Check your results for the final score.`,
        type: "result_graded",
        link: "/student",
      });
    }
    res.json({
      message: "Grades saved successfully",
      score,
      stillPendingCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateScorecardPDF = require("../utils/generateScorecardPDF");

// @route  GET /api/exams/results/:paperId/pdf  (Student — own result only)
exports.downloadScorecard = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.paperId)
      .populate("student", "name email")
      .populate({
        path: "exam",
        select: "title subject totalMarks",
        populate: { path: "subject", select: "name" },
      });

    if (!paper) return res.status(404).json({ message: "Result not found" });

    if (
      paper.student._id.toString() !== req.user._id.toString() &&
      req.user.role === "student"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this result" });
    }

    const percentage = paper.exam?.totalMarks
      ? Math.round((paper.score / paper.exam.totalMarks) * 100)
      : 0;
    const getGrade = (p) =>
      p >= 90
        ? "A+"
        : p >= 80
          ? "A"
          : p >= 70
            ? "B"
            : p >= 60
              ? "C"
              : p >= 40
                ? "D"
                : "F";

    const higherScores = await ExamPaper.countDocuments({
      exam: paper.exam._id,
      status: { $in: ["submitted", "auto_submitted"] },
      score: { $gt: paper.score },
    });
    const totalAttempts = await ExamPaper.countDocuments({
      exam: paper.exam._id,
      status: { $in: ["submitted", "auto_submitted"] },
    });

    generateScorecardPDF(res, {
      studentName: paper.student.name,
      studentEmail: paper.student.email,
      examTitle: paper.exam.title,
      subject: paper.exam.subject?.name,
      score: paper.score,
      totalMarks: paper.exam.totalMarks,
      percentage,
      grade: getGrade(percentage),
      passFail: percentage >= 40 ? "Pass" : "Fail",
      correctCount: paper.correctCount,
      wrongCount: paper.wrongCount,
      skippedCount: paper.skippedCount,
      rank: higherScores + 1,
      totalAttempts,
      timeTakenSeconds:
        paper.startedAt && paper.submittedAt
          ? Math.round((paper.submittedAt - paper.startedAt) / 1000)
          : null,
      submittedAt: paper.submittedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const ExcelJS = require("exceljs");

// @route  GET /api/exams/:id/export  (Admin/Faculty) — Excel export of class results
exports.exportExamResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("subject", "name");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const papers = await ExamPaper.find({
      exam: exam._id,
      status: { $in: ["submitted", "auto_submitted"] },
    })
      .populate("student", "name email")
      .sort({ score: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Results");

    sheet.columns = [
      { header: "Rank", key: "rank", width: 8 },
      { header: "Student Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Score", key: "score", width: 10 },
      { header: "Total Marks", key: "total", width: 12 },
      { header: "Percentage", key: "percentage", width: 12 },
      { header: "Correct", key: "correct", width: 10 },
      { header: "Wrong", key: "wrong", width: 10 },
      { header: "Skipped", key: "skipped", width: 10 },
      { header: "Tab Switches", key: "violations", width: 14 },
      { header: "Status", key: "status", width: 16 },
      { header: "Submitted At", key: "submittedAt", width: 22 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEF2FF" },
    };

    papers.forEach((p, i) => {
      sheet.addRow({
        rank: i + 1,
        name: p.student?.name,
        email: p.student?.email,
        score: p.score,
        total: exam.totalMarks,
        percentage: exam.totalMarks
          ? `${Math.round((p.score / exam.totalMarks) * 100)}%`
          : "0%",
        correct: p.correctCount,
        wrong: p.wrongCount,
        skipped: p.skippedCount,
        violations: p.tabSwitchCount,
        status: p.status === "auto_submitted" ? "Auto-submitted" : "Submitted",
        submittedAt: p.submittedAt
          ? new Date(p.submittedAt).toLocaleString()
          : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exam.title.replace(/\s+/g, "_")}_results.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/:id/live-status  (Admin/Faculty) — see who is currently taking the exam
exports.getLiveExamStatus = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const papers = await ExamPaper.find({ exam: exam._id })
      .populate("student", "name email")
      .sort({ startedAt: -1 });

    const summary = {
      notStarted: exam.assignedStudents.length - papers.length,
      inProgress: papers.filter((p) => p.status === "in_progress").length,
      submitted: papers.filter(
        (p) => p.status === "submitted" || p.status === "auto_submitted",
      ).length,
    };

    const liveList = papers.map((p) => ({
      studentName: p.student?.name,
      studentEmail: p.student?.email,
      status: p.status,
      startedAt: p.startedAt,
      submittedAt: p.submittedAt,
      tabSwitchCount: p.tabSwitchCount,
      refreshCount: p.refreshCount,
      elapsedSeconds:
        p.status === "in_progress" && p.startedAt
          ? Math.round((new Date() - p.startedAt) / 1000)
          : null,
    }));

    res.json({ summary, liveList });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/:id/report/summary — Exam Summary report
exports.exportExamSummary = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("subject", "name");
    const papers = await ExamPaper.find({
      exam: exam._id,
      status: { $in: ["submitted", "auto_submitted"] },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Exam Summary");
    sheet.addRow(["Exam Title", exam.title]);
    sheet.addRow(["Subject", exam.subject?.name]);
    sheet.addRow(["Total Marks", exam.totalMarks]);
    sheet.addRow(["Duration (min)", exam.duration]);
    sheet.addRow(["Assigned Students", exam.assignedStudents.length]);
    sheet.addRow(["Attempted", papers.length]);
    sheet.addRow([
      "Average Score",
      papers.length
        ? (papers.reduce((s, p) => s + p.score, 0) / papers.length).toFixed(2)
        : 0,
    ]);
    sheet.addRow([
      "Highest Score",
      papers.length ? Math.max(...papers.map((p) => p.score)) : 0,
    ]);
    sheet.addRow([
      "Lowest Score",
      papers.length ? Math.min(...papers.map((p) => p.score)) : 0,
    ]);
    sheet.getColumn(1).font = { bold: true };
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 30;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exam.title}_summary.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/:id/report/attendance — who attempted vs not
exports.exportAttendanceReport = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate(
      "assignedStudents",
      "name email",
    );
    const papers = await ExamPaper.find({ exam: exam._id });
    const attemptedIds = new Set(papers.map((p) => p.student.toString()));

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Attendance");
    sheet.columns = [
      { header: "Student Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Attendance", key: "attendance", width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };

    exam.assignedStudents.forEach((s) => {
      sheet.addRow({
        name: s.name,
        email: s.email,
        attendance: attemptedIds.has(s._id.toString()) ? "Present" : "Absent",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exam.title}_attendance.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/subject-analysis/:subjectId — Subject-wise Analysis across all exams for a subject
exports.exportSubjectAnalysis = async (req, res) => {
  try {
    const Subject = require("../models/Subject");
    const subject = await Subject.findById(req.params.subjectId);
    const exams = await Exam.find({ subject: req.params.subjectId });
    const examIds = exams.map((e) => e._id);
    const papersRaw = await ExamPaper.find({
      exam: { $in: examIds },
      status: { $in: ["submitted", "auto_submitted"] },
    })
      .populate("student", "name email")
      .populate("exam", "title totalMarks");

    // Filter out papers whose student or exam reference no longer exists (e.g. deleted test accounts)
    const papers = papersRaw.filter((p) => p.student && p.exam);

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Subject Analysis");
    sheet.columns = [
      { header: "Exam", key: "exam", width: 25 },
      { header: "Attempts", key: "attempts", width: 12 },
      { header: "Average %", key: "avg", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    exams.forEach((exam) => {
      const examPapers = papers.filter(
        (p) => p.exam._id.toString() === exam._id.toString(),
      );
      const avg = examPapers.length
        ? Math.round(
            (examPapers.reduce((s, p) => s + p.score, 0) /
              examPapers.length /
              exam.totalMarks) *
              100,
          )
        : 0;
      sheet.addRow({
        exam: exam.title,
        attempts: examPapers.length,
        avg: `${avg}%`,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${subject.name}_analysis.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/:id/report/top10 — Top 10 students
exports.exportTop10 = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    const papers = await ExamPaper.find({
      exam: exam._id,
      status: { $in: ["submitted", "auto_submitted"] },
    })
      .populate("student", "name email")
      .sort({ score: -1 })
      .limit(10);

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Top 10");
    sheet.columns = [
      { header: "Rank", key: "rank", width: 8 },
      { header: "Student", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Score", key: "score", width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };
    papers.forEach((p, i) =>
      sheet.addRow({
        rank: i + 1,
        name: p.student?.name,
        email: p.student?.email,
        score: p.score,
      }),
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exam.title}_top10.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/:id/report/question-analysis — per-question difficulty/accuracy report
exports.exportQuestionAnalysis = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    const papers = await ExamPaper.find({
      exam: exam._id,
      status: { $in: ["submitted", "auto_submitted"] },
    }).populate("questions.question");

    const stats = {};
    papers.forEach((paper) => {
      paper.questions.forEach((qEntry) => {
        const qId = qEntry.question._id.toString();
        if (!stats[qId])
          stats[qId] = {
            text: qEntry.question.questionText,
            difficulty: qEntry.question.difficulty,
            correct: 0,
            total: 0,
          };
        const answer = paper.answers.find((a) => a.question.toString() === qId);
        stats[qId].total += 1;
        if (
          answer?.selectedAnswer?.trim().toLowerCase() ===
          qEntry.question.correctAnswer?.trim().toLowerCase()
        )
          stats[qId].correct += 1;
      });
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Question Analysis");
    sheet.columns = [
      { header: "Question", key: "text", width: 50 },
      { header: "Difficulty", key: "difficulty", width: 12 },
      { header: "Correct", key: "correct", width: 10 },
      { header: "Total", key: "total", width: 10 },
      { header: "Accuracy %", key: "accuracy", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };
    Object.values(stats).forEach((s) =>
      sheet.addRow({ ...s, accuracy: Math.round((s.correct / s.total) * 100) }),
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exam.title}_question_analysis.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/exams/:id/refresh-detected  (Student) — logs a page refresh during an active exam
exports.recordRefresh = async (req, res) => {
  try {
    const paper = await ExamPaper.findOne({
      exam: req.params.id,
      student: req.user._id,
    });
    if (!paper)
      return res.status(404).json({ message: "Exam paper not found" });

    if (paper.status === "submitted" || paper.status === "auto_submitted") {
      return res.json({ refreshCount: paper.refreshCount });
    }

    paper.refreshCount += 1;
    await paper.save();
    res.json({ refreshCount: paper.refreshCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/results/:paperId/review  (Student — own result only) — full answer review with explanations
exports.getResultReview = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.paperId)
      .populate("questions.question")
      .populate("exam", "title totalMarks");

    if (!paper) return res.status(404).json({ message: "Result not found" });
    if (paper.student.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this result" });
    }
    if (paper.status !== "submitted" && paper.status !== "auto_submitted") {
      return res.status(400).json({ message: "Exam not yet submitted" });
    }

    const review = paper.questions.map((qEntry) => {
      const q = qEntry.question;
      const answer = paper.answers.find(
        (a) => a.question.toString() === q._id.toString(),
      );

      let studentAnswerDisplay = answer?.selectedAnswer || "";
      let correctAnswerDisplay = q.correctAnswer;
      let isCorrect = false;
      let isSkipped =
        !answer ||
        (!answer.selectedAnswer &&
          (!answer.selectedAnswers || answer.selectedAnswers.length === 0));

      if (q.type === "multiple_correct") {
        studentAnswerDisplay =
          (answer?.selectedAnswers || []).join(", ") || "(no answer)";
        correctAnswerDisplay = (q.correctAnswers || []).join(", ");
        const selected = (answer?.selectedAnswers || [])
          .map((s) => s.trim().toLowerCase())
          .sort();
        const correct = (q.correctAnswers || [])
          .map((s) => s.trim().toLowerCase())
          .sort();
        isCorrect =
          selected.length === correct.length &&
          selected.every((v, i) => v === correct[i]);
      } else if (q.type === "numerical") {
        const given = parseFloat(answer?.selectedAnswer);
        const correct = parseFloat(q.correctAnswer);
        isCorrect =
          !isNaN(given) &&
          Math.abs(given - correct) <= (q.numericalTolerance || 0);
      } else if (q.type === "short_answer") {
        studentAnswerDisplay = answer?.selectedAnswer || "(no answer)";
        correctAnswerDisplay =
          answer?.manualScore !== null && answer?.manualScore !== undefined
            ? `Manually graded: ${answer.manualScore}/${qEntry.marks}`
            : "Pending manual grading";
        isCorrect = answer?.manualScore >= qEntry.marks * 0.5;
      } else if (q.type === "programming") {
        studentAnswerDisplay = answer?.selectedAnswer || "(no code submitted)";
        correctAnswerDisplay = answer?.manualFeedback || "Not evaluated";
        isCorrect =
          answer?.manualFeedback?.includes("Passed") &&
          !answer.manualFeedback.startsWith("Passed 0/");
      } else {
        studentAnswerDisplay = answer?.selectedAnswer || "(no answer)";
        isCorrect =
          !isSkipped &&
          answer.selectedAnswer.trim().toLowerCase() ===
            q.correctAnswer.trim().toLowerCase();
      }

      return {
        questionText: q.questionText,
        type: q.type,
        marks: qEntry.marks,
        difficulty: q.difficulty,
        studentAnswer: studentAnswerDisplay,
        correctAnswer: correctAnswerDisplay,
        isSkipped,
        isCorrect: isSkipped ? false : isCorrect,
        explanation: q.explanation || null,
        chapter: q.chapter || null,
      };
    });

    res.json({
      examTitle: paper.exam.title,
      score: paper.score,
      totalMarks: paper.exam.totalMarks,
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/exams/marksheet/:subjectId  (Admin/Faculty) — consolidated marksheet across all exams in a subject
exports.exportMarksheet = async (req, res) => {
  try {
    const Subject = require("../models/Subject");
    const subject = await Subject.findById(req.params.subjectId);
    const exams = await Exam.find({
      subject: req.params.subjectId,
      status: { $ne: "draft" },
    });
    const examIds = exams.map((e) => e._id);

    const papersRaw = await ExamPaper.find({
      exam: { $in: examIds },
      status: { $in: ["submitted", "auto_submitted"] },
    })
      .populate("student", "name email")
      .populate("exam", "title totalMarks");

    // Filter out papers whose student or exam reference no longer exists (e.g. deleted test accounts)
    const papers = papersRaw.filter((p) => p.student && p.exam);

    // Group by student
    const studentMap = {};
    papers.forEach((p) => {
      const sid = p.student._id.toString();
      if (!studentMap[sid])
        studentMap[sid] = {
          name: p.student.name,
          email: p.student.email,
          scores: {},
          totalScored: 0,
          totalMax: 0,
        };
      studentMap[sid].scores[p.exam.title] = `${p.score}/${p.exam.totalMarks}`;
      studentMap[sid].totalScored += p.score;
      studentMap[sid].totalMax += p.exam.totalMarks;
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Marksheet");

    const examTitles = exams.map((e) => e.title);
    sheet.columns = [
      { header: "Student Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      ...examTitles.map((t) => ({ header: t, key: t, width: 18 })),
      { header: "Total", key: "total", width: 15 },
      { header: "Overall %", key: "percent", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEF2FF" },
    };

    Object.values(studentMap).forEach((s) => {
      const row = {
        name: s.name,
        email: s.email,
        total: `${s.totalScored}/${s.totalMax}`,
        percent: s.totalMax
          ? `${Math.round((s.totalScored / s.totalMax) * 100)}%`
          : "0%",
      };
      examTitles.forEach((t) => {
        row[t] = s.scores[t] || "—";
      });
      sheet.addRow(row);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${subject.name}_marksheet.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
