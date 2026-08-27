const express = require("express");
const jwt = require("jsonwebtoken");

const verifyUser = async (req, res, next) => {

  const authHeader = req.headers.authorization;

if (!authHeader) {
    return res.status(401).json({
        success: false,
        message: "No token provided."
    });
}


const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;
  try {
    jwt.verify(token, process.env.AUTH_SECRET, function (err, decoded) {
      if (err) {
        return res.status(401).send({ message: "Unauthorized user" });
      } else {
        console.log(decoded);
        // Attach a user object with both `id` and `_id` to support
        // handlers that expect either `req.user`, `req.user.id` or `req.user._id`.
        req.user = { id: decoded.id, _id: decoded.id };
        next();
      }
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports= verifyUser;
