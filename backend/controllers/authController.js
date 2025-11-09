const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const User = require("../models/userModel");
const Log = require("../models/logModel");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const PendingUser = require("../models/pendingUserModel"); // make sure you have this

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if already exists in main User collection
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    // Also check PendingUser
    const pending = await PendingUser.findOne({ email });
    if (pending) await PendingUser.deleteOne({ email }); // clean old pending

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
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    });

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

    res
      .status(200)
      .json({ message: "Email verified successfully", userId: newUser._id });
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
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.authProvider === "google") {
      return res.status(403).json({
        message: "Google users cannot change their profile picture here",
      });
    }

    // ✅ Always save full relative path in DB
    user.profilePicture = `/uploads/profile/${req.file.filename}`;
    await user.save();

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: `Updated profile picture`,
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
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
    const { firstName, lastName, email, password } = req.body;

    // Fetch current user data before updating
    const currentUser = await User.findById(req.user.id);
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
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
      changedFields.push("email");
    }

    if (password) {
      updates.password = await argon2.hash(password);
      changedFields.push("password");
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
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
        action: logAction,
        role: user.role || "tourist",
        targetType: "user",
        targetId: user._id,
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
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const oldName = `${currentUser.firstName} ${currentUser.lastName || ""}`.trim();
    
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await argon2.hash(updates.password);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
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
      action: logAction,
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
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

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: `Updated birthday`,
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
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
      req.user.id,
      { gender: normalizedGender },
      { new: true, select: "-password -otp -otpExpires" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: `Updated gender`,
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
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

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.country = country;
    await user.save();

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: `Updated country`,
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
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

    // Log action
    const userName = `${user.firstName} ${user.lastName || ""}`.trim();
    await Log.create({
      adminName: userName,
      action: `Updated language preference`,
      role: user.role || "tourist",
      targetType: "user",
      targetId: user._id,
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
    const userId = req.user.id;

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
    const userId = req.user.id;
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
        action: "Account Deactivated",
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
