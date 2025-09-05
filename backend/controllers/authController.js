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
      role: "tourist",
      otp,
      otpExpires,
      isVerified: false, // Add this to your User model
      authProvider: "local",
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

// For logged-in users changing email
exports.sendEmailVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if the email is already used by another user
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    exports.verifyEmailOtp = async (req, res) => {
      try {
        const { otp } = req.body;
        const userId = req.user.id; // comes from verifyToken middleware

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (
          user.otp !== otp ||
          !user.otpExpires ||
          user.otpExpires < new Date()
        ) {
          return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // If you also want to update the email at this point:
        if (req.body.newEmail) user.email = req.body.newEmail;

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ message: "Verification failed", error: err.message });
      }
    };

    exports.verifyEmailOtp = async (req, res) => {
      try {
        const { otp } = req.body;
        const userId = req.user.id; // comes from verifyToken middleware

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (
          user.otp !== otp ||
          !user.otpExpires ||
          user.otpExpires < new Date()
        ) {
          return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // If you also want to update the email at this point:
        if (req.body.newEmail) user.email = req.body.newEmail;

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ message: "Verification failed", error: err.message });
      }
    };

    // Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Juander" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Verify your new email",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email verification OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id; // comes from verifyToken middleware

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // If you also want to update the email at this point:
    if (req.body.newEmail) user.email = req.body.newEmail;

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
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
        authProvider: user.authProvider,
        language: user.language || "en",
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
        authProvider: "google",
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
        authProvider: user.authProvider,
        language: user.language || "en",
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

// Save account info (firstName, lastName, email, password)
exports.saveAccount = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;

    if (email) {
      // 🔎 Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
    }

    if (password) {
      updates.password = await argon2.hash(password);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      select: "-password -otp -otpExpires",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Account updated successfully", user });
  } catch (err) {
    console.error("Error updating account:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Profile Pre-req Save Account Info
exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await argon2.hash(updates.password);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      select: "-password -otp -otpExpires",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Save Birthday
exports.saveBirthday = async (req, res) => {
  try {
    const { month, date, year } = req.body;

    if (!month || !date || !year) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert month string (e.g., "Jan") into a number
    const monthIndex = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].indexOf(month);

    if (monthIndex === -1) {
      return res.status(400).json({ message: "Invalid month" });
    }

    // Construct a Date object
    const birthday = new Date(year, monthIndex, date);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { birthday },
      { new: true, select: "-password -otp -otpExpires" }
    );

    res.json({ message: "Birthday updated successfully", user });
  } catch (err) {
    console.error("Error updating birthday:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Save Gender
exports.saveGender = async (req, res) => {
  try {
    const { gender } = req.body;
    const normalizedGender =
      gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { gender: normalizedGender },
      { new: true, select: "-password -otp -otpExpires" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error saving gender:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Save Country
exports.saveCountry = async (req, res) => {
  try {
    console.log("REQ.BODY:", req.body);
    console.log("REQ.USER:", req.user);

    const { country } = req.body;
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.country = country;
    await user.save();

    res.json({
      message: "Country updated successfully",
      country: user.country,
    });
  } catch (err) {
    console.error("SAVE COUNTRY ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Save language
exports.saveLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const userId = req.user.id;

    // Validate language input
    if (!["en", "tl"].includes(language)) {
      return res.status(400).json({ message: "Invalid language code" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { language }, // store "en" or "tl"
      { new: true, select: "-password -otp -otpExpires" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Language updated successfully",
      language: user.language,
    });
  } catch (err) {
    console.error("Error updating language:", err);
    res.status(500).json({ message: "Server error" });
  }
};
