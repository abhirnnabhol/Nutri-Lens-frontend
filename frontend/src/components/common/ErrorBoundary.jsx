import React from "react";

/**
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the tree.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/home";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            background: "var(--nl-bg, #f8faf9)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              marginBottom: "16px",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "var(--nl-text-main, #141b24)",
              marginBottom: "8px",
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--nl-text-sub, #5f6f82)",
              maxWidth: "320px",
              marginBottom: "24px",
              lineHeight: 1.4,
            }}
          >
            {this.state.error?.message ||
              "An unexpected error occurred while loading this screen."}
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              width: "100%",
              maxWidth: "320px",
            }}
          >
            <button
              type="button"
              className="nl-btn-submit"
              onClick={this.handleReset}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
