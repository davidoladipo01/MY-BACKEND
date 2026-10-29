const express = require("express");
const { registerUser, loginUser, logoutUser, getCurrentUser, socialAuth } = require("../controller/Auth.controller");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.post("/social", socialAuth)
router.get("/me", verifyUser, getCurrentUser);

module.exports = router;