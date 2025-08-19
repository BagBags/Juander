const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["guest", "tourist", "admin"],
      default: "tourist",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    country: { type: String },
    language: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
