import React, { useState, useEffect } from "react";
import { Row, Col, Button, Form, Input, message, Spin } from "antd";
import {
  ArrowRightOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  StarFilled,
  SendOutlined,
  FormOutlined,
  CreditCardOutlined,
  FileImageOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../Home.css";

const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";
import {
  getGalleryImageSrcSet,
  getGalleryImageUrl,
  getImageErrorHandler,
  preloadImages,
} from "../../utils/imageUtils";

// Fallback images
const FALLBACK_HERO = "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop";
const FALLBACK_WEDDING = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop";
const FALLBACK_PORTRAIT = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop";
const FALLBACK_EVENT = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";
const FALLBACK_GEAR = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop";


const categoryLabels = {
  WEDDING: "Ảnh cưới",
  PORTRAIT: "Chân dung",
  EVENT: "Sự kiện",
  GRADUATION: "Kỷ yếu",
};

// Trang chủ khách hàng hiển thị hero, dịch vụ nổi bật và album tiêu biểu.
const Home = () => {
  const navigate = useNavigate();
  const [contactForm] = Form.useForm();
  
  // States for API Data
  const [services, setServices] = useState([]);
  const [galleries, setGalleries] = useState([]);
  
  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);

  // Marquee string
  const marqueeText = "CAO HIỂN STUDIO ✦ TIMELESS ROMANCE ✦ ELEGANT PORTRAIT ✦ FINE ART WEDDING ✦ CINEMATIC WEDDING DOCUMENTARY ✦ CREATIVE SPACE ✦ ".repeat(8);

  // 1. Dynamic Body Background & API Fetching
  useEffect(() => {
    // Set background to light warm cream
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const endpoints = [
          axios.get(`${API_URL}/services`),
          axios.get(`${API_URL}/galleries`),
        ];

        const [servicesRes, galleriesRes] = await Promise.allSettled(endpoints);

        if (servicesRes.status === "fulfilled") {
          setServices(servicesRes.value.data || []);
        }
        if (galleriesRes.status === "fulfilled") {
          const fetchedGalleries = galleriesRes.value.data || [];
          setGalleries(fetchedGalleries);
          await preloadImages(
            fetchedGalleries.slice(0, 4).map((item) =>
              getGalleryImageUrl(item, "cover", FALLBACK_PORTRAIT),
            ),
            { limit: 4, timeoutMs: 3200 },
          );
        }
      } catch (err) {
        console.error("Failed to load some resources", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Clean up
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // 2. Intersection Observer for Scroll Reveal Effects
  useEffect(() => {
    // We observe after loading has finished to capture dynamic elements
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
          observer.unobserve(entry.target); // Reveal only once
        }
      });
    }, observerOptions);

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, [loading, services, galleries]);

  // 3. Handle Contact Submission
  const handleContactSubmit = async (values) => {
    setContactLoading(true);
    try {
      await axios.post(`${API_URL}/contacts`, values);
      message.success("Cảm ơn bạn! Cao Hiển Studio đã nhận được yêu cầu tư vấn. Nhân viên sẽ liên hệ với bạn trong vòng 24h.");
      contactForm.resetFields();
    } catch (err) {
      console.error("Submit contact error:", err);
      message.error("Gửi lời nhắn thất bại. Vui lòng thử lại sau hoặc gọi hotline trực tiếp.");
    } finally {
      setContactLoading(false);
    }
  };

  // Helper for pricing
  const formatPrice = (price) => {
    if (price === undefined || price === null) return "Liên hệ";
    return Number(price).toLocaleString("vi-VN") + "đ";
  };

  // Stats computation
  const stats = {
    experience: 8,
    services: services.length || 6,
    galleries: galleries.length || 28,
    satisfaction: 99,
  };

  // Fallback demo data if APIs are empty
  const demoServices = [
    {
      _id: "demo-wedding",
      name: "Gói Cưới Fine Art / Wedding",
      base_price: 15000000,
      duration_hours: 8,
      thumbnail: FALLBACK_WEDDING,
      description: "Chụp ảnh và quay phim cưới với phong cách ánh sáng tự nhiên đầy lãng mạn, xử lý màu sắc tinh tế, dịu nhẹ.",
      features: ["2 Nhiếp ảnh gia chuyên nghiệp", "Hỗ trợ hướng dẫn tạo dáng tự nhiên", "Bàn giao toàn bộ file gốc & 50 ảnh retouch", "Album ảnh cao cấp 30x30 in ấn phong cách châu Âu"]
    },
    {
      _id: "demo-portrait",
      name: "Chân Dung Nghệ Thuật / Fine Art Portrait",
      base_price: 3500000,
      duration_hours: 3,
      thumbnail: FALLBACK_PORTRAIT,
      description: "Lưu giữ chân dung cá nhân mộc mạc, ghi dấu thần thái tự nhiên dưới góc máy dịu dàng, trong trẻo.",
      features: ["1 Photographer chính", "Setup studio ánh sáng trong trẻo nhẹ nhàng", "Retouch 15 file cao cấp xuất sắc", "Hỗ trợ make-up phong cách thanh lịch"]
    },
    {
      _id: "demo-event",
      name: "Quay Phim & Chụp Sự Kiện / Cinema Event",
      base_price: 8000000,
      duration_hours: 5,
      thumbnail: FALLBACK_EVENT,
      description: "Ghi lại những khoảnh khắc lễ đính hôn, sự kiện doanh nghiệp với phong cách chân thực, tinh tế và ấm áp.",
      features: ["1 thành viên chụp & 1 thành viên quay", "Quay phim độ phân giải 4K sắc nét", "Dựng phim highlight cảm xúc 3-5 phút", "Giao file nhanh chóng trong vòng 3 ngày"]
    }
  ];

  const demoGalleries = [
    { _id: "demo-gal-1", title: "Eternal Romance in Da Lat", category: "WEDDING", coverImage: FALLBACK_WEDDING, location: "Đà Lạt, Lâm Đồng" },
    { _id: "demo-gal-2", title: "Sài Gòn Sunrise Stories", category: "PORTRAIT", coverImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800&auto=format&fit=crop", location: "Quận 1, TP. HCM" },
    { _id: "demo-gal-3", title: "Sweet Dreamer Studio", category: "WEDDING", coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop", location: "Cao Hien Studio" },
    { _id: "demo-gal-4", title: "Luxury Fashion Editorial", category: "EVENT", coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop", location: "TP. HCM" }
  ];

  const displayServices = services.length > 0 ? services.slice(0, 3) : demoServices;
  const displayGalleries = galleries.length > 0 ? galleries.slice(0, 4) : demoGalleries;

  return (
    <div className="home-page-container">
      {/* Light glow spotlight effects */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ bottom: "12%", left: "8%" }}></div>

      {/* ==========================================
          1. HERO SECTION (Light Elegant Banner)
      ========================================== */}
      <section className="full-bleed" style={{ position: "relative", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div 
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to bottom, rgba(250, 247, 242, 0.3) 0%, rgba(250, 247, 242, 0.95) 100%), url(${FALLBACK_HERO})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "contrast(1.02) brightness(0.98)",
            zIndex: 0
          }}
        />

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 40px", width: "100%", zIndex: 2, position: "relative" }}>
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} lg={16} className="scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: "rgba(191, 161, 106, 0.08)", border: "1px solid rgba(191, 161, 106, 0.2)", marginBottom: "30px" }}>
                <CameraOutlined style={{ color: "#BFA16A" }} />
                <span style={{ fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", color: "#BFA16A", fontWeight: "600" }}>
                  Cao Hiển Studio — Elegant & Cinematic
                </span>
              </div>

              <h1 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "clamp(44px, 5.5vw, 80px)", fontWeight: "300", lineHeight: "1.15", margin: "0 0 24px 0", letterSpacing: "-0.5px", textTransform: "none" }}>
                Lưu Giữ Những Khoảnh Khắc <br/>
                <span className="text-gold" style={{ fontStyle: "italic", fontWeight: "400" }}>Vượt Thời Gian</span>
              </h1>

              <p style={{ color: "#555555", fontSize: "17.5px", maxWidth: "600px", lineHeight: "1.8", marginBottom: "40px", fontWeight: "300" }}>
                Mỗi khung hình là một câu chuyện được kể bằng ánh sáng, cảm xúc chân thực và sự tinh tế ngọt ngào nhất của ngày trọng đại.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <button className="btn-premium-gold" onClick={() => navigate("/booking")}>
                  ĐẶT LỊCH NGAY <ArrowRightOutlined />
                </button>
                <button className="btn-premium-outline" onClick={() => navigate("/galleries")}>
                  XEM THƯ VIỆN ẢNH
                </button>
                <button className="btn-premium-outline" style={{ borderColor: "transparent" }} onClick={() => navigate("/services")}>
                  KHÁM PHÁ DỊCH VỤ
                </button>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* ==========================================
          2. MARQUEE STRIP
      ========================================== */}
      <section className="full-bleed">
        <div className="marquee-container-light">
          <div className="marquee-content-light">
            {marqueeText}
          </div>
        </div>
      </section>

      {/* ==========================================
          3. STUDIO INTRODUCTION & STATS
      ========================================== */}
      <section style={{ padding: "100px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Row gutter={[60, 40]} align="middle">
            <Col xs={24} md={12} className="scroll-reveal">
              <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
                Về Cao Hiển Studio
              </span>
              <h2 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "40px", fontWeight: "300", lineHeight: "1.25", marginBottom: "30px", textTransform: "none" }}>
                Tinh Tế Trong Từng <br/>
                Thước Phim, Khung Hình
              </h2>
              <p style={{ color: "#555555", fontSize: "15px", lineHeight: "2", marginBottom: "20px", fontWeight: "300" }}>
                Cao Hiển Studio được tạo dựng dựa trên tình yêu nghệ thuật nhiếp ảnh cưới và mong muốn lưu giữ trọn vẹn những ký ức hạnh phúc ngọt ngào của các đôi uyên ương.
              </p>
              <p style={{ color: "#555555", fontSize: "15px", lineHeight: "2", marginBottom: "40px", fontWeight: "300" }}>
                Bên cạnh việc thực hiện các dự án của studio, chúng tôi cũng cung cấp dịch vụ cho thuê thiết bị chất lượng cao dành cho ekip quay chụp và khách hàng có nhu cầu sáng tạo riêng.
              </p>
              <button className="btn-premium-outline" onClick={() => navigate("/about")}>
                TÌM HIỂU THÊM
              </button>
            </Col>

            <Col xs={24} md={12} className="scroll-reveal stagger-1">
              <div className="glass-panel" style={{ padding: "40px", borderRadius: "0px" }}>
                <Row gutter={[20, 30]}>
                  <Col span={12} className="stat-card-luxury">
                    <div className="stat-number">{stats.experience}+</div>
                    <div className="stat-label">Năm Kinh Nghiệm</div>
                  </Col>
                  <Col span={12} className="stat-card-luxury">
                    <div className="stat-number">{stats.services}</div>
                    <div className="stat-label">Gói Dịch Vụ</div>
                  </Col>
                  <Col span={12} className="stat-card-luxury">
                    <div className="stat-number">{stats.galleries}+</div>
                    <div className="stat-label">Album Hoàn Thành</div>
                  </Col>
                  <Col span={12} className="stat-card-luxury">
                    <div className="stat-number">{stats.satisfaction}%</div>
                    <div className="stat-label">Khách Hàng Hài Lòng</div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* ==========================================
          4. FEATURED SERVICES
      ========================================== */}
      <section style={{ padding: "80px 20px", background: "#FAF7F2" }} className="full-bleed">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }} className="scroll-reveal">
            <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
              Our Services
            </span>
            <h2 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "42px", fontWeight: "300", marginTop: "10px", textTransform: "none" }}>
              Dịch Vụ Nổi Bật & Bảng Giá
            </h2>
            <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 0 auto" }}></div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}><Spin size="large" /></div>
          ) : (
            <>
              <Row gutter={[30, 40]}>
                {displayServices.map((item, index) => (
                  <Col xs={24} md={8} key={item._id} className={`scroll-reveal stagger-${index + 1}`}>
                    <div 
                      className="service-card-luxury"
                      onClick={() => navigate(`/services/${item._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="service-image-container">
                        <img 
                          src={item.thumbnail || FALLBACK_WEDDING} 
                          alt={item.name} 
                          onError={(e) => { e.currentTarget.src = FALLBACK_WEDDING; }}
                        />
                        <div className="service-image-overlay" />
                      </div>
                      <div className="service-card-content">
                        <h3 className="service-card-title">{item.name}</h3>
                        <div className="service-card-price">{formatPrice(item.base_price)}</div>
                        
                        {item.duration_hours && (
                          <div style={{ fontSize: "13px", color: "#666666", marginBottom: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <ClockCircleOutlined style={{ color: "#BFA16A" }} />
                            <span>Thời gian chụp: {item.duration_hours} giờ</span>
                          </div>
                        )}

                        <div className="service-card-features">
                          {(item.features || [
                            "Chụp ảnh không giới hạn file",
                            "Hỗ trợ concept chụp",
                            "Retouch file cao cấp",
                            "Bàn giao toàn bộ file gốc"
                          ]).slice(0, 4).map((feat, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                              <CheckOutlined style={{ color: "#BFA16A", marginTop: "4px", fontSize: "11px" }} />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        <Button 
                          block 
                          style={{
                            background: "transparent",
                            color: "#BFA16A",
                            border: "1px solid rgba(191, 161, 106, 0.4)",
                            borderRadius: 0,
                            height: "45px",
                            fontFamily: "Outfit",
                            fontSize: "12px",
                            letterSpacing: "1px",
                            marginTop: "auto"
                          }}
                          onClick={() => navigate(`/services/${item._id}`)}
                        >
                          XEM CHI TIẾT <ArrowRightOutlined />
                        </Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ textAlign: "center", marginTop: "50px" }} className="scroll-reveal">
                <button className="btn-premium-outline" onClick={() => navigate("/services")}>
                  XEM TẤT CẢ DỊCH VỤ <ArrowRightOutlined />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ==========================================
          5. FEATURED PORTFOLIO / GALLERY
      ========================================== */}
      <section style={{ padding: "100px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "60px", flexWrap: "wrap", gap: "20px" }} className="scroll-reveal">
            <div>
              <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
                Selected Work
              </span>
              <h2 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "42px", fontWeight: "300", marginTop: "10px", textTransform: "none", margin: 0 }}>
                Thư Viện Ảnh Của Chúng Tôi
              </h2>
            </div>
            <button className="btn-premium-outline" onClick={() => navigate("/galleries")}>
              XEM TOÀN BỘ ALBUM <ArrowRightOutlined />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}><Spin size="large" /></div>
          ) : (
            <div className="portfolio-masonry">
              {displayGalleries.map((item, index) => {
                const layoutClass =
                  index === 0
                    ? "portfolio-item-featured"
                    : index <= 2
                      ? "portfolio-item-side"
                      : "portfolio-item-wide";
                const imageUrl = getGalleryImageUrl(
                  item,
                  index === 0 ? "cover" : "grid",
                  FALLBACK_PORTRAIT,
                );
                const imageSrcSet = getGalleryImageSrcSet(imageUrl);

                return (
                  <div 
                    key={item._id} 
                    className={`portfolio-item-luxury ${layoutClass} scroll-reveal stagger-${index + 1}`}
                    onClick={() => navigate(`/galleries/${item._id}`)}
                  >
                    <img 
                      className="portfolio-item-image" 
                      src={imageUrl}
                      srcSet={imageSrcSet}
                      sizes={index === 0 ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 42vw"}
                      alt={item.title}
                      loading={index < 2 ? "eager" : "lazy"}
                      fetchPriority={index < 2 ? "high" : "auto"}
                      decoding="async"
                      onError={getImageErrorHandler(FALLBACK_PORTRAIT)}
                    />
                    <div className="portfolio-item-overlay" />
                    <div className="portfolio-item-info">
                      <span className="portfolio-item-category">{categoryLabels[item.category] || item.category}</span>
                      <h3 className="portfolio-item-title">{item.title}</h3>
                      {item.location && <p className="portfolio-item-desc"><EnvironmentOutlined style={{ marginRight: "4px" }} /> {item.location}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          6. PROFESSIONAL WORKFLOW / STEPS
      ========================================== */}
      <section style={{ padding: "100px 20px", background: "#FAF7F2" }} className="full-bleed">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }} className="scroll-reveal">
            <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
              Our Process
            </span>
            <h2 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "42px", fontWeight: "300", marginTop: "10px", textTransform: "none" }}>
              Quy Trình Làm Việc Chuyên Nghiệp
            </h2>
            <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 0 auto" }}></div>
          </div>

          <Row gutter={[24, 24]}>
            {[
              {
                step: "01",
                icon: <FormOutlined style={{ fontSize: "28px", color: "#BFA16A" }} />,
                title: "Tư Vấn & Lên Ý Tưởng",
                desc: "Đội ngũ Cao Hiển Studio sẽ trao đổi trực tiếp, lắng nghe câu chuyện của bạn để tư vấn concept và gói dịch vụ phù hợp nhất."
              },
              {
                step: "02",
                icon: <CreditCardOutlined style={{ fontSize: "28px", color: "#BFA16A" }} />,
                title: "Đăng Ký & Đặt Cọc",
                desc: "Thực hiện ký hợp đồng điện tử và đặt cọc giữ ngày chụp cực kỳ tiện lợi thông qua hệ thống thanh toán VNPay trực tiếp."
              },
              {
                step: "03",
                icon: <CameraOutlined style={{ fontSize: "28px", color: "#BFA16A" }} />,
                title: "Buổi Chụp Hào Hứng",
                desc: "Buổi chụp hình diễn ra tự nhiên, vui vẻ với sự đồng hành của ekip chuyên nghiệp cùng các thiết bị máy ảnh tối tân."
              },
              {
                step: "04",
                icon: <FileImageOutlined style={{ fontSize: "28px", color: "#BFA16A" }} />,
                title: "Retouch & Bàn Giao",
                desc: "Chúng tôi chỉnh sửa hậu kỳ tỉ mỉ bằng màu ảnh độc quyền tinh tế, bàn giao album đúng hẹn với chất lượng hoàn hảo nhất."
              }
            ].map((item, idx) => (
              <Col xs={24} sm={12} lg={6} key={idx} className={`scroll-reveal stagger-${idx + 1}`}>
                <div className="glass-panel" style={{ padding: "40px 30px", height: "100%", position: "relative", border: "1px solid #E8DED2", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{ background: "rgba(191, 161, 106, 0.08)", padding: "12px", borderRadius: "4px" }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: "24px", fontFamily: "'Playfair Display', serif", color: "rgba(191, 161, 106, 0.35)", fontWeight: "500" }}>{item.step}</span>
                  </div>
                  <h4 className="font-serif-luxury" style={{ fontSize: "18px", color: "#2F2F2F", marginBottom: "12px", fontWeight: "500" }}>{item.title}</h4>
                  <p style={{ color: "#666666", fontSize: "14px", lineHeight: "1.7", margin: 0, fontWeight: "300" }}>{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ==========================================
          7. CUSTOMER TESTIMONIALS
      ========================================== */}
      <section style={{ padding: "80px 20px", background: "#FAF7F2" }} className="full-bleed">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }} className="scroll-reveal">
            <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
              Client Testimonials
            </span>
            <h2 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "42px", fontWeight: "300", marginTop: "10px", textTransform: "none" }}>
              Đánh Giá Từ Khách Hàng
            </h2>
            <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 0 auto" }}></div>
          </div>

          <Row gutter={[30, 30]}>
            <Col xs={24} md={8} className="scroll-reveal stagger-1">
              <div className="testimonial-card-luxury">
                <p className="testimonial-text">
                  "Chúng tôi đã có một bộ ảnh cưới vô cùng ưng ý. Cao Hiến Studio bắt trọn từng khoảnh khắc tự nhiên nhất của hai vợ chồng."
                </p>
                <div className="testimonial-author">Nguyễn Hoàng & Mai Chi</div>
                <div className="testimonial-context">Pre-wedding Album</div>
              </div>
            </Col>
            <Col xs={24} md={8} className="scroll-reveal stagger-2">
              <div className="testimonial-card-luxury">
                <p className="testimonial-text">
                  "Màu ảnh trong trẻo, tự nhiên và cách làm phim phóng sự cưới rất cảm xúc của ekip làm tôi cực kỳ ưng ý."
                </p>
                <div className="testimonial-author">Trần Anh Tuấn</div>
                <div className="testimonial-context">Wedding Documentary Film</div>
              </div>
            </Col>
            <Col xs={24} md={8} className="scroll-reveal stagger-3">
              <div className="testimonial-card-luxury">
                <p className="testimonial-text">
                  "Nhiếp ảnh gia rất nhiệt tình, tạo không khí vui vẻ giúp gia đình tôi có những bức ảnh chân thật, ấm áp."
                </p>
                <div className="testimonial-author">Chị Thu Hằng</div>
                <div className="testimonial-context">Family Art Session</div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* ==========================================
          8. BOOKING CTA SECTION (Light warm gradient overlay)
      ========================================== */}
      <section className="full-bleed" style={{ position: "relative", padding: "130px 20px", textAlign: "center" }}>
        <div 
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to bottom, rgba(250, 247, 242, 0.92) 0%, rgba(246, 239, 231, 0.95) 50%, rgba(250, 247, 242, 0.98) 100%), url("https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto" }} className="scroll-reveal">
          <StarFilled style={{ color: "#BFA16A", fontSize: "36px", marginBottom: "20px" }} />
          <h2 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "44px", fontWeight: "300", marginBottom: "25px", textTransform: "none" }}>
            Hãy Để Chúng Tôi Kể Lại Câu Chuyện Của Bạn
          </h2>
          <p style={{ color: "#555555", fontSize: "16px", lineHeight: "1.8", marginBottom: "40px", fontWeight: "300" }}>
            Mỗi khung hình là một kỉ niệm vô giá lưu giữ mãi về sau. Đặt lịch cọc hôm nay qua cổng VNPay/PayOS để giữ ngày đẹp và nhận nhiều phần quà ý nghĩa từ studio.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <button className="btn-premium-gold" onClick={() => navigate("/booking")}>
              ĐẶT LỊCH NGAY <CalendarOutlined />
            </button>
            <button className="btn-premium-outline" onClick={() => navigate("/contact")}>
              LIÊN HỆ TƯ VẤN
            </button>
          </div>
        </div>
      </section>

      {/* ==========================================
          9. CONTACT SECTION (Form & Info)
      ========================================== */}
      <section style={{ padding: "100px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Row gutter={[60, 40]}>
            {/* Info Column */}
            <Col xs={24} md={10} className="scroll-reveal">
              <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
                Keep in Touch
              </span>
              <h2 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "40px", fontWeight: "300", marginBottom: "40px", textTransform: "none" }}>
                Thông Tin Liên Hệ
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <EnvironmentOutlined style={{ fontSize: "20px", color: "#BFA16A", marginTop: "4px" }} />
                  <div>
                    <h5 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#2F2F2F", margin: "0 0 6px 0", fontWeight: "600" }}>Địa Chỉ</h5>
                    <p style={{ color: "#555555", fontSize: "14px", lineHeight: "1.6" }}>34B4 TL 887, phường An Hội, Vĩnh Long</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <PhoneOutlined style={{ fontSize: "20px", color: "#BFA16A", marginTop: "4px" }} />
                  <div>
                    <h5 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#2F2F2F", margin: "0 0 6px 0", fontWeight: "600" }}>Hotline</h5>
                    <p style={{ color: "#555555", fontSize: "14px", lineHeight: "1.6" }}>(+84) 979 7676 02</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <MailOutlined style={{ fontSize: "20px", color: "#BFA16A", marginTop: "4px" }} />
                  <div>
                    <h5 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#2F2F2F", margin: "0 0 6px 0", fontWeight: "600" }}>Email</h5>
                    <p style={{ color: "#555555", fontSize: "14px", lineHeight: "1.6" }}>caohienstudio@gmail.com</p>
                  </div>
                </div>
              </div>
            </Col>

            {/* Form Column */}
            <Col xs={24} md={14} className="scroll-reveal stagger-1">
              <div className="glass-panel" style={{ padding: "40px", borderRadius: "0px" }}>
                <h3 className="font-serif-luxury" style={{ color: "#2F2F2F", fontSize: "28px", fontWeight: "300", marginBottom: "30px" }}>
                  Gửi Yêu Cầu Tư Vấn Nhanh
                </h3>

                <Form form={contactForm} layout="vertical" onFinish={handleContactSubmit}>
                  <Form.Item
                    label="Họ và Tên"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
                  >
                    <Input size="large" placeholder="Nguyễn Văn A" />
                  </Form.Item>

                  <Row gutter={20}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Số Điện Thoại"
                        name="phone"
                        rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                      >
                        <Input size="large" placeholder="0912345678" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Email (Tùy chọn)"
                        name="email"
                        rules={[{ type: "email", message: "Email không hợp lệ!" }]}
                      >
                        <Input size="large" placeholder="email@gmail.com" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="Lời Nhắn / Dịch Vụ Cần Tư Vấn"
                    name="message"
                    rules={[{ required: true, message: "Vui lòng để lại lời nhắn!" }]}
                  >
                    <Input.TextArea rows={4} placeholder="Tôi muốn tư vấn về gói chụp cưới phóng sự..." />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={contactLoading}
                    icon={<SendOutlined />}
                    style={{
                      background: "#BFA16A",
                      borderColor: "#BFA16A",
                      color: "#FFFFFF",
                      height: "50px",
                      width: "100%",
                      fontSize: "14px",
                      fontWeight: "600",
                      letterSpacing: "1px",
                      borderRadius: 0,
                      marginTop: "10px"
                    }}
                  >
                    GỬI LỜI NHẮN
                  </Button>
                </Form>
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
};

export default Home;
