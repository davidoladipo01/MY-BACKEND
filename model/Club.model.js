const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: {
    type: String,
    enum: ["member", "moderator", "admin"],
    default: "member",
  },
  joinedAt: { type: Date, default: Date.now },
});

const scheduleSchema = new mongoose.Schema({
  chapterRange: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  unlocked: { type: Boolean, default: false },
});

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    
    description: { type: String, required: true },
    coverImage: { type: String, default: "" },
    privacy: {
      type: String,
      enum: ["public", "invite-only", "private"],
      default: "public",
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [memberSchema],
    currentBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },
    upcomingBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    schedule: [scheduleSchema],
    activeVoteSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VoteSession",
      default: null,
    },
    inviteCode: { type: String, unique: true, sparse: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

clubSchema.index({ name: "text", description: "text" });

clubModel = mongoose.model("Club", clubSchema);

module.exports= clubModel
