const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String, // hashed
  otp: String,
  otpExpires: Date,
});

pendingUserSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PendingUser", pendingUserSchema);
