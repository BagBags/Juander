// const multer = require("multer");
// const path = require("path");

// // Storage config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // if uploading profile pictures
//     if (req.baseUrl.includes("auth")) {
//       cb(null, "uploads/profile"); // 👈 new folder for profile pics
//     } else {
//       cb(null, "uploads/photobooth"); // existing folder
//     }
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname); // keep original filename
//   },
// });

// // Only allow PNGs
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === "image/png") {
//     cb(null, true);
//   } else {
//     cb(new Error("Only .png files allowed!"), false);
//   }
// };

// const upload = multer({ storage, fileFilter });

// module.exports = upload;

const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes("auth")) {
      // ✅ Profile pictures folder
      cb(null, "uploads/profile");
    } else {
      // ✅ Photobooth folder (unchanged)
      cb(null, "uploads/photobooth");
    }
  },
  filename: (req, file, cb) => {
    if (req.baseUrl.includes("auth")) {
      // ✅ Profile pics → avoid overwriting, keep extension
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${Date.now()}${ext}`);
    } else {
      // ✅ Photobooth → keep original filename
      cb(null, file.originalname);
    }
  },
});

// File filter logic
const fileFilter = (req, file, cb) => {
  if (req.baseUrl.includes("auth")) {
    // ✅ Profile pictures: allow any image type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image files are allowed for profile pictures!"),
        false
      );
    }
  } else {
    // ✅ Photobooth unchanged: only PNG
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only .png files allowed for photobooth!"), false);
    }
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
