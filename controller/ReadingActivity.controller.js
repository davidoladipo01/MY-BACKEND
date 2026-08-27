const ReadingActivity = require("../model/ReadingActivity.model");

const todayStr = () => new Date().toISOString().slice(0, 10);

// POST /api/reading/:bookId/activity  { minutes }
const logReadingTime = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid minutes",
      });
    }

    const activity = await ReadingActivity.findOneAndUpdate(
      { user: req.user.id, date: todayStr() },
      {
        $inc: { minutesRead: minutes },
        $addToSet: { books: bookId },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reading/streak
const getStreak = async (req, res) => {
  try {
    const activities = await ReadingActivity.find({ user: req.user.id })
      .select("date -_id")
      .lean();

    const activeDates = new Set(activities.map((a) => a.date));

    // Current streak: walk back from today (or yesterday if today has no
    // activity yet, so an unfinished day doesn't zero out an active streak)
    let currentStreak = 0;
    const cursor = new Date();
    if (!activeDates.has(cursor.toISOString().slice(0, 10))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (activeDates.has(cursor.toISOString().slice(0, 10))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    // Longest streak ever
    const sortedDates = [...activeDates].sort();
    let longestStreak = 0;
    let running = 0;
    let prevDate = null;

    for (const dateStr of sortedDates) {
      const current = new Date(`${dateStr}T00:00:00Z`);
      if (prevDate && (current - prevDate) / 86400000 === 1) {
        running += 1;
      } else {
        running = 1;
      }
      longestStreak = Math.max(longestStreak, running);
      prevDate = current;
    }

    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalActiveDays: activeDates.size,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reading/heatmap?days=364
const getHeatmap = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 364;

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - days);
    const startStr = start.toISOString().slice(0, 10);

    const activities = await ReadingActivity.find({
      user: req.user.id,
      date: { $gte: startStr },
    })
      .select("date minutesRead -_id")
      .lean();

    const byDate = {};
    activities.forEach((a) => {
      byDate[a.date] = a.minutesRead;
    });

    const result = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ date: dateStr, minutes: byDate[dateStr] || 0 });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTodayActivity = async (req, res) => {
  try {
    const activity = await ReadingActivity.findOne({
      user: req.user.id,
      date: todayStr(),
    });

    res.json({
      success: true,
      data: { minutesRead: activity?.minutesRead || 0, goalMinutes: 20 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { logReadingTime, getStreak, getHeatmap, getTodayActivity };