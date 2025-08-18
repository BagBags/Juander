const { GoogleLogin } = require("@react-oauth/google");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const User = require("../models/userModel");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await argon2.hash(password);

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpires,
      isVerified: false, // Add this to your User model
    });

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Juander" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    });

    res.status(201).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
      userId: newUser._id,
    });
  } catch (err) {
    console.error("Register error:", err);
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Sending OTP to:", email); // debug log

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Juander" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "OTP for Password Reset",
      text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
    });

    console.log("Email sent:", info.response); // debug log
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err); // full error
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await argon2.hash(newPassword);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Password reset failed", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// GoogleLogin
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    let user = await User.findOne({ email });

    const isSuperAdmin = email === "aaronbagain@gmail.com";

    if (!user) {
      user = await User.create({
        firstName: firstName || "",
        lastName: lastName || "",
        email,
        password: await argon2.hash(googleId),
        role: isSuperAdmin ? "admin" : "tourist",
      });
    } else if (isSuperAdmin && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res
      .status(401)
      .json({ message: "Google login failed", error: err.message });
  }
};

// OTP verify
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "Email already verified" });

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
};
