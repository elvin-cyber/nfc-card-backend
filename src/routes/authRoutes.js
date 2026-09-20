const express = require("express");
const { signup, login, me, logout } = require("../controllers/authController");
const { protectUser } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protectUser, me);
router.post("/logout", protectUser, logout);

module.exports = router;
