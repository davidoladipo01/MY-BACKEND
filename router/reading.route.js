const express = require("express");

const router = express.Router();

const uploadBook = require("../middleware/uploadBook");

const verifyUser = require("../middleware/verifyUser");

const {
  uploadReadableBook,
  streamBookFile,
} = require("../controller/Reading.controller");

const {
  startReading,
  updateProgress,
  continueReading,
  addBookmark,
  addHighlight,
  getReadingBook,
  searchBooks,
  getReadingGoal,
} = require("../controller/ReadingSession.controller");
const {
  importReadableBooks,
} = require("../controller/BookDiscovery.controller");
const {
  getHeatmap,
  getStreak,
  logReadingTime,
  getTodayActivity,
} = require("../controller/ReadingActivity.controller");
const { getProfile } = require("../controller/Profile.controller");

router.post(
  "/upload",
  uploadBook.single("book"),
  verifyUser,
  uploadReadableBook,
);

router.get(
  "/file/:bookId",
  // verifyUser,
  streamBookFile,
);

router.post("/start/:bookId", verifyUser, startReading);

router.patch("/progress/:bookId", verifyUser, updateProgress);

router.get("/continue", verifyUser, continueReading);

router.post("/:bookId/activity", verifyUser, logReadingTime);
router.get("/streak", verifyUser, getStreak);
router.get("/heatmap", verifyUser, getHeatmap);

router.post("/bookmark/:bookId", verifyUser, addBookmark);

router.post("/highlight/:bookId", verifyUser, addHighlight);

router.post("/readable-books", importReadableBooks);

router.get("/book/:bookId", verifyUser, getReadingBook);
router.get("/books/search", searchBooks);

router.get("/goal", verifyUser, getReadingGoal);
router.get("/today", verifyUser, getTodayActivity);
router.get("/profile", verifyUser, getProfile);

module.exports = router;
