const express = require("express");
const router = express.Router();
const {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} = require("../controllers/tagController");

// GET all tags
router.get("/", getTags);

// GET single tag
router.get("/:id", getTagById);

// POST new tag
router.post("/", createTag);

// PUT update tag
router.put("/:id", updateTag);

// DELETE a tag
router.delete("/:id", deleteTag);

module.exports = router;
