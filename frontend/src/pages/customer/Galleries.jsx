import React, { useState, useEffect } from "react";
import { Tabs, Spin, message, Empty } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowRightOutlined,
  CameraOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const categoryLabels = {
  ALL: "Tất cả",
  WEDDING: "Ảnh cưới",
  PORTRAIT: "Chân dung",
  EVENT: "Sự kiện",
  GRADUATION: "Kỷ yếu",
};

const Galleries = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get("cat") || "ALL";

  useEffect(() => {
    const fetchGalleries = async () => {
      setLoading(true);

      try {
        const res = await axios.get(
          `http://localhost:5000/api/galleries?category=${currentCategory}`,
        );

        setGalleries(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        message.error("Không thể tải thư viện ảnh");
      } finally {
        setLoading(false);
      }
    };

    fetchGalleries();
  }, [currentCategory]);

  const handleTabChange = (key) => {
    setSearchParams({ cat: key });
  };

  const tabItems = [
    { key: "ALL", label: "TẤT CẢ" },
    { key: "WEDDING", label: "ẢNH CƯỚI" },
    { key: "PORTRAIT", label: "CHÂN DUNG" },
    { key: "EVENT", label: "SỰ KIỆN" },
    { key: "GRADUATION", label: "KỶ YẾU" },
  ];

  return (
    <div style={{ width: "100%", background: "#fff", minHeight: "100vh" }}>
      {/* HERO */}
      <section className="gallery-hero">
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="eyebrow">
            <CameraOutlined />
            CAO HIEN STUDIO
          </div>

          <h1>Thư Viện Ảnh</h1>

          <p>
            Mỗi khung hình là một câu chuyện được kể bằng ánh sáng, cảm xúc và
            những khoảnh khắc không thể lặp lại.
          </p>

          <div className="hero-stats">
            <div>
              <strong>{galleries.length || 0}</strong>
              <span>Album hiển thị</span>
            </div>
            <div>
              <strong>{categoryLabels[currentCategory]}</strong>
              <span>Danh mục hiện tại</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="gallery-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">SELECTED WORKS</span>
            <h2>Bộ sưu tập nổi bật</h2>
          </div>

          <p>
            Khám phá những album được chọn lọc từ các buổi chụp cưới, chân dung,
            sự kiện và kỷ yếu của studio.
          </p>
        </div>

        <div className="gallery-tabs">
          <Tabs
            activeKey={currentCategory}
            onChange={handleTabChange}
            items={tabItems}
            size="large"
            tabBarStyle={{ borderBottom: "none", marginBottom: 0 }}
          />
        </div>

        {loading ? (
          <div className="loading-box">
            <Spin size="large" />
            <p>Đang tải thư viện ảnh...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="empty-box">
            <Empty description="Chưa có album nào trong danh mục này" />
          </div>
        ) : (
          <div className="gallery-grid">
            {galleries.map((item, index) => (
              <article
                key={item._id}
                className={`gallery-card ${
                  index % 7 === 0 ? "gallery-card-large" : ""
                }`}
                onClick={() => navigate(`/galleries/${item._id}`)}
              >
                <img
                  src={
                    item.coverImage ||
                    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt={item.title}
                  loading="lazy"
                />

                <div className="card-shade" />

                <div className="card-top">
                  <span>
                    <PictureOutlined />
                    {categoryLabels[item.category] || item.category}
                  </span>
                </div>

                <div className="card-content">
                  <div>
                    <span className="card-category">
                      {categoryLabels[item.category] || item.category}
                    </span>

                    <h3>{item.title}</h3>

                    {item.description && <p>{item.description}</p>}
                  </div>

                  <button className="view-button">
                    Xem album <ArrowRightOutlined />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .gallery-hero {
          position: relative;
          min-height: 72vh;
          background-image:
            linear-gradient(120deg, rgba(0,0,0,0.78), rgba(0,0,0,0.28)),
            url("https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 75% 25%, rgba(154,138,120,0.25), transparent 34%),
            linear-gradient(to bottom, transparent 65%, #fff 100%);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 920px;
          padding: 110px 8vw 90px;
          color: #fff;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #e8ded2;
          font-size: 12px;
          letter-spacing: 4px;
          font-weight: 700;
          margin-bottom: 22px;
        }

        .hero-content h1 {
          font-family: ${FONT_SERIF};
          font-size: clamp(58px, 8vw, 112px);
          line-height: 0.95;
          font-weight: 400;
          margin: 0 0 24px;
          letter-spacing: -2px;
        }

        .hero-content p {
          max-width: 660px;
          font-size: 17px;
          line-height: 1.9;
          color: rgba(255,255,255,0.82);
          margin: 0;
        }

        .hero-stats {
          display: flex;
          gap: 18px;
          margin-top: 38px;
          flex-wrap: wrap;
        }

        .hero-stats div {
          min-width: 170px;
          padding: 18px 22px;
          border: 1px solid rgba(255,255,255,0.24);
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
        }

        .hero-stats strong {
          display: block;
          font-family: ${FONT_SERIF};
          font-size: 28px;
          font-weight: 400;
          margin-bottom: 4px;
        }

        .hero-stats span {
          font-size: 11px;
          color: rgba(255,255,255,0.68);
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .gallery-section {
          max-width: 1480px;
          margin: 0 auto;
          padding: 76px 28px 95px;
        }

        .section-heading {
          display: grid;
          grid-template-columns: 1fr minmax(280px, 520px);
          gap: 34px;
          align-items: end;
          margin-bottom: 36px;
        }

        .section-kicker {
          display: block;
          color: ${PRIMARY_COLOR};
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 3px;
          margin-bottom: 10px;
        }

        .section-heading h2 {
          font-family: ${FONT_SERIF};
          font-size: clamp(36px, 4.5vw, 62px);
          font-weight: 400;
          margin: 0;
          color: #222;
        }

        .section-heading p {
          color: #777;
          line-height: 1.8;
          margin: 0;
          font-size: 15px;
        }

        .gallery-tabs {
          display: flex;
          justify-content: center;
          margin: 24px 0 44px;
          padding: 12px;
          background: #f8f5f1;
          border: 1px solid #eee6dc;
        }

        .gallery-tabs .ant-tabs-tab {
          font-size: 12px;
          letter-spacing: 2px;
          color: #777;
          padding: 12px 20px;
          transition: all 0.3s;
        }

        .gallery-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: ${PRIMARY_COLOR} !important;
          font-weight: 700;
        }

        .gallery-tabs .ant-tabs-ink-bar {
          background: ${PRIMARY_COLOR};
          height: 2px;
        }

        .loading-box,
        .empty-box {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #888;
        }

        .loading-box p {
          margin-top: 18px;
          color: #777;
          letter-spacing: 1px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: 90px;
          gap: 18px;
        }

        .gallery-card {
          grid-column: span 4;
          grid-row: span 5;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background: #eee;
          border-radius: 18px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.08);
          isolation: isolate;
        }

        .gallery-card-large {
          grid-column: span 6;
          grid-row: span 6;
        }

        .gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.02);
          transition: transform 1.1s cubic-bezier(.2,.8,.2,1), filter 0.6s ease;
        }

        .card-shade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.2) 48%, rgba(0,0,0,0.04)),
            radial-gradient(circle at 50% 20%, transparent, rgba(0,0,0,0.18));
          opacity: 0.82;
          transition: opacity 0.5s ease;
        }

        .card-top {
          position: absolute;
          top: 18px;
          left: 18px;
          right: 18px;
          display: flex;
          justify-content: flex-start;
          z-index: 2;
        }

        .card-top span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          color: #fff;
          font-size: 11px;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(10px);
        }

        .card-content {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          padding: 30px;
          color: #fff;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          transform: translateY(8px);
          transition: transform 0.5s ease;
        }

        .card-category {
          display: block;
          color: #e5d7c6;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .card-content h3 {
          font-family: ${FONT_SERIF};
          font-size: clamp(25px, 2.1vw, 38px);
          line-height: 1.05;
          font-weight: 400;
          margin: 0;
        }

        .card-content p {
          max-width: 440px;
          margin: 10px 0 0;
          color: rgba(255,255,255,0.75);
          line-height: 1.6;
          font-size: 13px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .view-button {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.12);
          color: #fff;
          padding: 12px 16px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 1px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transform: translateX(8px);
          opacity: 0;
          transition: all 0.45s ease;
        }

        .gallery-card:hover img {
          transform: scale(1.1);
          filter: saturate(1.08) contrast(1.05);
        }

        .gallery-card:hover .card-shade {
          opacity: 1;
        }

        .gallery-card:hover .card-content {
          transform: translateY(0);
        }

        .gallery-card:hover .view-button {
          opacity: 1;
          transform: translateX(0);
        }

        @media (max-width: 1180px) {
          .gallery-card,
          .gallery-card-large {
            grid-column: span 6;
            grid-row: span 5;
          }
        }

        @media (max-width: 768px) {
          .gallery-hero {
            min-height: 62vh;
            background-attachment: scroll;
          }

          .hero-content {
            padding: 90px 24px 70px;
          }

          .hero-content h1 {
            font-size: 58px;
          }

          .section-heading {
            grid-template-columns: 1fr;
          }

          .gallery-tabs {
            justify-content: flex-start;
            overflow-x: auto;
          }

          .gallery-grid {
            display: block;
          }

          .gallery-card,
          .gallery-card-large {
            height: 420px;
            margin-bottom: 18px;
          }

          .card-content {
            padding: 24px;
            display: block;
          }

          .view-button {
            opacity: 1;
            transform: none;
            margin-top: 18px;
          }
        }

        @media (max-width: 480px) {
          .gallery-card,
          .gallery-card-large {
            height: 360px;
            border-radius: 14px;
          }

          .card-content h3 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default Galleries;
