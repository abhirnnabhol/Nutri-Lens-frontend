const express = require("express");
const corsMiddleware = require("./middleware/cors");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const apiRoutes = require("./routes");
const env = require("./config/env");

const app = express();

// Security and utility middleware
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (env.nodeEnv === "development") {
  app.use((req, _res, next) => {
    console.log(`📡 [${req.method}] ${req.url}`);
    next();
  });
}

// Mount REST API routes
app.use("/api", apiRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error-handling middleware
app.use(errorHandler);

module.exports = app;
