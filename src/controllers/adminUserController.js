const User = require("../models/User");
const Admin = require("../models/Admin");
const Card = require("../models/Card");
const { sanitizeUser } = require("../utils/sanitize");
const { generateTempPassword } = require("../utils/cardToken");

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "MAIN_ADMIN"];

async function findAccount(id) {
  const admin = await Admin.findById(id).catch(() => null);
  if (admin) return { type: "admin", doc: admin };
  const user = await User.findById(id).catch(() => null);
  if (user) return { type: "user", doc: user };
  return null;
}

function serializeAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    cards: 0,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

// GET /api/admin/users - combined list of user accounts and administrator accounts.
exports.listUsers = async (req, res, next) => {
  try {
    const [users, admins, cards] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Admin.find().sort({ createdAt: -1 }),
      Card.find({ deleted: { $ne: true } }, "owner"),
    ]);

    const cardCountByOwner = {};
    cards.forEach((c) => {
      const key = String(c.owner);
      cardCountByOwner[key] = (cardCountByOwner[key] || 0) + 1;
    });

    const userList = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: "USER",
      status: u.status,
      cards: cardCountByOwner[String(u._id)] || 0,
      profile: u.profile,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    const adminList = admins.map(serializeAdmin);

    res.json({ users: [...userList, ...adminList] });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const found = await findAccount(req.params.id);
    if (!found) return res.status(404).json({ message: "Account not found." });

    if (found.type === "admin") {
      return res.json({ user: serializeAdmin(found.doc) });
    }

    const cardsCount = await Card.countDocuments({ owner: found.doc._id, deleted: { $ne: true } });
    res.json({ user: { ...sanitizeUser(found.doc), cards: cardsCount } });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/users - creates a normal user account, or (with a role field
// and sufficient privilege) a new administrator account.
exports.createAccount = async (req, res, next) => {
  try {
    const { name, email, role } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }
    const normalizedEmail = String(email).toLowerCase().trim();

    if (role && ADMIN_ROLES.includes(role)) {
      if (!["SUPER_ADMIN", "MAIN_ADMIN"].includes(req.admin.role)) {
        return res.status(403).json({ message: "Only a main administrator can create administrator accounts." });
      }
      const exists = await Admin.findOne({ email: normalizedEmail });
      if (exists) return res.status(409).json({ message: "An administrator with this email already exists." });

      const temporaryPassword = generateTempPassword();
      const admin = await Admin.create({ name, email: normalizedEmail, password: temporaryPassword, role });
      return res.status(201).json({ user: serializeAdmin(admin), temporaryPassword });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(409).json({ message: "A user with this email already exists." });

    const temporaryPassword = generateTempPassword();
    const user = await User.create({ name, email: normalizedEmail, password: temporaryPassword });
    res.status(201).json({ user: sanitizeUser(user), temporaryPassword });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id
exports.updateAccount = async (req, res, next) => {
  try {
    const found = await findAccount(req.params.id);
    if (!found) return res.status(404).json({ message: "Account not found." });

    if (found.type === "admin") {
      if (!["SUPER_ADMIN", "MAIN_ADMIN"].includes(req.admin.role)) {
        return res.status(403).json({ message: "Only a main administrator can update administrator accounts." });
      }
      const { name, email, role, status } = req.body || {};
      if (name !== undefined) found.doc.name = name;
      if (email !== undefined) found.doc.email = String(email).toLowerCase().trim();
      if (role !== undefined) found.doc.role = role;
      if (status !== undefined) found.doc.status = status;
      await found.doc.save();
      return res.json({ user: serializeAdmin(found.doc) });
    }

    const { name, email, status, profile, personalProfile, officeProfile, profileType } = req.body || {};
    const user = found.doc;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = String(email).toLowerCase().trim();
    if (status !== undefined) user.status = status;

    // New admin editor supports independent Personal and Office profiles.
    // Legacy `profile` payloads still update Personal for backwards compatibility.
    const mergeProfile = (target, patch) => {
      if (!patch || typeof patch !== "object") return target;
      return { ...(target?.toObject ? target.toObject() : (target || {})), ...patch };
    };
    if (personalProfile && typeof personalProfile === "object") {
      user.personalProfile = mergeProfile(user.personalProfile, personalProfile);
      user.profile = mergeProfile(user.profile, personalProfile);
    } else if (profileType === "PERSONAL" && profile && typeof profile === "object") {
      user.personalProfile = mergeProfile(user.personalProfile, profile);
      user.profile = mergeProfile(user.profile, profile);
    } else if (profile && typeof profile === "object") {
      user.personalProfile = mergeProfile(user.personalProfile, profile);
      user.profile = mergeProfile(user.profile, profile);
    }
    if (officeProfile && typeof officeProfile === "object") {
      user.officeProfile = mergeProfile(user.officeProfile, officeProfile);
    } else if (profileType === "OFFICE" && profile && typeof profile === "object") {
      user.officeProfile = mergeProfile(user.officeProfile, profile);
    }

    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/disable and /enable
exports.setAccountStatus = (status) => async (req, res, next) => {
  try {
    const found = await findAccount(req.params.id);
    if (!found) return res.status(404).json({ message: "Account not found." });

    if (found.type === "admin" && !["SUPER_ADMIN", "MAIN_ADMIN"].includes(req.admin.role)) {
      return res.status(403).json({ message: "Only a main administrator can change administrator status." });
    }

    found.doc.status = status;
    await found.doc.save();

    res.json({
      user: found.type === "admin" ? serializeAdmin(found.doc) : sanitizeUser(found.doc),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
exports.deleteAccount = async (req, res, next) => {
  try {
    if (String(req.admin._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot delete the administrator account you are currently using." });
    }

    const found = await findAccount(req.params.id);
    if (!found) return res.status(404).json({ message: "Account not found." });

    if (found.type === "admin") {
      if (!["SUPER_ADMIN", "MAIN_ADMIN"].includes(req.admin.role)) {
        return res.status(403).json({ message: "Only a main administrator can delete administrator accounts." });
      }
      await Admin.deleteOne({ _id: found.doc._id });
      return res.json({ message: "Administrator deleted." });
    }

    await User.deleteOne({ _id: found.doc._id });
    res.json({ message: "User deleted." });
  } catch (err) {
    next(err);
  }
};
