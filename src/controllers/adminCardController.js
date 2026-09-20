const Card = require("../models/Card");
const { generateCardToken, buildPublicUrl } = require("../utils/cardToken");

function serializeCard(cardDoc) {
  const obj = cardDoc.toObject();
  if (obj.owner && obj.owner.name !== undefined) {
    obj.owner = {
      _id: obj.owner._id,
      id: obj.owner._id,
      name: obj.owner.name,
      email: obj.owner.email,
      status: obj.owner.status,
    };
  }
  return obj;
}

// GET /api/admin/cards - includes soft-deleted cards so deletions remain visible
// to admins as an audit trail, per the frontend contract.
exports.listCards = async (req, res, next) => {
  try {
    const cards = await Card.find({ deleted: { $ne: true } }).populate("owner", "name email status").sort({ createdAt: -1 });
    res.json({ cards: cards.map(serializeCard) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/cards - provisions the public NFC URL for an existing,
// unprovisioned card that a user has already requested.
exports.issueCard = async (req, res, next) => {
  try {
    const { userId, cardId, cardType, label } = req.body || {};
    if (!userId || !cardId) {
      return res.status(400).json({ message: "A user and card must be selected." });
    }

    const card = await Card.findOne({ _id: cardId, owner: userId, deleted: { $ne: true } });
    if (!card) return res.status(404).json({ message: "Selected card was not found for this user." });
    if (card.provisioned) return res.status(409).json({ message: "This card has already been provisioned." });
    if (cardType && card.cardType !== cardType) {
      return res.status(400).json({ message: "Card type does not match the selected card." });
    }

    if (label) card.label = label;
    card.token = generateCardToken();
    card.provisioned = true;
    card.publicUrl = buildPublicUrl(card.token);
    if (card.status === "DELETED") card.status = "ACTIVE";

    await card.save();
    await card.populate("owner", "name email status");

    res.status(201).json({ card: serializeCard(card) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/cards/:id
exports.updateCard = async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, deleted: { $ne: true } });
    if (!card) return res.status(404).json({ message: "Card not found." });

    const { label, cardType } = req.body || {};
    if (label !== undefined) card.label = label;
    if (cardType !== undefined) card.cardType = cardType;

    await card.save();
    await card.populate("owner", "name email status");
    res.json({ card: serializeCard(card) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/cards/:id/disable and /enable - administrator lock. A regular
// user cannot override this; only another admin action can lift it.
exports.setAdminLock = (locked) => async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, deleted: { $ne: true } });
    if (!card) return res.status(404).json({ message: "Card not found." });

    card.adminDisabled = locked;
    card.status = locked ? "ADMIN_DISABLED" : "ACTIVE";

    await card.save();
    await card.populate("owner", "name email status");
    res.json({ card: serializeCard(card) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/cards/:id - soft delete, preserving the audit trail.
exports.deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id });
    if (!card) return res.status(404).json({ message: "Card not found." });

    card.deleted = true;
    card.deletedAt = new Date();
    card.status = "DELETED";
    await card.save();

    res.json({ message: "Card deleted." });
  } catch (err) {
    next(err);
  }
};
