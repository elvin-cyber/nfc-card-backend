const crypto = require("crypto");

// Public NFC token, e.g. "19DA73AEA06E5F08" - 16 uppercase hex characters.
function generateCardToken() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

// A shorter, human-friendly identifier assigned to every card at creation time,
// shown to the user as "Unique card ID" before the admin provisions the public URL.
function generateCardId() {
  return `NFC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function buildPublicUrl(token) {
  const base = (process.env.PUBLIC_APP_URL || process.env.CLIENT_ORIGIN || "").replace(/\/$/, "");
  return `${base}/c/${token}`;
}

function generateTempPassword() {
  return crypto.randomBytes(6).toString("base64url");
}

module.exports = { generateCardToken, generateCardId, buildPublicUrl, generateTempPassword };
