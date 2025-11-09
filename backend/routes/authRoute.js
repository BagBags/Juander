const express = require("express");
const { check, validationResult } = require("express-validator");
const mongoSanitize = require("express-mongo-sanitize");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const User = require("../models/userModel");
// Apply mongo-sanitize globally for this route file
// router.use(mongoSanitize());

// Register Route
router.post(
  "/register",
  [
    check("email").isEmail().withMessage("Please enter a valid email address"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    check("firstName").notEmpty().withMessage("First name is required"),
    check("lastName").notEmpty().withMessage("Last name is required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.register
);

// Send OTP Route (For Password Reset)
router.post(
  "/send-otp",
  [check("email").isEmail().withMessage("Please enter a valid email address")],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.sendOtp
);

// Reset Password Route
router.post(
  "/reset-password",
  [
    check("email").isEmail().withMessage("Please enter a valid email address"),
    check("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
    check("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.resetPassword
);

// Login Route
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Please enter a valid email address"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.login
);

// Google Login Route
router.post("/google-login", authController.googleLogin);

// OTP Verification Route
router.post(
  "/verify-otp",
  [
    check("email").isEmail().withMessage("Please enter a valid email address"),
    check("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.verifyOtp
);

router.post(
  "/send-email-verification-otp",
  verifyToken, // user must be logged in
  authController.sendEmailVerificationOtp
);

router.post(
  "/verify-email-otp",
  verifyToken,
  [
    check("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  authController.verifyEmailOtp // you need to implement this in authController
);

// GET currently logged-in user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password -otp -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    // ensure only "en" or "tl"
    const normalizedLang = user.language === "tl" ? "tl" : "en";

    res.json({
      ...user.toObject(),
      language: normalizedLang,
    });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Fort Santiago modal preference
router.put("/fort-santiago-modal", verifyToken, async (req, res) => {
  try {
    const { hideFortSantiagoModal } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { hideFortSantiagoModal },
      { new: true, select: "-password -otp -otpExpires" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ 
      message: "Preference updated successfully",
      hideFortSantiagoModal: user.hideFortSantiagoModal 
    });
  } catch (err) {
    console.error("Error updating Fort Santiago modal preference:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload Profile Picture Route
router.post(
  "/upload-profile-picture",
  verifyToken,
  upload.single("profilePicture"),
  authController.uploadProfilePicture
);

// Update account info (firstName, lastName, email, password)
router.put(
  "/account",
  verifyToken,
  [
    check("email")
      .optional()
      .isEmail()
      .withMessage("Please enter a valid email address"),
    check("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    check("firstName")
      .optional()
      .notEmpty()
      .withMessage("First name is required"),
    check("lastName")
      .optional()
      .notEmpty()
      .withMessage("Last name is required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.saveAccount
);

// Update profile
// router.put("/update", verifyToken, authController.updateProfile);
// Profile Update Route
router.put(
  "/update",
  verifyToken,
  [
    check("firstName")
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters long"),
    check("lastName")
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters long"),
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .custom(async (email, { req }) => {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== req.user.id) {
          throw new Error("Email is already in use");
        }
        return true;
      }),
    check("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.updateProfile
);

// Save Birthday
// router.post("/birthday", verifyToken, authController.saveBirthday);
// Update Birthday Route
router.post(
  "/birthday",
  verifyToken,
  [
    check("month").notEmpty().withMessage("Month is required"),
    check("date")
      .isInt({ min: 1, max: 31 })
      .withMessage("Please enter a valid date (1-31)"),
    check("year")
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage("Please enter a valid year"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.saveBirthday
);

// Save Gender
// router.post("/gender", verifyToken, authController.saveGender);
// Update Gender Route
router.post(
  "/gender",
  verifyToken,
  [
    check("gender")
      .notEmpty()
      .withMessage("Gender is required")
      .isIn(["Male", "Female", "Other"])
      .withMessage("Invalid gender value"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.saveGender
);

// Save Country
// router.post("/country", verifyToken, authController.saveCountry);
// Update Country Route
router.post(
  "/country",
  verifyToken,
  [
    check("country")
      .notEmpty()
      .withMessage("Country is required")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Country must contain only letters and spaces"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.saveCountry
);

// Save Language
// router.post("/language", verifyToken, authController.saveLanguage);
// Update Language Route
router.post(
  "/language",
  verifyToken,
  [
    check("language")
      .notEmpty()
      .withMessage("Language is required")
      .isAlpha()
      .withMessage("Language must contain only letters"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.saveLanguage
);

// Complete Profile Route
router.post("/complete-profile", verifyToken, authController.completeProfile);

// Deactivate Account Route
router.delete("/deactivate-account", verifyToken, authController.deactivateAccount);

module.exports = router;
