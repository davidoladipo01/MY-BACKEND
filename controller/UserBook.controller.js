const UserBook = require("../model/UserBook.model");

const ALLOWED_STATUSES = ["want_to_read", "currently_reading", "completed"];

const shelveBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const nextStatus = ALLOWED_STATUSES.includes(status)
      ? status
      : "want_to_read";

    const update = { status: nextStatus };

    if (nextStatus === "completed") {
      update.completedAt = new Date();
    }

    const entry = await UserBook.findOneAndUpdate(
      { user: req.user.id, book: id },
      {
        $set: update,
        $setOnInsert: { user: req.user.id, book: id },
      },
      { upsert: true, new: true }
    ).populate("book");

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getShelfStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await UserBook.findOne({
      user: req.user.id,
      book: id,
    });

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getShelf = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { user: req.user.id };

    if (status) {
      filter.status = status;
    }

    const entries = await UserBook.find(filter)
      .populate("book")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeFromShelf = async (req, res) => {
  try {
    const { id } = req.params;

    await UserBook.findOneAndDelete({
      user: req.user.id,
      book: id,
    });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  shelveBook,
  getShelfStatus,
  getShelf,
  removeFromShelf,
};