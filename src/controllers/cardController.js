const Card = require("../models/Card");
const { generateCardId } = require("../utils/cardToken");

const MAX_CARDS = 2;

exports.getCards = async (req, res, next) => {
  try {
    const cards = await Card.find({ owner: req.user._id, deleted: { $ne: true } }).sort({ createdAt: 1 });
    res.json({ cards });
  } catch (err) {
    next(err);
  }
};

exports.createCard = async (req, res, next) => {
  try {
    const { label, cardType } = req.body || {};
    if (!["PERSONAL", "COMPANY"].includes(cardType)) {
      return res.status(400).json({ message: "Invalid card type." });
    }

    const existingCards = await Card.find({ owner: req.user._id, deleted: { $ne: true } });
    if (existingCards.length >= MAX_CARDS) {
      return res.status(409).json({ message: "You can have a maximum of two cards: Personal and Office." });
    }
    if (existingCards.some((c) => c.cardType === cardType)) {
      return res.status(409).json({ message: `Your ${cardType.toLowerCase()} card already exists.` });
    }

    const card = await Card.create({
      owner: req.user._id,
      label: label || `${cardType === "PERSONAL" ? "Personal" : "Office"} NFC card`,
      cardType,
      cardId: generateCardId(),
      status: "ACTIVE",
    });

    res.status(201).json({ card });
  } catch (err) {
    next(err);
  }
};

exports.updateCard = async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, owner: req.user._id, deleted: { $ne: true } });
    if (!card) return res.status(404).json({ message: "Card not found." });

    if (req.body?.label !== undefined) card.label = req.body.label;
    await card.save();
    res.json({ card });
  } catch (err) {
    next(err);
  }
};

exports.enableCard = async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, owner: req.user._id, deleted: { $ne: true } });
    if (!card) return res.status(404).json({ message: "Card not found." });

    if (card.adminDisabled || card.status === "ADMIN_DISABLED") {
      return res.status(403).json({
        message: "This card was deactivated by an administrator. Only an administrator can reactivate it.",
      });
    }

    card.status = "ACTIVE";
    await card.save();
    res.json({ card });
  } catch (err) {
    next(err);
  }
};

exports.disableCard = async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, owner: req.user._id, deleted: { $ne: true } });
    if (!card) return res.status(404).json({ message: "Card not found." });

    card.status = "DISABLED";
    await card.save();
    res.json({ card });
  } catch (err) {
    next(err);
  }
};

exports.deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, owner: req.user._id, deleted: { $ne: true } });
    if (!card) return res.status(404).json({ message: "Card not found." });

    // Soft delete so the record (and its admin-provisioning history) survives for
    // the admin audit trail, per the frontend contract, without being restored to the user.
    card.deleted = true;
    card.deletedAt = new Date();
    await card.save();

    res.json({ message: "Card deleted." });
  } catch (err) {
    next(err);
  }
};
