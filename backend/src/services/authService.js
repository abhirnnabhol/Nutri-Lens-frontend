const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const env = require("../config/env");

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "7d",
  });
}

async function register({ email, password, fullName }) {
  const cleanEmail = email.trim().toLowerCase();

  const existing = await db.query("SELECT id FROM users WHERE email = $1", [
    cleanEmail,
  ]);
  if (existing.rows && existing.rows.length > 0) {
    const err = new Error("An account with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const res = await db.query(
    "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, profile_complete",
    [cleanEmail, passwordHash, fullName ? fullName.trim() : null],
  );

  const user = res.rows[0];
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      profileComplete: Boolean(user.profile_complete),
    },
  };
}

async function login({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  const res = await db.query(
    "SELECT id, email, password_hash, full_name, profile_complete FROM users WHERE email = $1",
    [cleanEmail],
  );

  if (!res.rows || res.rows.length === 0) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const user = res.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      profileComplete: Boolean(user.profile_complete),
    },
  };
}

async function getUser(userId) {
  const userRes = await db.query(
    "SELECT id, email, full_name, profile_complete, notification_preferences, created_at FROM users WHERE id = $1",
    [userId],
  );

  if (!userRes.rows || userRes.rows.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const user = userRes.rows[0];

  const profileRes = await db.query(
    "SELECT age, gender, height_cm, weight_kg, health_conditions FROM health_profiles WHERE user_id = $1",
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
    healthConditions:
      profile && Array.isArray(profile.health_conditions)
        ? profile.health_conditions
        : [],
  };
}

async function saveOnboarding(userId, data) {
  // Update user name and profile_complete flag
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

  const conditions = Array.isArray(data.healthConditions)
    ? data.healthConditions.filter((c) => c && c !== "None")
    : [];

  // Upsert health profile
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
      data.height ? parseFloat(data.height) : null,
      data.weight ? parseFloat(data.weight) : null,
      conditions,
    ],
  );

  return getUser(userId);
}

module.exports = { register, login, getUser, saveOnboarding };
