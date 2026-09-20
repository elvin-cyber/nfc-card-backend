// Converts a short duration string like "7d", "12h", "30m", "45s" to milliseconds.
// Falls back to 7 days if the input can't be parsed.
function parseDuration(input, fallbackMs = 7 * 24 * 60 * 60 * 1000) {
  if (!input || typeof input !== "string") return fallbackMs;
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) return fallbackMs;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * multipliers[unit];
}

module.exports = parseDuration;
