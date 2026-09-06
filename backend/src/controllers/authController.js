const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Email and password are required", statusCode: 400 },
      });
    }

    const result = await authService.register({ email, password, fullName });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Email and password are required", statusCode: 400 },
      });
    }

    const result = await authService.login({ email, password });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getUser(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, logout };
