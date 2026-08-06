const uploadBookFile = require("../services/cloudinaryBookUpload");
const Book = require("../model/Book.model");

const uploadReadableBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const uploaded = await uploadBookFile(req.file.buffer);

    const { title, author, description } = req.body;

    const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "epub";

    const book = await Book.create({
      title,
      authors: [author],
      description,

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

module.exports = {
  uploadReadableBook,
};
