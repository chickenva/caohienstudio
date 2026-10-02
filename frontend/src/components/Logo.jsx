/**
 * Logo.jsx
 * Component logo Cao Hiển Studio dạng text/image, dùng chung toàn site.
 */
import React from "react";
import logoSymbol from "../assets/logo-symbol.png";

// Component logo dùng lại ở header/layout với tùy chọn kích thước và màu chữ.
const Logo = ({ size = 36, showText = true, textColor = "#BFA16A", style = {}, ...props }) => {
  const goldColor = "#BFA16A";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        userSelect: "none",
        ...style,
      }}
      {...props}
    >
      <img
        src={logoSymbol}
        alt="Cao Hiển Studio"
        style={{
          height: `${size}px`,
          width: "auto",
          maxHeight: `${size}px`,
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
      />

      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: "1", textAlign: "left" }}>
          <span
            style={{
              fontFamily: '"Playfair Display", "Didot", "Times New Roman", serif',
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: textColor,
              textTransform: "uppercase",
            }}
          >
            CΛO HIỂN
          </span>
          <span
            style={{
              fontFamily: '"Outfit", "Montserrat", sans-serif',
              fontSize: "8.5px",
              fontWeight: 500,
              letterSpacing: "4.5px",
              color: goldColor,
              marginTop: "3px",
              textTransform: "uppercase",
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