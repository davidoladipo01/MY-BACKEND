const mongoose = require("mongoose");

const UserBookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },

    status: {
      type: String,
      enum: [
        "want_to_read",
        "currently_reading",
        "completed"
      ],
      default: "want_to_read"
    },

    progressPercentage: {
      type: Number,
      default: 0
    },

    currentLocation: {
      type: String,
      default: ""
    },

    startedAt: Date,

    completedAt: Date
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "UserBook",
    UserBookSchema
  );