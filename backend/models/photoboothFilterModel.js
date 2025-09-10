const mongoose = require("mongoose");

const photoboothFilterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // URL or local path
      required: true,
    },
    category: {
      type: String,
      enum: ["general", "head", "eyes", "frame"],
      default: "general",
    },
    position: {
      type: Number,
      default: 0, // used for ordering
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhotoboothFilter", photoboothFilterSchema);
