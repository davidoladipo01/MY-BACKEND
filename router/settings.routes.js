const express = require("express");
const multer = require("multer");
const verifyUser = require("../middleware/verifyUser");
const upload = require("../middleware/upload");
const {
  getAccount,
  updateProfile,
  changePassword,
} = require("../controller/Settings.controller");

const router = express.Router();

// Runs multer and turns its errors (wrong type, too big) into clean JSON
const handleAvatarUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (!error) return next();

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller."
        : error.message || "Image upload failed.";

    res.status(400).json({ success: false, message });
  });
};

router.get("/account", verifyUser, getAccount);
router.patch("/profile", verifyUser, handleAvatarUpload, updateProfile);
router.patch("/password", verifyUser, changePassword);

module.exports = router;