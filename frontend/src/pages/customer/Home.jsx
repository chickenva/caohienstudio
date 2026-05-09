import React from "react";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Arial, sans-serif';

const Home = () => {
  const navigate = useNavigate();
  const marqueeText =
    "Pre Wedding ✦ Phóng Sự Cưới ✦ Truyền Thống Cưới ✦ Ceremony Wedding ✦ Wedding Documentary ✦ ".repeat(
      10,
    );

  return (
    <div
      style={{ width: "100%", background: "#ffffff", fontFamily: FONT_SANS }}
    >
      {/* ==========================================
          1. HERO SECTION (Ảnh bìa)
      ========================================== */}
      <div
        style={{
          height: "calc(100vh - 90px)",
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#fff" }}>
          <p
            style={{
              letterSpacing: "4px",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            CAOHIENPHOTOGRAPHY
          </p>
          <h1
            style={{
              fontSize: "72px",
              fontFamily: FONT_SERIF,
              margin: "0 0 40px 0",
              fontWeight: "normal",
            }}
          >
            Moments of Love
          </h1>
          <Button
            onClick={() => navigate("/booking")}
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid #fff",
              borderRadius: "0",
              padding: "0 40px",
              height: "45px",
              fontSize: "12px",
              letterSpacing: "2px",
            }}
          >
            ĐẶT LỊCH <ArrowRightOutlined />
          </Button>
        </div>
      </div>

      {/* ==========================================
          2. DẢI CHỮ MARQUEE
      ========================================== */}
      <div
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          padding: "15px 0",
          background: "#ffffff",
        }}
      >
        <div
          className="marquee-content"
          style={{
            display: "inline-block",
            fontFamily: FONT_SERIF,
            fontSize: "18px",
            color: PRIMARY_COLOR,
            letterSpacing: "2px",
          }}
        >
          {marqueeText}
        </div>
      </div>

      {/* ==========================================
          3. PHẦN GIỚI THIỆU (ABOUT ME)
      ========================================== */}
      <div
        style={{
          background: "#ffffff",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "850px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: "normal",
              color: "#333333",
              marginBottom: "40px",
              fontSize: "32px",
            }}
          >
            Xin chào, tôi là Cao Hiền – Nhiếp ảnh gia Cưới & Production
          </h2>
          <div
            style={{ fontSize: "14px", color: "#444444", lineHeight: "2.4" }}
          >
            <p style={{ marginBottom: "20px" }}>
              Xin chào, tôi là Hiền, một nhiếp ảnh gia chuyên chụp ảnh cưới và
              production.
            </p>
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
              <strong style={{ color: "#000", fontWeight: "bold" }}>
                chụp ảnh và quay phim sự kiện, hội nghị, lễ khai trương, chương
                trình doanh nghiệp và các hoạt động truyền thống khác
              </strong>
              , giúp ghi lại những khoảnh khắc quan trọng một cách chuyên nghiệp
              và ấn tượng.
            </p>
            <p style={{ marginBottom: "50px" }}>
              Tôi luôn mong được đồng hành cùng bạn để lưu giữ những khoảnh khắc
              đặc biệt - dù đó là ngày trọng đại của cuộc đời hay những sự kiện
              đáng nhớ trong hành trình phát triển của bạn.
            </p>
          </div>
          <Button
            onClick={() => navigate("/contact")}
            type="primary"
            style={{
              background: PRIMARY_COLOR,
              color: "#ffffff",
              borderRadius: "0",
              height: "45px",
              border: "none",
              padding: "0 35px",
              fontSize: "12px",
              letterSpacing: "1px",
            }}
          >
            LIÊN HỆ VỚI TÔI <ArrowRightOutlined />
          </Button>
        </div>
      </div>

      {/* ==========================================
          4. BA CỘT NỘI DUNG 
      ========================================== */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 20px 100px 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "40px",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop"
              alt="Portrait"
              style={{
                width: "100%",
                height: "260px",
                objectFit: "cover",
                marginBottom: "25px",
              }}
            />
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "22px",
                fontWeight: "normal",
                color: "#333",
                marginBottom: "15px",
              }}
            >
              Thông tin về tôi
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#555",
                lineHeight: "1.8",
                marginBottom: "30px",
              }}
            >
              Là một nhiếp ảnh gia cưới, tôi ghi lại vẻ đẹp của tình yêu để tạo
              nên những kỷ niệm vượt thời gian trong ngày đặc biệt của bạn.
            </p>
            <Button
              onClick={() => navigate("/about")}
              style={{
                background: PRIMARY_COLOR,
                color: "#fff",
                borderRadius: "0",
                border: "none",
                height: "40px",
                fontSize: "11px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              ẤN VÀO ĐỂ XEM <ArrowRightOutlined />
            </Button>
          </div>

          <div style={{ textAlign: "left" }}>
            <img
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop"
              alt="Album"
              style={{
                width: "100%",
                height: "260px",
                objectFit: "cover",
                marginBottom: "25px",
              }}
            />
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "22px",
                fontWeight: "normal",
                color: "#333",
                marginBottom: "15px",
              }}
            >
              Album Ảnh
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#555",
                lineHeight: "1.8",
                marginBottom: "30px",
              }}
            >
              Từ ảnh cưới, lễ cưới mộng tư đến những câu chuyện tình yêu, tôi đã
              ghi lại tất cả với phong cách tinh tế, tối giản nhưng đầy cảm xúc
              và sức sống.
            </p>
            <Button
              onClick={() => navigate("/galleries")}
              style={{
                background: PRIMARY_COLOR,
                color: "#fff",
                borderRadius: "0",
                border: "none",
                height: "40px",
                fontSize: "11px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              ẤN VÀO ĐỂ XEM <ArrowRightOutlined />
            </Button>
          </div>

          <div style={{ textAlign: "left" }}>
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"
              alt="Price"
              style={{
                width: "100%",
                height: "260px",
                objectFit: "cover",
                marginBottom: "25px",
              }}
            />
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "22px",
                fontWeight: "normal",
                color: "#333",
                marginBottom: "15px",
              }}
            >
              BẢNG GIÁ / PRICE
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#555",
                lineHeight: "1.8",
                marginBottom: "30px",
              }}
            >
              Giá trị của hình ảnh và thước phim không nằm ở chi phí, mà nằm ở
              những kỷ niệm sẽ được lưu giữ mãi về sau.
            </p>
            <Button
              onClick={() => navigate("/services")}
              style={{
                background: PRIMARY_COLOR,
                color: "#fff",
                borderRadius: "0",
                border: "none",
                height: "40px",
                fontSize: "11px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              ẤN VÀO ĐỂ XEM <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .marquee-content { animation: marquee 50s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
};

export default Home;
