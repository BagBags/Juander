const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");
const Log = require("../models/logModel");

// Helper: get admin name
function getAdminName(req) {
  return req.user
    ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
    : "Unknown Admin";
}

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new category
router.post("/", async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    // Check if category already exists
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({
      name: name.trim(),
    });

    await newCategory.save();

    await Log.create({
      adminName: getAdminName(req),
      action: `Created category: ${newCategory.name}`,
      role: "admin",
      targetType: "other",
      targetId: newCategory._id,
    });

    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update category
router.put("/:id", async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if new name already exists
    const existing = await Category.findOne({ 
      name: name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    category.name = name.trim();
    await category.save();

    await Log.create({
      adminName: getAdminName(req),
      action: `Updated category (ID: ${category._id})`,
      role: "admin",
      targetType: "other",
      targetId: category._id,
    });

    res.json(category);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE category
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.deleteOne({ _id: req.params.id });

    await Log.create({
      adminName: getAdminName(req),
      action: `Deleted category: ${category.name}`,
      role: "admin",
      targetType: "other",
      targetId: category._id,
    });

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
