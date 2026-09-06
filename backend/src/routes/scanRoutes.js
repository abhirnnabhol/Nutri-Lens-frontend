const express = require("express");
const scanController = require("../controllers/scanController");

const router = express.Router();

// GET /api/scans/history
router.get("/history", scanController.getScanHistory);

// GET /api/scans/:id
router.get("/:id", scanController.getScanById);

module.exports = router;
