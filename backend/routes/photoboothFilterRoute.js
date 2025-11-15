const express = require("express");
const controller = require("../controllers/photoboothFilterController");
const upload = require("../middleware/upload");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", controller.getFilters);
// Proxy remote filter images through our backend (same-origin for canvas safety)
router.get("/proxy", controller.proxyImage);
router.get("/archived", verifyAdmin, controller.getArchivedFilters);

// Serve filter image by ID
router.get("/:id/image", controller.getFilterImage);

// ✅ Upload PNG + create filter
router.post("/", upload.single("image"), verifyAdmin, controller.createFilter);

router.put(
  "/:id",
  upload.single("image"),
  verifyAdmin,
  controller.updateFilter
);

// Archive and restore routes
router.put("/:id/archive", verifyAdmin, controller.archiveFilter);
router.put("/:id/restore", verifyAdmin, controller.restoreFilter);

// Permanent delete
router.delete("/:id", verifyAdmin, controller.deleteFilter);
router.put("/reorder", verifyAdmin, controller.reorderFilters);

module.exports = router;
