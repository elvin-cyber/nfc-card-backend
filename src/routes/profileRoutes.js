const express = require("express");
const { getProfile, updateProfile, changePassword } = require("../controllers/profileController");
const { protectUser } = require("../middleware/auth");

const router = express.Router();

router.use(protectUser);
router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/password", changePassword);

module.exports = router;
