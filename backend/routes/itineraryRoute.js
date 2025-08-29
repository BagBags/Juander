// routes/itineraryRoute.js
const express = require("express");
const router = express.Router();
const Itinerary = require("../models/itineraryModel"); // make sure filename matches

// CREATE a new itinerary
router.post("/", async (req, res) => {
  try {
    const { name, description, imageUrl, sites } = req.body;
    const itinerary = new Itinerary({ name, description, imageUrl, sites });
    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all itineraries with populated sites
router.get("/", async (req, res) => {
  try {
    const itineraries = await Itinerary.find().populate("sites");
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ a single itinerary by ID
router.get("/:id", async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate("sites"); // <-- This is key!
    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }
    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE an itinerary by ID
router.put("/:id", async (req, res) => {
  try {
    const { name, description, imageUrl, sites } = req.body;
    const updated = await Itinerary.findByIdAndUpdate(
      req.params.id,
      { name, description, imageUrl, sites },
      { new: true }
    ).populate("sites");

    if (!updated) return res.status(404).json({ error: "Itinerary not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an itinerary by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Itinerary.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Itinerary not found" });
    res.json({ message: "Itinerary deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
