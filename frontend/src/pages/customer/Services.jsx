/**
 * Services.jsx
 * Trang danh sách gói dịch vụ, lọc theo danh mục.
 */
import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message, Empty } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";
import { isServerUploadUrl, upgradeGoogleImageUrl } from "../../utils/imageUtils";

const PRIMARY_COLOR = "#BFA16A";
const FALLBACK_WEDDING = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

/**
 * Chọn src thumbnail card: ưu tiên server upload, fallback sang Drive thumbnail.
 * @param {string} thumbnail
 * @returns {string}
 */
const resolveCardThumbnail = (thumbnail) => {
  if (!thumbnail) return FALLBACK_WEDDING;
  if (isServerUploadUrl(thumbnail)) return thumbnail;
  return upgradeGoogleImageUrl(thumbnail, "s800") || FALLBACK_WEDDING;
};

// Trang danh sách dịch vụ, lọc theo danh mục và dẫn sang chi tiết/đặt lịch.
const Services = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([
    { key: "ALL", label: "TẤT CẢ GÓI", description: "Toàn bộ bảng giá dịch vụ chụp ảnh" }
  ]);

  const currentCategory = searchParams.get("category") || searchParams.get("cat") || "ALL";

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [catsRes, srvRes] = await Promise.all([
          axios.get(`${API_URL}/categories?type=SERVICE&is_active=true`),
          axios.get(`${API_URL}/services`)
        ]);

        const dynamicCategories = (catsRes.data.categories || []).map(c => ({
          key: c.slug,
          label: c.name,
          description: c.description
        }));
        
        setCategories([
          { key: "ALL", label: "Tất cả", description: "Tổng hợp các gói chụp, quay, in ảnh và photobook hiện có tại Cao Hiển Studio." },
          ...dynamicCategories
        ]);

        setServices(Array.isArray(srvRes.data) ? srvRes.data : []);
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

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
  }, [loading, services, currentCategory]);

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
          <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
            Our Services
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
            {currentCategory === "ALL" ? (
              <>Tất Cả{" "}<span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>Dịch Vụ</span></>
            ) : (
              <>{(categories.find(c => c.key === currentCategory)?.label || "Dịch Vụ").split(" ")[0]}{" "}
              <span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>{(categories.find(c => c.key === currentCategory)?.label || "Dịch Vụ").split(" ").slice(1).join(" ")}</span></>
            )}
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "0 auto 20px" }}>
            <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
            <div style={{ width: 6, height: 6, background: PRIMARY_COLOR, transform: "rotate(45deg)" }} />
            <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
          </div>
          <p style={{ color: "#555555", fontSize: "15.5px", fontWeight: 300, letterSpacing: "0.5px", maxWidth: 760, margin: "0 auto", lineHeight: 1.8 }}>
            {categories.find(c => c.key === currentCategory)?.description || ""}
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
          {categories.map((item) => {
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
          const displayedServices = services.filter((item, index, self) => {
            const matchesCategory = currentCategory === "ALL" || item.category === currentCategory || item.category?.slug === currentCategory;
            if (!matchesCategory) return false;
            return self.findIndex(t => t.name === item.name) === index;
          });

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
                      src={resolveCardThumbnail(item.thumbnail)}
                      onError={(e) => {
                        // server upload lỗi → thử Drive thumbnail nếu có
                        if (!e.currentTarget.dataset.fallbackApplied) {
                          e.currentTarget.dataset.fallbackApplied = "true";
                          const driveUrl = upgradeGoogleImageUrl(item.thumbnail, "s800");
                          if (driveUrl && driveUrl !== e.currentTarget.src) {
                            e.currentTarget.src = driveUrl;
                          } else {
                            e.currentTarget.src = FALLBACK_WEDDING;
                          }
                        } else {
                          e.currentTarget.src = FALLBACK_WEDDING;
                        }
                      }}
                    />
                    <div className="service-image-overlay" />
                  </div>

                  <div className="service-card-content">
                    <div style={{ color: PRIMARY_COLOR, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
                      {categories.find(c => c.key === item.category || c.key === item.category?.slug)?.label || "Dịch vụ"}
                    </div>

                    <h3 className="service-card-title font-serif-luxury" style={{ fontWeight: "400", fontSize: "22px" }}>
                      {item.name}
                    </h3>

                    <div className="service-card-price" style={{ color: PRIMARY_COLOR, fontWeight: "600" }}>
                      {item.base_price?.toLocaleString("vi-VN")}đ
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

