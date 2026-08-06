const Book = require("../model/Book.model");

const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeaturedBooks = async (req, res) => {
  try {
    const books = await Book.find({
      featured: true,
    }).limit(20);

    res.status(200).json({
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

const getDiscoverBooks = async (req, res) => {
  try {
    const books = await Book.find().limit(50);

    res.status(200).json({
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

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // if (!book.canRead) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "This book is not available for reading",
    //   });
    // }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;

    const books = await Book.find({
      $or: [
        {
          title: {
            $regex: q,
            $options: "i",
          },
        },
        {
          authors: {
            $regex: q,
            $options: "i",
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
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
  getAllBooks,
  getBookById,
  searchBooks,
  getFeaturedBooks,
  getDiscoverBooks,
};
