const mongoose = require("mongoose");

const pinSchema = new mongoose.Schema(
  {
    siteName: { type: String, required: true },
    siteDescription: { type: String }, // English description
    siteDescriptionTagalog: { type: String }, // Tagalog description
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    mediaFiles: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
      },
    ],
    arEnabled: { type: Boolean, default: false },
    arLink: { type: String },
    glbUrl: { type: String },
    facadeUrl: { type: String, default: "" },
    feeType: { 
      type: String, 
      enum: ["none", "fort_santiago", "custom_fee"], 
      default: "none" 
    },
    feeAmount: { type: Number, default: null },
    feeAmountDiscounted: { type: Number, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    inactiveReason: { 
      type: String, 
      enum: ["under_construction", "temporarily_closed", "maintenance", "no_longer_exists", "restricted_access", "safety_concerns", "other"],
      default: null 
    },
    inactiveReasonDetails: { type: String, default: "" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pin", pinSchema);
