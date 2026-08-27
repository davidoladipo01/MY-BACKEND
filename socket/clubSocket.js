const Message = require("../model/Message.model");
const ReadingProgress = require("../model/ReadingProgress.model");
const Club = require("../model/Club.model");
const mongoose = require('mongoose');

const activeUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // AUTHENTICATION
    socket.on("authenticate", (data) => {
      const { userId, username, avatar } = data;
      activeUsers.set(socket.id, {
        userId,
        username,
        avatar,
        currentRooms: [],
      });
      socket.userId = userId;
      socket.username = username;
      socket.avatar = avatar;
      console.log(`User ${username} authenticated`);
    });

    // JOIN CLUB LOUNGE
    socket.on("join-club-lounge", async (data) => {
      const { clubId } = data;
      const user = activeUsers.get(socket.id);

      if (!user) return socket.emit("error", { message: "Not authenticated" });

      const club = await Club.findById(clubId);
      if (!club) return socket.emit("error", { message: "Club not found" });

      const isMember = club.members.some(
        (m) => m.userId.toString() === user.userId,
      );
      if (!isMember && club.privacy !== "public") {
        return socket.emit("error", { message: "Not a member of this club" });
      }

      const roomName = `club:${clubId}:lounge`;
      socket.join(roomName);
      user.currentRooms.push(roomName);

      const history = await Message.find({
        clubId,
        room: "lounge",
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("replyTo", "username content");

      socket.emit("lounge-history", history.reverse());

      socket.to(roomName).emit("user-joined-lounge", {
        userId: user.userId,
        username: user.username,
        avatar: user.avatar,
        timestamp: new Date(),
      });
    });

    // LOUNGE MESSAGE
    socket.on("lounge-message", async (data) => {
      const { clubId, content, replyTo } = data;
      const user = activeUsers.get(socket.id);

      if (!user) {
        return socket.emit("error", {
          message: "Session expired or not authenticated. Please reconnect.",
        });
      }

      try {
        // 1. Sanitize replyTo ID
        let replyToId = null;
        if (replyTo) {
          // Handle if replyTo is passed as an object ({ _id: '...' }) or direct ID string
          const rawId =
            typeof replyTo === "object" ? replyTo._id || replyTo.id : replyTo;
          if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
            replyToId = rawId;
          }
        }

        // 2. Validate user.userId format
        if (!mongoose.Types.ObjectId.isValid(user.userId)) {
          console.error("Invalid user.userId in activeUsers:", user.userId);
          return socket.emit("error", {
            message: "Invalid user authentication credentials.",
          });
        }

        // 3. Create document matching Message schema
        const message = await Message.create({
          clubId,
          room: "lounge",
          userId: user.userId,
          username: user.username,
          avatar: user.avatar || "",
          content,
          replyTo: replyToId,
        });

        // 4. Populate replyTo reference if present so frontend renders preview cleanly
        if (message.replyTo) {
          await message.populate("replyTo", "username content");
        }

        const roomName = `club:${clubId}:lounge`;
        io.to(roomName).emit("new-lounge-message", {
          _id: message._id,
          id: message._id,
          userId: user.userId,
          username: user.username,
          avatar: user.avatar,
          content: message.content,
          replyTo: message.replyTo,
          reactions: [],
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error("Mongoose Create Error:", err.message);
        socket.emit("error", {
          message: `Failed to send message: ${err.message}`,
        });
      }
    });
    // JOIN CHAPTER ROOM
    socket.on("join-chapter-room", async (data) => {
      const { clubId, chapterRange } = data;
      const user = activeUsers.get(socket.id);

      if (!user) return socket.emit("error", { message: "Not authenticated" });

      const club = await Club.findById(clubId);
      if (!club || !club.currentBookId) {
        return socket.emit("error", { message: "No active book in this club" });
      }

      const progress = await ReadingProgress.findOne({
        userId: user.userId,
        clubId,
        bookId: club.currentBookId,
      });

      const lastChapter = parseInt(chapterRange.split("-")[2]);
      const userLastChapter = progress ? progress.lastChapterRead : 0;

      const scheduleItem = club.schedule.find(
        (s) => s.chapterRange === chapterRange,
      );
      const now = new Date();
      const isUnlockedBySchedule =
        !scheduleItem || now >= scheduleItem.startDate;
      const isUnlockedByProgress = userLastChapter >= lastChapter;

      if (!isUnlockedBySchedule && !isUnlockedByProgress) {
        return socket.emit("room-locked", {
          chapterRange,
          reason: "LOCKED_BY_SCHEDULE",
          unlocksAt: scheduleItem ? scheduleItem.startDate : null,
          yourProgress: userLastChapter,
          requiredProgress: lastChapter,
        });
      }

      const roomName = `club:${clubId}:room:${chapterRange}`;
      socket.join(roomName);
      user.currentRooms.push(roomName);

      const history = await Message.find({
        clubId,
        room: chapterRange,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(50);

      socket.emit("chapter-room-history", {
        chapterRange,
        messages: history.reverse(),
        unlockedBy: isUnlockedByProgress ? "progress" : "schedule",
      });
    });

    // CHAPTER MESSAGE
    socket.on("chapter-message", async (data) => {
      const { clubId, chapterRange, content } = data;
      const user = activeUsers.get(socket.id);

      if (!user) return;

      const message = await Message.create({
        clubId,
        room: chapterRange,
        userId: user.userId,
        username: user.username,
        avatar: user.avatar,
        content,
      });

      const roomName = `club:${clubId}:room:${chapterRange}`;
      io.to(roomName).emit("new-chapter-message", {
        id: message._id,
        userId: user.userId,
        username: user.username,
        avatar: user.avatar,
        content: message.content,
        reactions: [],
        createdAt: message.createdAt,
      });
    });

    // TYPING INDICATOR
    socket.on("typing", (data) => {
      const { clubId, room, isTyping } = data;
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const roomName =
        room === "lounge"
          ? `club:${clubId}:lounge`
          : `club:${clubId}:room:${room}`;

      socket.to(roomName).emit("user-typing", {
        userId: user.userId,
        username: user.username,
        isTyping,
      });
    });

    // REACTION
    socket.on("add-reaction", async (data) => {
      const { messageId, emoji } = data;
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      message.reactions = message.reactions.filter(
        (r) => !(r.userId.toString() === user.userId && r.emoji === emoji),
      );

      const hadReaction =
        message.reactions.length <
        (await Message.findById(messageId)).reactions.length;
      if (!hadReaction) {
        message.reactions.push({ emoji, userId: user.userId });
      }

      await message.save();

      const roomName = `club:${message.clubId}:${message.room === "lounge" ? "lounge" : "room:" + message.room}`;
      io.to(roomName).emit("message-reaction-updated", {
        messageId,
        reactions: message.reactions,
      });
    });

    // UPDATE READING PROGRESS
    socket.on("update-progress", async (data) => {
      const { clubId, bookId, chapter, percentComplete } = data;
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const progress = await ReadingProgress.findOneAndUpdate(
        { userId: user.userId, clubId, bookId },
        {
          currentChapter: chapter,
          lastChapterRead: Math.max(
            chapter,
            (
              await ReadingProgress.findOne({
                userId: user.userId,
                clubId,
                bookId,
              })
            )?.lastChapterRead || 0,
          ),
          percentComplete,
          status: percentComplete >= 100 ? "completed" : "reading",
        },
        { upsert: true, new: true },
      );

      io.to(`club:${clubId}:lounge`).emit("member-progress-update", {
        userId: user.userId,
        username: user.username,
        chapter,
        percentComplete,
      });

      const club = await Club.findById(clubId);
      club.schedule.forEach((scheduleItem) => {
        const lastCh = parseInt(scheduleItem.chapterRange.split("-")[2]);
        if (chapter >= lastCh) {
          socket.emit("chapter-unlocked", {
            chapterRange: scheduleItem.chapterRange,
            unlockedBy: "progress",
          });
        }
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.currentRooms.forEach((roomName) => {
          socket.to(roomName).emit("user-left", {
            userId: user.userId,
            username: user.username,
          });
        });
        activeUsers.delete(socket.id);
      }
      console.log("Socket disconnected:", socket.id);
    });
  });
};
