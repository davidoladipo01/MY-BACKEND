const UserModel = require("../model/User.model");
const ReadingProgress = require("../model/ReadingProgress.model");
const ReadingActivity = require("../model/ReadingActivity.model");

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [booksCompleted, booksReading, activities] = await Promise.all([
      ReadingProgress.countDocuments({ user: userId, status: "completed" }),
      ReadingProgress.countDocuments({ user: userId, status: "reading" }),
      ReadingActivity.find({ user: userId }).select("date minutesRead -_id").lean(),
    ]);

    const totalMinutesRead = activities.reduce((sum, a) => sum + a.minutesRead, 0);

    // Current streak (same logic as ReadingActivity.controller's getStreak)
    const activeDates = new Set(activities.map((a) => a.date));
    let currentStreak = 0;
    const cursor = new Date();
    if (!activeDates.has(cursor.toISOString().slice(0, 10))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (activeDates.has(cursor.toISOString().slice(0, 10))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          booksCompleted,
          booksReading,
          totalMinutesRead,
          currentStreak,
          memberSince: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile };