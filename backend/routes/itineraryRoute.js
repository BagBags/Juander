// routes/itineraryRoute.js
const express = require("express");
const router = express.Router();
const Itinerary = require("../models/itineraryModel");

// Create
router.post("/", async (req, res) => {
  try {
    const { name, description, sites } = req.body;
    const itinerary = new Itinerary({ name, description, sites });
    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  const itineraries = await Itinerary.find().populate("sites");
  res.json(itineraries);
});

module.exports = router;
