const express = require("express");
const healthRoutes = require("./healthRoutes");
const categoryRoutes = require("./categoryRoutes");
const productRoutes = require("./productRoutes");
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const healthScoreRoutes = require("./healthScoreRoutes");
const rankingRoutes = require("./rankingRoutes");
const comparisonRoutes = require("./comparisonRoutes");
const analyzeRoutes = require("./analyzeRoutes");
const scanRoutes = require("./scanRoutes");

const router = express.Router();

// Mount REST API routes
router.use("/health", healthRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/score", healthScoreRoutes);
router.use("/ranking", rankingRoutes);
router.use("/comparisons", comparisonRoutes);
router.use("/analyze", analyzeRoutes);
router.use("/scans", scanRoutes);

module.exports = router;
