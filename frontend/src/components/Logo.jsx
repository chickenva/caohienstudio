/**
 * Logo.jsx
 * Component logo Cao Hiển Studio dạng text/image, dùng chung toàn site.
 */
import React from "react";

// Component logo dùng lại ở header/layout với tùy chọn kích thước và màu chữ.
const Logo = ({ size = 36, showText = true, textColor = "#C1A67B", style = {}, ...props }) => {
  const goldColor = "#C1A67B";

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
      <svg
        viewBox="0 0 100 100"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fill: "none",
          flexShrink: 0,
        }}
      >
        <g fill={goldColor}>
          {/* NỬA TRÁI (Chữ C)
             - Độ dày chuẩn 15px (Bán kính ngoài 45, bán kính trong 30)
             - Mặt cắt đứng tại tọa độ x = 37.5
          */}
          <path
            d="
              M 37.5 6.77 
              A 45 45 0 0 0 37.5 93.23 
              L 37.5 77.27 
              A 30 30 0 0 1 37.5 22.73 
              Z
            "
          />

          {/* NỬA PHẢI (Chữ h/b cách điệu)
             - Cột giữa có độ rộng chuẩn 15px (x từ 42.5 đến 57.5)
             - Khoảng hở đáy (gap) rộng 5px (x từ 57.5 đến 62.5)
             - Nét chéo 45 độ thanh thoát, giữ nguyên độ dày 15px 
          */}
          <path
            d="
              M 42.5 5.63 
              A 45 45 0 0 1 57.5 5.63 
              L 57.5 36.29 
              L 78.56 15.23 
              A 45 45 0 0 1 62.5 93.23 
              L 62.5 77.27 
              A 30 30 0 0 0 77.34 37.66 
              L 57.5 57.5 
              L 57.5 94.37 
              A 45 45 0 0 1 42.5 94.37 
              Z
            "
          />
        </g>
      </svg>

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