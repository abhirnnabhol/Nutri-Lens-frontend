const cors = require("cors");
const env = require("../config/env");

function normalizeOrigin(url) {
  return url ? url.trim().replace(/\/+$/, "") : "";
}

// Support comma-separated CLIENT_URL values (e.g., custom domain + onrender.com)
const configuredOrigins = (env.clientUrl || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = normalizeOrigin(origin);
    const allowed = [...configuredOrigins, ...defaultOrigins];

    // Check exact matches or development mode
    if (allowed.includes(cleanOrigin) || env.nodeEnv === "development") {
      return callback(null, true);
    }

    // Allow Render and Vercel preview domains
    if (
      cleanOrigin.endsWith(".onrender.com") ||
      cleanOrigin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
