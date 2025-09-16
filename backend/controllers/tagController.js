const Tag = require("../models/tagModel");

// GET all tags
exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tags" });
  }
};

// GET single tag
exports.getTagById = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) return res.status(404).json({ message: "Tag not found" });
    res.json(tag);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tag" });
  }
};

// POST new tag
exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Tag name is required" });

    const tag = new Tag({ name });
    await tag.save();
    res.status(201).json(tag);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Tag already exists" });
    }
    res.status(500).json({ message: "Error creating tag" });
  }
};

// UPDATE tag
exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const tag = await Tag.findById(id);
    if (!tag) return res.status(404).json({ message: "Tag not found" });

    tag.name = name || tag.name;
    await tag.save();

    res.json(tag);
  } catch (err) {
    res.status(500).json({ message: "Error updating tag" });
  }
};

// DELETE a tag
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await Tag.findByIdAndDelete(id);
    res.json({ message: "Tag deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting tag" });
  }
};
