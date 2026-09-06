const express = require("express");
const profileController = require("../controllers/profileController");
const { authenticate } = require("../middleware/auth");
const {
  validateProfileUpdate,
  validateHealthProfile,
} = require("../validators/authValidators");

const router = express.Router();

// Require JWT authentication for all profile endpoints
router.use(authenticate);

// Main profile routes
router.get("/", profileController.getProfile);
router.put("/", validateProfileUpdate, profileController.updateProfile);

// Health profile routes
router.get("/health", profileController.getHealthProfile);
router.put(
  "/health",
  validateHealthProfile,
  profileController.updateHealthProfile,
);

// Onboarding route (alias for compatibility)
router.post(
  "/onboarding",
  validateHealthProfile,
  profileController.saveOnboarding,
);

module.exports = router;
