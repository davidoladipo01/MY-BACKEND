const uploadBookFile = require("../services/cloudinaryBookUpload");
const Book = require("../model/Book.model");
const axios = require("axios");

const buildCoverImageUrl = (title, author) => {
  const label = [title || "Book", author ? `by ${author}` : ""].filter(Boolean).join(" ");
  const safeLabel = label.slice(0, 38).trim() || "Book";

  return `https://placehold.co/600x900/0F172A/FFFFFF?text=${encodeURIComponent(safeLabel)}`;
};

const uploadReadableBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { title, author, description, coverImage } = req.body;

    const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "epub";

    const uploaded = await uploadBookFile(req.file.buffer, fileType);

    const finalCoverImage =
      coverImage || buildCoverImageUrl(title, author);

    const book = await Book.create({
      title,
      authors: [author],
      description,
      coverImage: finalCoverImage,

      fileUrl: uploaded.secure_url,

      fileType,

      readingFormat: fileType,

      fileSize: req.file.size,

      canRead: true,

      source: "user_upload",

      sourceType: "uploaded",
    });

    res.status(201).json({
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

const streamBookFile = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);

    if (!book || !book.fileUrl) {
      return res.status(404).json({
        success: false,
        message: "Book file not found",
      });
    }

    const response = await axios({
      method: "GET",
      url: book.fileUrl,
      responseType: "stream",
    });

    if (book.fileType === "epub") {
      res.setHeader(
        "Content-Type",
        "application/epub+zip"
      );
    } else if (book.fileType === "pdf") {
      res.setHeader(
        "Content-Type",
        "application/pdf"
      );
    }

    response.data.pipe(res);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadReadableBook,
  streamBookFile,
};
