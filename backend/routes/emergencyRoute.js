const express = require("express");
const router = express.Router();
const controller = require("../controllers/emergencyController");
const { verifyAdmin } = require("../middleware/authMiddleware");

//Public routes for emergency contacts
router.get("/", controller.getContacts);

//Protected routes for emergency contacts
router.put("/reorder", verifyAdmin, controller.reorderContacts);
router.post("/", verifyAdmin, controller.createContact);
router.put("/:id", verifyAdmin, controller.updateContact);
router.delete("/:id", verifyAdmin, controller.deleteContact);

module.exports = router;
