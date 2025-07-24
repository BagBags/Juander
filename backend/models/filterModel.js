const mongoose = require("mongoose");

const filterSchema = new mongoose.Schema({
  label: { type: String, required: true },
  img_path: { type: String, required: true },
  category: { type: String, required: true },
});

module.exports = mongoose.model("Filter", filterSchema);
