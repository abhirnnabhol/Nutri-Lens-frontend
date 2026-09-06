const profileService = require("../services/profileService");

async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: profile,
      user: profile,
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const updated = await profileService.updateProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      data: updated,
      user: updated,
    });
  } catch (err) {
    next(err);
  }
}

async function getHealthProfile(req, res, next) {
  try {
    const healthProfile = await profileService.getHealthProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: healthProfile,
    });
  } catch (err) {
    next(err);
  }
}

async function updateHealthProfile(req, res, next) {
  try {
    const result = await profileService.updateHealthProfile(
      req.user.id,
      req.body,
    );
    res.status(200).json({
      success: true,
      data: result,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

async function saveOnboarding(req, res, next) {
  try {
    const result = await profileService.updateHealthProfile(
      req.user.id,
      req.body,
    );
    res.status(200).json({
      success: true,
      user: result.user,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getHealthProfile,
  updateHealthProfile,
  saveOnboarding,
};
