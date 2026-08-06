const express = require("express");
const { seedFeaturedBooks } = require("../controller/FeaturedBooks.controller");

const router = express.Router();

router.post("/seed", seedFeaturedBooks);

module.exports = router