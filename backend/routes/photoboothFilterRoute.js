const express = require("express");
const controller = require("../controllers/photoboothFilterController");
const upload = require("../middleware/upload");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", controller.getFilters);

// ✅ Upload PNG + create filter
router.post("/", upload.single("image"), verifyAdmin, controller.createFilter);

router.put(
  "/:id",
  upload.single("image"),
  verifyAdmin,
  controller.updateFilter
);
router.delete("/:id", verifyAdmin, controller.deleteFilter);
router.put("/reorder", verifyAdmin, controller.reorderFilters);

module.exports = router;
