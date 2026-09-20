const User = require("../models/User");
const { sanitizeUser } = require("../utils/sanitize");

exports.getProfile = async (req, res) => {
  const user = req.user;
  // Existing accounts have their old single profile stored in `profile`.
  // Expose it as Personal until the user saves a dedicated Personal/Office profile.
  const legacy = user.profile ? user.profile.toObject() : {};
  const personal = user.personalProfile && Object.keys(user.personalProfile.toObject()).some(k => user.personalProfile[k])
    ? user.personalProfile.toObject()
    : legacy;
  const office = user.officeProfile ? user.officeProfile.toObject() : {};

  const safe = sanitizeUser(user);
  safe.personalProfile = personal;
  safe.officeProfile = office;
  // Keep profile pointing at Personal for older frontend/admin consumers.
  safe.profile = personal;
  res.json({ user: safe });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      profileType = "PERSONAL",
      fullName,
      email,
      jobTitle,
      company,
      phone,
      whatsapp,
      linkedin,
      website,
      bio,
      photo,
      coverPhoto,
      resume,
      resumeName,
    } = req.body || {};

    if (!["PERSONAL", "OFFICE"].includes(profileType)) {
      return res.status(400).json({ message: "Invalid profile type." });
    }

    if (fullName !== undefined && profileType === "PERSONAL") user.name = fullName;

    if (email !== undefined && profileType === "PERSONAL" && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (exists) return res.status(409).json({ message: "This email is already in use." });
      user.email = normalizedEmail;
    }

    const key = profileType === "OFFICE" ? "officeProfile" : "personalProfile";
    const current = user[key] ? user[key].toObject() : {};
    const nextProfile = { ...current };

    // Migrate the old single profile into Personal on the first Personal save.
    if (profileType === "PERSONAL" && !Object.values(current).some(Boolean)) {
      Object.assign(nextProfile, user.profile ? user.profile.toObject() : {});
    }

    const assignIfDefined = (name, value) => {
      if (value !== undefined) nextProfile[name] = value;
    };

    if (profileType === "OFFICE") {
      assignIfDefined("fullName", fullName);
      assignIfDefined("email", email);
    }

    assignIfDefined("jobTitle", jobTitle);
    assignIfDefined("company", company);
    assignIfDefined("phone", phone);
    assignIfDefined("whatsapp", whatsapp);
    assignIfDefined("linkedin", linkedin);
    assignIfDefined("website", website);
    assignIfDefined("bio", bio);
    assignIfDefined("photo", photo);
    assignIfDefined("coverPhoto", coverPhoto);
    assignIfDefined("resume", resume);
    assignIfDefined("resumeName", resumeName);

    user[key] = nextProfile;
    if (profileType === "PERSONAL") user.profile = nextProfile;

    await user.save();

    const safe = sanitizeUser(user);
    safe.personalProfile = user.personalProfile?.toObject?.() || {};
    safe.officeProfile = user.officeProfile?.toObject?.() || {};
    safe.profile = safe.personalProfile;

    res.json({ user: safe });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
};
