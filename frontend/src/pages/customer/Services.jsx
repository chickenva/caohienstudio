import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message, Empty } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FALLBACK_WEDDING = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop";

const CATEGORY_LABELS = {
  ALL: "Tất cả dịch vụ",
  TRADITIONAL: "Truyền thống",
  PHOTOJOURNALISM: "Phóng sự",
  COMBO: "Kết hợp",
  PRINT: "Ảnh / Photobook",
};

const CATEGORY_DESCRIPTIONS = {
  ALL: "Tổng hợp các gói chụp, quay, in ảnh và photobook hiện có tại Cao Hiển Studio.",
  TRADITIONAL: "Các gói quay và chụp truyền thống cho lễ cưới, lễ công cô, tiệc nhà hàng và những khoảnh khắc quan trọng trong ngày cưới.",
  PHOTOJOURNALISM: "Các gói phóng sự ghi lại câu chuyện ngày cưới tự nhiên, cảm xúc và giàu tính tư liệu.",
  COMBO: "Gói kết hợp giữa phong cách truyền thống và phóng sự, phù hợp khi bạn muốn vừa đủ nghi thức vừa có câu chuyện trọn vẹn.",
  PRINT: "Dịch vụ in ảnh, hình lớn, photobook và album lưu giữ kỷ niệm sau buổi chụp.",
};

const categoryOptions = [
  { key: "ALL", label: "Tất cả" },
  { key: "TRADITIONAL", label: "Truyền thống" },
  { key: "PHOTOJOURNALISM", label: "Phóng sự" },
  { key: "COMBO", label: "Kết hợp" },
  { key: "PRINT", label: "Ảnh / Photobook" },
];

const Services = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get("category") || "ALL";

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchServices = async () => {
      setLoading(true);
      try {
        const query = currentCategory !== "ALL" ? `?category=${currentCategory}` : "";
        const res = await axios.get(`http://localhost:5000/api/services${query}`);
        setServices(Array.isArray(res.data) ? res.data : []);
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
  }, [currentCategory]);

  useEffect(() => {
    if (loading) return;

    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observerOptions = {
      root: null,
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
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

  const handleCategoryChange = (category) => {
    if (category === "ALL") {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "150px 0", background: "#FAF7F2" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="home-page-container" style={{ width: "100%", background: "#FAF7F2", minHeight: "100vh" }}>
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }}></div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 20px 100px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "38px" }} className="scroll-reveal">
          <span style={{ color: PRIMARY_COLOR, letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
            Cao Hiển Studio
          </span>
          <h1
            className="font-serif-luxury"
            style={{
              fontSize: "44px",
              fontWeight: "300",
              color: "#1F1F1F",
              marginTop: "10px",
            }}
          >
            {CATEGORY_LABELS[currentCategory] || CATEGORY_LABELS.ALL}
          </h1>
          <div style={{ width: "40px", height: "1px", background: PRIMARY_COLOR, margin: "20px auto 25px auto" }}></div>
          <p style={{ color: "#555555", fontSize: "15.5px", fontWeight: "300", letterSpacing: "0.5px", maxWidth: 760, margin: "0 auto", lineHeight: 1.8 }}>
            {CATEGORY_DESCRIPTIONS[currentCategory] || CATEGORY_DESCRIPTIONS.ALL}
          </p>
        </div>

        <div
          className="scroll-reveal stagger-1"
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 48,
          }}
        >
          {categoryOptions.map((item) => {
            const active = currentCategory === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleCategoryChange(item.key)}
                style={{
                  minHeight: 38,
                  padding: "0 16px",
                  border: active ? `1px solid ${PRIMARY_COLOR}` : "1px solid #E8DED2",
                  background: active ? PRIMARY_COLOR : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#555555",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {(() => {
          const displayedServices = currentCategory === "ALL"
            ? services.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
            : services;

          if (displayedServices.length === 0) {
            return <Empty description="Chưa có gói dịch vụ trong danh mục này" />;
          }

          return (
            <Row gutter={[30, 40]}>
              {displayedServices.map((item, index) => (
                <Col xs={24} md={8} key={item._id} className={`scroll-reveal stagger-${(index % 3) + 1}`}>
                  <div
                  className="service-card-luxury"
                  onClick={() => navigate(`/services/${item._id}`, { state: { fromCategory: currentCategory } })}
                  style={{ cursor: "pointer" }}
                >
                  <div className="service-image-container">
                    <img
                      alt={item.name}
                      src={item.thumbnail || FALLBACK_WEDDING}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_WEDDING;
                      }}
                    />
                    <div className="service-image-overlay" />
                  </div>

                  <div className="service-card-content">
                    <div style={{ color: PRIMARY_COLOR, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
                      {CATEGORY_LABELS[item.category] || "Dịch vụ"}
                    </div>

                    <h3 className="service-card-title font-serif-luxury" style={{ fontWeight: "400", fontSize: "22px" }}>
                      {item.name}
                    </h3>

                    <div className="service-card-price" style={{ color: PRIMARY_COLOR, fontWeight: "600" }}>
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
                        gap: "6px",
                      }}
                    >
                      <ClockCircleOutlined style={{ color: PRIMARY_COLOR }} />
                      <span>Thời lượng: {item.duration_hours || 4} giờ</span>
                    </div>

                    <div className="service-card-features">
                      {(
                        item.features?.length
                          ? item.features
                          : [
                              "Tư vấn lịch trình và phong cách chụp",
                              "Ekip hỗ trợ chuyên nghiệp",
                              "Giao file theo thỏa thuận gói dịch vụ",
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
                              gap: "8px",
                            }}
                          >
                            <CheckOutlined style={{ color: PRIMARY_COLOR, marginTop: "4px", fontSize: "11px" }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/services/${item._id}`, { state: { fromCategory: currentCategory } });
                      }}
                      className="btn-premium-outline"
                      style={{ width: "100%", height: "45px", justifyContent: "center", fontSize: "12px", border: "1px solid rgba(191, 161, 106, 0.35)", color: PRIMARY_COLOR, marginTop: "auto" }}
                    >
                      XEM CHI TIẾT <ArrowRightOutlined />
                    </button>
                  </div>
                </div>
              </Col>
            ))}
            </Row>
          );
        })()}
      </div>
    </div>
  );
};

export default Services;
