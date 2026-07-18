const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "mcq",
        "true_false",
        "fill_blank",
        "multiple_correct",
        "numerical",
        "short_answer",
        "programming",
      ],
      required: true,
    },
    questionText: { type: String, required: true, trim: true },
    options: [{ type: String }],
    correctAnswer: { type: String, default: "" },
    correctAnswers: [{ type: String }],
    numericalTolerance: { type: Number, default: 0 },
    testCases: [
      {
        input: { type: String, default: "" },
        expectedOutput: { type: String, default: "" },
      },
    ],
    languageId: { type: Number, default: 71 }, // Judge0 language ID — 71 = Python 3 by default
    chapter: { type: String, trim: true, default: "" },
    explanation: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    marks: { type: Number, required: true, default: 1, min: 1 },
    negativeMarks: { type: Number, default: 0, min: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

questionSchema.pre("validate", function () {
  if (
    (this.type === "mcq" || this.type === "multiple_correct") &&
    (!this.options || this.options.length < 2)
  ) {
    throw new Error(
      "MCQ and Multiple Correct questions must have at least 2 options",
    );
  }
  if (
    this.type === "multiple_correct" &&
    (!this.correctAnswers || this.correctAnswers.length < 1)
  ) {
    throw new Error(
      "Multiple Correct questions must have at least 1 correct answer selected",
    );
  }
  if (this.type === "numerical" && isNaN(parseFloat(this.correctAnswer))) {
    throw new Error("Numerical questions must have a numeric correct answer");
  }
  if (this.type === "short_answer") {
    this.correctAnswer = this.correctAnswer || "MANUAL_EVALUATION"; // placeholder — actual grading is manual
  }
  if (
    this.type === "programming" &&
    (!this.testCases || this.testCases.length === 0)
  ) {
    throw new Error("Programming questions must have at least 1 test case");
  }
});

module.exports = mongoose.model("Question", questionSchema);
