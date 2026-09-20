const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

function getToken(req, cookieName) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return req.cookies ? req.cookies[cookieName] : undefined;
}

async function protectUser(req, res, next) {
  try {
    const token = getToken(req, process.env.JWT_COOKIE_NAME);
    if (!token) return res.status(401).json({ message: "Not authenticated." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.kind !== "user") return res.status(401).json({ message: "Not authenticated." });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Not authenticated." });
    if (user.status === "DISABLED") {
      return res.status(403).json({ message: "Your account has been disabled by an administrator." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authenticated." });
  }
}

async function protectAdmin(req, res, next) {
  try {
    const token = getToken(req, process.env.ADMIN_JWT_COOKIE_NAME);
    if (!token) return res.status(401).json({ message: "Not authenticated." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.kind !== "admin") return res.status(401).json({ message: "Not authenticated." });

    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Not authenticated." });
    if (admin.status === "DISABLED") {
      return res.status(403).json({ message: "Your administrator account has been disabled." });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authenticated." });
  }
}

function requireMainAdmin(req, res, next) {
  if (!req.admin || !["SUPER_ADMIN", "MAIN_ADMIN"].includes(req.admin.role)) {
    return res.status(403).json({ message: "Only a main administrator can perform this action." });
  }
  next();
}

module.exports = { protectUser, protectAdmin, requireMainAdmin };
