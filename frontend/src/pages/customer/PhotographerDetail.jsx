import React, { useEffect, useState } from "react";
import { Row, Col, Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

// Trang hồ sơ nhiếp ảnh gia và điều hướng đặt lịch theo người chụp.
const PhotographerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [photographer, setPhotographer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";
    fetchPhotographerDetail();

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
  }, [loading, photographer]);

  const fetchPhotographerDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/photographers/${id}`,
      );
      setPhotographer(res.data.photographer);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải chi tiết nhiếp ảnh gia",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    navigate("/booking", {
      state: {
        photographer_id: photographer._id,
        photographer_name: photographer.full_name,
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

  if (!photographer) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", background: "#FAF7F2", color: "#777777" }}>
        Không tìm thấy nhiếp ảnh gia. Vui lòng quay lại danh sách.
      </div>
    );
  }

  const portfolio = photographer.portfolio || {};

  return (
    <div className="home-page-container" style={{ background: "#FAF7F2", minHeight: "100vh", width: "100%" }}>
      {/* Ambient spotlights */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "50%", right: "5%" }}></div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px 100px 20px" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/photographers")}
          className="btn-premium-outline scroll-reveal"
          style={{ marginBottom: 40, height: "42px", padding: "0 22px", fontSize: "11px" }}
        >
          <ArrowLeftOutlined style={{ marginRight: "6px" }} /> QUAY LẠI DANH SÁCH
        </button>

        {/* Info detail */}
        <Row gutter={[60, 40]} align="middle" className="scroll-reveal stagger-1">
          {/* Avatar frame */}
          <Col xs={24} md={10}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8DED2",
                borderRadius: "0px",
                overflow: "hidden",
                padding: "16px",
                boxShadow: "0 5px 15px rgba(154, 138, 120, 0.02)"
              }}
            >
              <img
                src={
                  portfolio.avatar ||
                  "https://images.unsplash.com/photo-1554151228-14d9def656e4"
                }
                alt={photographer.full_name}
                style={{
                  width: "100%",
                  height: 520,
                  objectFit: "cover",
                  display: "block",
                  border: "1px solid #E8DED2"
                }}
              />
            </div>
          </Col>

          {/* Details metadata */}
          <Col xs={24} md={14}>
            <span
              style={{
                color: PRIMARY_COLOR,
                letterSpacing: 3,
                fontSize: 11,
                fontWeight: "600",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 15
              }}
            >
              {portfolio.years_of_experience || 3}+ NĂM KINH NGHIỆM
            </span>

            <h1
              className="font-serif-luxury"
              style={{
                fontSize: "clamp(38px, 5vw, 56px)",
                fontWeight: "300",
                margin: "0 0 25px 0",
                color: "#1F1F1F",
                lineHeight: "1.15"
              }}
            >
              {photographer.full_name}
            </h1>

            <div style={{ marginBottom: 30, display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(portfolio.specialties || ["Wedding", "Portrait"]).map(
                (item) => (
                  <span
                    key={item}
                    className="photographer-tag"
                    style={{
                      background: "rgba(191, 161, 106, 0.05)",
                      border: "1px solid rgba(191, 161, 106, 0.15)",
                      padding: "4px 12px",
                      fontSize: "11px",
                      letterSpacing: "1px",
                      color: "#BFA16A",
                      borderRadius: "0px",
                      textTransform: "uppercase",
                      display: "inline-block"
                    }}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <p
              style={{
                color: "#555555",
                fontSize: "15px",
                lineHeight: "2",
                marginBottom: "40px",
                fontWeight: "300"
              }}
            >
              {portfolio.bio ||
                "Một nhiếp ảnh gia đam mê việc bắt trọn những khoảnh khắc chân thực nhất, mang lại góc nhìn điện ảnh đầy tính tự sự và màu sắc lãng mạn."}
            </p>

            <button
              onClick={handleBooking}
              className="btn-premium-gold"
              style={{ height: "50px", padding: "0 40px", fontSize: "12px", display: "inline-flex" }}
            >
              ĐẶT LỊCH HẸN NGAY <CalendarOutlined />
            </button>
          </Col>
        </Row>

        {/* Portfolio Showcase Grid */}
        {(portfolio.featured_images || []).length > 0 && (
          <div style={{ marginTop: 85 }} className="scroll-reveal stagger-2">
            <h2
              className="font-serif-luxury"
              style={{
                fontSize: "32px",
                fontWeight: "300",
                marginBottom: "35px",
                color: "#1F1F1F"
              }}
            >
              <CameraOutlined style={{ marginRight: 10, color: "#BFA16A" }} />
              Tác Phẩm Trưng Bày
            </h2>

            <Row gutter={[30, 30]}>
              {portfolio.featured_images.map((img, index) => (
                <Col xs={24} md={8} key={index}>
                  <div
                    style={{
                      height: 320,
                      overflow: "hidden",
                      borderRadius: "0px",
                      border: "1px solid #E8DED2",
                      padding: "8px",
                      background: "#FFFFFF",
                      cursor: "pointer",
                      boxShadow: "0 5px 15px rgba(154, 138, 120, 0.02)"
                    }}
                    className="portfolio-image-item"
                  >
                    <img
                      src={img}
                      alt={`portfolio-${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        border: "1px solid #E8DED2",
                        transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
                      }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>

      <style>{`
        .portfolio-image-item:hover img {
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
};

export default PhotographerDetail;
