const express = require("express");
const {
  listUsers,
  getUser,
  createAccount,
  updateAccount,
  setAccountStatus,
  deleteAccount,
} = require("../controllers/adminUserController");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(protectAdmin);
router.get("/", listUsers);
router.post("/", createAccount);
router.get("/:id", getUser);
router.put("/:id", updateAccount);
router.patch("/:id/disable", setAccountStatus("DISABLED"));
router.patch("/:id/enable", setAccountStatus("ACTIVE"));
router.delete("/:id", deleteAccount);

module.exports = router;
