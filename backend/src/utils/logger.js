const env = require("../config/env");

const logger = {
  info: (...args) => console.log("ℹ️", ...args),
  warn: (...args) => console.warn("⚠️", ...args),
  error: (...args) => console.error("❌", ...args),
  debug: (...args) => {
    if (env.nodeEnv === "development") {
      console.log("🐛 [DEBUG]", ...args);
    }
  },
};

module.exports = logger;
