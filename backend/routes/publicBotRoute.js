const express = require("express");
const router = express.Router();
const BotEntry = require("../models/botEntryModel");

// Public: GET all chatbot entries
router.get("/", async (req, res) => {
  try {
    const entries = await BotEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
