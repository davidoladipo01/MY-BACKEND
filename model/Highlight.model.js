const mongoose = require("mongoose");

const HighlightSchema = new mongoose.Schema(
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

    text: {
      type: String,
      required: true,
    },

    page: {
      type: Number,
    },

    epubLocation: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "#FFD54F",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Highlight", HighlightSchema);
