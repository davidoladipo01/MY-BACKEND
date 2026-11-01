const mongoose = require("mongoose");

const CATEGORIES = [
  "Culture",
  "Reading Tips",
  "Book Reviews",
  "Communities",
  "Author Spotlight",
  "Other",
];

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    excerpt: {
      type: String,
      default: "",
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
      minlength: 50,
      maxlength: 20000,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "Other",
    },
    coverImage: {
      type: String,
      default: "",
    },
    // Cloudinary id, kept so the image can be deleted/replaced later.
    // Never sent to the frontend (see toJSON below).
    coverImagePublicId: {
      type: String,
      default: "",
    },
    readTime: {
      type: Number,
      default: 1, // minutes
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.coverImagePublicId;
        return ret;
      },
    },
  }
);

blogPostSchema.index({ createdAt: -1 });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);
BlogPost.CATEGORIES = CATEGORIES;

module.exports = BlogPost;