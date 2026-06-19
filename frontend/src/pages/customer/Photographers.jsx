import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, message, Row, Col } from "antd";
import { InstagramOutlined, ArrowRightOutlined } from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

const Photographer = () => {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchStaffs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "http://localhost:5000/api/users/photographers",
        );
        setStaffs(res.data.photographers || []);
      } catch (err) {
        message.error("Không thể tải danh sách nhiếp ảnh gia");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffs();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Intersection Observer for scroll reveal animations
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
  }, [loading, staffs]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "150px 0", background: "#FAF7F2" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div className="home-page-container" style={{ background: "#FAF7F2", width: "100%", overflow: "hidden" }}>
      {/* Ambient spotlights */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "50%", right: "5%" }}></div>

      {/* HEADER GIỚI THIỆU */}
      <div
        className="scroll-reveal"
        style={{
          textAlign: "center",
          padding: "100px 20px 70px 20px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
          Our Storytellers
        </span>
        <h1
          className="font-serif-luxury"
          style={{
            fontSize: "48px",
            fontWeight: "300",
            color: "#1F1F1F",
            marginBottom: "20px",
            lineHeight: "1.2"
          }}
        >
          Những Người Kể Chuyện
        </h1>
        <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 25px auto" }}></div>
        <p
          style={{
            color: "#555555",
            fontSize: "15.5px",
            lineHeight: "1.8",
            fontWeight: "300",
          }}
        >
          Phía sau mỗi tác phẩm hoàn mỹ là sự nhạy cảm nghệ thuật, phong cách xử lý màu sắc tinh tế
          và trái tim của người làm nghệ thuật. Hãy cùng khám phá những câu chuyện từ đội ngũ nhiếp ảnh gia của chúng tôi.
        </p>
      </div>

      {/* DANH SÁCH THỢ CHỤP (ZIG-ZAG LAYOUT) */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {staffs.map((staff, index) => {
          const isEven = index % 2 === 0;
          const { portfolio } = staff;

          return (
            <Row
              key={staff._id}
              className="scroll-reveal"
              style={{
                minHeight: "85vh",
                flexDirection: isEven ? "row" : "row-reverse",
                background: isEven ? "#FAF7F2" : "#F6EFf7" /* fallback transparent overlay logic */,
                borderTop: "1px solid #E8DED2",
                borderBottom: index === staffs.length - 1 ? "1px solid #E8DED2" : "none"
              }}
            >
              {/* CỘT 1: THÔNG TIN VÀ ẢNH CHÂN DUNG */}
              <Col
                xs={24}
                lg={10}
                className="scroll-reveal stagger-1"
                style={{
                  padding: "8% 6%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  background: isEven ? "transparent" : "#FAF7F2",
                  borderRight: isEven && !loading ? "none" : "none",
                  borderLeft: !isEven && !loading ? "none" : "none"
                }}
              >
                <span
                  style={{
                    color: PRIMARY_COLOR,
                    letterSpacing: "3px",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {portfolio?.years_of_experience || 3}+ NĂM KINH NGHIỆM
                </span>

                <h2
                  className="font-serif-luxury"
                  style={{
                    fontSize: "52px",
                    margin: "15px 0 25px 0",
                    fontWeight: "300",
                    color: "#1F1F1F",
                    lineHeight: "1.15"
                  }}
                >
                  {staff.full_name}
                </h2>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "30px",
                    flexWrap: "wrap",
                  }}
                >
                  {(portfolio?.specialties || ["Portrait", "Wedding"]).map(
                    (spec) => (
                      <span
                        key={spec}
                        className="photographer-tag"
                        style={{
                          background: "rgba(191, 161, 106, 0.05)",
                          border: "1px solid rgba(191, 161, 106, 0.15)",
                          padding: "4px 12px",
                          fontSize: "11px",
                          letterSpacing: "1px",
                          color: "#BFA16A",
                          borderRadius: "0px",
                          textTransform: "uppercase"
                        }}
                      >
                        {spec}
                      </span>
                    ),
                  )}
                </div>

                <p
                  style={{
                    color: "#555555",
                    fontSize: "14.5px",
                    lineHeight: "1.9",
                    marginBottom: "40px",
                    fontWeight: "300"
                  }}
                >
                  {portfolio?.bio ||
                    "Một nhiếp ảnh gia chuyên nghiệp luôn cống hiến hết mình để bắt trọn từng khoảnh khắc tự nhiên & cảm xúc chân thực nhất."}
                </p>

                {/* Chữ ký / Avatar nhỏ */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "25px", flexWrap: "wrap" }}
                >
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    padding: "3px",
                    border: "1px solid rgba(191, 161, 106, 0.2)",
                    display: "inline-block"
                  }}>
                    <img
                      src={
                        portfolio?.avatar ||
                        "https://images.unsplash.com/photo-1554151228-14d9def656e4"
                      }
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => navigate(`/photographers/${staff._id}`)}
                      className="btn-premium-outline"
                      style={{ height: "42px", padding: "0 20px", fontSize: "11px" }}
                    >
                      HỒ SƠ CHI TIẾT <InstagramOutlined />
                    </button>
                    <button
                      onClick={() => navigate("/booking", { state: { photographer_id: staff._id, photographer_name: staff.full_name } })}
                      className="btn-premium-gold"
                      style={{ height: "42px", padding: "0 20px", fontSize: "11px" }}
                    >
                      ĐẶT LỊCH NGAY <ArrowRightOutlined />
                    </button>
                  </div>
                </div>
              </Col>

              {/* CỘT 2: SHOWCASE ẢNH ĐẸP (ASYMMETRICAL GRID) */}
              <Col xs={24} lg={14} style={{ padding: "5%" }} className="scroll-reveal stagger-2">
                <div className="portfolio-grid">
                  <div className="grid-item item-large" style={{ border: "1px solid #E8DED2", borderRadius: 0 }}>
                    <img
                      src={
                        portfolio?.featured_images?.[0] ||
                        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc"
                      }
                      alt="featured-1"
                      style={{ transition: "transform 1.2s ease" }}
                    />
                  </div>
                  <div className="grid-item item-small" style={{ border: "1px solid #E8DED2", borderRadius: 0 }}>
                    <img
                      src={
                        portfolio?.featured_images?.[1] ||
                        "https://images.unsplash.com/photo-1519741497674-611481863552"
                      }
                      alt="featured-2"
                      style={{ transition: "transform 1.2s ease" }}
                    />
                  </div>
                  <div className="grid-item item-small" style={{ border: "1px solid #E8DED2", borderRadius: 0 }}>
                    <img
                      src={
                        portfolio?.featured_images?.[2] ||
                        "https://images.unsplash.com/photo-1537633552985-df8429e8048b"
                      }
                      alt="featured-3"
                      style={{ transition: "transform 1.2s ease" }}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          );
        })}
      </div>

      <style>{`
        /* Lưới 3 ảnh bất đối xứng nghệ thuật */
        .portfolio-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 20px;
          height: 100%;
          min-height: 500px;
        }

        .grid-item { overflow: hidden; position: relative; }
        .grid-item img { width: 100%; height: 100%; object-fit: cover; }
        .grid-item:hover img { transform: scale(1.05); }

        .item-large { grid-column: 1 / 2; grid-row: 1 / 3; }
        .item-small { grid-column: 2 / 3; }

        @media (max-width: 991px) {
          .portfolio-grid { min-height: 400px; }
        }
      `}</style>
    </div>
  );
};

export default Photographer;
