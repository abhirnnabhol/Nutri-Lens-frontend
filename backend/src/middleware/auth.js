const jwt = require("jsonwebtoken");
const env = require("../config/env");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { message: "Authentication required", statusCode: 401 },
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        message:
          err.name === "TokenExpiredError"
            ? "Token expired"
            : "Invalid authentication token",
        statusCode: 401,
      },
    });
  }
}

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = { id: decoded.id, email: decoded.email };
    } catch (err) {
      // Ignore token failure in optional authentication
    }
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
