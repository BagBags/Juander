const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes("auth")) {
      cb(null, "uploads/profile");
    } else if (req.baseUrl.includes("pins")) {
      if (file.mimetype.startsWith("image/")) {
        // Check if it's a facade upload based on field name
        if (file.fieldname === "facade") {
          cb(null, "uploads/facades");
        } else {
          // Media files go to media folder
          const uploadDir = "uploads/media";
          if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        }
      } else if (file.mimetype.startsWith("video/")) {
        // Videos go to media folder
        const uploadDir = "uploads/media";
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } else {
        cb(null, "uploads/arModels");
      }
    } else if (req.baseUrl.includes("itineraries")) {
      const uploadDir = "uploads/itineraries";
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } else if (req.baseUrl.includes("userItineraries")) {
      const uploadDir = "uploads/userItineraries";
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } else if (req.baseUrl.includes("emergency")) {
      const uploadDir = "uploads/emergency";
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } else if (req.baseUrl.includes("reviews")) {
      const uploadDir = "uploads/reviews";
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } else {
      cb(null, "uploads/photobooth");
    }
  },
  filename: (req, file, cb) => {
    if (req.baseUrl.includes("auth")) {
      const uploadDir = "uploads/profile";

      // Delete previous profile pictures
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

      const ext = path.extname(file.originalname);
      cb(null, `${req.user.id}${ext}`);
    } else if (req.baseUrl.includes("reviews")) {
      // For reviews: use timestamp + user ID + original filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      cb(null, `${timestamp}-${req.user.id}-${basename}${ext}`);
    } else if (req.baseUrl.includes("pins") && file.fieldname === "mediaFiles") {
      // For pin media files: use timestamp + original filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      cb(null, `${timestamp}-${basename}${ext}`);
    } else {
      // For everything else: keep original filename
      cb(null, file.originalname);
    }
  },
});

// File filter logic
const fileFilter = (req, file, cb) => {
  if (req.baseUrl.includes("auth")) {
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
      cb(null, true);
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else if (
      file.mimetype === "model/gltf-binary" ||
      file.originalname.endsWith(".glb")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video, or .glb files are allowed for pins!"), false);
    }
  } else if (
    req.baseUrl.includes("itineraries") ||
    req.baseUrl.includes("userItineraries")
  ) {
    cb(null, true); // Allow any file type
  } else if (req.baseUrl.includes("emergency")) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for emergency icons!"), false);
    }
  } else if (req.baseUrl.includes("reviews")) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for review photos!"), false);
    }
  } else {
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only .png files allowed for photobooth!"), false);
    }
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for video files
  }
});

module.exports = upload;
