const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    profilePicture: {
      type: String, // URL to the uploaded image
    },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
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
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String, unique: true, sparse: true }, // stores Google "sub"
    profileCompleted: {
      type: Boolean,
      default: false, // New users need to complete profile
    },
    hideFortSantiagoModal: {
      type: Boolean,
      default: false, // Show Fort Santiago modal by default
    },
    hasCompletedTour: {
      type: Boolean,
      default: false, // New users need to see the onboarding tour
    },
    tourCompletedAt: {
      type: Date,
      default: null, // Timestamp when tour was completed
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
