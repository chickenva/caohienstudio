/**
 * About.jsx
 * Trang giới thiệu studio: câu chuyện, phong cách và đội ngũ.
 */
import React from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const BG_WARM = "#FAF7F2";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

// Trang giới thiệu studio, phong cách chụp và thông tin thương hiệu.
const About = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

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
      document.body.style.backgroundColor = "";
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="home-page-container" style={{ width: "100%", background: "#FAF7F2", color: "#2F2F2F" }}>
      {/* Ambient Glow spotlights */}
      <div className="glow-spotlight-light" style={{ top: "10%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "50%", right: "5%" }}></div>

      {/* SECTION 1: ABOUT */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 90px)", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px", padding: "40px 40px 40px 40px" }} className="scroll-reveal">
          <img
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop"
            alt="Portrait"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "550px",
              objectFit: "cover",
              filter: "contrast(1.02) brightness(0.98)",
              border: "1px solid #E8DED2",
            }}
          />
        </div>
        <div
          className="scroll-reveal stagger-1"
          style={{
            flex: "1 1 500px",
            padding: "60px 40px 60px 80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
            Nghệ Sĩ Nhiếp Ảnh
          </span>
          <h1
            className="font-serif-luxury"
            style={{
              fontWeight: "300",
              color: "#1F1F1F",
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: "1.25",
              marginBottom: "35px",
            }}
          >
            Xin chào, tôi là Cao Hiển – <br/>
            <span className="text-gold" style={{ fontStyle: "italic", fontWeight: "400" }}>Nhiếp ảnh gia Cưới & Production</span>
          </h1>
          <div style={{ fontSize: "14px", color: "#555555", lineHeight: "2.2", fontWeight: "300" }}>
            <p style={{ marginBottom: "20px" }}>
              Niềm đam mê của tôi là ghi lại những khoảnh khắc yêu thương thoáng
              qua để tạo nên những bức ảnh đẹp, chân thật và có giá trị theo
              thời gian.
            </p>
            <p style={{ marginBottom: "20px" }}>
              Tôi yêu việc lưu giữ những câu chuyện của các cặp đôi, từ lễ cưới,
              lễ đính hôn cho đến những khoảnh khắc đời thường của gia đình.
              Phong cách của tôi hướng đến sự tự nhiên, tinh tế và cảm xúc chân
              thật, để mỗi bức ảnh không chỉ là hình ảnh mà còn là một kỷ niệm
              đáng trân trọng.
            </p>
            <p style={{ marginBottom: "20px" }}>
              Bên cạnh chụp ảnh cưới, tôi cũng thực hiện nhiều dự án{" "}
              <strong style={{ color: "#2F2F2F", fontWeight: "500" }}>
                chụp ảnh và quay phim sự kiện, hội nghị, lễ khai trương, chương
                trình doanh nghiệp và các hoạt động truyền thống khác
              </strong>
              , giúp ghi lại những khoảnh khắc quan trọng một cách chuyên nghiệp
              và ấn tượng.
            </p>
            <p style={{ marginBottom: "40px" }}>
              Tôi luôn mong được đồng hành cùng bạn để lưu giữ những khoảnh khắc
              đặc biệt - dù đó là ngày trọng đại của cuộc đời hay những sự kiện
              đáng nhớ trong hành trình phát triển của bạn.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate("/contact")}
              className="btn-premium-gold"
            >
              LIÊN HỆ VỚI TÔI <ArrowRightOutlined />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: FAQ */}
      <div style={{ background: "#FAF7F2", padding: "100px 40px", borderTop: "1px solid #E8DED2", borderBottom: "1px solid #E8DED2" }} className="full-bleed">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "65px" }} className="scroll-reveal">
            <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
              Frequently Asked Questions
            </span>
            <h2
              className="font-serif-luxury"
              style={{
                fontSize: "40px",
                fontWeight: "300",
                color: "#1F1F1F",
                margin: 0
              }}
            >
              Câu hỏi thường gặp
            </h2>
            <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 0 auto" }}></div>
          </div>
          
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "30px",
            }}
          >
            {/* Card 1 */}
            <div
              className="scroll-reveal stagger-1 glass-panel"
              style={{
                padding: "40px",
                borderRadius: "0px",
              }}
            >
              <h3
                style={{
                  fontSize: "17.5px",
                  fontWeight: "500",
                  marginBottom: "20px",
                  fontFamily: "Outfit",
                  color: "#BFA16A",
                  letterSpacing: "0.5px"
                }}
              >
                💼 Chụp TRUYỀN THỐNG là gì ?
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  fontSize: "13.5px",
                  color: "#555",
                  lineHeight: "2.2",
                  margin: 0,
                  listStyleType: "disc",
                }}
              >
                <li>Chụp ảnh được dàn dựng, tạo dáng theo sự chỉnh chu.</li>
                <li>Tập trung vào ảnh nghi thức, ảnh gia đình, ảnh nhóm.</li>
                <li>
                  Góc chụp thường chính diện, chỉn chu. Hình ảnh thường đẹp, tinh
                  tế, có tính lưu niệm.
                </li>
              </ul>
            </div>
            {/* Card 2 */}
            <div
              className="scroll-reveal stagger-2 glass-panel"
              style={{
                padding: "40px",
                borderRadius: "0px",
              }}
            >
              <h3
                style={{
                  fontSize: "17.5px",
                  fontWeight: "500",
                  marginBottom: "20px",
                  fontFamily: "Outfit",
                  color: "#BFA16A",
                  letterSpacing: "0.5px"
                }}
              >
                📸 Chụp PHÓNG SỰ là gì ?
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  fontSize: "13.5px",
                  color: "#555",
                  lineHeight: "2.2",
                  margin: 0,
                  listStyleType: "disc",
                }}
              >
                <li>Ghi lại khoảnh khắc tự nhiên, không sắp đặt.</li>
                <li>
                  Chú trọng vào cảm xúc, câu chuyện, hành động. Góc chụp đa dạng,
                  có thể nghiêng, cận cảnh, "bắt khoảnh khắc".
                </li>
                <li>Hình ảnh mang tính kể chuyện, sống động, chân thực.</li>
              </ul>
            </div>
            {/* Card 3 */}
            <div
              className="scroll-reveal stagger-3 glass-panel"
              style={{
                padding: "40px",
                borderRadius: "0px",
              }}
            >
              <h3
                style={{
                  fontSize: "17.5px",
                  fontWeight: "500",
                  marginBottom: "20px",
                  fontFamily: "Outfit",
                  color: "#BFA16A",
                  letterSpacing: "0.5px"
                }}
              >
                📌 Vì sao cần cả 2 phong cách chụp trong ngày cưới?
              </h3>
              <div style={{ fontSize: "13.5px", color: "#555", lineHeight: "2.2" }}>
                <p style={{ marginBottom: "12px" }}>
                  - <strong style={{ color: "#2F2F2F" }}>Máy chụp truyền thống:</strong> Ghi lại nghi thức &
                  ảnh lưu niệm (ảnh gia đình, họ hàng, nghi lễ). Đây là "khung
                  xương" để kể lại câu chuyện ngày cưới một cách đầy đủ.
                </p>
                <p style={{ margin: 0 }}>
                  - <strong style={{ color: "#2F2F2F" }}>Máy chụp phóng sự:</strong> Bắt trọn khoảnh khắc tự
                  nhiên, cảm xúc chân thật. Đây là phần "gia vị" giúp bộ ảnh sống
                  động & có hồn.
                </p>
              </div>
            </div>
            {/* Card 4 */}
            <div
              className="scroll-reveal stagger-1 glass-panel"
              style={{
                padding: "40px",
                borderRadius: "0px",
              }}
            >
              <h3
                style={{
                  fontSize: "17.5px",
                  fontWeight: "500",
                  marginBottom: "20px",
                  fontFamily: "Outfit",
                  color: "#BFA16A",
                  letterSpacing: "0.5px"
                }}
              >
                🎥 Quay TRUYỀN THỐNG là gì ?
              </h3>
              <ul
                style={{
                  paddingLeft: "0",
                  fontSize: "13.5px",
                  color: "#555",
                  lineHeight: "2.2",
                  margin: 0,
                  listStyleType: "none",
                }}
              >
                <li>
                  - <strong style={{ color: "#2F2F2F" }}>Nội dung:</strong> Ghi hình đầy đủ nghi thức & các
                  phần quan trọng.
                </li>
                <li>
                  - <strong style={{ color: "#2F2F2F" }}>Độ dài phim:</strong> 30 PHÚT - 60 PHÚT (tùy vào
                  chương trình).
                </li>
                <li>
                  - <strong style={{ color: "#2F2F2F" }}>Cách quay:</strong> Cố định, chính diện, ít di chuyển.
                </li>
              </ul>
            </div>
            {/* Card 5 */}
            <div
              className="scroll-reveal stagger-2 glass-panel"
              style={{
                padding: "40px",
                borderRadius: "0px",
              }}
            >
              <h3
                style={{
                  fontSize: "17.5px",
                  fontWeight: "500",
                  marginBottom: "20px",
                  fontFamily: "Outfit",
                  color: "#BFA16A",
                  letterSpacing: "0.5px"
                }}
              >
                🎥 Quay PHÓNG SỰ là gì ?
              </h3>
              <ul
                style={{
                  paddingLeft: "0",
                  fontSize: "13.5px",
                  color: "#555",
                  lineHeight: "2.2",
                  margin: 0,
                  listStyleType: "none",
                }}
              >
                <li>
                  - <strong style={{ color: "#2F2F2F" }}>Nội dung:</strong> Tập trung vào khoảnh khắc tự nhiên,
                  cảm xúc thật.
                </li>
                <li>
                  - <strong style={{ color: "#2F2F2F" }}>Độ dài phim:</strong> CLIP NGẮN 5-10 PHÚT.
                </li>
                <li>
                  - <strong style={{ color: "#2F2F2F" }}>Cách quay:</strong> Nhiều góc máy sáng tạo, di chuyển
                  linh hoạt.
                </li>
              </ul>
            </div>
            {/* Card 6 */}
            <div
              className="scroll-reveal stagger-3 glass-panel"
              style={{
                padding: "40px",
                borderRadius: "0px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "19px",
                  fontWeight: "normal",
                  fontFamily: FONT_SERIF,
                  marginBottom: "20px",
                  color: "#2F2F2F"
                }}
              >
                Bao lâu sẽ nhận được sản phẩm file ảnh / film
              </h3>
              <div style={{ fontSize: "13.5px", color: "#555", lineHeight: "2.4" }}>
                <p style={{ marginBottom: "6px" }}>
                  Đối với file ảnh thời gian nhận ảnh:{" "}
                  <strong style={{ color: "#BFA16A" }}>5 - 7 ngày</strong>
                </p>
                <p style={{ marginBottom: "6px" }}>
                  Đối với file phim thời gian hoàn thiện:{" "}
                  <strong style={{ color: "#BFA16A" }}>10 - 12 ngày</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Cách thức nhận file: <strong style={{ color: "#BFA16A" }}>Google Drive</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
