const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
  {
    // External API Reference
    googleBookId: {
      type: String,
      unique: true,
      sparse: true,
    },

    openLibraryId: {
      type: String,
      unique: true,
      sparse: true,
    },

    gutenbergId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Core Metadata
    title: {
      type: String,
      required: true,
      trim: true,
    },

    authors: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    publishedDate: {
      type: String,
      default: "",
    },

    pageCount: {
      type: Number,
      default: 0,
    },

    language: {
      type: String,
      default: "en",
    },

    categories: {
      type: [String],
      default: [],
    },

    publisher: {
      type: String,
      default: "",
    },

    isbn: {
      type: String,
      default: "",
    },

    // Ratings
    averageRating: {
      type: Number,
      default: 0,
    },

    ratingsCount: {
      type: Number,
      default: 0,
    },

    // AfriReadCo Metadata
    country: {
      type: String,
      default: "",
    },

    region: {
      type: String,
      default: "",
    },

    era: {
      type: String,
      default: "",
    },

    isAfricanLiterature: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    awards: {
      type: [String],
      default: [],
    },

    source: {
      type: String,
      default: "google",
    },

    genres: [String],

    // Analytics
    savesCount: {
      type: Number,
      default: 0,
    },

    currentlyReadingCount: {
      type: Number,
      default: 0,
    },

    completedCount: {
      type: Number,
      default: 0,
    },

    //Reading engine

    fileUrl: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      enum: ["epub", "pdf", "none"],
      default: "none",
    },

    sourceType: {
      type: String,
      enum: [
        "uploaded",
        "gutenberg",
        "openlibrary",
        "google",
        "nyt",
        "hardcover",
      ],
      default: "google",
    },

    downloadUrl: {
      type: String,
      default: "",
    },

    epubUrl: {
      type: String,
      default: "",
    },

    pdfUrl: {
      type: String,
      default: "",
    },

    canRead: {
      type: Boolean,
      default: false,
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    readingFormat: {
      type: String,
      enum: ["pdf", "epub", "unknown"],
      default: "unknown",
    },

    // Clubs
    clubsReading: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Book", BookSchema);
