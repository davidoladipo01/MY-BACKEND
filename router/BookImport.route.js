const express = require("express");
const { importAfricanBooks } = require("../controller/BookImport.controller");

const router = express.Router();

router.post("/african-books", importAfricanBooks);

module.exports = router;