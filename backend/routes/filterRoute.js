const express = require("express");
const router = express.Router();
const { filters } = require("../controllers/filterController");

router.get("/", filters);
module.exports = router;
