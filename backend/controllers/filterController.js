const Filter = require("../models/filterModel");

exports.filters = async (req, res) => {
  try {
    const filters = await Filter.find();
    console.log("Fetched filters:", filters); // ← add this
    res.json(filters);
  } catch (err) {
    console.error("GET /filters error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
