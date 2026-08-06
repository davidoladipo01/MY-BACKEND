const mongoose = require("mongoose");

const BookmarkSchema = new mongoose.Schema(
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

    page: {
      type: Number,
      required: true,
    },

    epubLocation: {
      type: String,
      default: "",
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

BookmarkSchema.index(
  { user: 1, book: 1 },
  { unique: true },
);

module.exports = mongoose.model("Bookmark", BookmarkSchema);
