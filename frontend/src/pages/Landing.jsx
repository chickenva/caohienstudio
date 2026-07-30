/**
 * Landing.jsx
 * Trang giới thiệu studio: hero, dịch vụ nổi bật, album và CTA.
 */
import React from "react";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import Logo from "../components/Logo";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Arial, sans-serif';

// Landing page giới thiệu nhanh thương hiệu và điều hướng vào website.
const Landing = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{ width: "100%", background: "#ffffff", fontFamily: FONT_SANS }}
    >
      {/* HERO SECTION */}
      <div
        style={{
          height: "100vh",
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
          <Logo size={48} textColor="#ffffff" style={{ marginBottom: "24px", justifyContent: "center" }} />
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
          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            <Button
              onClick={() => navigate("/auth/login")}
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
              ĐĂNG NHẬP
            </Button>
            <Button
              onClick={() => navigate("/auth/register")}
              style={{
                background: PRIMARY_COLOR,
                color: "#fff",
                borderRadius: "0",
                padding: "0 40px",
                height: "45px",
                fontSize: "12px",
                letterSpacing: "2px",
                border: "none",
              }}
            >
              ĐĂNG KÝ
            </Button>
          </div>
        </div>
      </div>

      {/* MARQUEE SECTION */}
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
          Pre Wedding ✦ Phóng Sự Cưới ✦ Truyền Thống Cưới ✦ Ceremony Wedding ✦
          Wedding Documentary ✦ Pre Wedding ✦ Phóng Sự Cưới ✦ Truyền Thống Cưới
          ✦ Ceremony Wedding ✦ Wedding Documentary ✦
        </div>
      </div>

      {/* ABOUT SECTION */}
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
            Xin chào, tôi là Cao Hiển – Nhiếp ảnh gia Cưới & Production
          </h2>
          <div
            style={{ fontSize: "14px", color: "#444444", lineHeight: "2.4" }}
          >
            <p style={{ marginBottom: "20px" }}>
              Xin chào, tôi là Hiển, một nhiếp ảnh gia chuyên chụp ảnh cưới và
              production.
            </p>
            <p style={{ marginBottom: "20px" }}>
              Niềm đam mê của tôi là ghi lại những khoảnh khắc yêu thương thoáng
              qua để tạo nên những bức ảnh đẹp, chân thật và có giá trị theo
              thời gian.
            </p>
            <p style={{ marginBottom: "50px" }}>
              Bên cạnh chụp ảnh cưới, tôi cũng thực hiện nhiều dự án chụp ảnh
              và quay phim sự kiện, hội nghị, lễ khai trương, chương trình doanh
              nghiệp và các hoạt động truyền thống khác.
            </p>
          </div>
          <Button
            onClick={() => navigate("/auth/login")}
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
            BẮT ĐẦU <ArrowRightOutlined />
          </Button>
        </div>
      </div>

      {/* CTA SECTION */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "40px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "22px",
                fontWeight: "normal",
                color: "#333",
                marginBottom: "15px",
              }}
            >
              Chuyên Nghiệp
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#555",
                lineHeight: "1.8",
                marginBottom: "30px",
              }}
            >
              Với hơn 10 năm kinh nghiệm, chúng tôi cam kết mang lại chất lượng
              tốt nhất cho bạn.
            </p>
            <Button
              onClick={() => navigate("/auth/register")}
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
              TÌM HIỂU THÊM
            </Button>
          </div>

          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "22px",
                fontWeight: "normal",
                color: "#333",
                marginBottom: "15px",
              }}
            >
              Sáng Tạo
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#555",
                lineHeight: "1.8",
                marginBottom: "30px",
              }}
            >
              Mỗi dự án là một câu chuyện độc đáo. Chúng tôi tạo ra những bức
              ảnh đẹp và ý nghĩa.
            </p>
            <Button
              onClick={() => navigate("/auth/register")}
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
              TÌM HIỂU THÊM
            </Button>
          </div>

          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "22px",
                fontWeight: "normal",
                color: "#333",
                marginBottom: "15px",
              }}
            >
              Tin Tưởng
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#555",
                lineHeight: "1.8",
                marginBottom: "30px",
              }}
            >
              Hàng ngàn cặp đôi và công ty đã tin tưởng chúng tôi. Bạn cũng có
              thể.
            </p>
            <Button
              onClick={() => navigate("/auth/register")}
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
              TÌM HIỂU THÊM
            </Button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer
        style={{
          background: "#1a1a1a",
          color: "#fff",
          padding: "50px 40px 30px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Logo size={40} textColor="#ffffff" style={{ marginBottom: "20px", justifyContent: "center" }} />
          <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "30px" }}>
            Ghi lại những khoảnh khắc yêu thương thoáng qua để tạo nên những
            bức ảnh đẹp, chân thật và có giá trị theo thời gian.
          </p>
          <div style={{ color: "#999", fontSize: "12px" }}>
            © 2024 Cao Hiến Photography. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        .marquee-content { animation: marquee 50s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
};

export default Landing;
