const express = require("express");
const router = express.Router();
const controller = require("../controllers/emergencyController");
const { verifyAdmin } = require("../middleware/authMiddleware");

router.put("/reorder", verifyAdmin, controller.reorderContacts);
router.post("/", verifyAdmin, controller.createContact);
router.put("/:id", verifyAdmin, controller.updateContact);
router.delete("/:id", verifyAdmin, controller.deleteContact);
router.get("/", verifyAdmin, controller.getContacts);

module.exports = router;
