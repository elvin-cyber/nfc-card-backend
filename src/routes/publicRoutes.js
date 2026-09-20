const express = require("express");
const { getPublicCard } = require("../controllers/publicController");

const router = express.Router();

router.get("/:token", getPublicCard);

module.exports = router;
