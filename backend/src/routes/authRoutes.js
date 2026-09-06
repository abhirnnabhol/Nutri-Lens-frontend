const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const {
  validateRegister,
  validateLogin,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authController.logout);

module.exports = router;
