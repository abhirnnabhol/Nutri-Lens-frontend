import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/api";

const HEALTH_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "High Cholesterol",
  "Thyroid",
  "None",
];

const DIETARY_PREFERENCES = [
  "Vegetarian",
  "Non-Vegetarian",
  "Vegan",
  "Eggetarian",
];

const ALLERGIES = [
  "Nuts",
  "Dairy / Lactose",
  "Gluten",
  "Soy",
  "Shellfish",
  "None",
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Step 1: Personal Details (from Mockup 3)
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const [height, setHeight] = useState("165");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weight, setWeight] = useState("60");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [selectedConditions, setSelectedConditions] = useState([]);

  // Step 2 & 3: Diet and Goals
  const [diet, setDiet] = useState("Vegetarian");
  const [selectedAllergies, setSelectedAllergies] = useState(["None"]);

  const toggleCondition = (condition) => {
    if (condition === "None") {
      setSelectedConditions(["None"]);
      return;
    }
    const next = selectedConditions.filter((c) => c !== "None");
    if (next.includes(condition)) {
      setSelectedConditions(next.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...next, condition]);
    }
  };

  const toggleAllergy = (allergy) => {
    if (allergy === "None") {
      setSelectedAllergies(["None"]);
      return;
    }
    const next = selectedAllergies.filter((a) => a !== "None");
    if (next.includes(allergy)) {
      setSelectedAllergies(next.filter((a) => a !== allergy));
    } else {
      setSelectedAllergies([...next, allergy]);
    }
  };

  const validateStep1 = () => {
    if (age) {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        setError("Age must be between 1 and 120");
        return false;
      }
    }
    if (height) {
      const parsedHeight = parseFloat(height);
      if (isNaN(parsedHeight) || parsedHeight <= 0) {
        setError("Height must be a positive number");
        return false;
      }
    }
    if (weight) {
      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setError("Weight must be a positive number");
        return false;
      }
    }
    return true;
  };

  const handleComplete = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const payload = {
        fullName,
        age: parseInt(age, 10) || null,
        gender,
        height: parseFloat(height) || null,
        heightUnit,
        weight: parseFloat(weight) || null,
        weightUnit,
        healthConditions: selectedConditions,
        dietaryPreference: diet,
        allergies: selectedAllergies,
      };

      const res = await apiClient.put("/profile/health", payload);
      if (res.user) {
        updateUser(res.user);
      } else {
        updateUser({ ...(user || {}), profileComplete: true, fullName });
      }
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to save health profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!validateStep1()) return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <div className="nl-onboarding">
      <div className="nl-onboarding__step">Step {step} of 3</div>
      <h1 className="nl-onboarding__title">
        {step === 1 && "Tell us about you"}
        {step === 2 && "Dietary Preferences"}
        {step === 3 && "Food Allergies"}
      </h1>
      <p className="nl-onboarding__subtitle">
        {step === 1 && "Help us personalise your experience"}
        {step === 2 && "Tell us how you like to eat"}
        {step === 3 && "Flag ingredients you want to avoid"}
      </p>

      {error && (
        <div className="nl-auth-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* STEP 1: About You (Direct Mockup 3 Implementation) */}
      {step === 1 && (
        <>
          {/* Card 1: Name, Age, Gender */}
          <div className="nl-onboard-card">
            <div className="nl-field">
              <label className="nl-field__label">Full Name</label>
              <input
                type="text"
                className="nl-input"
                placeholder="e.g. Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="nl-field">
              <label className="nl-field__label">Age</label>
              <input
                type="number"
                className="nl-input"
                placeholder="e.g. 28"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="nl-field">
              <label className="nl-field__label">Gender</label>
              <div className="nl-pill-row">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`nl-pill ${gender === g ? "nl-pill--active" : ""}`}
                    onClick={() => setGender(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Height & Weight */}
          <div className="nl-onboard-card">
            <div className="nl-field">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label className="nl-field__label">Height</label>
                <div className="nl-unit-toggle">
                  <button
                    type="button"
                    className={`nl-unit-btn ${heightUnit === "cm" ? "nl-unit-btn--active" : ""}`}
                    onClick={() => setHeightUnit("cm")}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    className={`nl-unit-btn ${heightUnit === "ft" ? "nl-unit-btn--active" : ""}`}
                    onClick={() => setHeightUnit("ft")}
                  >
                    ft
                  </button>
                </div>
              </div>
              <input
                type="text"
                className="nl-input"
                placeholder="e.g. 165"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>

            <div className="nl-field">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label className="nl-field__label">Weight</label>
                <div className="nl-unit-toggle">
                  <button
                    type="button"
                    className={`nl-unit-btn ${weightUnit === "kg" ? "nl-unit-btn--active" : ""}`}
                    onClick={() => setWeightUnit("kg")}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    className={`nl-unit-btn ${weightUnit === "lb" ? "nl-unit-btn--active" : ""}`}
                    onClick={() => setWeightUnit("lb")}
                  >
                    lb
                  </button>
                </div>
              </div>
              <input
                type="text"
                className="nl-input"
                placeholder="e.g. 60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          {/* Health Conditions Section */}
          <div style={{ marginTop: "8px", marginBottom: "16px" }}>
            <label
              className="nl-field__label"
              style={{ marginBottom: "12px", display: "block" }}
            >
              Any existing health conditions?
            </label>
            <div className="nl-pill-row">
              {HEALTH_CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  className={`nl-pill ${
                    selectedConditions.includes(cond) ? "nl-pill--active" : ""
                  }`}
                  onClick={() => toggleCondition(cond)}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* STEP 2: Dietary Preferences */}
      {step === 2 && (
        <div className="nl-onboard-card">
          <label className="nl-field__label">Primary Diet</label>
          <div className="nl-pill-row">
            {DIETARY_PREFERENCES.map((d) => (
              <button
                key={d}
                type="button"
                className={`nl-pill ${diet === d ? "nl-pill--active" : ""}`}
                onClick={() => setDiet(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Allergies */}
      {step === 3 && (
        <div className="nl-onboard-card">
          <label className="nl-field__label">Known Allergens to Flag</label>
          <div className="nl-pill-row">
            {ALLERGIES.map((a) => (
              <button
                key={a}
                type="button"
                className={`nl-pill ${
                  selectedAllergies.includes(a) ? "nl-pill--active" : ""
                }`}
                onClick={() => toggleAllergy(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Continue Button */}
      <div className="nl-onboarding__footer">
        <button
          type="button"
          className="nl-btn-submit"
          disabled={isSubmitting}
          onClick={handleNext}
        >
          {isSubmitting
            ? "Saving..."
            : step === 3
              ? "Continue to App"
              : "Continue"}
        </button>
      </div>
    </div>
  );
}
