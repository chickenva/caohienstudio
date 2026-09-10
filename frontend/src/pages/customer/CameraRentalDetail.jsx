/**
 * CameraRentalDetail.jsx
 * Trang chi tiết thiết bị cho thuê — hiển thị gallery ảnh, thông số kỹ thuật,
 * giá thuê, tiền cọc và thông tin liên hệ. KHÔNG có chức năng đặt trực tiếp.
 */
import React, { useState, useEffect } from "react";
import { Spin, message, Tag, Button, Image, Row, Col, Empty } from "antd";
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FALLBACK_CAMERA = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const CONDITION_MAP = {
  NEW: { label: "Mới 100%", color: "green" },
  LIKE_NEW: { label: "Như mới", color: "blue" },
  GOOD: { label: "Tốt", color: "orange" },
};

const CATEGORY_MAP = {
  BODY: "Thân máy (Body)",
  LENS: "Ống kính (Lens)",
  ACCESSORY: "Phụ kiện",
  KIT: "Bộ Kit",
};

const CameraRentalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [camera, setCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";
    fetchCamera();
    return () => { document.body.style.backgroundColor = ""; };
  }, [id]);

  const fetchCamera = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/camera-rentals/${id}`);
      setCamera(res.data?.camera || null);
    } catch (err) {
      message.error("Không tìm thấy thiết bị");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!camera) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
        <Empty description="Không tìm thấy thiết bị" />
      </div>
    );
  }

  const allImages = camera.images && camera.images.length > 0 ? camera.images : [camera.thumbnail || FALLBACK_CAMERA];

  return (
    <div className="home-page-container" style={{ minHeight: "100vh", padding: "100px 0 60px" }}>
      <div className="glow-spotlight-light" style={{ top: "5%", left: "3%" }} />
      <div className="glow-spotlight-light" style={{ bottom: "10%", right: "5%" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>
        {/* Back button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/camera-rental")}
          type="text"
          style={{ marginBottom: 24, color: "#555", fontWeight: 500 }}
        >
          Quay lại danh sách
        </Button>

        <Row gutter={[40, 32]}>
          {/* Left: Image Gallery */}
          <Col xs={24} md={12}>
            <div style={{ position: "relative" }}>
              {/* Main Image */}
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid #EDE8E1",
                  marginBottom: 12,
                }}
              >
                <Image
                  src={allImages[selectedImage] || FALLBACK_CAMERA}
                  alt={camera.name}
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
                  fallback={FALLBACK_CAMERA}
                  preview={{ mask: "Xem ảnh lớn" }}
                />
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      style={{
                        width: 72,
                        height: 54,
                        borderRadius: 6,
                        overflow: "hidden",
                        cursor: "pointer",
                        border: idx === selectedImage ? `2px solid ${PRIMARY_COLOR}` : "1px solid #EDE8E1",
                        flexShrink: 0,
                        opacity: idx === selectedImage ? 1 : 0.6,
                        transition: "all 0.2s",
                      }}
                    >
                      <img
                        src={img}
                        alt={`${camera.name} ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.src = FALLBACK_CAMERA; }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          {/* Right: Info */}
          <Col xs={24} md={12}>
            {/* Brand & Category */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {camera.brand && (
                <Tag style={{ fontSize: 11, fontWeight: 600, borderRadius: 4 }}>
                  {camera.brand}
                </Tag>
              )}
              {camera.category && (
                <Tag color="default" style={{ fontSize: 11, borderRadius: 4 }}>
                  {CATEGORY_MAP[camera.category] || camera.category}
                </Tag>
              )}
              {camera.condition && (
                <Tag color={CONDITION_MAP[camera.condition]?.color} style={{ fontSize: 11, borderRadius: 4 }}>
                  {CONDITION_MAP[camera.condition]?.label}
                </Tag>
              )}
            </div>

            {/* Name */}
            <h1
              className="font-serif-luxury"
              style={{
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 400,
                color: "#1F1F1F",
                margin: "0 0 8px 0",
                lineHeight: 1.2,
              }}
            >
              {camera.name}
            </h1>

            {/* Availability */}
            <div style={{ marginBottom: 20 }}>
              <Tag
                icon={camera.is_available ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                color={camera.is_available ? "success" : "error"}
                style={{ fontSize: 13, padding: "4px 12px" }}
              >
                {camera.is_available ? "Sẵn sàng cho thuê" : "Đang cho thuê"}
              </Tag>
            </div>

            {/* Price */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #EDE8E1",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    Giá thuê / ngày
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: PRIMARY_COLOR }}>
                    {Number(camera.rental_price_per_day || 0).toLocaleString("vi-VN")}đ
                  </div>
                </div>
                <CameraOutlined style={{ fontSize: 32, color: "#eee" }} />
              </div>
              {camera.deposit_amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f5f0ea", paddingTop: 12, fontSize: 14 }}>
                  <span style={{ color: "#888" }}>Tiền cọc yêu cầu</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>
                    {Number(camera.deposit_amount).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}
            </div>

            {/* Contact Box */}
            <div
              style={{
                background: "linear-gradient(135deg, #2F2F2F 0%, #1a1a1a 100%)",
                borderRadius: 12,
                padding: "24px",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <PhoneOutlined style={{ color: PRIMARY_COLOR, fontSize: 24, marginBottom: 8 }} />
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 300, marginBottom: 8 }}>
                Để thuê thiết bị này, vui lòng liên hệ
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: PRIMARY_COLOR, letterSpacing: 1, marginBottom: 12 }}>
                0123 456 789
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 300 }}>
                Hotline / Zalo — Hỗ trợ từ 8:00 – 21:00 hàng ngày
              </div>
            </div>

            {/* Description */}
            {camera.description && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Mô tả
                </div>
                <div style={{ color: "#555", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                  {camera.description}
                </div>
              </div>
            )}

            {/* Specifications */}
            {camera.specifications && camera.specifications.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  Thông số kỹ thuật
                </div>
                <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 10, overflow: "hidden" }}>
                  {camera.specifications.map((spec, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        color: "#444",
                        borderBottom: idx < camera.specifications.length - 1 ? "1px solid #f5f0ea" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY_COLOR, flexShrink: 0 }} />
                      {spec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CameraRentalDetail;
