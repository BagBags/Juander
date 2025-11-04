const mongoose = require("mongoose");

const BotEntrySchema = new mongoose.Schema({
  info_en: { type: String, required: true, trim: true }, // long informative paragraph
  info_fil: { type: String, trim: true }, // optional Filipino version
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  keywords: [{ type: String, trim: true }], // keywords or tags
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BotEntry", BotEntrySchema);
