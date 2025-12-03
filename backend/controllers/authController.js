const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const User = require("../models/userModel");
const Log = require("../models/logModel");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const PendingUser = require("../models/pendingUserModel"); // make sure you have this

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildEmailHtml = ({ title, message, otp, actionUrl, actionText }) => {
  const brand = "#f04e37";
  const brandLight = "#ff6b54";
  const logoUrl = "https://d39zx5gyblzxjs.cloudfront.net/Logo.svg";
  const safeAction = actionUrl || `${process.env.FRONTEND_URL || ""}/login`;
  const btnText = actionText || "Complete your registration";
  return `
  <div style="background:#ffffff;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;">
      <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(16,24,40,0.12);border:1px solid #f1f1f3">
        <div style="background:${brand};background-image:linear-gradient(135deg, ${brand}, ${brandLight});height:120px;display:flex;align-items:center;justify-content:center">
          <img src="${logoUrl}" alt="Juander" style="height:44px;display:block;margin:auto"/>
        </div>
        <div style="padding:24px;text-align:center">
          <h1 style="margin:0 0 8px;font-size:22px;color:#101828;letter-spacing:-0.2px">${title}</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#475467">${message}</p>
          ${otp ? `<div style="margin:18px 0;padding:14px 18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;display:inline-block">
            <div style="font-size:12px;color:#667085;letter-spacing:.6px;text-transform:uppercase">Your OTP</div>
            <div style="font-size:26px;font-weight:700;color:${brand};letter-spacing:2px">${otp}</div>
          </div>` : ""}
          <div style="margin-top:18px">
            <a href="${safeAction}" style="display:inline-block;background:${brand};color:#fff;text-decoration:none;border-radius:999px;padding:12px 20px;font-weight:700;box-shadow:0 1px 2px rgba(16,24,40,0.06)">${btnText}</a>
          </div>
        </div>
      </div>
      <div style="text-align:center;color:#98a2b3;font-size:12px;margin-top:16px">Juander · All rights reserved</div>
    </div>
  </div>`;
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const COOLDOWN_MS = parseInt(process.env.OTP_COOLDOWN_MS || "60000", 10);

    // Check if already exists in main User collection
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    // Also check PendingUser
    const pending = await PendingUser.findOne({ email });
    if (pending && pending.otpLastSent && Date.now() - new Date(pending.otpLastSent).getTime() < COOLDOWN_MS) {
      return res.status(429).json({ message: "Please wait before requesting another OTP." });
    }
    if (pending) await PendingUser.deleteOne({ email });

    const hashedPassword = await argon2.hash(password);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Save in PendingUser collection instead of User
    const newPendingUser = await PendingUser.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
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
      html: buildEmailHtml({
        title: "Thank you for your registration",
        message: "Use the OTP below to complete your registration. It expires in 10 minutes.",
        otp,
        actionUrl: `${process.env.FRONTEND_URL || ""}/login`,
        actionText: "Complete your registration",
      }),
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    });

    newPendingUser.otpLastSent = new Date();
    await newPendingUser.save();

    res.status(201).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
      pendingUserId: newPendingUser._id,
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
    const COOLDOWN_MS = parseInt(process.env.OTP_COOLDOWN_MS || "60000", 10);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if the email is already used by another user
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Rate-limit OTP sends
    if (user.otpLastSent && Date.now() - new Date(user.otpLastSent).getTime() < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSec}s before requesting another OTP.` });
    }

    // Generate and send OTP
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
      html: buildEmailHtml({
        title: "Verify your new email",
        message: "Use the OTP below to verify your new email. It expires in 10 minutes.",
        otp,
        actionUrl: `${process.env.FRONTEND_URL || ""}/login`,
        actionText: "Verify email",
      }),
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    });

    user.otpLastSent = new Date();
    await user.save();

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email verification OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};


exports.verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id; // comes from verifyToken middleware

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
    const COOLDOWN_MS = parseInt(process.env.OTP_COOLDOWN_MS || "60000", 10);

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Rate-limit OTP sends
    if (user.otpLastSent && Date.now() - new Date(user.otpLastSent).getTime() < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSec}s before requesting another OTP.` });
    }

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
      html: buildEmailHtml({
        title: "Reset your password",
        message: "Use the OTP below to reset your password. It expires in 10 minutes.",
        otp,
        actionUrl: `${process.env.FRONTEND_URL || ""}/login`,
        actionText: "Reset password",
      }),
      text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
    });

    console.log("Email sent:", info.response); // debug log
    user.otpLastSent = new Date();
    await user.save();
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err); // full error
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

