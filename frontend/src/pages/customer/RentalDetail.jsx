import React, { useEffect, useState } from "react";
import { Row, Col, Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  CameraOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

const typeLabels = {
  CAMERA: "Máy ảnh",
  LENS: "Ống kính",
  LIGHT: "Đèn",
  STUDIO: "Studio",
  ACCESSORY: "Phụ kiện",
};

const RentalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";
    fetchResourceDetail();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [id]);

  // Scroll reveals trigger
  useEffect(() => {
    if (loading) return;

    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observerOptions = {
      root: null,
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, [loading, resource]);

  const fetchResourceDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/resources/rentals/${id}`,
      );
      setResource(res.data);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải chi tiết thiết bị",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContactRental = () => {
    navigate("/contact", {
      state: {
        contactMessage: `Tôi muốn thuê thiết bị ${resource.name}. Vui lòng tư vấn giúp tôi về giá thuê, tiền cọc, giấy tờ cần chuẩn bị, hợp đồng thuê và thời gian nhận/trả thiết bị.`,
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "150px 0", background: "#FAF7F2" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", background: "#FAF7F2", color: "#777777" }}>
        Không tìm thấy thiết bị. Vui lòng quay lại danh sách thiết bị.
      </div>
    );
  }

  return (
    <div className="home-page-container" style={{ background: "#FAF7F2", minHeight: "100vh", width: "100%" }}>
      {/* Ambient spotlights */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "50%", right: "5%" }}></div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px 100px 20px" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/rentals")}
          className="btn-premium-outline scroll-reveal"
          style={{ marginBottom: 40, height: "42px", padding: "0 22px", fontSize: "11px" }}
        >
          <ArrowLeftOutlined style={{ marginRight: "6px" }} /> QUAY LẠI DANH SÁCH
        </button>

        <Row gutter={[60, 40]} className="scroll-reveal stagger-1">
          {/* Left Column: Image wrapper */}
          <Col xs={24} md={11}>
            <div
              style={{
                background: "rgba(250, 247, 242, 0.4)",
                border: "1px solid #E8DED2",
                borderRadius: "0px",
                padding: "40px",
                textAlign: "center",
                boxShadow: "0 5px 15px rgba(154, 138, 120, 0.02)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "450px"
              }}
            >
              <img
                src={
                  resource.thumbnail ||
                  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000"
                }
                alt={resource.name}
                style={{
                  width: "100%",
                  maxHeight: 380,
                  objectFit: "contain",
                  mixBlendMode: "multiply",
                }}
              />
            </div>
          </Col>

          {/* Right Column: Metadata */}
          <Col xs={24} md={13}>
            {/* Badges tags */}
            <div style={{ marginBottom: 20, display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "1.5px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  padding: "4px 12px",
                  border: "1px solid rgba(191, 161, 106, 0.3)",
                  background: "rgba(191, 161, 106, 0.05)",
                  color: "#BFA16A"
                }}
              >
                {typeLabels[resource.type] || resource.type}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "1.5px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  padding: "4px 12px",
                  border: resource.status === "AVAILABLE" ? "1px solid rgba(191, 161, 106, 0.3)" : "1px solid #E8DED2",
                  background: resource.status === "AVAILABLE" ? "rgba(191, 161, 106, 0.05)" : "rgba(0, 0, 0, 0.02)",
                  color: resource.status === "AVAILABLE" ? "#BFA16A" : "#777777"
                }}
              >
                {resource.status === "AVAILABLE" ? "SẴN SÀNG" : "ĐANG ĐƯỢC THUÊ"}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-serif-luxury"
              style={{
                fontSize: "clamp(32px, 4.5vw, 48px)",
                fontWeight: "300",
                color: "#1F1F1F",
                marginBottom: "15px",
                lineHeight: "1.2"
              }}
            >
              {resource.name}
            </h1>

            {/* Price tag */}
            <div
              style={{
                fontSize: "26px",
                color: PRIMARY_COLOR,
                fontWeight: "600",
                marginBottom: "30px",
              }}
            >
              {resource.rental_price_per_day?.toLocaleString("vi-VN")}đ
              <span style={{ fontSize: "14px", color: "#777777", fontWeight: "300" }}>
                {" "}
                / ngày
              </span>
            </div>

            {/* Custom Descriptions grid */}
            <div style={{ border: "1px solid #E8DED2", background: "#FFFFFF", marginBottom: "35px" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #E8DED2", padding: "14px 20px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ width: "160px", color: "#777777", fontSize: "12.5px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "500" }}>Loại thiết bị</div>
                <div style={{ flex: 1, color: "#2F2F2F", fontSize: "14.5px", fontWeight: "500" }}>{typeLabels[resource.type] || resource.type}</div>
              </div>
              <div style={{ display: "flex", borderBottom: "1px solid #E8DED2", padding: "14px 20px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ width: "160px", color: "#777777", fontSize: "12.5px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "500" }}>Giá thuê / ngày</div>
                <div style={{ flex: 1, color: "#BFA16A", fontSize: "15px", fontWeight: "600" }}>{resource.rental_price_per_day?.toLocaleString("vi-VN")}đ</div>
              </div>
              <div style={{ display: "flex", borderBottom: "1px solid #E8DED2", padding: "14px 20px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ width: "160px", color: "#777777", fontSize: "12.5px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "500" }}>Tiền cọc yêu cầu</div>
                <div style={{ flex: 1, color: "#2F2F2F", fontSize: "15px", fontWeight: "600" }}>{resource.required_deposit_amount?.toLocaleString("vi-VN")}đ</div>
              </div>
              <div style={{ display: "flex", padding: "14px 20px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ width: "160px", color: "#777777", fontSize: "12.5px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "500" }}>Tình trạng</div>
                <div style={{ flex: 1, color: resource.status === "AVAILABLE" ? "#BFA16A" : "#777777", fontSize: "14.5px", fontWeight: "500" }}>
                  {resource.status === "AVAILABLE" ? "Sẵn sàng cho thuê" : "Tạm không sẵn sàng"}
                </div>
              </div>
            </div>

            {/* Specialties features */}
            <h3 className="font-serif-luxury" style={{ fontSize: "22px", fontWeight: "400", marginBottom: "20px", color: "#2F2F2F" }}>
              <CameraOutlined style={{ marginRight: 8, color: PRIMARY_COLOR }} />
              Cấu Hình Nổi Bật
            </h3>

            {resource.features?.length > 0 ? (
              <div style={{ marginBottom: "35px" }}>
                {resource.features.map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      color: "#555555",
                      marginBottom: "12px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <ToolOutlined
                      style={{ color: PRIMARY_COLOR }}
                    />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#888888", fontStyle: "italic", marginBottom: "35px" }}>Chưa có thông tin cấu hình.</p>
            )}

            {/* Safety notes box */}
            <div
              style={{
                background: "rgba(191, 161, 106, 0.05)",
                padding: "22px",
                border: "1px solid rgba(191, 161, 106, 0.15)",
                borderRadius: "0px",
                marginBottom: "35px",
                color: "#555555",
                lineHeight: "1.8",
                fontSize: "13.5px",
                fontFamily: "Outfit"
              }}
            >
              <SafetyCertificateOutlined
                style={{ marginRight: 8, color: PRIMARY_COLOR, fontSize: "16px" }}
              />
              Khi thuê thiết bị, khách hàng vui lòng mang theo căn cước công dân bản gốc, chuẩn bị tiền cọc hoặc tài sản thế chấp tương ứng theo yêu cầu và tiến hành ký hợp đồng thuê trực tiếp tại Cao Hiển Studio. Các phát sinh như trễ hạn, hao mòn hư hỏng sẽ được đối chiếu nghiệm thu khi trả thiết bị.
            </div>

            {/* Action CTA */}
            <button
              disabled={resource.status !== "AVAILABLE"}
              onClick={handleContactRental}
              className="btn-premium-gold"
              style={{
                width: "100%",
                height: "52px",
                justifyContent: "center",
                display: "inline-flex",
                background: resource.status === "AVAILABLE" ? "#BFA16A" : "#CCCCCC",
                boxShadow: resource.status === "AVAILABLE" ? "0 4px 15px rgba(191, 161, 106, 0.2)" : "none",
                cursor: resource.status === "AVAILABLE" ? "pointer" : "not-allowed"
              }}
            >
              <PhoneOutlined /> {resource.status === "AVAILABLE" ? "LIÊN HỆ THUÊ THIẾT BỊ NGAY" : "THIẾT BỊ TẠM KHÔNG SẴN SÀNG"}
            </button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RentalDetail;
