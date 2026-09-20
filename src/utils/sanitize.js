function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  const obj = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  delete obj.__v;
  return {
    ...obj,
    id: obj._id,
    role: "USER",
  };
}

function sanitizeAdmin(adminDoc) {
  if (!adminDoc) return null;
  const obj = typeof adminDoc.toObject === "function" ? adminDoc.toObject() : { ...adminDoc };
  delete obj.password;
  delete obj.__v;
  return {
    ...obj,
    id: obj._id,
  };
}

module.exports = { sanitizeUser, sanitizeAdmin };
