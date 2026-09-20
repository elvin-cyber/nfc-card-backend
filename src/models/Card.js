const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cardType: { type: String, enum: ["PERSONAL", "COMPANY"], required: true },
    label: { type: String, default: "" },
    cardId: { type: String, unique: true, sparse: true },
    token: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED", "ADMIN_DISABLED", "DELETED"],
      default: "ACTIVE",
    },
    provisioned: { type: Boolean, default: false },
    publicUrl: { type: String, default: "" },
    adminDisabled: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);
