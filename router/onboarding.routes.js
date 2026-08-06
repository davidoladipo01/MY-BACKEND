const express = require("express")
const upload = require("../middleware/upload")
const verifyUser = require("../middleware/verifyUser");
const { completeOnboarding } = require("../controller/User.controller");
const router = express.Router();

router.patch("/onboard", verifyUser, upload.single("avatar"), completeOnboarding )

module.exports = router;