const express = require("express");
const router = express.Router();
const controller = require("../controllers/emergencyController");

router.get("/", controller.getContacts);
router.post("/", controller.createContact);
router.put("/:id", controller.updateContact);
router.delete("/:id", controller.deleteContact);

module.exports = router;
