const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  adminName: { type: String, required: true },
  action: { type: String, required: true },
  role: { type: String, enum: ["admin", "tourist"], default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", logSchema);