exports.resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Resending signup OTP to:", email);
    const COOLDOWN_MS = parseInt(process.env.OTP_COOLDOWN_MS || "60000", 10);

    if (!email) return res.status(400).json({ message: "Email is required" });

    // Find user in PendingUser collection (signup process uses PendingUser)
    const user = await PendingUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: "No pending registration found for this email" 
      });
    }

    // Rate-limit OTP sends
    if (user.otpLastSent && Date.now() - new Date(user.otpLastSent).getTime() < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSec}s before requesting another OTP.` });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send email
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
      subject: "Verify Your Account",
      html: buildEmailHtml({
        title: "Verify your email",
        message: "Use the OTP below to continue. It expires in 10 minutes.",
        otp,
        actionUrl: `${process.env.FRONTEND_URL || ""}/login`,
        actionText: "Verify now",
      }),
      text: `Your verification OTP is ${otp}. It will expire in 10 minutes.`,
    });

    console.log("Resend OTP email sent:", info.response);
    user.otpLastSent = new Date();
    await user.save();
    res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend signup OTP error:", err);
    res.status(500).json({ 
      message: "Failed to resend OTP", 
      error: err.message 
    });
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
        profilePicture: user.profilePicture || null, // ✅ include profilePicture
        language: user.language || "en",
        profileCompleted: user.profileCompleted || false, // ✅ track profile completion
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
    const { email, name, picture, sub: googleId } = payload;

    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    let user = await User.findOne({ email });

    const isSuperAdmin = email === "aaronbagain@gmail.com";

    if (!user) {
      user = await User.create({
        firstName: firstName || "",
        lastName: lastName || "",
        email,
        password: await argon2.hash(googleId), // store hashed sub
        role: isSuperAdmin ? "admin" : "tourist",
        authProvider: "google",
        profilePicture: picture, // ✅ save google picture
      });
    } else {
      // always keep Google picture in sync
      if (user.authProvider === "google") {
        user.profilePicture = picture;
      }
      if (isSuperAdmin && user.role !== "admin") {
        user.role = "admin";
      }
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
        profilePicture: user.profilePicture, // ✅ return it
        language: user.language || "en",
        profileCompleted: user.profileCompleted || false, // ✅ track profile completion
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

    // Look in PendingUser collection
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser)
      return res.status(404).json({ message: "Pending user not found" });

    if (
      pendingUser.otp !== otp ||
      !pendingUser.otpExpires ||
      pendingUser.otpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Move user to main User collection
    const newUser = await User.create({
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      email: pendingUser.email,
      password: pendingUser.password,
      role: "tourist",
      isVerified: true,
      authProvider: "local",
    });

    // Delete pending user
    await PendingUser.deleteOne({ _id: pendingUser._id });

    // Generate JWT token for the new user
    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Email verified successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        authProvider: newUser.authProvider,
        profilePicture: newUser.profilePicture || null,
        language: newUser.language || "en",
        profileCompleted: newUser.profileCompleted || false,
        birthday: newUser.birthday,
        gender: newUser.gender,
        country: newUser.country,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    console.log('🔍 Upload Profile Picture - req.file:', JSON.stringify(req.file, null, 2));
    console.log('🔍 req.user:', req.user?._id);
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.authProvider === "google") {
      return res.status(403).json({
        message: "Google users cannot change their profile picture here",
      });
    }

    // ✅ For S3 uploads, req.file.location contains the full S3 URL
    // The S3 key might have 'undefined' in it because req.user wasn't available during multer processing
    // We'll use the location directly since it's the full URL
    const previousProfilePicture = user.profilePicture;
    if (req.file.location) {
      user.profilePicture = require("../utils/cdnUtil").toCdnUrl(req.file.location);
    } else {
      // Fallback for local uploads
      user.profilePicture = `/uploads/profile/${req.file.filename}`;
    }
    
    await user.save();

    // Delete previous picture from storage if it exists and isn’t the same as the new one
    if (previousProfilePicture && previousProfilePicture !== user.profilePicture) {
      try {
        const { deleteFromS3 } = require("../middleware/upload");
        await deleteFromS3(previousProfilePicture);
      } catch (delErr) {
        console.error("Failed to delete previous profile picture:", delErr.message || delErr);
      }
    }
    
    console.log('✅ Profile picture saved:', user.profilePicture);
    console.log('📁 req.file.location:', req.file.location);
    console.log('📁 req.file.key:', req.file.key);

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: "Updated",
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
      details: {
        changes: {
          profilePicture: { from: previousProfilePicture || null, to: user.profilePicture },
        },
      },
    });

    res.json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture, // already has correct path
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Save account info (firstName, lastName, email, password)
exports.saveAccount = async (req, res) => {
  try {
    const { firstName, lastName, email, password, currentPassword } = req.body;

    // Fetch current user data before updating
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const updates = {};
    const changedFields = [];
    let nameChanged = false;
    const oldName = `${currentUser.firstName} ${currentUser.lastName || ""}`.trim();
    
    if (firstName && firstName !== currentUser.firstName) {
      updates.firstName = firstName;
      changedFields.push("first name");
      nameChanged = true;
    }
    if (lastName && lastName !== currentUser.lastName) {
      updates.lastName = lastName;
      changedFields.push("last name");
      nameChanged = true;
    }

    if (email && email !== currentUser.email) {
      // 🔎 Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
      changedFields.push("email");
    }

    if (password) {
      if (currentUser.authProvider !== "local") {
        return res.status(400).json({ message: "Password change is only available for local login accounts" });
      }

      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const isValidCurrent = await argon2.verify(currentUser.password, currentPassword);
      if (!isValidCurrent) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      updates.password = await argon2.hash(password);
      changedFields.push("password");
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      select: "-password -otp -otpExpires",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Log action
    if (changedFields.length > 0) {
      const newName = `${user.firstName} ${user.lastName || ""}`.trim();
      let logAction = "";
      
      if (nameChanged) {
        logAction = `Changed name from "${oldName}" to "${newName}"`;
        if (changedFields.length > (changedFields.includes("first name") ? 1 : 0) + (changedFields.includes("last name") ? 1 : 0)) {
          const otherFields = changedFields.filter(f => f !== "first name" && f !== "last name");
          logAction += ` and updated: ${otherFields.join(", ")}`;
        }
      } else {
        logAction = `Updated account info: ${changedFields.join(", ")}`;
      }
      
      await Log.create({
        adminName: newName,
        action: "Updated",
        role: user.role || "tourist",
        targetType: "user",
        targetId: user._id,
        details: { message: logAction, changedFields },
      });
    }

    res.json({ message: "Account updated successfully", user });
  } catch (err) {
    console.error("Error updating account:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Profile Pre-req Save Account Info
exports.updateProfile = async (req, res) => {
  try {
    // Fetch current user data before updating
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const oldName = `${currentUser.firstName} ${currentUser.lastName || ""}`.trim();
    
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await argon2.hash(updates.password);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      select: "-password -otp -otpExpires",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Log action
    const newName = `${user.firstName} ${user.lastName || ""}`.trim();
    const nameChanged = (updates.firstName && updates.firstName !== currentUser.firstName) || 
                        (updates.lastName && updates.lastName !== currentUser.lastName);
    
    let logAction = "";
    if (nameChanged) {
      logAction = `Changed name from "${oldName}" to "${newName}"`;
    } else {
      logAction = `Updated profile information`;
    }
    
    await Log.create({
      adminName: newName,
      action: "Updated",
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
      details: { message: logAction },
    });

    res.json(user);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Save Birthday
exports.saveBirthday = async (req, res) => {
  try {
    const { month, date, year, parentalConsent = false } = req.body;

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

    // Age calculation
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;

    if (age < 13) {
      return res
        .status(400)
        .json({ message: "Users must be at least 13 years old." });
    }

    if (age < 18 && !parentalConsent) {
      return res
        .status(400)
        .json({ message: "Parental consent required for users 13-17." });
    }

    const update = {
      birthday,
      parentalConsent: age < 18 ? Boolean(parentalConsent) : false,
    };

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      update,
      { new: true, select: "-password -otp -otpExpires" }
    );

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: "Updated",
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
      details: { changes: { birthday: { to: birthday } } },
    });

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
      req.user._id,
      { gender: normalizedGender },
      { new: true, select: "-password -otp -otpExpires" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: "Updated",
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
      details: { changes: { gender: { to: normalizedGender } } },
    });

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

    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.country = country;
    await user.save();

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: "Updated",
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
      details: { changes: { country: { to: user.country } } },
    });

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
    const userId = req.user._id;

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

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: "Updated",
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
      details: { changes: { language: { to: user.language } } },
    });

    res.json({
      message: "Language updated successfully",
      language: user.language,
    });
  } catch (err) {
    console.error("Error updating language:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark profile as completed
exports.completeProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if required fields are filled
    const requiredFields = ['firstName', 'lastName', 'birthday', 'gender', 'country'];
    const missingFields = requiredFields.filter(field => !user[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: "Please complete all required fields",
        missingFields 
      });
    }

    user.profileCompleted = true;
    await user.save();

    res.json({
      message: "Profile completed successfully",
      profileCompleted: true,
    });
  } catch (err) {
    console.error("Error completing profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Deactivate Account
exports.deactivateAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { confirmationText } = req.body;

    // Verify confirmation text
    if (confirmationText !== "DELETE") {
      return res.status(400).json({ 
        message: "Invalid confirmation. Please type DELETE to confirm." 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent super admin from deactivating their account
    if (user.email === "aaronbagain@gmail.com") {
      return res.status(403).json({ 
        message: "Super admin account cannot be deactivated." 
      });
    }

    // Import models
    const Itinerary = require("../models/itineraryModel");
    const Review = require("../models/reviewModel");

    // Delete user's itineraries
    const deletedItineraries = await Itinerary.deleteMany({ userId });
    
    // Delete user's reviews
    const deletedReviews = await Review.deleteMany({ userId });

    // Create log entry for account deactivation
    if (user.role === "admin") {
      await Log.create({
        adminName: `${user.firstName} ${user.lastName}`,
        action: "Deleted",
        role: "admin",
        targetType: "user",
        targetId: userId,
        details: {
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          previousData: {
            itinerariesDeleted: deletedItineraries.deletedCount,
            reviewsDeleted: deletedReviews.deletedCount,
            deactivatedAt: new Date(),
          },
        },
      });
    }

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({
      message: "Account successfully deactivated",
      deletedData: {
        itineraries: deletedItineraries.deletedCount,
        reviews: deletedReviews.deletedCount,
      },
    });
  } catch (err) {
    console.error("Error deactivating account:", err);
    res.status(500).json({ message: "Server error during account deactivation" });
  }
};
