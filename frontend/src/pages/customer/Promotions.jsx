/**
 * Promotions.jsx
 * Trang tổng hợp các chương trình ưu đãi, khuyến mãi & poster sự kiện của Cao Hiển Studio.
 * Đồng bộ 100% với hệ thống Design System (Light Luxury) của các trang Services, Galleries, CameraRentals.
 */
import React, { useState, useEffect } from "react";
import { Row, Col, Spin, Empty, Modal, Tag } from "antd";
import {
  GiftOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  EyeOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

const Promotions = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState(null);

  const resolveImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const backendBase = API_URL.replace(/\/api\/?$/, "");
    return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";
    window.scrollTo(0, 0);

    const fetchActivePromotions = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/banners`);
        setBanners(res.data?.banners || []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách ưu đãi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePromotions();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // IntersectionObserver kích hoạt hiệu ứng scroll-reveal đồng bộ với toàn website
  useEffect(() => {
    if (loading) return;

    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, banners]);

  return (
    <div
      className="home-page-container"
      style={{
        width: "100%",
        background: "#FAF7F2",
        minHeight: "100vh",
        padding: "80px 0 100px 0",
      }}
    >
      {/* Ambient Spotlight Lights đồng bộ */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }} />
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>
        {/* HEADER SECTION CHUẨN DESIGN SYSTEM CAO HIỂN STUDIO */}
        <div style={{ textAlign: "center", marginBottom: "48px" }} className="scroll-reveal">
          <span
            style={{
              color: PRIMARY_COLOR,
              letterSpacing: "3px",
              fontSize: "11px",
              fontWeight: "600",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "15px",
            }}
          >
            Special Offers & Promotions
          </span>

          <h1
            className="font-serif-luxury"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 300,
              color: "#1F1F1F",
              margin: "0 0 16px 0",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            Chương Trình{" "}
            <span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>
              Ưu Đãi
            </span>
          </h1>

          {/* Họa tiết divider vàng kim đặc trưng */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              margin: "0 auto 20px",
            }}
          >
            <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
            <div style={{ width: 6, height: 6, background: PRIMARY_COLOR, transform: "rotate(45deg)" }} />
            <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
          </div>

          <p
            style={{
              color: "#555555",
              fontSize: "15.5px",
              fontWeight: 300,
              letterSpacing: "0.5px",
              maxWidth: 740,
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            Lưu giữ trọn vẹn từng khoảnh khắc thiêng liêng và ngọt ngào với các gói dịch vụ cao cấp,
            đi kèm ưu đãi quà tặng và mức giá đặc quyền từ Cao Hiển Studio.
          </p>
        </div>

        {/* BANNER THÔNG TIN LIÊN HỆ & TƯ VẤN NHANH */}
        <div
          className="scroll-reveal"
          style={{
            background: "linear-gradient(135deg, #2F2F2F 0%, #1a1a1a 100%)",
            border: "1px solid #E8DED2",
            padding: "20px 28px",
            marginBottom: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 42,
                height: 42,
                border: "1px solid rgba(191,161,106,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PRIMARY_COLOR,
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              <GiftOutlined />
            </div>
            <div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                ĐẶC QUYỀN KHI ĐẶT LỊCH TRÊN WEBSITE
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12.5px", fontWeight: 300, marginTop: 2 }}>
                Áp dụng trực tiếp cho các hợp đồng chụp ảnh & thuê thiết bị trong thời gian diễn ra chương trình
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a
              href="tel:0979767602"
              style={{
                color: PRIMARY_COLOR,
                fontSize: "17px",
                fontWeight: 700,
                letterSpacing: 1,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <PhoneOutlined /> 0979 767 602
            </a>
          </div>
        </div>

        {/* DANH SÁCH CÁC CHƯƠNG TRÌNH ƯU ĐÃI */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: "#8C827A", fontSize: 13, letterSpacing: 1 }}>
              ĐANG TẢI DỮ LIỆU ƯU ĐÃI...
            </div>
          </div>
        ) : banners.length === 0 ? (
          <div
            className="scroll-reveal"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8DED2",
              padding: "70px 24px",
              textAlign: "center",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <h3 className="font-serif-luxury" style={{ color: "#2F2F2F", fontSize: 22, fontWeight: 400 }}>
                    Hiện chưa có chương trình ưu đãi mới
                  </h3>
                  <p style={{ color: "#777", maxWidth: 520, margin: "10px auto 24px auto", fontSize: 14, lineHeight: 1.8 }}>
                    Các ưu đãi theo mùa đang được hoàn thiện. Quý khách vui lòng liên hệ hotline hoặc theo dõi
                    Fanpage để được tư vấn gói dịch vụ phù hợp nhất.
                  </p>
                </div>
              }
            >
              <button
                type="button"
                className="btn-premium-gold"
                onClick={() => window.open(import.meta.env.VITE_ZALO_URL || "https://zalo.me/0979767602", "_blank")}
              >
                LIÊN HỆ TƯ VẤN NGAY <ArrowRightOutlined />
              </button>
            </Empty>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {banners.map((item, index) => {
              const imgUrl = resolveImageUrl(item.imageUrl);
              return (
                <div
                  key={item._id || index}
                  className="scroll-reveal"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8DED2",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = PRIMARY_COLOR;
                    e.currentTarget.style.boxShadow = "0 15px 35px rgba(154, 138, 120, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E8DED2";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Row gutter={0} align="stretch">
                    {/* CỘT ẢNH POSTER */}
                    {imgUrl && (
                      <Col xs={24} lg={10} style={{ display: "flex" }}>
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            minHeight: 340,
                            maxHeight: 520,
                            background: "#181513",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() => setSelectedPoster(item)}
                        >
                          <img
                            src={imgUrl}
                            alt={item.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                          />

                          {/* Badge giảm giá góc trên ảnh */}
                          {item.discount_percent > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: 16,
                                left: 16,
                                background: PRIMARY_COLOR,
                                color: "#FFFFFF",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "1.5px",
                                padding: "6px 14px",
                                textTransform: "uppercase",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                              }}
                            >
                              <GiftOutlined /> -{item.discount_percent}% ƯU ĐÃI
                            </div>
                          )}

                          {/* Nút xem phóng to poster */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: 16,
                              right: 16,
                              background: "rgba(24, 21, 19, 0.85)",
                              backdropFilter: "blur(6px)",
                              color: "#E2C896",
                              border: "1px solid rgba(191,161,106,0.5)",
                              padding: "6px 14px",
                              fontSize: "11px",
                              fontWeight: 600,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <EyeOutlined /> Phóng to Poster
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* CỘT THÔNG TIN CHI TIẾT */}
                    <Col xs={24} lg={imgUrl ? 14 : 24}>
                      <div
                        style={{
                          padding: "40px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          height: "100%",
                        }}
                      >
                        <div>
                          {/* Metadata row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              flexWrap: "wrap",
                              marginBottom: 16,
                            }}
                          >
                            <span
                              style={{
                                color: PRIMARY_COLOR,
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "2px",
                                textTransform: "uppercase",
                              }}
                            >
                              ✦ CHƯƠNG TRÌNH KHUYẾN MÃI
                            </span>
                            <span style={{ color: "#CCC" }}>|</span>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#777",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <ClockCircleOutlined style={{ color: PRIMARY_COLOR }} />
                              Thời gian: {dayjs(item.start_date).format("DD/MM/YYYY")} –{" "}
                              {dayjs(item.end_date).format("DD/MM/YYYY")}
                            </span>
                          </div>

                          {/* Tiêu đề gói chụp */}
                          <h2
                            className="font-serif-luxury"
                            style={{
                              fontSize: "clamp(22px, 2.2vw, 28px)",
                              fontWeight: 400,
                              color: "#1F1F1F",
                              margin: "0 0 16px 0",
                              lineHeight: 1.35,
                            }}
                          >
                            {item.title}
                          </h2>

                          {/* Mô tả chi tiết */}
                          {item.description && (
                            <p
                              style={{
                                color: "#555555",
                                fontSize: "14.5px",
                                lineHeight: 1.8,
                                fontWeight: 300,
                                margin: "0 0 24px 0",
                                whiteSpace: "pre-line",
                              }}
                            >
                              {item.description}
                            </p>
                          )}

                          {/* Box quyền lợi chuẩn style light luxury */}
                          <div
                            style={{
                              background: "#FAF7F2",
                              border: "1px solid #E8DED2",
                              padding: "18px 22px",
                              marginBottom: 28,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "2px",
                                color: PRIMARY_COLOR,
                                textTransform: "uppercase",
                                marginBottom: 10,
                              }}
                            >
                              ĐẶC QUYỀN GÓI DỊCH VỤ
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "13.5px", color: "#4F4F4F", lineHeight: 1.6 }}>
                                <CheckOutlined style={{ color: PRIMARY_COLOR, marginTop: 4 }} />
                                <span>Chỉnh sửa màu sắc & độ nét kỹ thuật số chuẩn phong cách Fine Art chuyên nghiệp.</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "13.5px", color: "#4F4F4F", lineHeight: 1.6 }}>
                                <CheckOutlined style={{ color: PRIMARY_COLOR, marginTop: 4 }} />
                                <span>Được hỗ trợ tư vấn trang phục, phụ kiện và bối cảnh phù hợp với từng câu chuyện cưới.</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "13.5px", color: "#4F4F4F", lineHeight: 1.6 }}>
                                <CheckOutlined style={{ color: PRIMARY_COLOR, marginTop: 4 }} />
                                <span>Cam kết minh bạch giá dịch vụ, không phát sinh phụ phí ngoài hợp đồng cam kết.</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nút hành động chuẩn class .btn-premium của website */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            flexWrap: "wrap",
                            paddingTop: 24,
                            borderTop: "1px solid #E8DED2",
                          }}
                        >
                          <div style={{ color: "#777", fontSize: "13px" }}>
                            Hotline tư vấn: <strong style={{ color: "#2F2F2F" }}>0979 767 602</strong>
                          </div>

                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {imgUrl && (
                              <button
                                type="button"
                                className="btn-premium-outline"
                                onClick={() => setSelectedPoster(item)}
                                style={{ height: "44px", padding: "0 22px", fontSize: "11px" }}
                              >
                                <EyeOutlined /> XEM POSTER
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn-premium-gold"
                              onClick={() => navigate(item.linkUrl || "/booking")}
                              style={{ height: "44px", padding: "0 26px", fontSize: "11px" }}
                            >
                              ĐẶT LỊCH NGAY <ArrowRightOutlined />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PHÓNG TO POSTER ĐỒNG BỘ NGHỆ THUẬT */}
      <Modal
        open={Boolean(selectedPoster)}
        onCancel={() => setSelectedPoster(null)}
        footer={null}
        centered
        width={580}
        styles={{
          mask: {
            backgroundColor: "rgba(24, 21, 19, 0.8)",
            backdropFilter: "blur(6px)",
          },
          content: {
            padding: 0,
            borderRadius: 0,
            border: "1px solid #E8DED2",
            overflow: "hidden",
            backgroundColor: "#181513",
          },
          body: { padding: 0 },
        }}
      >
        {selectedPoster && (
          <div style={{ backgroundColor: "#181513", color: "#FFFFFF" }}>
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid rgba(191,161,106,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#241F1A",
              }}
            >
              <div style={{ color: PRIMARY_COLOR, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
                ✦ CHI TIẾT ẤN PHẨM POSTER ✦
              </div>
              {selectedPoster.discount_percent > 0 && (
                <span
                  style={{
                    background: PRIMARY_COLOR,
                    color: "#181513",
                    fontWeight: 700,
                    fontSize: "11px",
                    padding: "3px 8px",
                    letterSpacing: "1px",
                  }}
                >
                  -{selectedPoster.discount_percent}%
                </span>
              )}
            </div>

            {/* Poster image container */}
            <div style={{ textAlign: "center", padding: "16px 0", background: "#0E0D0C" }}>
              <img
                src={resolveImageUrl(selectedPoster.imageUrl)}
                alt={selectedPoster.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "68vh",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>

            {/* Modal Action Bottom */}
            <div
              style={{
                padding: "18px 24px",
                borderTop: "1px solid rgba(191,161,106,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                background: "#1E1A16",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                Hotline hỗ trợ: <strong style={{ color: "#FFFFFF" }}>0979 767 602</strong>
              </div>

              <button
                type="button"
                className="btn-premium-gold"
                style={{ height: "42px", padding: "0 24px", fontSize: "11px" }}
                onClick={() => {
                  const target = selectedPoster.linkUrl || "/booking";
                  setSelectedPoster(null);
                  navigate(target);
                }}
              >
                ĐẶT LỊCH NGAY <ArrowRightOutlined />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Promotions;
