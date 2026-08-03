/**
 * ZaloWidget.jsx
 * Component nút Zalo nổi (Floating Action Button) phong cách Light Luxury đồng bộ với Cao Hiển Studio.
 * Nằm ở góc dưới bên phải, xếp cùng phía với AI Chatbot Widget.
 */
import React, { useState } from "react";
import { Tooltip, Modal, Button, message } from "antd";
import { CopyOutlined, MessageOutlined } from "@ant-design/icons";
import "./ZaloWidget.css";

// SVG Logo Zalo sang trọng khớp với Vibe Cao Hiển Studio (#BFA16A)
export const ZaloIcon = ({ size = 32, color = "#BFA16A", textColor = "#ffffff", style = {} }) => (
  <svg
    viewBox="0 0 500 500"
    width={size}
    height={size}
    style={{ display: "block", ...style }}
  >
    <rect width="500" height="500" rx="110" fill={color} />
    <text
      x="50%"
      y="55%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill={textColor}
      fontFamily="Arial, 'Helvetica Neue', sans-serif"
      fontWeight="900"
      fontSize="145"
      letterSpacing="-2px"
    >
      Zalo
    </text>
  </svg>
);

const ZaloWidget = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const zaloPhone = import.meta.env.VITE_ZALO_PHONE || "0979767602";
  const zaloUrl = import.meta.env.VITE_ZALO_URL || `https://zalo.me/${zaloPhone}`;

  const formattedPhone = zaloPhone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");

  const handleOpenZalo = (e) => {
    e.preventDefault();
    window.open(zaloUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(zaloPhone);
    message.success("Đã sao chép số Hotline / Zalo: " + formattedPhone);
  };

  return (
    <>
      <Tooltip
        title={`Chat Zalo cùng Studio (${formattedPhone})`}
        placement="left"
      >
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="zalo-chat-fab"
          onClick={handleOpenZalo}
          aria-label="Liên hệ Zalo Hotline"
        >
          <div className="zalo-fab-circle">
            <ZaloIcon size={30} color="#BFA16A" textColor="#ffffff" />
          </div>
          <span className="zalo-fab-label">Chat Zalo</span>
        </a>
      </Tooltip>

      {/* Modal QR Code Zalo */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ZaloIcon size={24} color="#BFA16A" />
            <span style={{ fontWeight: 600, color: "#1f1f1f" }}>Zalo Hotline Cao Hiển Studio</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyPhone}>
            Sao chép SĐT
          </Button>,
          <Button
            key="chat"
            type="primary"
            style={{ background: "#BFA16A", borderColor: "#BFA16A" }}
            icon={<MessageOutlined />}
            onClick={() => {
              window.open(zaloUrl, "_blank");
              setModalVisible(false);
            }}
          >
            Mở Chat Zalo
          </Button>,
        ]}
        centered
        width={360}
      >
        <div className="zalo-modal-content">
          <p style={{ color: "#666", marginBottom: 12 }}>
            Quét mã QR bên dưới hoặc nhấn <strong>Mở Chat Zalo</strong> để bắt đầu trò chuyện trực tiếp:
          </p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              zaloUrl
            )}`}
            alt="Mã QR Zalo Cao Hiển Studio"
            className="zalo-qr-image"
          />
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#BFA16A",
              marginTop: 10,
            }}
          >
            Hotline / Zalo: {formattedPhone}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ZaloWidget;
