const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    duration: { type: Number, required: true }, // in minutes
    totalMarks: { type: Number, required: true },

    // Blueprint: how many questions of each type/difficulty to pull
    paperConfig: {
      easyCount: { type: Number, default: 0 },
      mediumCount: { type: Number, default: 0 },
      hardCount: { type: Number, default: 0 },
    },

    numberOfSets: { type: Number, default: 0, min: 0 }, // 0 = fully per-student random (current behavior); 1+ = fixed sets
    paperSets: [
      {
        setLabel: { type: String }, // "Set A", "Set B", etc.
        questions: [
          {
            question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
            marks: { type: Number },
            shuffledOptions: [{ type: String }],
          },
        ],
      },
    ],

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    status: {
      type: String,
      enum: ["draft", "published", "completed"],
      default: "draft",
    },
    reminderSent: { type: Boolean, default: false },

    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Exam", examSchema);
