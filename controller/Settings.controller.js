const bcrypt = require("bcryptjs");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const UserModel = require("../model/User.model");

// Same rules as the Register form
const USERNAME_RULE = /^[a-zA-Z0-9_]{3,16}$/;
const PASSWORD_RULE =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const clean = (value) => String(value ?? "").trim();

const uploadAvatarImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "AfriReadCo/avatars",
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });

// GET /api/settings/account
const getAccount = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const hasPassword = Boolean(user.password);

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        hasPassword,
        signInMethod: hasPassword ? "password" : "google",
      },
    });
  } catch (error) {
    console.error("getAccount error:", error);
    res
      .status(500)
      .json({ success: false, message: "Could not load your account." });
  }
};

// PATCH /api/settings/profile  (multipart/form-data, optional "avatar" file)
const updateProfile = async (req, res) => {
  try {
    const firstName = clean(req.body.firstName);
    const lastName = clean(req.body.lastName);
    const userName = clean(req.body.userName).toLowerCase();
    const bio = clean(req.body.bio);
    const location = clean(req.body.location);

    if (firstName.length < 2 || firstName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "First name must be 2 to 50 characters.",
      });
    }
    if (lastName.length < 2 || lastName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Last name must be 2 to 50 characters.",
      });
    }
    if (!USERNAME_RULE.test(userName)) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3 to 16 characters: letters, numbers and underscores only.",
      });
    }
    if (bio.length > 200) {
      return res
        .status(400)
        .json({ success: false, message: "Bio must be 200 characters or less." });
    }
    if (location.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Location must be 100 characters or less.",
      });
    }

    const taken = await UserModel.findOne({
      userName,
      _id: { $ne: req.user.id },
    });

    if (taken) {
      return res
        .status(409)
        .json({ success: false, message: "That username is already taken." });
    }

    const updates = { firstName, lastName, userName, bio, location };

    if (req.file) {
      const uploaded = await uploadAvatarImage(req.file.buffer);
      updates.avatar = uploaded.secure_url;
    } else if (String(req.body.removeAvatar) === "true") {
      updates.avatar = null;
    }

    const user = await UserModel.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Profile updated.", data: user });
  } catch (error) {
    // two people saving the same username at the same moment
    if (error && error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "That username is already taken." });
    }

    console.error("updateProfile error:", error);
    res
      .status(500)
      .json({ success: false, message: "Could not update your profile." });
  }
};

// PATCH /api/settings/password  { currentPassword, newPassword }
// NOTE: a wrong current password returns 400 (not 401) on purpose, so it can
// never be mistaken for an expired login.
const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword ?? "");
    const newPassword = String(req.body.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Enter your current password and a new one.",
      });
    }

    const user = await UserModel.findById(req.user.id).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "Your account signs in with Google, so there is no password to change.",
      });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res
        .status(400)
        .json({ success: false, message: "Your current password is incorrect." });
    }

    if (!PASSWORD_RULE.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include an uppercase letter, a number and a special character (@$!%*?&).",
      });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({
        success: false,
        message: "Your new password must be different from the current one.",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updateOne({ _id: user._id }, { $set: { password: hashed } });

    res.status(200).json({ success: true, message: "Password updated." });
  } catch (error) {
    console.error("changePassword error:", error);
    res
      .status(500)
      .json({ success: false, message: "Could not update your password." });
  }
};

module.exports = { getAccount, updateProfile, changePassword };
