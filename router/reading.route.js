const express = require("express");

const router = express.Router();

const uploadBook = require("../middleware/uploadBook");

const verifyUser = require("../middleware/verifyUser");

const { uploadReadableBook } = require("../controller/Reading.controller");

const {
  startReading,
  updateProgress,
  continueReading,
  addBookmark,
  addHighlight,
  getReadingBook,
} = require("../controller/ReadingSession.controller");
const { importReadableBooks } = require("../controller/BookDiscovery.controller");

router.post("/upload", uploadBook.single("book"), verifyUser ,uploadReadableBook);

router.post("/start/:bookId", verifyUser, startReading);

router.patch("/progress/:bookId", verifyUser, updateProgress);

router.get("/continue", verifyUser, continueReading);

router.post("/bookmark/:bookId", verifyUser, addBookmark);

router.post("/highlight/:bookId", verifyUser, addHighlight);

router.post("/readable-books", importReadableBooks);

router.get("/book/:bookId", verifyUser, getReadingBook);

module.exports = router;
