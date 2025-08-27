// routes/mask.js
const express = require("express");
const { getMask, saveMask } = require("../controllers/maskController.js");

const router = express.Router();

router.get("/", getMask);
router.post("/", saveMask);

module.exports = router;
