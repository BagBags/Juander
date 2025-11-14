const express = require("express");
const router = express.Router();
const controller = require("../controllers/emergencyController");
const { verifyAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // multer middleware

//Public routes for emergency contacts
router.get("/", controller.getContacts);

//Protected routes for emergency contacts
router.get("/archived", verifyAdmin, controller.getArchivedContacts);
router.put("/reorder", verifyAdmin, controller.reorderContacts);
router.put("/:id/archive", verifyAdmin, controller.archiveContact);
router.put("/:id/restore", verifyAdmin, controller.restoreContact);
router.post("/", verifyAdmin, upload.single("icon"), controller.createContact); // ✅ accept file
router.put(
  "/:id",
  verifyAdmin,
  upload.single("icon"),
  controller.updateContact
); // ✅ accept file
router.delete("/:id", verifyAdmin, controller.deleteContact);

module.exports = router;
