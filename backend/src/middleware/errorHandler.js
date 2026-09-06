const env = require("../config/env");

/**
 * Centralized error handling middleware.
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProd = env.nodeEnv === "production";

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);
  if (!isProd && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message:
        statusCode === 500 && isProd ? "Internal Server Error" : err.message,
      statusCode,
      ...(!isProd && { stack: err.stack }),
    },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      statusCode: 404,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
