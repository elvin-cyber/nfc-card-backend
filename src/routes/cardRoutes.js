const express = require("express");
const {
  getCards,
  createCard,
  updateCard,
  enableCard,
  disableCard,
  deleteCard,
} = require("../controllers/cardController");
const { protectUser } = require("../middleware/auth");

const router = express.Router();

router.use(protectUser);
router.get("/", getCards);
router.post("/", createCard);
router.put("/:id", updateCard);
router.patch("/:id/enable", enableCard);
router.patch("/:id/disable", disableCard);
router.delete("/:id", deleteCard);

module.exports = router;
