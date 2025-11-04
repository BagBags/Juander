const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Log = require("../models/logModel");
const BotEntry = require("../models/botEntryModel");

// Helper: get admin name
function getAdminName(req) {
  return req.user
    ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
    : "Unknown Admin";
}

// Helper: normalize keywords
function processKeywords(keywords) {
  if (!keywords || !Array.isArray(keywords)) return [];
  return keywords
    .flatMap((k) => k.split(/\s+/))
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

// GET all entries (excluding archived, with tags populated)
router.get("/", async (req, res) => {
  try {
    const entries = await BotEntry.find({ isArchived: { $ne: true } })
      .populate("tags", "name")
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET archived entries
router.get("/archived", async (req, res) => {
  try {
    const entries = await BotEntry.find({ isArchived: true })
      .populate("tags", "name")
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new entry
router.post("/", async (req, res) => {
  const { info_en, info_fil, keywords, tags } = req.body;

  if (!info_en) {
    return res
      .status(400)
      .json({ message: "English info paragraph is required" });
  }

  try {
    const newEntry = new BotEntry({
      info_en: info_en.trim(),
      info_fil: info_fil ? info_fil.trim() : "",
      keywords: processKeywords(keywords),
      tags: Array.isArray(tags) ? tags : [], // expecting array of tag IDs
    });

    await newEntry.save();

    await Log.create({
      adminName: getAdminName(req),
      action: `Created chatbot entry with tags: ${newEntry.tags.join(", ")}`,
    });

    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update entry
router.put("/:id", async (req, res) => {
  const { info_en, info_fil, keywords, tags } = req.body;
  try {
    const entry = await BotEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    if (info_en) entry.info_en = info_en.trim();
    if (info_fil) entry.info_fil = info_fil.trim();
    if (keywords) entry.keywords = processKeywords(keywords);
    if (tags) entry.tags = Array.isArray(tags) ? tags : [];

    await entry.save();

    await Log.create({
      adminName: getAdminName(req),
      action: `Updated chatbot entry (ID: ${entry._id})`,
    });

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ARCHIVE entry
router.put("/:id/archive", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const entry = await BotEntry.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true }
    ).populate("tags", "name");

    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await Log.create({
      adminName: getAdminName(req),
      action: `Archived chatbot entry (ID: ${entry._id})`,
    });

    res.json(entry);
  } catch (err) {
    console.error("Error archiving entry:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESTORE entry
router.put("/:id/restore", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const entry = await BotEntry.findByIdAndUpdate(
      id,
      { isArchived: false },
      { new: true }
    ).populate("tags", "name");

    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await Log.create({
      adminName: getAdminName(req),
      action: `Restored chatbot entry (ID: ${entry._id})`,
    });

    res.json(entry);
  } catch (err) {
    console.error("Error restoring entry:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE entry (permanent)
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const entry = await BotEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await BotEntry.deleteOne({ _id: id });

    await Log.create({
      adminName: getAdminName(req),
      action: `Permanently deleted chatbot entry with keywords: ${entry.keywords.join(
        ", "
      )}`,
    });

    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("Error deleting entry:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
