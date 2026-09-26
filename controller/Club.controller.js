const express = require("express");
const ClubModel = require("../model/Club.model");
// const { v4: uuidv4 } = require("uuid");
const { randomUUID } = require('crypto');
const ReadingProgressModel = require("../model/ReadingProgress.model");
const VoteSessionModel = require("../model/VoteSession.model");
const Vote = require("../model/Vote.model");

const createClub = async (req, res) => {
  const { name, description, privacy, coverImage } = req.body;

  try {
    const payload = {
      name,
      description,
      coverImage: coverImage || "",
      privacy: privacy || "public",
      creatorId: req.user._id,
      members: [{ userId: req.user._id, role: "admin" }],
    };

    // Only set inviteCode when privacy is not public so the field is omitted
    // for public clubs. This avoids inserting `inviteCode: null` which would
    // be indexed by the unique index and cause duplicate key errors.
    if (privacy !== "public") {
      payload.inviteCode = randomUUID().substring(0, 8).toUpperCase();
    }

    const club = await ClubModel.create(payload);
    res.status(201).json({ success: true, club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClubs = async (req, res) => {
  try {
    const { search, privacy } = req.query;
    let query = { isArchived: false };

    if (privacy) query.privacy = privacy;
    if (search) query.$text = { $search: search };

    const clubs = await ClubModel.find(query)
      .populate("creatorId", "username avatar")
      .populate("currentBookId", "title coverImage")
      .populate("members.userId", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, clubs });
  } catch (error) {
    console.error("Error in getClubs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSingleClub = async (req, res) => {
  try {
    // Validate clubId to avoid Mongoose CastError on invalid ObjectId
    const { clubId } = req.params;
    if (!clubId) {
      return res.status(400).json({ success: false, message: "clubId is required" });
    }
    if (!require("mongoose").Types.ObjectId.isValid(clubId)) {
      return res.status(400).json({ success: false, message: "Invalid clubId" });
    }

    const club = await ClubModel.findById(clubId)
      .populate("creatorId", "username avatar")
      .populate("currentBookId", "title coverImage author")
      .populate("upcomingBooks", "title coverImage")
      .populate("members.userId", "username avatar");

    if (!club)
      return res
        .status(404)
        .json({ success: false, message: "Club not found" });

    const myProgress = club.currentBookId
      ? await ReadingProgressModel.findOne({
          userId: req.user._id,
          clubId: club._id,
          bookId: club.currentBookId,
        })
      : null;

    let membersProgress = [];
    if (club.currentBookId) {
      membersProgress = await ReadingProgressModel.find({
        clubId: club._id,
        bookId: club.currentBookId,
      }).populate("userId", "username avatar");
    }

    res.json({ success: true, club, myProgress, membersProgress });
  } catch (error) {
    console.error("Error in getSingleClub:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const joinClub = async (req, res) => {
  try {
    const club = await ClubModel.findById(req.params.clubId);
    if (!club)
      return res
        .status(404)
        .json({ success: false, message: "Club not found" });

    const isMember = club.members.some(
      (m) => m.userId.toString() === req.user._id.toString(),
    );
    if (isMember)
      return res
        .status(400)
        .json({ success: false, message: "Already a member" });

    if (club.privacy === "private") {
      return res
        .status(403)
        .json({ success: false, message: "This club is invite-only" });
    }

    club.members.push({ userId: req.user._id, role: "member" });
    await club.save();

    res.json({ success: true, message: "Joined club successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const setCurrentBook = async (req, res) => {
  try {
    const { bookId, schedule } = req.body;
    const club = await ClubModel.findById(req.params.clubId);

    if (!club)
      return res
        .status(404)
        .json({ success: false, message: "Club not found" });

    const isAdmin = club.members.some(
      (m) =>
        m.userId.toString() === req.user._id &&
        ["admin", "moderator"].includes(m.role),
    );
    if (!isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    club.currentBookId = bookId;
    if (schedule) club.schedule = schedule;
    await club.save();

    res.json({ success: true, club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { bookId, chapter, percentComplete } = req.body;

    const progress = await ReadingProgressModel.findOneAndUpdate(
      { userId: req.user._id, clubId: req.params.clubId, bookId },
      {
        currentChapter: chapter,
        lastChapterRead: chapter,
        percentComplete,
        status: percentComplete >= 100 ? "completed" : "reading",
      },
      { upsert: true, new: true },
    );

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const voteSession = async (req, res) => {
  try {
    const club = await ClubModel.findById(req.params.clubId);
    if (!club)
      return res
        .status(404)
        .json({ success: false, message: "Club not found" });

    const isAdmin = club.members.some(
      (m) => m.userId.toString() === req.user._id && m.role === "admin",
    );
    if (!isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    if (club.activeVoteSessionId) {
      await VoteSessionModel.findByIdAndUpdate(club.activeVoteSessionId, {
        status: "closed",
      });
    }

    const { nominations = [], startDate, endDate } = req.body;

    const voteSession = await VoteSessionModel.create({
      clubId: club._id,
      status: "nominating",
      nominations: nominations.map((n) => ({
        bookId: n.bookId,
        nominatedBy: req.user._id,
      })),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate
        ? new Date(endDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    club.activeVoteSessionId = voteSession._id;
    await club.save();

    res.status(201).json({ success: true, voteSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVoteSession = async (req, res) => {
  try {
    const club = await ClubModel.findById(req.params.clubId);
    if (!club || !club.activeVoteSessionId) {
      return res.json({ success: true, voteSession: null });
    }

    const voteSession = await VoteSessionModel.findById(club.activeVoteSessionId)
      .populate("nominations.bookId", "title coverImage author")
      .populate("nominations.nominatedBy", "username")
      .populate("winnerBookId", "title coverImage");

    const voteCounts = await Vote.aggregate([
      { $match: { sessionId: voteSession._id } },
      { $group: { _id: "$bookId", count: { $sum: 1 } } },
    ]);

    const myVote = await Vote.findOne({
      sessionId: voteSession._id,
      userId: req.user._id,
    });

    if (voteSession.status === "voting" && new Date() > voteSession.endDate) {
      const winner = voteCounts.sort((a, b) => b.count - a.count)[0];
      if (winner) {
        voteSession.status = "closed";
        voteSession.winnerBookId = winner._id;
        await voteSession.save();
        club.upcomingBooks.push(winner._id);
        await club.save();
      }
    }

    res.json({
      success: true,
      voteSession,
      voteCounts: voteCounts.map((v) => ({ bookId: v._id, count: v.count })),
      myVote: myVote ? myVote.bookId : null,
      totalVotes: voteCounts.reduce((sum, v) => sum + v.count, 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const castVote = async (req, res) => {
  try {
    const { bookId } = req.body;
    const club = await ClubModel.findById(req.params.clubId);

    if (!club || !club.activeVoteSessionId) {
      return res
        .status(400)
        .json({ success: false, message: "No active vote session" });
    }

    const voteSession = await VoteSessionModel.findById(club.activeVoteSessionId);
    if (voteSession.status !== "voting") {
      return res
        .status(400)
        .json({ success: false, message: "Voting is not open" });
    }

    if (new Date() > voteSession.endDate) {
      return res
        .status(400)
        .json({ success: false, message: "Voting has ended" });
    }

    const vote = await Vote.findOneAndUpdate(
      { sessionId: voteSession._id, userId: req.user._id },
      { bookId },
      { upsert: true, new: true },
    );

    const voteCounts = await Vote.aggregate([
      { $match: { sessionId: voteSession._id } },
      { $group: { _id: "$bookId", count: { $sum: 1 } } },
    ]);

    const io = req.app.get("io");
    io.to(`club:${club._id}:lounge`).emit("vote-update", {
      voteCounts: voteCounts.map((v) => ({ bookId: v._id, count: v.count })),
      totalVotes: voteCounts.reduce((sum, v) => sum + v.count, 0),
    });

    res.json({ success: true, vote, voteCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const nominateBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const club = await ClubModel.findById(req.params.clubId);

    if (!club || !club.activeVoteSessionId) {
      return res
        .status(400)
        .json({ success: false, message: "No active nomination period" });
    }

    const voteSession = await VoteSessionModel.findById(club.activeVoteSessionId);
    if (voteSession.status !== "nominating") {
      return res
        .status(400)
        .json({ success: false, message: "Nominations are closed" });
    }

    const alreadyNominated = voteSession.nominations.some(
      (n) => n.bookId.toString() === bookId,
    );
    if (alreadyNominated) {
      return res
        .status(400)
        .json({ success: false, message: "Book already nominated" });
    }

    if (voteSession.nominations.length >= voteSession.maxNominations) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum nominations reached" });
    }

    voteSession.nominations.push({
      bookId,
      nominatedBy: req.user._id,
    });
    await voteSession.save();

    res.json({ success: true, voteSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startVoting = async (req, res) => {
  try {
    const club = await ClubModel.findById(req.params.clubId);
    if (!club)
      return res
        .status(404)
        .json({ success: false, message: "Club not found" });

    const isAdmin = club.members.some(
      (m) => m.userId.toString() === req.user._id && m.role === "admin",
    );
    if (!isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    const voteSession = await VoteSessionModel.findById(club.activeVoteSessionId);
    if (!voteSession || voteSession.status !== "nominating") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot start voting" });
    }

    voteSession.status = "voting";
    await voteSession.save();

    res.json({ success: true, voteSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyActiveClub = async (req, res) => {
  try {
    const club = await ClubModel.findOne({
      "members.userId": req.user._id,
      isArchived: false,
    })
      .populate("currentBookId", "title coverImage")
      .sort({ updatedAt: -1 });

    if (!club) {
      return res.json({ success: true, club: null });
    }

    const activeSchedule = club.schedule.find(
      (s) => new Date() >= s.startDate && new Date() <= s.endDate,
    );

    res.json({
      success: true,
      club: {
        _id: club._id,
        name: club.name,
        currentBook: club.currentBookId,
        activeSchedule,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createClub,
  getClubs,
  getSingleClub,
  getMyActiveClub,
  joinClub,
  setCurrentBook,
  updateProgress,
  voteSession,
  getVoteSession,
  castVote,
  nominateBook,
  startVoting,
};
