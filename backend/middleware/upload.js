const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/photobooth"); // folder for filter images
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // ✅ keep original filename only
  },
});

// Only allow PNGs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Only .png files allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
