const express = require("express");
const {
  getFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  reorderFilters,
} = require("../controllers/photoboothFilterController");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getFilters);

// ✅ Upload PNG + create filter
router.post("/", upload.single("image"), createFilter);

router.put("/:id", upload.single("image"), updateFilter);
router.delete("/:id", deleteFilter);
router.put("/reorder", reorderFilters);

module.exports = router;
