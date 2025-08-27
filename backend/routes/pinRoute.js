// routes/pins.js
const express = require("express");
const {
  getPins,
  createPin,
  updatePin,
  deletePin,
} = require("../controllers/pinController.js");

const router = express.Router();

router.get("/", getPins);
router.post("/", createPin);
router.put("/:id", updatePin);
router.delete("/:id", deletePin);
module.exports = router;
