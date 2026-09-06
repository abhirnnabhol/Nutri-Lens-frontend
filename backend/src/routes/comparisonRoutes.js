const express = require("express");
const comparisonController = require("../controllers/comparisonController");

const router = express.Router();

router.post("/", comparisonController.createComparison);
router.get("/history", comparisonController.getComparisonHistory);
router.get("/:id", comparisonController.getComparisonById);

module.exports = router;
