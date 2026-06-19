import React from "react";

const Logo = ({ size = 36, showText = true, textColor = "#2F2F2F", style = {}, ...props }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        userSelect: "none",
        ...style,
      }}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fill: "none",
          flexShrink: 0,
        }}
      >
        {/* Left arc (C) */}
        <path
          d="M 40 14 A 36 36 0 0 0 40 86"
          stroke="#BFA16A"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
        {/* Middle vertical stem of H */}
        <line
          x1="50"
          y1="10"
          x2="50"
          y2="90"
          stroke="#BFA16A"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
        {/* Right semicircle of H */}
        <path
          d="M 50 14 A 36 36 0 0 1 86 50 A 36 36 0 0 1 50 86"
          stroke="#BFA16A"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
        {/* H crossbar */}
        <line
          x1="50"
          y1="50"
          x2="86"
          y2="50"
          stroke="#BFA16A"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.1", textAlign: "left" }}>
          <span
            style={{
              fontFamily: '"Playfair Display", "Times New Roman", serif',
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              color: textColor,
            }}
          >
            CAO HIỂN
          </span>
          <span
            style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: "8.5px",
              fontWeight: 500,
              letterSpacing: "4.5px",
              color: textColor === "#ffffff" || textColor === "#fff" ? "#aaa" : "#888",
              marginTop: "2.5px",
            }}
          >
            STUDIO
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
