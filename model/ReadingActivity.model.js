const mongoose = require("mongoose");

const ReadingActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD", UTC calendar day — avoids Date/timezone bucketing issues
      required: true,
    },
    minutesRead: {
      type: Number,
      default: 0,
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  { timestamps: true }
);

ReadingActivitySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("ReadingActivity", ReadingActivitySchema);