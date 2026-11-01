const crypto = require("crypto");
const mongoose = require("mongoose");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const BlogPost = require("../model/BlogPost.model");

const AUTHOR_FIELDS = "firstName lastName userName avatar";

/* ---------------- helpers ---------------- */

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "post";

// readable slug + short random suffix so two posts with the same title never clash
const makeSlug = (title) =>
  `${slugify(title)}-${crypto.randomBytes(3).toString("hex")}`;

const buildMeta = (content) => {
  const clean = content.replace(/\s+/g, " ").trim();
  const words = clean ? clean.split(" ").length : 0;

  return {
    excerpt: clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean,
    readTime: Math.max(1, Math.ceil(words / 200)),
  };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateFields = (body) => {
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const category = BlogPost.CATEGORIES.includes(body.category)
    ? body.category
    : "Other";

  if (title.length < 3 || title.length > 120) {
    return { error: "Title must be between 3 and 120 characters." };
  }
  if (content.length < 50) {
    return { error: "Post content must be at least 50 characters." };
  }
  if (content.length > 20000) {
    return { error: "Post content is too long (20,000 characters max)." };
  }

  return { title, content, category };
};

/* ---------------- cloudinary ---------------- */

const uploadCover = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "AfriReadCo/blog",
        transformation: [
          { width: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });

// best-effort: a failed delete should never break the request
const removeCover = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
  }
};

/* ---------------- handlers ---------------- */

// GET /api/blog/categories
const getCategories = (req, res) => {
  res.status(200).json({ success: true, data: BlogPost.CATEGORIES });
};

// Shared list handler for GET /api/blog and GET /api/blog/mine
const listPosts = async (req, res, extraFilter = {}) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 30);

    const filter = { ...extraFilter };

    if (BlogPost.CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    if (req.query.q && String(req.query.q).trim()) {
      filter.title = {
        $regex: escapeRegex(String(req.query.q).trim()),
        $options: "i",
      };
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .select("-content")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", AUTHOR_FIELDS),
      BlogPost.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("listPosts error:", error);
    res.status(500).json({ success: false, message: "Could not load posts." });
  }
};

// GET /api/blog
const getPosts = (req, res) => listPosts(req, res);

// GET /api/blog/mine  (auth)
const getMyPosts = (req, res) => listPosts(req, res, { author: req.user.id });

// GET /api/blog/:slug
const getPostBySlug = async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug }).populate(
      "author",
      AUTHOR_FIELDS
    );

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found." });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("getPostBySlug error:", error);
    res.status(500).json({ success: false, message: "Could not load post." });
  }
};

// POST /api/blog  (auth, multipart/form-data, optional "coverImage" file)
const createPost = async (req, res) => {
  let uploaded = null;

  try {
    const fields = validateFields(req.body);
    if (fields.error) {
      return res.status(400).json({ success: false, message: fields.error });
    }

    if (req.file) {
      uploaded = await uploadCover(req.file.buffer);
    }

    const post = await BlogPost.create({
      title: fields.title,
      slug: makeSlug(fields.title),
      content: fields.content,
      category: fields.category,
      coverImage: uploaded?.secure_url || "",
      coverImagePublicId: uploaded?.public_id || "",
      author: req.user.id,
      ...buildMeta(fields.content),
    });

    await post.populate("author", AUTHOR_FIELDS);

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error("createPost error:", error);
    // don't leave an orphan image behind if saving failed
    await removeCover(uploaded?.public_id);
    res.status(500).json({ success: false, message: "Could not create post." });
  }
};

// Loads a post and makes sure the logged-in user owns it
const findOwnedPost = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ success: false, message: "Invalid post id." });
    return null;
  }

  const post = await BlogPost.findById(req.params.id);

  if (!post) {
    res.status(404).json({ success: false, message: "Post not found." });
    return null;
  }

  if (String(post.author) !== String(req.user.id)) {
    res
      .status(403)
      .json({ success: false, message: "You can only change your own posts." });
    return null;
  }

  return post;
};

// PUT /api/blog/:id  (auth, owner only)
// New "coverImage" file replaces the old one; removeCoverImage=true clears it.
const updatePost = async (req, res) => {
  let uploaded = null;

  try {
    const post = await findOwnedPost(req, res);
    if (!post) return;

    const fields = validateFields(req.body);
    if (fields.error) {
      return res.status(400).json({ success: false, message: fields.error });
    }

    const oldPublicId = post.coverImagePublicId;
    const removeRequested = String(req.body.removeCoverImage) === "true";

    // slug is left unchanged so existing links keep working
    post.title = fields.title;
    post.content = fields.content;
    post.category = fields.category;
    Object.assign(post, buildMeta(fields.content));

    if (req.file) {
      uploaded = await uploadCover(req.file.buffer);
      post.coverImage = uploaded.secure_url;
      post.coverImagePublicId = uploaded.public_id;
    } else if (removeRequested) {
      post.coverImage = "";
      post.coverImagePublicId = "";
    }

    await post.save();

    // old image is only deleted once the new data is safely saved
    if (uploaded || removeRequested) {
      await removeCover(oldPublicId);
    }

    await post.populate("author", AUTHOR_FIELDS);

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("updatePost error:", error);
    await removeCover(uploaded?.public_id);
    res.status(500).json({ success: false, message: "Could not update post." });
  }
};

// DELETE /api/blog/:id  (auth, owner only)
const deletePost = async (req, res) => {
  try {
    const post = await findOwnedPost(req, res);
    if (!post) return;

    const publicId = post.coverImagePublicId;

    await post.deleteOne();
    await removeCover(publicId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("deletePost error:", error);
    res.status(500).json({ success: false, message: "Could not delete post." });
  }
};

module.exports = {
  getCategories,
  getPosts,
  getMyPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
};