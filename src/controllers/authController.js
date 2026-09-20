const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const parseDuration = require("../utils/parseDuration");
const { sanitizeUser } = require("../utils/sanitize");

function setUserCookie(res, token) {
  res.cookie(process.env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SECURE === "true" ? "none" : "lax",
    maxAge: parseDuration(process.env.JWT_EXPIRES_IN),
  });
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email: normalizedEmail, password });
    const token = generateToken({ id: user._id, kind: "user" });
    setUserCookie(res, token);

    res.status(201).json({ user: sanitizeUser(user), token, accessToken: token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (user.status === "DISABLED") {
      return res.status(403).json({ message: "Your account has been disabled by an administrator." });
    }

    const token = generateToken({ id: user._id, kind: "user" });
    setUserCookie(res, token);

    res.json({ user: sanitizeUser(user), token, accessToken: token });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

exports.logout = async (req, res) => {
  res.clearCookie(process.env.JWT_COOKIE_NAME);
  res.json({ message: "Logged out." });
};
