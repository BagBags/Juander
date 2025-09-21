const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes("auth")) {
      cb(null, "uploads/profile"); // Profile pics folder
    } else if (req.baseUrl.includes("pins")) {
      if (file.mimetype.startsWith("image/")) {
        cb(null, "uploads/facades"); // ✅ New folder for facade images
      } else {
        cb(null, "uploads/arModels"); // AR .glb models
      }
    } else {
      cb(null, "uploads/photobooth"); // Photobooth folder
    }
  },
  filename: (req, file, cb) => {
    if (req.baseUrl.includes("auth")) {
      const uploadDir = "uploads/profile";

      // Delete any previous profile picture(s) for this user
      fs.readdir(uploadDir, (err, files) => {
        if (!err) {
          const userFiles = files.filter((f) => f.startsWith(req.user.id));
          userFiles.forEach((f) => {
            try {
              fs.unlinkSync(path.join(uploadDir, f));
            } catch (unlinkErr) {
              console.error("Failed to delete old profile pic:", unlinkErr);
            }
          });
        }
      });

      // Save new file as <userId>.<extension>
      const ext = path.extname(file.originalname);
      cb(null, `${req.user.id}${ext}`);
    } else {
      // For facades, photobooth, and AR models: keep original filename
      cb(null, file.originalname);
    }
  },
});

// File filter logic
const fileFilter = (req, file, cb) => {
  if (req.baseUrl.includes("auth")) {
    // Profile pics: only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image files are allowed for profile pictures!"),
        false
      );
    }
  } else if (req.baseUrl.includes("pins")) {
    if (file.mimetype.startsWith("image/")) {
      // ✅ Facades: allow all images
      cb(null, true);
    } else if (
      file.mimetype === "model/gltf-binary" ||
      file.originalname.endsWith(".glb")
    ) {
      // AR models: only .glb files
      cb(null, true);
    } else {
      cb(new Error("Only image or .glb files are allowed for pins!"), false);
    }
  } else {
    // Photobooth: only PNG
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only .png files allowed for photobooth!"), false);
    }
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
