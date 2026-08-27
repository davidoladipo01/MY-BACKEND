const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    avatar: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },

    genres: {
      type: [String],
      default: [],
    },

    favoriteAuthors: {
      type: [String],
      default: [],
    },

    favoriteBooks: {
      type: [String],
      default: [],
    },

    readingGoal: {
      type: String,
    },

    country: {
      type: String,
    },

    timezone: {
      type: String,
    },

    location: {
      type: String,
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
    strict: "throw",
  })


const UserModel = mongoose.model("User", UserSchema)

module.exports = UserModel