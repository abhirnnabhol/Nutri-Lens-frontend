const express = require("express");
const healthScoreController = require("../controllers/healthScoreController");

const router = express.Router();

router.post("/evaluate", healthScoreController.evaluateScore);
router.post("/calculate", healthScoreController.evaluateScore);

module.exports = router;
