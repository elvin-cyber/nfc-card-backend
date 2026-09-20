const crypto = require("crypto");

// Generate a unique NFC card token
function generateCardToken() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

// Generate a human-readable card ID
function generateCardId() {
  return `NFC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

// Generate the public frontend URL
function buildPublicUrl(token) {
  const baseUrl = "https://nfc-card-frontend-two.vercel.app";

  if (!token) {
    throw new Error("Card token is required to generate public URL");
  }

  return `${baseUrl}/c/${token}`;
}

// Generate temporary password
function generateTempPassword() {
  return crypto.randomBytes(6).toString("base64url");
}

module.exports = {
  generateCardToken,
  generateCardId,
  buildPublicUrl,
  generateTempPassword,
};