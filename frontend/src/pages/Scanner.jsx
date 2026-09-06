import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import ScoreBadge from "../components/common/ScoreBadge";
import ComparisonTray from "../components/common/ComparisonTray";
import { useApp } from "../context/AppContext";
import apiClient from "../services/api";

export default function Scanner() {
  const navigate = useNavigate();
  const { toggleProductSelection, isProductSelected, selectedProducts } =
    useApp();

  // Navigation steps: 'capture' | 'preview' | 'verifying' | 'result'
  const [step, setStep] = useState("capture");

  // Media & camera state
  const [imageSrc, setImageSrc] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [ocrMeta, setOcrMeta] = useState(null);
  const [rawOcrText, setRawOcrText] = useState("");

  // Verification form state (defaults to empty so user sees true extracted data)
  const [formData, setFormData] = useState({
    productName: "",
    servingSize: "",
    calories: "",
    protein: "",
    carbohydrates: "",
    totalSugar: "",
    addedSugar: "",
    totalFat: "",
    saturatedFat: "",
    transFat: "",
    sodium: "",
    fiber: "",
    ingredients: "",
  });

  // Analysis result state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
    setCameraLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Callback ref: Attaches stream the exact millisecond video DOM element mounts
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node
        .play()
        .then(() => {
          setCameraReady(true);
          setCameraLoading(false);
        })
        .catch((e) => {
          console.warn("video.play() auto-play error:", e);
        });
    }
  }, []);

  // Start device camera
  const startCamera = async (overrideFacingMode) => {
    stopCamera();
    setCameraError(null);
    setCameraLoading(true);

    const mode = overrideFacingMode || facingMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera access is not supported in this browser. Please use the Upload Image option.",
        );
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (modeErr) {
        console.warn(
          "Ideal facingMode failed, falling back to any video device:",
          modeErr,
        );
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .then(() => {
            setCameraReady(true);
            setCameraLoading(false);
          })
          .catch((e) => {
            console.warn("video.play() error:", e);
          });
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraLoading(false);
      setCameraActive(false);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera permissions in your browser or upload an image file."
          : err.message ||
              "Unable to access device camera. Please upload an image file instead.",
      );
    }
  };

  // Flip / Switch Camera
  const handleSwitchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture current video frame
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      stopCamera();
      setImageSrc(dataUrl);
      setStep("preview");
    } catch (err) {
      console.error("Failed to capture frame:", err);
      setCameraError("Failed to capture photo from video feed.");
    }
  };

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setImageSrc(reader.result);
      setStep("preview");
    };
    reader.readAsDataURL(file);
  };

  // Preset sample label for instant testing
  const handlePresetSelect = (presetKey) => {
    stopCamera();
    setImageSrc(`preset:${presetKey}`);
    setStep("preview");
  };

  // Retake or remove photo
  const handleRetake = () => {
    stopCamera();
    setImageSrc(null);
    setAnalysisResult(null);
    setRawOcrText("");
    setStep("capture");
  };

  // Call OCR Analysis endpoint (POST /api/analyze/image)
  const handleAnalyzeImage = async () => {
    setOcrLoading(true);
    setOcrError(null);

    try {
      let payload = {};
      if (imageSrc && imageSrc.startsWith("preset:")) {
        payload.preset = imageSrc.replace("preset:", "");
      } else {
        payload.image = imageSrc;
      }

      const res = await apiClient.post("/analyze/image", payload);

      if (res.data && res.data.extractedData) {
        const ext = res.data.extractedData;
        setOcrMeta(res.data.ocrMeta);
        setRawOcrText(res.data.rawText || "");

        setFormData({
          productName: ext.productName || "",
          servingSize: ext.servingSize || "",
          calories:
            ext.calories !== null && ext.calories !== undefined
              ? String(ext.calories)
              : "",
          protein:
            ext.protein !== null && ext.protein !== undefined
              ? String(ext.protein)
              : "",
          carbohydrates:
            ext.carbohydrates !== null && ext.carbohydrates !== undefined
              ? String(ext.carbohydrates)
              : "",
          totalSugar:
            ext.totalSugar !== null && ext.totalSugar !== undefined
              ? String(ext.totalSugar)
              : "",
          addedSugar:
            ext.addedSugar !== null && ext.addedSugar !== undefined
              ? String(ext.addedSugar)
              : "",
          totalFat:
            ext.totalFat !== null && ext.totalFat !== undefined
              ? String(ext.totalFat)
              : "",
          saturatedFat:
            ext.saturatedFat !== null && ext.saturatedFat !== undefined
              ? String(ext.saturatedFat)
              : "",
          transFat:
            ext.transFat !== null && ext.transFat !== undefined
              ? String(ext.transFat)
              : "",
          sodium:
            ext.sodium !== null && ext.sodium !== undefined
              ? String(ext.sodium)
              : "",
          fiber:
            ext.fiber !== null && ext.fiber !== undefined
              ? String(ext.fiber)
              : "",
          ingredients: Array.isArray(ext.ingredients)
            ? ext.ingredients.join(", ")
            : "",
        });
        setStep("verifying");
      }
    } catch (err) {
      setOcrError(
        err.response?.data?.error ||
          err.message ||
          "Failed to extract text from label.",
      );
    } finally {
      setOcrLoading(false);
    }
  };

  // Handle form change on verification screen
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Confirm and calculate score (POST /api/analyze/confirm)
  const handleConfirmAndAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setOcrError(null);

    try {
      const payload = {
        productName: formData.productName,
        servingSize: formData.servingSize,
        calories: formData.calories,
        protein: formData.protein,
        carbohydrates: formData.carbohydrates,
        totalSugar: formData.totalSugar,
        addedSugar: formData.addedSugar,
        totalFat: formData.totalFat,
        saturatedFat: formData.saturatedFat,
        transFat: formData.transFat,
        sodium: formData.sodium,
        fiber: formData.fiber,
        ingredients: formData.ingredients,
        rawText: rawOcrText,
      };

      const res = await apiClient.post("/analyze/confirm", payload);

      if (res.data && res.data.product) {
        setAnalysisResult(res.data);
        setStep("result");
      }
    } catch (err) {
      setOcrError(
        err.response?.data?.error ||
          err.message ||
          "Failed to analyze verified product.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="nl-search-page" style={{ paddingBottom: "110px" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>
          Offline Label Scanner
        </h1>
        <span style={{ fontSize: "0.82rem", color: "var(--nl-text-sub)" }}>
          Capture food nutrition labels & ingredients for instant analysis
        </span>
      </div>

      {/* STEP 1: CAPTURE / UPLOAD */}
      {step === "capture" && (
        <>
          {cameraActive ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#0f172a",
                marginBottom: "16px",
                minHeight: "320px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <video
                ref={setVideoRef}
                playsInline
                autoPlay
                muted
                onLoadedMetadata={(e) => {
                  e.target
                    .play()
                    .then(() => {
                      setCameraReady(true);
                      setCameraLoading(false);
                    })
                    .catch(() => {});
                }}
                onPlaying={() => {
                  setCameraReady(true);
                  setCameraLoading(false);
                }}
                style={{
                  width: "100%",
                  height: "340px",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {cameraLoading && !cameraReady && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(15, 23, 42, 0.85)",
                    color: "#fff",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      border: "3px solid rgba(255,255,255,0.2)",
                      borderTopColor: "var(--nl-teal)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      marginBottom: "10px",
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Connecting camera feed...
                  </span>
                </div>
              )}

              {/* Viewfinder Target Frame */}
              <div
                style={{
                  position: "absolute",
                  inset: "24px",
                  border: "2px dashed rgba(255,255,255,0.75)",
                  borderRadius: "12px",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: "12px",
                  zIndex: 3,
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    background: "rgba(0, 0, 0, 0.65)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Point camera at Nutrition Facts
                </span>
              </div>

              {/* Camera Actions Bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                  alignItems: "center",
                  zIndex: 4,
                }}
              >
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "44px",
                    height: "44px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)",
                  }}
                  title="Close Camera"
                >
                  ✕
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  style={{
                    background: "#ffffff",
                    border: "4px solid var(--nl-teal)",
                    borderRadius: "50%",
                    width: "68px",
                    height: "68px",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Snap Photo"
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      background: "var(--nl-teal)",
                    }}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "44px",
                    height: "44px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)",
                  }}
                  title="Flip / Switch Camera"
                >
                  🔄
                </button>
              </div>
            </div>
          ) : (
            <Card
              style={{
                textAlign: "center",
                padding: "36px 20px",
                marginBottom: "16px",
              }}
            >
              <div
                className="nl-splash__icon"
                style={{
                  margin: "0 auto 16px",
                  width: "64px",
                  height: "64px",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                Scan Nutrition Label
              </h3>
              <p
                style={{
                  color: "var(--nl-text-sub)",
                  fontSize: "0.85rem",
                  marginBottom: "20px",
                  lineHeight: 1.4,
                }}
              >
                Capture a photo of the Nutrition Facts panel or upload an image
                from your device gallery.
              </p>

              {cameraError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    color: "#dc2626",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    marginBottom: "16px",
                    textAlign: "left",
                    lineHeight: 1.4,
                  }}
                >
                  <strong>⚠️ Camera Notice:</strong> {cameraError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => startCamera()}
                  disabled={cameraLoading}
                >
                  📷{" "}
                  {cameraLoading ? "Opening Camera..." : "Open Device Camera"}
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                >
                  📁 Upload Label Image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            </Card>
          )}

          {/* Selected Products Tray Reminder if user is scanning additional products */}
          {selectedProducts.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "#0f766e",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>📦</span> Current Comparison Set (
                {selectedProducts.length} added):
              </div>
              <ComparisonTray inline />
            </div>
          )}

          {/* Clearly Labelled DEMO / TEST Presets for Development Testing */}
          <Card
            style={{
              padding: "16px",
              border: "1px dashed #cbd5e1",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                DEMO / TEST LABELS
              </span>
              <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                (Known Nutrition Data for Quick Testing)
              </span>
            </div>

            <p
              style={{
                fontSize: "0.76rem",
                color: "var(--nl-text-sub)",
                marginBottom: "12px",
                lineHeight: 1.4,
              }}
            >
              Because OCR accuracy is under active development, use these preset
              test labels with known nutrition facts to test multi-product
              comparison.
              <em>
                {" "}
                Note: Demo labels are synthetic samples for testing and not
                certified food formulas.
              </em>
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <button
                type="button"
                className="nl-chip"
                onClick={() => handlePresetSelect("oat-bar")}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                🌾 [Demo] Whole Grain Oat Bar
              </button>
              <button
                type="button"
                className="nl-chip"
                onClick={() => handlePresetSelect("chips")}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                🍟 [Demo] Salty Potato Chips
              </button>
              <button
                type="button"
                className="nl-chip"
                onClick={() => handlePresetSelect("soda")}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                🥤 [Demo] Fizzy Cola Soda
              </button>
            </div>
          </Card>
        </>
      )}

      {/* STEP 2: PREVIEW & RETAKE */}
      {step === "preview" && (
        <Card style={{ padding: "20px", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
              Label Image Preview
            </h3>
            <button
              type="button"
              onClick={handleRetake}
              style={{
                background: "none",
                border: "none",
                color: "var(--nl-text-muted)",
                fontSize: "0.82rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Remove
            </button>
          </div>

          <div
            style={{
              maxHeight: "320px",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              border: "1px solid var(--nl-border)",
            }}
          >
            {imageSrc && imageSrc.startsWith("preset:") ? (
              <div
                style={{
                  padding: "30px",
                  color: "var(--nl-text-sub)",
                  fontSize: "0.9rem",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
                  📋
                </div>
                <strong>Preset Sample Label:</strong>
                <div
                  style={{
                    textTransform: "capitalize",
                    fontWeight: 700,
                    color: "var(--nl-teal-dark)",
                  }}
                >
                  {imageSrc.replace("preset:", "")}
                </div>
              </div>
            ) : (
              <img
                src={imageSrc}
                alt="Captured Label"
                style={{
                  width: "100%",
                  maxHeight: "320px",
                  objectFit: "contain",
                }}
              />
            )}
          </div>

          {ocrError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                color: "#dc2626",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                marginBottom: "16px",
              }}
            >
              {ocrError}
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleAnalyzeImage}
              disabled={ocrLoading}
            >
              {ocrLoading
                ? "Reading Label with OCR Engine..."
                : "Scan & Extract Data with OCR →"}
            </Button>

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handleRetake}
            >
              Retake / Change Photo
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: USER VERIFICATION FORM */}
      {step === "verifying" && (
        <form onSubmit={handleConfirmAndAnalyze}>
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "var(--nl-radius-md)",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "0.82rem",
              color: "#1e40af",
            }}
          >
            <strong>🔍 Please Review & Verify Extracted Label Data:</strong>
            <div
              style={{
                marginTop: "3px",
                color: "#2563eb",
                lineHeight: 1.4,
              }}
            >
              Values below were recognized directly from your image. You can
              correct any numbers or enter missing details before analyzing the
              score.
            </div>

            {rawOcrText && (
              <details style={{ marginTop: "8px", fontSize: "0.78rem" }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#1d4ed8",
                  }}
                >
                  📄 View Raw OCR Text Recognized by Camera
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    marginTop: "6px",
                    fontSize: "0.72rem",
                    background: "#ffffff",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    maxHeight: "120px",
                    overflowY: "auto",
                  }}
                >
                  {rawOcrText}
                </pre>
              </details>
            )}
          </div>

          <Card style={{ padding: "18px", marginBottom: "16px" }}>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "var(--nl-text-main)",
                marginBottom: "12px",
              }}
            >
              Product Information
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "4px",
                  }}
                >
                  Product Name
                </label>
                <input
                  type="text"
                  name="productName"
                  placeholder="e.g. Rolled Oat Bar"
                  value={formData.productName}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "4px",
                  }}
                >
                  Serving Size (e.g. 30g, 1 can)
                </label>
                <input
                  type="text"
                  name="servingSize"
                  placeholder="e.g. 30g"
                  value={formData.servingSize}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>
            </div>

            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "var(--nl-text-main)",
                marginBottom: "12px",
              }}
            >
              Nutrition Facts (per serving)
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  name="calories"
                  placeholder="e.g. 150"
                  value={formData.calories}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="protein"
                  placeholder="e.g. 5"
                  value={formData.protein}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Total Sugar (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="totalSugar"
                  placeholder="e.g. 6"
                  value={formData.totalSugar}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Added Sugar (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="addedSugar"
                  placeholder="e.g. 2"
                  value={formData.addedSugar}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Dietary Fiber (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="fiber"
                  placeholder="e.g. 4"
                  value={formData.fiber}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Sodium (mg)
                </label>
                <input
                  type="number"
                  name="sodium"
                  placeholder="e.g. 95"
                  value={formData.sodium}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Total Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="totalFat"
                  placeholder="e.g. 3"
                  value={formData.totalFat}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--nl-text-sub)",
                    marginBottom: "3px",
                  }}
                >
                  Saturated Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="saturatedFat"
                  placeholder="e.g. 0.5"
                  value={formData.saturatedFat}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--nl-border)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "var(--nl-text-sub)",
                  marginBottom: "4px",
                }}
              >
                Ingredients (comma-separated)
              </label>
              <textarea
                name="ingredients"
                rows="3"
                placeholder="e.g. Oats, almond butter, chia seeds, salt"
                value={formData.ingredients}
                onChange={handleFormChange}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.8rem",
                  borderRadius: "8px",
                  border: "1px solid var(--nl-border)",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </Card>

          {ocrError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                color: "#dc2626",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                marginBottom: "16px",
              }}
            >
              {ocrError}
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={analyzing}
            >
              {analyzing
                ? "Computing NutriLens Score..."
                : "Confirm & Analyze Score →"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setStep("preview")}
            >
              ← Back to Photo
            </Button>
          </div>
        </form>
      )}

      {/* STEP 4: ANALYSIS RESULTS & ADD TO COMPARISON */}
      {step === "result" && analysisResult && (
        <div>
          <div
            style={{
              background: "#f0fdf9",
              border: "1px solid #ccfbf1",
              borderRadius: "var(--nl-radius-md)",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "0.82rem",
              color: "#0f766e",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>✓ Scanned label analyzed with unified scoring engine</span>
            <button
              type="button"
              onClick={handleRetake}
              style={{
                background: "none",
                border: "none",
                color: "#0d9488",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Scan Another
            </button>
          </div>

          <Card style={{ padding: "20px", marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "var(--nl-teal-dark)",
                    background: "var(--nl-teal-light)",
                    padding: "3px 8px",
                    borderRadius: "var(--nl-radius-full)",
                    textTransform: "uppercase",
                  }}
                >
                  Offline Scanned Item
                </span>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    margin: "6px 0 2px",
                    color: "var(--nl-text-main)",
                  }}
                >
                  {analysisResult.product.name}
                </h2>
                <span
                  style={{ fontSize: "0.8rem", color: "var(--nl-text-sub)" }}
                >
                  Serving Size: {analysisResult.product.serving_size}
                </span>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    justifyContent: "flex-end",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "var(--nl-teal-dark)",
                    }}
                  >
                    {analysisResult.product.health_score}
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--nl-text-muted)",
                    }}
                  >
                    /100
                  </span>
                  <ScoreBadge score={analysisResult.product.health_score} />
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--nl-text-muted)",
                  }}
                >
                  NutriLens Health Score
                </span>
              </div>
            </div>

            {/* Factor Explanations */}
            <div
              style={{
                background: "#fafafa",
                borderRadius: "var(--nl-radius-md)",
                padding: "12px",
                marginBottom: "14px",
                fontSize: "0.8rem",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {analysisResult.scoreEvaluation?.positives?.length > 0 && (
                <div>
                  <strong
                    style={{
                      color: "#0f766e",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    ✓ Why it scored well:
                  </strong>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      color: "var(--nl-text-main)",
                    }}
                  >
                    {analysisResult.scoreEvaluation.positives.map(
                      (pos, idx) => (
                        <li key={idx}>{pos}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {analysisResult.scoreEvaluation?.negatives?.length > 0 && (
                <div>
                  <strong
                    style={{
                      color: "#b45309",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    ⚠ Areas of concern:
                  </strong>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      color: "var(--nl-text-main)",
                    }}
                  >
                    {analysisResult.scoreEvaluation.negatives.map(
                      (neg, idx) => (
                        <li key={idx}>{neg}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Nutrition Breakdown Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "6px",
                fontSize: "0.78rem",
                background: "#f8fafc",
                padding: "8px 10px",
                borderRadius: "var(--nl-radius-md)",
                textAlign: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.66rem",
                    color: "var(--nl-text-muted)",
                    display: "block",
                  }}
                >
                  Calories
                </span>
                <strong>
                  {analysisResult.product.calories !== null
                    ? analysisResult.product.calories
                    : "—"}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.66rem",
                    color: "var(--nl-text-muted)",
                    display: "block",
                  }}
                >
                  Sugar
                </span>
                <strong>
                  {analysisResult.product.total_sugar !== null
                    ? analysisResult.product.total_sugar + "g"
                    : "—"}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.66rem",
                    color: "var(--nl-text-muted)",
                    display: "block",
                  }}
                >
                  Sodium
                </span>
                <strong>
                  {analysisResult.product.sodium !== null
                    ? analysisResult.product.sodium + "mg"
                    : "—"}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.66rem",
                    color: "var(--nl-text-muted)",
                    display: "block",
                  }}
                >
                  Fiber
                </span>
                <strong>
                  {analysisResult.product.fiber !== null
                    ? analysisResult.product.fiber + "g"
                    : "—"}
                </strong>
              </div>
            </div>
          </Card>

          {/* Add to Comparison Action */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              variant={
                isProductSelected(analysisResult.product.id)
                  ? "outline"
                  : "primary"
              }
              size="md"
              fullWidth
              onClick={() => toggleProductSelection(analysisResult.product)}
            >
              {isProductSelected(analysisResult.product.id)
                ? "✓ In Comparison Tray (Tap to Remove)"
                : "＋ Add to Product Comparison"}
            </Button>

            {selectedProducts.length > 0 && (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => navigate("/compare")}
              >
                Compare ({selectedProducts.length}) Products Now →
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handleRetake}
            >
              📷 Scan Another Food Label
            </Button>

            {/* Reusable Comparison Tray */}
            {selectedProducts.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <ComparisonTray inline onAddAnother={handleRetake} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
