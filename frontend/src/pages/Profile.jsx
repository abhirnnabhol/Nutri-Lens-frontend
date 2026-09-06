import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import apiClient from "../services/api";

const HEALTH_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "High Cholesterol",
  "Thyroid",
  "None",
];

const MEDICAL_DISCLAIMER =
  "The health profile information is used for optional personalization only, not for medical diagnosis.";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Fresh profile state
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notification Preferences State
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationPreferences ?? true,
  );
  const [savingNotif, setSavingNotif] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Edit Health Profile Form State
  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState("Female");
  const [editHeight, setEditHeight] = useState("165");
  const [editHeightUnit, setEditHeightUnit] = useState("cm");
  const [editWeight, setEditWeight] = useState("60");
  const [editWeightUnit, setEditWeightUnit] = useState("kg");
  const [editConditions, setEditConditions] = useState([]);
  const [editError, setEditError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Load fresh profile on mount
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/profile")
      .then((res) => {
        if (!isMounted) return;
        const data = res.data || res.user;
        if (data) {
          setProfileData(data);
          if (data.notificationPreferences !== undefined) {
            setNotificationsEnabled(data.notificationPreferences);
          }
        }
      })
      .catch((_err) => {
        // Fallback to auth context data if offline
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleToggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    setSavingNotif(true);

    try {
      const res = await apiClient.put("/profile", {
        notificationPreferences: nextVal,
      });
      if (res.data || res.user) {
        updateUser({
          ...(user || {}),
          notificationPreferences: nextVal,
        });
      }
    } catch {
      // Revert if failed
      setNotificationsEnabled(!nextVal);
    } finally {
      setSavingNotif(false);
    }
  };

  const openEditModal = () => {
    const p =
      profileData?.healthProfile || profileData?.profile || user?.profile;
    const conds =
      profileData?.healthProfile?.healthConditions ||
      profileData?.healthConditions ||
      user?.healthConditions ||
      [];

    setEditAge(p?.age ? String(p.age) : "");
    setEditGender(p?.gender || "Female");
    setEditHeight(
      p?.heightCm ? String(p.heightCm) : p?.height ? String(p.height) : "165",
    );
    setEditHeightUnit("cm");
    setEditWeight(
      p?.weightKg ? String(p.weightKg) : p?.weight ? String(p.weight) : "60",
    );
    setEditWeightUnit("kg");
    setEditConditions(conds.length > 0 ? conds : ["None"]);
    setEditError("");
    setIsEditModalOpen(true);
  };

  const toggleCondition = (cond) => {
    if (cond === "None") {
      setEditConditions(["None"]);
      return;
    }
    const next = editConditions.filter((c) => c !== "None");
    if (next.includes(cond)) {
      setEditConditions(next.filter((c) => c !== cond));
    } else {
      setEditConditions([...next, cond]);
    }
  };

  const handleSaveHealthProfile = async (e) => {
    e.preventDefault();
    setEditError("");

    // Validate Age
    if (editAge) {
      const parsedAge = parseInt(editAge, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        setEditError("Age must be between 1 and 120");
        return;
      }
    }

    // Validate Height
    if (editHeight) {
      const parsedHeight = parseFloat(editHeight);
      if (isNaN(parsedHeight) || parsedHeight <= 0) {
        setEditError("Height must be a positive number");
        return;
      }
    }

    // Validate Weight
    if (editWeight) {
      const parsedWeight = parseFloat(editWeight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setEditError("Weight must be a positive number");
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        age: editAge ? parseInt(editAge, 10) : null,
        gender: editGender,
        height: editHeight ? parseFloat(editHeight) : null,
        heightUnit: editHeightUnit,
        weight: editWeight ? parseFloat(editWeight) : null,
        weightUnit: editWeightUnit,
        healthConditions: editConditions,
      };

      const res = await apiClient.put("/profile/health", payload);
      const updatedHealth = res.data;
      const updatedUser = res.user || res.data?.user;

      if (updatedUser) {
        updateUser(updatedUser);
      }

      setProfileData((prev) => ({
        ...(prev || {}),
        ...(updatedUser || {}),
        healthProfile: updatedHealth,
      }));

      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err.message || "Failed to update health profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Resolved user values
  const activeUser = profileData || user;
  const fullName = activeUser?.fullName || "Priya Sharma";
  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PS";

  const health = activeUser?.healthProfile ||
    activeUser?.profile || {
      age: 28,
      gender: "Female",
      heightCm: 165,
      weightKg: 60,
    };

  const conditions =
    activeUser?.healthProfile?.healthConditions ||
    activeUser?.healthConditions ||
    [];

  return (
    <div className="nl-profile-page">
      {/* Profile Header */}
      <div className="nl-profile-card">
        <div className="nl-profile-avatar">{initials}</div>
        <h2
          style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "4px" }}
        >
          {fullName}
        </h2>
        <p style={{ color: "var(--nl-text-sub)", fontSize: "0.88rem" }}>
          {activeUser?.email || "user@nutrilens.com"}
        </p>
      </div>

      {/* Health Profile Card */}
      <Card style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
              Your Health Profile
            </h3>
            <span
              style={{ fontSize: "0.76rem", color: "var(--nl-text-muted)" }}
            >
              Used for personalized food recommendations
            </span>
          </div>
          <button
            type="button"
            className="nl-link-teal"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.86rem",
              fontWeight: 700,
            }}
            onClick={openEditModal}
          >
            Edit
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            fontSize: "0.88rem",
          }}
        >
          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "10px",
              border: "1px solid var(--nl-border)",
            }}
          >
            <span
              style={{
                color: "var(--nl-text-muted)",
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "2px",
              }}
            >
              Gender
            </span>
            <strong>{health.gender || "Female"}</strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "10px",
              border: "1px solid var(--nl-border)",
            }}
          >
            <span
              style={{
                color: "var(--nl-text-muted)",
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "2px",
              }}
            >
              Age
            </span>
            <strong>
              {health.age ? `${health.age} yrs` : "Not specified"}
            </strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "10px",
              border: "1px solid var(--nl-border)",
            }}
          >
            <span
              style={{
                color: "var(--nl-text-muted)",
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "2px",
              }}
            >
              Height
            </span>
            <strong>
              {health.heightCm
                ? `${health.heightCm} cm`
                : health.height
                  ? `${health.height} ${health.height_unit || "cm"}`
                  : "Not specified"}
            </strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "10px",
              border: "1px solid var(--nl-border)",
            }}
          >
            <span
              style={{
                color: "var(--nl-text-muted)",
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "2px",
              }}
            >
              Weight
            </span>
            <strong>
              {health.weightKg
                ? `${health.weightKg} kg`
                : health.weight
                  ? `${health.weight} ${health.weight_unit || "kg"}`
                  : "Not specified"}
            </strong>
          </div>
        </div>

        {/* Health Conditions Pills */}
        <div style={{ marginTop: "14px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--nl-text-muted)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Health Conditions
          </span>
          {conditions && conditions.length > 0 ? (
            <div className="nl-pill-row">
              {conditions.map((cond) => (
                <span
                  key={cond}
                  className="nl-pill nl-pill--active"
                  style={{
                    height: "30px",
                    fontSize: "0.78rem",
                    padding: "0 14px",
                  }}
                >
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.85rem", color: "var(--nl-text-sub)" }}>
              None recorded
            </span>
          )}
        </div>

        {/* Medical disclaimer reminder */}
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--nl-text-muted)",
            marginTop: "12px",
            lineHeight: 1.4,
          }}
        >
          * {MEDICAL_DISCLAIMER}
        </p>
      </Card>

      {/* Settings & Preferences Card */}
      <Card style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>
          Preferences
        </h3>

        {/* Notification Preferences Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
          }}
        >
          <div style={{ paddingRight: "16px" }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.92rem",
                marginBottom: "2px",
              }}
            >
              🔔 Health & Ingredient Alerts
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--nl-text-sub)" }}>
              Get warnings when food items have high sugar, sodium, or flagged
              ingredients
            </div>
          </div>
          <label className="nl-toggle-switch" aria-label="Toggle notifications">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleToggleNotifications}
              disabled={savingNotif}
            />
            <span className="nl-toggle-slider" />
          </label>
        </div>
      </Card>

      {/* Relevant Navigation Menu */}
      <div className="nl-profile-menu">
        <div
          className="nl-profile-menu-item"
          onClick={() => setIsAboutModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          <span>ℹ️ About NutriLens & Medical Disclaimer</span>
          <span>→</span>
        </div>

        <div
          className="nl-profile-menu-item"
          onClick={() => navigate("/history")}
          role="button"
          tabIndex={0}
        >
          <span>📊 Scan & Search History</span>
          <span>→</span>
        </div>

        <div
          className="nl-profile-menu-item"
          onClick={() => navigate("/compare")}
          role="button"
          tabIndex={0}
        >
          <span>⚖️ Product Comparisons</span>
          <span>→</span>
        </div>

        <div
          className="nl-profile-menu-item"
          onClick={() => navigate("/search")}
          role="button"
          tabIndex={0}
        >
          <span>🔍 Explore Food Database</span>
          <span>→</span>
        </div>
      </div>

      {/* Logout Button */}
      <div style={{ marginTop: "24px" }}>
        <Button variant="danger" size="md" fullWidth onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      {/* EDIT HEALTH PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Health Profile"
        maxWidth="420px"
      >
        <form onSubmit={handleSaveHealthProfile}>
          {editError && (
            <div className="nl-auth-error" style={{ marginBottom: "14px" }}>
              {editError}
            </div>
          )}

          {/* Age & Gender */}
          <div className="nl-field" style={{ marginBottom: "12px" }}>
            <label className="nl-field__label">Age</label>
            <input
              type="number"
              className="nl-input"
              placeholder="e.g. 28"
              value={editAge}
              onChange={(e) => setEditAge(e.target.value)}
              min="1"
              max="120"
            />
          </div>

          <div className="nl-field" style={{ marginBottom: "14px" }}>
            <label className="nl-field__label">Gender</label>
            <div className="nl-pill-row">
              {["Male", "Female", "Other"].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`nl-pill ${editGender === g ? "nl-pill--active" : ""}`}
                  onClick={() => setEditGender(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div className="nl-field" style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <label className="nl-field__label">Height</label>
              <div className="nl-unit-toggle">
                <button
                  type="button"
                  className={`nl-unit-btn ${editHeightUnit === "cm" ? "nl-unit-btn--active" : ""}`}
                  onClick={() => setEditHeightUnit("cm")}
                >
                  cm
                </button>
                <button
                  type="button"
                  className={`nl-unit-btn ${editHeightUnit === "ft" ? "nl-unit-btn--active" : ""}`}
                  onClick={() => setEditHeightUnit("ft")}
                >
                  ft
                </button>
              </div>
            </div>
            <input
              type="number"
              step="any"
              className="nl-input"
              placeholder={editHeightUnit === "cm" ? "e.g. 165" : "e.g. 5.8"}
              value={editHeight}
              onChange={(e) => setEditHeight(e.target.value)}
            />
          </div>

          {/* Weight */}
          <div className="nl-field" style={{ marginBottom: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <label className="nl-field__label">Weight</label>
              <div className="nl-unit-toggle">
                <button
                  type="button"
                  className={`nl-unit-btn ${editWeightUnit === "kg" ? "nl-unit-btn--active" : ""}`}
                  onClick={() => setEditWeightUnit("kg")}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={`nl-unit-btn ${editWeightUnit === "lb" ? "nl-unit-btn--active" : ""}`}
                  onClick={() => setEditWeightUnit("lb")}
                >
                  lb
                </button>
              </div>
            </div>
            <input
              type="number"
              step="any"
              className="nl-input"
              placeholder={editWeightUnit === "kg" ? "e.g. 60" : "e.g. 132"}
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
            />
          </div>

          {/* Health Conditions */}
          <div className="nl-field" style={{ marginBottom: "18px" }}>
            <label className="nl-field__label">Health Conditions</label>
            <div className="nl-pill-row">
              {HEALTH_CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  className={`nl-pill ${
                    editConditions.includes(cond) ? "nl-pill--active" : ""
                  }`}
                  onClick={() => toggleCondition(cond)}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Saving Profile..." : "Save Changes"}
          </Button>
        </form>
      </Modal>

      {/* ABOUT & MEDICAL DISCLAIMER MODAL */}
      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="About NutriLens"
        footer={
          <button
            type="button"
            className="nl-btn-submit"
            onClick={() => setIsAboutModalOpen(false)}
          >
            Close
          </button>
        }
      >
        <div
          style={{
            fontSize: "0.92rem",
            lineHeight: "1.5",
            color: "var(--nl-text-sub)",
          }}
        >
          <p style={{ marginBottom: "12px" }}>
            <strong>NutriLens</strong> is a packaged-food comparison platform
            designed to help consumers make informed, transparent choices using
            nutrition facts and ingredient intelligence.
          </p>
          <div className="nl-disclaimer-box" style={{ margin: "14px 0" }}>
            <strong>⚖️ Medical Disclaimer</strong>
            {MEDICAL_DISCLAIMER} NutriLens does not provide clinical diagnosis,
            medical treatment, or personalized healthcare advice. Always consult
            a qualified medical professional for health concerns.
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--nl-text-muted)" }}>
            Version: MVP 1.0.0 (Phase 3 Foundation)
          </p>
        </div>
      </Modal>
    </div>
  );
}
