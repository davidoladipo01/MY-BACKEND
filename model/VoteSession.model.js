const mongoose = require("mongoose");

const nominationSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    nominatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nominatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const voteSessionSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    status: {
      type: String,
      enum: ["nominating", "voting", "closed"],
      default: "nominating",
    },
    nominations: [nominationSchema],
    startDate: { type: Date },
    endDate: { type: Date },
    winnerBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },
    maxNominations: { type: Number, default: 5 },
    maxVotesPerUser: { type: Number, default: 1 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("VoteSession", voteSessionSchema);
