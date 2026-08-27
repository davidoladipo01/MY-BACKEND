const ReadingProgress = require("../model/ReadingProgress.model");
const Bookmark = require("../model/BookMark.model");
const Highlight = require("../model/Highlight.model");
const Book = require("../model/Book.model");
const {
  ingestGutenbergBook,
} = require("../services/ingestGutenbergBook.service");

const startReading = async (req, res) => {
  try {
    const { bookId } = req.params;

    const userId = req.user.id;

    let progress = await ReadingProgress.findOne({
      user: userId,
      book: bookId,
    });

    if (!progress) {
      progress = await ReadingProgress.create({
        user: userId,
        book: bookId,
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { currentPage, epubLocation, percentage } = req.body;

    const update = { currentPage, epubLocation, percentage };

    if (percentage >= 99) {
      update.status = "completed";
      update.completedAt = new Date();
    }

    const progress = await ReadingProgress.findOneAndUpdate(
      { user: req.user.id, book: bookId },
      update,
      { new: true },
    );

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const continueReading = async (req, res) => {
  try {
    const books = await ReadingProgress.find({
      user: req.user.id,
      status: "reading",
    })
      .populate("book")
      .sort({
        updatedAt: -1,
      });

    res.json({
      success: true,
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addBookmark = async (req, res) => {
  try {
    const { bookId } = req.params;

    const { page, note } = req.body;

    const bookmark = await Bookmark.create({
      user: req.user.id,
      book: bookId,
      page,
      note,
    });

    res.status(201).json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addHighlight = async (req, res) => {
  try {
    const { bookId } = req.params;

    const { text, page, color } = req.body;

    const highlight = await Highlight.create({
      user: req.user.id,
      book: bookId,
      text,
      page,
      color,
    });

    res.status(201).json({
      success: true,
      data: highlight,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getReadingGoal = async (req, res) => {
  try {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const booksCompleted = await ReadingProgress.countDocuments({
      user: req.user.id,
      status: "completed",
      completedAt: { $gte: startOfYear },
    });

    res.json({
      success: true,
      data: {
        booksCompleted,
        goal: req.user.annualReadingGoal || 12,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====Reading Engine=====

const getReadingBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const userId = req.user.id;

    let book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (!book.canRead) {
      return res.status(400).json({
        success: false,
        message: "This book is not available for reading",
      });
    }

    if (!book.fileUrl && book.sourceType === "gutenberg") {
      book = await ingestGutenbergBook(book);
    }

    const [progress, bookmarks, highlights] = await Promise.all([
      ReadingProgress.findOne({
        user: userId,
        book: bookId,
      }),

      Bookmark.find({
        user: userId,
        book: bookId,
      }).sort({ page: 1 }),

      Highlight.find({
        user: userId,
        book: bookId,
      }).sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        book,
        progress,
        bookmarks,
        highlights,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        books: []
      });
    }

    // Search by title or author matching the query string
    const books = await Book.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { authors: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } } // handling both schema formats
      ]
    })
    .select('_id title authors author coverImage fileType')
    .limit(10);

    return res.status(200).json({
      success: true,
      books
    });
  } catch (error) {
    console.error('Search books error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  startReading,
  updateProgress,
  continueReading,
  addBookmark,
  addHighlight,
  getReadingBook,
  searchBooks,
  getReadingGoal,
};
