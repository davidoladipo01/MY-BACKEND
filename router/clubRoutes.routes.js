const express = require("express");
const verifyUser = require("../middleware/verifyUser");
const { createClub, getClubs, getSingleClub, joinClub, setCurrentBook, updateProgress, voteSession, getVoteSession, castVote, nominateBook, startVoting, getMyActiveClub } = require("../controller/Club.controller");

const router = express.Router();

router.post("/createClub",verifyUser, createClub )
router.get("/getClubs", verifyUser, getClubs)
router.get("/my-active", verifyUser, getMyActiveClub);
router.get("/getSingleClub/:clubId", verifyUser, getSingleClub)
router.post("/joinClub/:clubId", verifyUser, joinClub)
router.put("/current-book/:clubId", verifyUser, setCurrentBook)
router.put("/progress/:clubId", verifyUser, updateProgress)
router.post("/voteSession/:clubId", verifyUser, voteSession);
router.get("/vote-session/:clubId", verifyUser, getVoteSession);
router.post("/vote/:clubId", verifyUser, castVote);
router.post("/nominateBook/:clubId", verifyUser, nominateBook);
router.put("/vote-session/start-voting/:clubId", verifyUser, startVoting);



module.exports = router;