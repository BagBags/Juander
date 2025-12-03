const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");

// Decide storage: S3 when credentials are present; otherwise local disk
const hasAwsCreds = Boolean(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);
const S3_BUCKET = process.env.S3_BUCKET_NAME || "juander-frontend";

let storage;

if (hasAwsCreds) {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  storage = multerS3({
    s3: s3Client,
    bucket: S3_BUCKET,
    acl: "public-read",
    contentType: (req, file, cb) => {
      const mimeType = file.mimetype;
      if (mimeType.startsWith("video/")) {
        cb(null, mimeType);
      } else {
        cb(null, file.mimetype);
      }
    },
    key: (req, file, cb) => {
      let folder = "";
      let filename = "";

      if (req.baseUrl.includes("auth")) {
        folder = "uploads/profile";
        const ext = path.extname(file.originalname);
        const userId =
          req.user?._id ||
          `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        // Append timestamp to ensure a unique object key on every upload – avoids CDN caching the old image
        filename = `${userId}-${Date.now()}${ext}`;
      } else if (req.baseUrl.includes("pins")) {
        if (file.fieldname === "facade") {
          folder = "uploads/facades";
          filename = file.originalname;
        } else if (file.fieldname === "mediaFiles") {
          folder = "uploads/media";
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          const basename = path.basename(file.originalname, ext);
          filename = `${timestamp}-${basename}${ext}`;
        } else if (file.fieldname === "arModel" || file.fieldname === "glb") {
          folder = "uploads/arModels";
          filename = file.originalname;
        } else {
          folder = "uploads/media";
          filename = file.originalname;
        }
      } else if (req.baseUrl.includes("itineraries")) {
        folder = "uploads/itineraries";
        const timestamp = Date.now();
        filename = `${timestamp}-${file.originalname}`;
      } else if (req.baseUrl.includes("userItineraries")) {
        folder = "uploads/userItineraries";
        const timestamp = Date.now();
        filename = `${timestamp}-${file.originalname}`;
      } else if (req.baseUrl.includes("emergency")) {
        folder = "uploads/emergency";
        filename = file.originalname;
      } else if (req.baseUrl.includes("reviews")) {
        folder = "uploads/reviews";
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        filename = `${timestamp}-${req.user._id}-${basename}${ext}`;
      } else {
        folder = "uploads/photobooth";
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const basename = path
          .basename(file.originalname, ext)
          .replace(/[^a-zA-Z0-9-_]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "");
        filename = `${timestamp}-${basename}${ext}`;
      }

      const key = `${folder}/${filename}`;
      cb(null, key);
    },
  });
} else {
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = "";
      if (req.baseUrl.includes("auth")) folder = "uploads/profile";
      else if (req.baseUrl.includes("pins")) {
        if (file.fieldname === "facade") folder = "uploads/facades";
        else if (file.fieldname === "mediaFiles") folder = "uploads/media";
        else if (file.fieldname === "arModel" || file.fieldname === "glb")
          folder = "uploads/arModels";
        else folder = "uploads/media";
      } else if (req.baseUrl.includes("itineraries"))
        folder = "uploads/itineraries";
      else if (req.baseUrl.includes("userItineraries"))
        folder = "uploads/userItineraries";
      else if (req.baseUrl.includes("emergency")) folder = "uploads/emergency";
      else if (req.baseUrl.includes("reviews")) folder = "uploads/reviews";
      else folder = "uploads/photobooth";

      const dest = path.join(__dirname, "..", folder);
      try {
        fs.mkdirSync(dest, { recursive: true });
      } catch {}
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const basename = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      cb(null, `${timestamp}-${basename}${ext}`);
    },
  });
  storage = diskStorage;
}

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
      cb(
        new Error("Only image, video, or .glb files are allowed for pins!"),
        false
      );
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
    fileSize: 50 * 1024 * 1024,
  },
});

// Helper function to delete files from local storage
const deleteFile = (filePath) => {
  try {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;
    const fullPath = path.join(__dirname, "..", cleanPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`File deleted successfully: ${fullPath}`);
      return true;
    } else {
      console.log(`File not found: ${fullPath}`);
      return false;
    }
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err);
    return false;
  }
};

// Helper function to delete files from S3
const deleteFromS3 = async (fileUrl) => {
  try {
    // Check if it's an S3 URL or local path
    const { extractKey } = require("../utils/cdnUtil");

    // Determine the object key from either a CloudFront or direct S3 URL.
    const key = extractKey(fileUrl);
    if (key) {
      try {
        const client = new S3Client({
          region: process.env.AWS_REGION || "ap-southeast-2",
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });
        const command = new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        });
        await client.send(command);
        console.log(`File deleted from S3: ${key}`);
        return true;
      } catch (err) {
        console.error("AWS delete error", err);
        return false;
      }
    }

    // Not an S3 / CloudFront URL – treat as local path.
    return deleteFile(fileUrl);
  } catch (err) {
    console.error(`Error deleting from S3: ${fileUrl}`, err);
    return false;
  }
};

module.exports = upload;
module.exports.deleteFile = deleteFile;
module.exports.deleteFromS3 = deleteFromS3;
