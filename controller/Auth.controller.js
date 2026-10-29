const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserModel = require("../model/User.model");
const nodemailer = require("nodemailer");
const { welcomeEmail } = require("../utils/emailTemplates");
const { verifyToken, createClerkClient } = require("@clerk/backend");

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.APP_MAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const registerUser = async (req, res) => {
  const { firstName, lastName, userName, email, password } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const user = await UserModel.create({
      firstName,
      lastName,
      userName,
      email,
      password: hashedPassword,
    });

    let mailOptions = {
      from: process.env.APP_MAIL,
      to: [`${email}`, "davidoladipo2025@gmail.com"],
      subject: "Welcome to AfriReadCo",
      // html: welcomeEmail(firstName)
      text: `
        Welcome to AfriReadCo!

        Hi ${firstName},
        Thank you for joining our reading community.
        Happy Reading!
        The AfriReadCo Team
        `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.status(201).send({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).send({
      message: "User could not be created",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Account created via social login has no password hash
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "This account uses social sign-in. Please continue with Google.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    const token = await jwt.sign({ id: user._id }, process.env.AUTH_SECRET, {
      expiresIn: "2h",
    });

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const { password: dbpassword, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      success: true,
      message: "Login Successful",
      data: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------- Social login ----------

// Turns "David.Ola+test@gmail.com" into a valid, unique userName
// (3-16 chars, a-z 0-9 _ only - same rules as your Register form).

const generateUniqueUsername = async (seed) => {
  let base = String(seed || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 12);
  if (base.length < 3) base = "reader";

  let candidate = base;

  for (let i = 0; i < 5; i++) {
    const taken = await UserModel.exists({ userName: candidate });

    if (!taken) return candidate;

    candidate = `${base}${Math.floor(9000 * Math.random() + 1000)}`;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
};

const socialAuth = async (req, res) => {
  try {
    const { clerkToken } = req.body;

    if (!clerkToken) {
      return res
        .status(400)
        .json({ success: false, message: "missing Clerk Token" });
    }

    let payload;
    try {
      payload = await verifyToken(clerkToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    } catch (err) {
      console.error("Clerk verifyToken failed:", err.reason, "-", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
        reason: err.reason, // dev only, remove later
      });
    }

    if (!payload?.sub) {
      return res.status(401).json({ success: false, message: "Invalid Token" });
    }

    const clerkUser = await clerk.users.getUser(payload.sub);
    const emailObj =
      clerkUser.primaryEmailAddress || clerkUser.emailAddresses?.[0];
      const email = emailObj?.emailAddress?.toLowerCase();

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "No email address on this account" });
    }

    if (emailObj.verification?.status !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Your email address is not verified.",
      });
    }

    let isNewUser = false;

    let user = await UserModel.findOne({ clerkId: clerkUser.id });

    if (!user) {
      user = await UserModel.findOne({ email });
      if (user) {
        user.clerkId = clerkUser.id;
        if (!user.avatar && clerkUser.imageUrl)
          user.avatar = clerkUser.imageUrl;
        await user.save();
      }
      
    }
    

    if (!user) {
      const emalName = email.split("@")[0];

      user = await UserModel.create({
        firstName: clerkUser.firstName || clerkUser.username || emalName,
        lastName: clerkUser.lastName || "Reader",
        email,
        clerkId: clerkUser.id,
        userName: await generateUniqueUsername(clerkUser.username || emalName),
        avatar: clerkUser.imageUrl || null,
      });

      isNewUser = true;
    }

    const token = jwt.sign({ id: user._id }, process.env.AUTH_SECRET, {
      expiresIn: "2h",
    });

    const { password: _pw, ...userWithoutPassword } = user.toObject();

    return res.status(200).json({
      success: true,
      message: isNewUser ? "Account created" : "Login Successful",
      data: userWithoutPassword,
      token,
      isNewUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId =
      req.user && (req.user.id || req.user._id)
        ? req.user.id || req.user._id
        : req.user;
    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  socialAuth,
  logoutUser,
  getCurrentUser,
};
