const db = require("../config/db");

const MEDICAL_DISCLAIMER =
  "The health profile information is used for optional personalization only, not for medical diagnosis.";

function convertHeightToCm(height, unit) {
  if (height === undefined || height === null || height === "") return null;
  const num = parseFloat(height);
  if (isNaN(num)) return null;
  if (unit === "ft") {
    return Math.round(num * 30.48 * 10) / 10;
  }
  return Math.round(num * 10) / 10;
}

function convertWeightToKg(weight, unit) {
  if (weight === undefined || weight === null || weight === "") return null;
  const num = parseFloat(weight);
  if (isNaN(num)) return null;
  if (unit === "lb") {
    return Math.round(num * 0.453592 * 10) / 10;
  }
  return Math.round(num * 10) / 10;
}

async function getProfile(userId) {
  const userRes = await db.query(
    "SELECT id, email, full_name, profile_complete, notification_preferences, created_at, updated_at FROM users WHERE id = $1",
    [userId],
  );

  if (!userRes.rows || userRes.rows.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const user = userRes.rows[0];

  const profileRes = await db.query(
    "SELECT age, gender, height_cm, weight_kg, health_conditions, updated_at FROM health_profiles WHERE user_id = $1",
    [userId],
  );

  const profile = profileRes.rows ? profileRes.rows[0] : null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    profileComplete: Boolean(user.profile_complete),
    notificationPreferences: user.notification_preferences !== false,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    profile: profile
      ? {
          age: profile.age,
          gender: profile.gender,
          height: profile.height_cm ? Number(profile.height_cm) : null,
          height_unit: "cm",
          weight: profile.weight_kg ? Number(profile.weight_kg) : null,
          weight_unit: "kg",
        }
      : null,
    healthProfile: profile
      ? {
          age: profile.age,
          gender: profile.gender,
          heightCm: profile.height_cm ? Number(profile.height_cm) : null,
          weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
          healthConditions: Array.isArray(profile.health_conditions)
            ? profile.health_conditions
            : [],
          disclaimer: MEDICAL_DISCLAIMER,
          updatedAt: profile.updated_at,
        }
      : null,
    healthConditions:
      profile && Array.isArray(profile.health_conditions)
        ? profile.health_conditions
        : [],
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

async function updateProfile(
  userId,
  { fullName, notificationPreferences, notification_preferences },
) {
  const updates = [];
  const params = [];
  let paramIdx = 1;

  if (fullName !== undefined) {
    updates.push(`full_name = $${paramIdx++}`);
    params.push(typeof fullName === "string" ? fullName.trim() : null);
  }

  const notif =
    notificationPreferences !== undefined
      ? notificationPreferences
      : notification_preferences;
  if (notif !== undefined) {
    updates.push(`notification_preferences = $${paramIdx++}`);
    params.push(Boolean(notif));
  }

  updates.push(`updated_at = NOW()`);
  params.push(userId);

  const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING id, email, full_name, profile_complete, notification_preferences, updated_at`;
  const res = await db.query(sql, params);

  if (!res.rows || res.rows.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return getProfile(userId);
}

async function getHealthProfile(userId) {
  const profileRes = await db.query(
    "SELECT age, gender, height_cm, weight_kg, health_conditions, updated_at FROM health_profiles WHERE user_id = $1",
    [userId],
  );

  const profile = profileRes.rows ? profileRes.rows[0] : null;
  if (!profile) {
    return {
      age: null,
      gender: null,
      heightCm: null,
      weightKg: null,
      healthConditions: [],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  return {
    age: profile.age,
    gender: profile.gender,
    heightCm: profile.height_cm ? Number(profile.height_cm) : null,
    weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
    healthConditions: Array.isArray(profile.health_conditions)
      ? profile.health_conditions
      : [],
    disclaimer: MEDICAL_DISCLAIMER,
    updatedAt: profile.updated_at,
  };
}

async function updateHealthProfile(userId, data) {
  // If fullName passed during onboarding, update user full_name
  if (data.fullName) {
    await db.query(
      "UPDATE users SET full_name = $1, profile_complete = TRUE, updated_at = NOW() WHERE id = $2",
      [data.fullName.trim(), userId],
    );
  } else {
    await db.query(
      "UPDATE users SET profile_complete = TRUE, updated_at = NOW() WHERE id = $1",
      [userId],
    );
  }

  // Handle unit conversions
  const rawHeight = data.height_cm !== undefined ? data.height_cm : data.height;
  const heightUnit = data.heightUnit || data.height_unit || "cm";
  const heightCm = convertHeightToCm(rawHeight, heightUnit);

  const rawWeight = data.weight_kg !== undefined ? data.weight_kg : data.weight;
  const weightUnit = data.weightUnit || data.weight_unit || "kg";
  const weightKg = convertWeightToKg(rawWeight, weightUnit);

  // Normalize health conditions
  const rawConditions = data.healthConditions || data.health_conditions || [];
  let conditions = [];
  if (Array.isArray(rawConditions)) {
    conditions = rawConditions.filter(
      (c) => c && typeof c === "string" && c !== "None",
    );
  }

  await db.query(
    `INSERT INTO health_profiles (user_id, age, gender, height_cm, weight_kg, health_conditions)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       age = EXCLUDED.age,
       gender = EXCLUDED.gender,
       height_cm = EXCLUDED.height_cm,
       weight_kg = EXCLUDED.weight_kg,
       health_conditions = EXCLUDED.health_conditions,
       updated_at = NOW()`,
    [
      userId,
      data.age ? parseInt(data.age, 10) : null,
      data.gender || null,
      heightCm,
      weightKg,
      conditions,
    ],
  );

  const healthProfile = await getHealthProfile(userId);
  const fullProfile = await getProfile(userId);

  return {
    ...healthProfile,
    user: fullProfile,
  };
}

module.exports = {
  MEDICAL_DISCLAIMER,
  getProfile,
  updateProfile,
  getHealthProfile,
  updateHealthProfile,
  convertHeightToCm,
  convertWeightToKg,
};
