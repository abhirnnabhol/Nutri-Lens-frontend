const express = require("express");
const analyzeController = require("../controllers/analyzeController");

const router = express.Router();

router.post("/image", analyzeController.analyzeImage);
router.post("/confirm", analyzeController.confirmAndAnalyze);
router.post("/ingredients", analyzeController.analyzeIngredients);

module.exports = router;
