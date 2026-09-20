const express = require("express");
const {
  listCards,
  issueCard,
  updateCard,
  setAdminLock,
  deleteCard,
} = require("../controllers/adminCardController");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(protectAdmin);
router.get("/", listCards);
router.post("/", issueCard);
router.put("/:id", updateCard);
router.patch("/:id/disable", setAdminLock(true));
router.patch("/:id/enable", setAdminLock(false));
router.delete("/:id", deleteCard);

module.exports = router;
