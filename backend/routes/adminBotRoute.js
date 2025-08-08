const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const BotEntry = require("../models/botEntryModel");

// Helper: split multi-word keywords into single words, lowercase and trim
function processKeywords(keywords) {
  if (!keywords || !Array.isArray(keywords)) return [];
  return keywords
    .flatMap((k) => k.split(/\s+/)) // split multi-word keywords
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

// GET all entries
router.get("/", async (req, res) => {
  try {
    const entries = await BotEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new info entry
router.post("/", async (req, res) => {
  const { info_en, info_fil, keywords } = req.body;

  if (!info_en) {
    return res
      .status(400)
      .json({ message: "English info paragraph is required" });
  }

  try {
    const newEntry = new BotEntry({
      info_en: info_en.trim(),
      info_fil: info_fil ? info_fil.trim() : "",
      keywords: Array.isArray(keywords) ? keywords.map((k) => k.trim()) : [],
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update entry
router.put("/:id", async (req, res) => {
  const { info_en, info_fil, keywords } = req.body;
  try {
    const entry = await BotEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    if (info_en) entry.info_en = info_en.trim();
    if (info_fil) entry.info_fil = info_fil.trim();
    if (keywords) entry.keywords = processKeywords(keywords);

    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE entry
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const entry = await BotEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await BotEntry.deleteOne({ _id: id });
    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("Error deleting entry:", err); // Log actual error to console
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
