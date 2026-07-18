const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "B.Tech CSE"
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    }, // e.g. "BTCSE"
    semester: { type: Number, required: true, min: 1, max: 8 },
    institute: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Course", courseSchema);
