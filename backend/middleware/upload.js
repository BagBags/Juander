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
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes("auth")) {
      cb(null, "uploads/profile"); // Profile pics folder
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
      // Photobooth: keep original filename
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
  } else {
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only .png files allowed for photobooth!"), false);
    }
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
