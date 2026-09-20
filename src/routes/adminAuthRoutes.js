const express = require("express");
const { login, me, logout } = require("../controllers/adminAuthController");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/login", login);
router.get("/me", protectAdmin, me);
router.post("/logout", protectAdmin, logout);

module.exports = router;
