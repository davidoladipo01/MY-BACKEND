const express = require("express");
const multer = require("multer");
const verifyUser = require("../middleware/verifyUser");
const upload = require("../middleware/upload");
const {
  getCategories,
  getPosts,
  getMyPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} = require("../controller/Blog.controller");

const router = express.Router();

// Runs multer and turns its errors (wrong type, too big) into clean JSON
const handleCoverUpload = (req, res, next) => {
  upload.single("coverImage")(req, res, (error) => {
    if (!error) return next();

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller."
        : error.message || "Image upload failed.";

    res.status(400).json({ success: false, message });
  });
};

// NOTE: fixed paths (/categories, /mine) must come before /:slug
router.get("/", getPosts);
router.get("/categories", getCategories);
router.get("/mine", verifyUser, getMyPosts);
router.get("/:slug", getPostBySlug);

router.post("/", verifyUser, handleCoverUpload, createPost);
router.put("/:id", verifyUser, handleCoverUpload, updatePost);
router.delete("/:id", verifyUser, deletePost);

module.exports = router;