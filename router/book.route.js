const express = require("express");
const { getAllBooks, searchBooks, getFeaturedBooks, getDiscoverBooks, getBookById } = require("../controller/Book.controller");
const { continueReading, addBookmark, addHighlight, startReading, updateProgress } = require("../controller/ReadingSession.controller");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.get("/", getAllBooks);

router.get("/search", searchBooks);

router.get("/featured", getFeaturedBooks);

router.get("/continue", verifyUser, continueReading);

router.get("/discover", getDiscoverBooks);

// router.post("/upload", )
router.get("/:id", getBookById);


router.post("/bookmark/:bookId", verifyUser, addBookmark);

router.post("/highlight/:bookId", verifyUser, addHighlight);

router.post("/start/:bookId", verifyUser, startReading);

router.patch("/progress/:bookId", verifyUser, updateProgress);

module.exports = router;
