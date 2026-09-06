const ALLOWED_GENDERS = ["Male", "Female", "Other"];
const ALLOWED_HEALTH_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "High Cholesterol",
  "Thyroid",
  "None",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(req, res, next) {
  const { email, password, fullName } = req.body || {};

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: {
        message: "A valid email address is required",
        statusCode: 400,
      },
    });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Password must be at least 6 characters long",
        statusCode: 400,
      },
    });
  }

  if (fullName !== undefined && typeof fullName !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Full name must be a text string",
        statusCode: 400,
      },
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Email or phone is required",
        statusCode: 400,
      },
    });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Password is required",
        statusCode: 400,
      },
    });
  }

  next();
}

function validateHealthProfile(req, res, next) {
  const {
    age,
    gender,
    height,
    height_cm,
    weight,
    weight_kg,
    healthConditions,
    health_conditions,
  } = req.body || {};

  // Validate Age (1-120)
  if (age !== undefined && age !== null && age !== "") {
    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Age must be an integer between 1 and 120",
          statusCode: 400,
        },
      });
    }
  }

  // Validate Gender
  if (gender !== undefined && gender !== null && gender !== "") {
    if (!ALLOWED_GENDERS.includes(gender)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Gender must be one of: ${ALLOWED_GENDERS.join(", ")}`,
          statusCode: 400,
        },
      });
    }
  }

  // Validate Height (> 0)
  const hVal = height_cm !== undefined ? height_cm : height;
  if (hVal !== undefined && hVal !== null && hVal !== "") {
    const parsedHeight = Number(hVal);
    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Height must be a positive number",
          statusCode: 400,
        },
      });
    }
  }

  // Validate Weight (> 0)
  const wVal = weight_kg !== undefined ? weight_kg : weight;
  if (wVal !== undefined && wVal !== null && wVal !== "") {
    const parsedWeight = Number(wVal);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Weight must be a positive number",
          statusCode: 400,
        },
      });
    }
  }

  // Validate Health Conditions (Restricted to supported list)
  const conditions =
    healthConditions !== undefined ? healthConditions : health_conditions;
  if (conditions !== undefined && conditions !== null) {
    if (!Array.isArray(conditions)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Health conditions must be an array of supported conditions",
          statusCode: 400,
        },
      });
    }

    const invalid = conditions.filter(
      (c) => typeof c !== "string" || !ALLOWED_HEALTH_CONDITIONS.includes(c),
    );
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid health conditions: ${invalid.join(", ")}. Supported: ${ALLOWED_HEALTH_CONDITIONS.join(", ")}`,
          statusCode: 400,
        },
      });
    }
  }

  next();
}

function validateProfileUpdate(req, res, next) {
  const { fullName, notificationPreferences, notification_preferences } =
    req.body || {};

  if (fullName !== undefined && typeof fullName !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Full name must be a text string",
        statusCode: 400,
      },
    });
  }

  const notif =
    notificationPreferences !== undefined
      ? notificationPreferences
      : notification_preferences;

  if (notif !== undefined && typeof notif !== "boolean") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Notification preferences must be a boolean",
        statusCode: 400,
      },
    });
  }

  next();
}

module.exports = {
  ALLOWED_GENDERS,
  ALLOWED_HEALTH_CONDITIONS,
  validateRegister,
  validateLogin,
  validateHealthProfile,
  validateProfileUpdate,
};
