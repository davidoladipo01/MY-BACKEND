const mongoose = require("mongoose");

const ReadingProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    currentPage: {
      type: Number,
      default: 1,
    },

    epubLocation: {
      type: String,
      default: "",
    },

    percentage: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["reading", "completed", "paused"],
      default: "reading",
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

ReadingProgressSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("ReadingProgress", ReadingProgressSchema);
