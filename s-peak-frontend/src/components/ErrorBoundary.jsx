import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: 12,
            fontFamily: "sans-serif",
            textAlign: "center",
            padding: 24,
          }}
        >
          <h2 style={{ margin: 0 }}>Something went wrong.</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Try refreshing the page. If it keeps happening, let us know.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              background: "#2F4A3F",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}