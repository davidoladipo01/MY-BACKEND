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
        req.user = decoded.id;
        next();
      }
    });
  } catch (err) {
    console.error();
  }
};

module.exports= verifyUser;
