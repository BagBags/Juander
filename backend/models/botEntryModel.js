const mongoose = require("mongoose");

const BotEntrySchema = new mongoose.Schema({
  info_en: { type: String, required: true, trim: true }, // long informative paragraph
  info_fil: { type: String, trim: true }, // optional Filipino version
  keywords: [{ type: String, trim: true }], // keywords or tags
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BotEntry", BotEntrySchema);
