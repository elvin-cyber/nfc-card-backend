const Card = require("../models/Card");

exports.getPublicCard = async (req, res, next) => {
  try {
    const { token } = req.params;
    const card = await Card.findOne({ token }).populate("owner");

    if (!card || !card.provisioned || !card.owner) {
      return res.status(404).json({ message: "This NFC profile could not be found." });
    }

    const ownerDisabled = card.owner.status === "DISABLED";
    const adminLocked = card.adminDisabled || card.status === "ADMIN_DISABLED";
    const userDisabled = card.status === "DISABLED";
    const unavailable = card.deleted || ownerDisabled || adminLocked || userDisabled;

    // IMPORTANT: all user/card data stays in the database regardless of status, but a
    // revoked or disabled card must never have its personal data rendered publicly.
    if (unavailable) {
      return res.json({
        profile: {
          status: adminLocked || ownerDisabled ? "ADMIN_DISABLED" : "DISABLED",
          adminDisabled: Boolean(adminLocked || ownerDisabled),
        },
      });
    }

    const p = card.cardType === "COMPANY"
      ? (card.owner.officeProfile || card.owner.profile || {})
      : (card.owner.personalProfile || card.owner.profile || {});
    res.json({
      profile: {
        name: card.cardType === "COMPANY" ? (p.fullName || card.owner.name) : card.owner.name,
        title: p.jobTitle || "",
        company: p.company || "",
        bio: p.bio || "",
        phone: p.phone || "",
        email: card.cardType === "COMPANY" ? (p.email || card.owner.email || "") : (card.owner.email || ""),
        whatsapp: p.whatsapp || "",
        linkedin: p.linkedin || "",
        website: p.website || "",
        photo: p.photo || p.photoUrl || "",
        coverPhoto: p.coverPhoto || p.coverPhotoUrl || "",
        resume: p.resume || "",
        resumeName: p.resumeName || "",
        cardType: card.cardType,
        cardId: card.cardId || "",
        status: "ACTIVE",
      },
    });
  } catch (err) {
    next(err);
  }
};
