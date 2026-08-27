const express = require("express");
const { getAllBooks, searchBooks, getFeaturedBooks, getDiscoverBooks, getBookById } = require("../controller/Book.controller");
const { continueReading, addBookmark, addHighlight, startReading, updateProgress } = require("../controller/ReadingSession.controller");
const { shelveBook, getShelfStatus, getShelf, removeFromShelf } = require("../controller/UserBook.controller");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.get("/", getAllBooks);

router.get("/search", searchBooks);

router.get("/featured", getFeaturedBooks);

router.get("/continue", verifyUser, continueReading);

router.get("/discover", getDiscoverBooks);

router.get("/shelf", verifyUser, getShelf);

// router.post("/upload", )
router.get("/:id", getBookById);


router.post("/bookmark/:bookId", verifyUser, addBookmark);

router.post("/highlight/:bookId", verifyUser, addHighlight);

router.post("/start/:bookId", verifyUser, startReading);

router.patch("/progress/:bookId", verifyUser, updateProgress);

router.post("/:id/shelf", verifyUser, shelveBook);

router.get("/:id/shelf", verifyUser, getShelfStatus);

router.delete("/:id/shelf", verifyUser, removeFromShelf);

module.exports = router;