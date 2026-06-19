import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';
const FALLBACK_WEDDING = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop";

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchServices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/services");
        setServices(res.data);
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Scroll reveal Intersection Observer hook
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
  }, [loading, services]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "150px 0", background: "#FAF7F2" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div className="home-page-container" style={{ width: "100%", background: "#FAF7F2", minHeight: "100vh" }}>
      {/* Ambient lights */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }}></div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 20px 100px 20px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "65px" }} className="scroll-reveal">
          <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
            Our Pricing
          </span>
          <h1
            className="font-serif-luxury"
            style={{
              fontSize: "44px",
              fontWeight: "300",
              color: "#1F1F1F",
              marginTop: "10px"
            }}
          >
            Bảng Giá Dịch Vụ
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 25px auto" }}></div>
          <p style={{ color: "#555555", fontSize: "15.5px", fontWeight: "300", letterSpacing: "0.5px" }}>
            Lưu giữ trọn vẹn những khoảnh khắc hạnh phúc của bạn bằng phong cách chuyên nghiệp và đầy tận tâm.
          </p>
        </div>

        {/* Content list */}
        <Row gutter={[30, 40]}>
          {services.map((item, index) => (
            <Col xs={24} md={8} key={item._id} className={`scroll-reveal stagger-${(index % 3) + 1}`}>
              <div
                className="service-card-luxury"
                onClick={() => navigate(`/services/${item._id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="service-image-container">
                  <img
                    alt={item.name}
                    src={
                      item.thumbnail ||
                      FALLBACK_WEDDING
                    }
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_WEDDING;
                    }}
                  />
                  <div className="service-image-overlay" />
                </div>
                
                <div className="service-card-content">
                  <h3 className="service-card-title font-serif-luxury" style={{ fontWeight: "400", fontSize: "22px" }}>
                    {item.name}
                  </h3>

                  <div className="service-card-price" style={{ color: "#BFA16A", fontWeight: "600" }}>
                    {item.base_price?.toLocaleString("vi-VN")}đ
                  </div>

                  <div
                    style={{
                      fontSize: "13.5px",
                      color: "#666",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <ClockCircleOutlined style={{ color: "#BFA16A" }} /> 
                    <span>Thời gian chụp: {item.duration_hours || 4} giờ</span>
                  </div>

                  <div className="service-card-features">
                    {(
                      item.features || [
                        "Chụp ảnh không giới hạn file",
                        "Hỗ trợ concept chụp",
                        "Chỉnh sửa 30 file retouch",
                        "Giao toàn bộ file gốc",
                      ]
                    )
                      .slice(0, 4)
                      .map((feat, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: "13.5px",
                            color: "#555",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px"
                          }}
                        >
                          <CheckOutlined style={{ color: "#BFA16A", marginTop: "4px", fontSize: "11px" }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                  </div>

                  <button
                    onClick={() => navigate(`/services/${item._id}`)}
                    className="btn-premium-outline"
                    style={{ width: "100%", height: "45px", justifyContent: "center", fontSize: "12px", border: "1px solid rgba(191, 161, 106, 0.35)", color: "#BFA16A" }}
                  >
                    XEM CHI TIẾT <ArrowRightOutlined />
                  </button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Services;
