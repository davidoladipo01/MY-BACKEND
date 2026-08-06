const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/epub+zip"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF and EPUB files are allowed."),
      false
    );
  }
};

const uploadBook = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter
});

module.exports = uploadBook;