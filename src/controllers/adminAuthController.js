const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const parseDuration = require("../utils/parseDuration");
const { sanitizeAdmin } = require("../utils/sanitize");

function setAdminCookie(res, token) {
  res.cookie(process.env.ADMIN_JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SECURE === "true" ? "none" : "lax",
    maxAge: parseDuration(process.env.JWT_EXPIRES_IN),
  });
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const admin = await Admin.findOne({ email: normalizedEmail }).select("+password");
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (admin.status === "DISABLED") {
      return res.status(403).json({ message: "Your administrator account has been disabled." });
    }

    const token = generateToken({ id: admin._id, kind: "admin" });
    setAdminCookie(res, token);

    res.json({ user: sanitizeAdmin(admin), token, accessToken: token });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ user: sanitizeAdmin(req.admin) });
};

exports.logout = async (req, res) => {
  res.clearCookie(process.env.ADMIN_JWT_COOKIE_NAME);
  res.json({ message: "Logged out." });
};
