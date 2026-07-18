const mongoose = require("mongoose");

const examPaperSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        marks: { type: Number, required: true },
        shuffledOptions: [{ type: String }],
      },
    ],
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedAnswer: { type: String, default: "" }, // used for mcq/true_false/fill_blank/numerical/short_answer
        selectedAnswers: [{ type: String }], // used for multiple_correct
        markedForReview: { type: Boolean, default: false },
        manualScore: { type: Number, default: null }, // set by faculty for short_answer questions
        manualFeedback: { type: String, default: "" }, // optional faculty comment
      },
    ],
    status: {
      type: String,
      enum: ["not_started", "in_progress", "submitted", "auto_submitted"],
      default: "not_started",
    },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    score: { type: Number, default: null },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    tabSwitchCount: { type: Number, default: 0 }, // anti-cheat tracking, Day 5
    refreshCount: { type: Number, default: 0 },
    hasPendingManualGrading: { type: Boolean, default: false },
    assignedSetLabel: { type: String, default: null },
  },
  { timestamps: true },
);

// A student can only have ONE paper per exam
examPaperSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("ExamPaper", examPaperSchema);
