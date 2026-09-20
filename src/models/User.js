const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const profileSchema = new mongoose.Schema(
  {
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    company: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    website: { type: String, default: "" },
    bio: { type: String, default: "" },
    photo: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },
    resume: { type: String, default: "" },
    resumeName: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    status: { type: String, enum: ["ACTIVE", "DISABLED"], default: "ACTIVE" },
    // Legacy profile is retained for backwards compatibility and is treated as the
    // Personal profile for existing accounts.
    profile: { type: profileSchema, default: () => ({}) },
    personalProfile: { type: profileSchema, default: () => ({}) },
    officeProfile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
