import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message, Tabs } from "antd";
import {
  CameraOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

const Rentals = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("ALL");

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resources/rentals?type=${currentTab}`,
        );
        setEquipment(res.data);
      } catch (err) {
        message.error("Không thể tải danh sách thiết bị");
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [currentTab]);

  // Scroll reveal Intersection Observer setup
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
  }, [loading, equipment]);

  const tabItems = [
    { key: "ALL", label: "TẤT CẢ" },
    { key: "CAMERA", label: "MÁY ẢNH (BODY)" },
    { key: "LENS", label: "ỐNG KÍNH (LENS)" },
    { key: "LIGHT", label: "ĐÈN & STUDIO" },
    { key: "ACCESSORY", label: "PHỤ KIỆN KHÁC" },
  ];

  return (
    <div
      className="home-page-container"
      style={{
        width: "100%",
        background: "#FAF7F2",
        padding: "80px 20px 100px 20px",
        minHeight: "100vh",
      }}
    >
      {/* Glow ambient spots */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "50%", right: "5%" }}></div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "65px" }} className="scroll-reveal">
        <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
          Premium Camera Gear
        </span>
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "44px",
            fontWeight: "300",
            color: "#1F1F1F",
            marginTop: "10px"
          }}
        >
          Cho Thuê Thiết Bị
        </h1>
        <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 25px auto" }}></div>
        <p
          style={{
            color: "#555555",
            fontSize: "15.5px",
            maxWidth: "600px",
            margin: "0 auto",
            fontWeight: "300",
            lineHeight: "1.7"
          }}
        >
          Trải nghiệm hệ sinh thái máy ảnh, ống kính và thiết bị studio chuyên nghiệp với thủ tục linh hoạt, nhanh gọn và tối ưu chi phí.
        </p>
      </div>

      {/* Tabs list */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "50px",
        }}
        className="rental-tabs scroll-reveal stagger-1"
      >
        <Tabs
          activeKey={currentTab}
          onChange={setCurrentTab}
          items={tabItems}
          size="large"
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
        </div>
      ) : equipment.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#777777",
            padding: "80px 20px",
            fontSize: "16px",
            fontWeight: "300"
          }}
          className="glass-panel"
        >
          Chưa có thiết bị nào trong danh mục này. Vui lòng liên hệ hotline để biết thêm thông tin.
        </div>
      ) : (
        <Row gutter={[30, 40]}>
          {equipment.map((item, index) => (
            <Col xs={24} sm={12} lg={8} key={item._id} className={`scroll-reveal stagger-${(index % 3) + 1}`}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  border: "1px solid #E8DED2",
                  borderRadius: "0px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "pointer"
                }}
                className="gear-item-card-wrapper"
                onClick={() => navigate(`/rentals/${item._id}`)}
              >
                <div
                  style={{
                    padding: "30px",
                    background: "rgba(250, 247, 242, 0.5)",
                    textAlign: "center",
                    borderBottom: "1px solid #E8DED2",
                    height: "240px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}
                >
                  <img
                    alt={item.name}
                    src={item.thumbnail}
                    style={{
                      maxHeight: "180px",
                      objectFit: "contain",
                      mixBlendMode: "multiply",
                      transition: "transform 1s ease"
                    }}
                    className="gear-card-image"
                  />
                </div>

                <div style={{ padding: "26px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "15px",
                      gap: "12px"
                    }}
                  >
                    <h3
                      className="font-serif-luxury"
                      style={{
                        fontSize: "20px",
                        margin: 0,
                        fontWeight: "400",
                        color: "#2F2F2F",
                        lineHeight: "1.3"
                      }}
                    >
                      {item.name}
                    </h3>
                    
                    <span
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        border: item.status === "AVAILABLE" ? "1px solid rgba(191, 161, 106, 0.3)" : "1px solid #E8DED2",
                        background: item.status === "AVAILABLE" ? "rgba(191, 161, 106, 0.05)" : "rgba(0, 0, 0, 0.02)",
                        color: item.status === "AVAILABLE" ? "#BFA16A" : "#777777"
                      }}
                    >
                      {item.status === "AVAILABLE" ? "SẴN SÀNG" : "ĐANG ĐƯỢC THUÊ"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "18px",
                      color: PRIMARY_COLOR,
                      fontWeight: 600,
                      marginBottom: "20px",
                    }}
                  >
                    {item.rental_price_per_day?.toLocaleString()}đ{" "}
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#777777",
                        fontWeight: "300",
                      }}
                    >
                      / ngày
                    </span>
                  </div>

                  <div style={{ minHeight: "80px", marginBottom: "20px" }}>
                    {(item.features || []).slice(0, 3).map((feat, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: "13.5px",
                          color: "#555555",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <CameraOutlined
                          style={{ color: PRIMARY_COLOR }}
                        />{" "}
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666666",
                      marginBottom: "25px",
                      padding: "12px",
                      background: "rgba(191, 161, 106, 0.05)",
                      border: "1px solid rgba(191, 161, 106, 0.15)",
                      borderRadius: "0px",
                      fontFamily: "Outfit"
                    }}
                  >
                    <SafetyCertificateOutlined style={{ marginRight: "6px", color: "#BFA16A" }} />{" "}
                    Yêu cầu cọc:{" "}
                    <strong>
                      {item.required_deposit_amount?.toLocaleString()}đ
                    </strong>{" "}
                    hoặc giấy tờ cá nhân.
                  </div>

                  <button
                    className="btn-premium-gold"
                    style={{ width: "100%", height: "45px", justifyContent: "center", fontSize: "12px", marginTop: "auto", display: "inline-flex" }}
                    onClick={() => navigate(`/rentals/${item._id}`)}
                  >
                    XEM CHI TIẾT
                  </button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      <style>{`
        .rental-tabs .ant-tabs-tab { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #777777; transition: all 0.3s; font-family: 'Outfit', sans-serif; }
        .rental-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${PRIMARY_COLOR} !important; font-weight: 600; }
        .rental-tabs .ant-tabs-ink-bar { background: ${PRIMARY_COLOR} !important; height: 2px; }
        
        .gear-item-card-wrapper:hover {
          border-color: ${PRIMARY_COLOR} !important;
          box-shadow: 0 15px 30px rgba(154, 138, 120, 0.08);
        }
        
        .gear-item-card-wrapper:hover .gear-card-image {
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
};

export default Rentals;
