const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'juander-frontend';

const storage = multerS3({
  s3: s3Client,
  bucket: S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    let folder = '';
    let filename = '';
    
    // Determine folder based on route
    if (req.baseUrl.includes("auth")) {
      folder = "uploads/profile";
      const ext = path.extname(file.originalname);
      filename = `${req.user._id}${ext}`;
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
        // 3D models go to arModels folder
        folder = "uploads/arModels";
        filename = file.originalname;
      } else {
        folder = "uploads/media";
        filename = file.originalname;
      }
    } else if (req.baseUrl.includes("itineraries")) {
      folder = "uploads/itineraries";
      filename = file.originalname;
    } else if (req.baseUrl.includes("userItineraries")) {
      folder = "uploads/userItineraries";
      filename = file.originalname;
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
      filename = file.originalname;
    }
    
    const key = `${folder}/${filename}`;
    cb(null, key);
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

// Helper function to delete files from local storage
const deleteFile = (filePath) => {
  try {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(__dirname, '..', cleanPath);
    
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
    if (fileUrl.includes('s3.amazonaws.com') || fileUrl.includes('s3.ap-southeast-2.amazonaws.com')) {
      // It's an S3 URL - extract the key
      const urlParts = fileUrl.split('.com/');
      const key = urlParts[1] || fileUrl;

      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
      console.log(`File deleted from S3: ${key}`);
      return true;
    } else {
      // It's a local file path - use local deletion
      return deleteFile(fileUrl);
    }
  } catch (err) {
    console.error(`Error deleting from S3: ${fileUrl}`, err);
    return false;
  }
};

module.exports = upload;
module.exports.deleteFile = deleteFile;
module.exports.deleteFromS3 = deleteFromS3;
