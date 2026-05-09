import React, { useState, useEffect } from "react";
import { Tabs, Spin, message, Image } from "antd";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const Galleries = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy category từ URL (VD: bấm từ Menu trang chủ xuống)
  const currentCategory = searchParams.get("cat") || "ALL";

  useEffect(() => {
    const fetchGalleries = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/galleries?category=${currentCategory}`,
        );
        setGalleries(res.data);
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
      {/* HEADER PARALLAX */}
      <div
        style={{
          height: "50vh",
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop')",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "56px",
            fontWeight: "normal",
            margin: "0 0 10px 0",
            letterSpacing: "2px",
          }}
        >
          Thư Viện Ảnh
        </h1>
        <p
          style={{
            fontSize: "14px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#ccc",
          }}
        >
          Lưu giữ từng khoảnh khắc
        </p>
      </div>

      {/* TABS & MASONRY GRID */}
      <div
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 20px" }}
      >
        {/* Thanh Lọc Danh Mục */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "50px",
          }}
          className="gallery-tabs"
        >
          <Tabs
            activeKey={currentCategory}
            onChange={handleTabChange}
            items={tabItems}
            size="large"
            tabBarStyle={{ borderBottom: "none" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "100px" }}>
            <Spin size="large" />
          </div>
        ) : galleries.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "100px",
              color: "#888",
              fontFamily: FONT_SERIF,
              fontSize: "20px",
            }}
          >
            Chưa có album nào trong danh mục này.
          </div>
        ) : (
          <div className="masonry-container">
            {galleries.map((item) => (
              <div
                key={item._id}
                className="masonry-item"
                onClick={() => navigate(`/galleries/${item._id}`)} // LOGIC MỚI: Bấm vào là chuyển trang
                style={{ cursor: "pointer" }}
              >
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="masonry-image"
                />
                {/* Lớp phủ Gradient */}
                <div className="item-info">
                  <span className="item-category">{item.category}</span>
                  <h3 className="item-title">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STYLE ĐỘC QUYỀN CHO MASONRY & HIỆU ỨNG HOVER */}
      <style>{`
        .gallery-tabs .ant-tabs-tab { font-size: 13px; letter-spacing: 2px; color: #888; padding: 12px 24px; transition: all 0.3s; }
        .gallery-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${PRIMARY_COLOR} !important; font-weight: 600; }
        .gallery-tabs .ant-tabs-ink-bar { background: ${PRIMARY_COLOR}; height: 2px; }

        /* Masonry Grid Setup */
        .masonry-container {
          column-count: 1;
          column-gap: 20px;
        }
        @media (min-width: 768px) { .masonry-container { column-count: 2; } }
        @media (min-width: 1024px) { .masonry-container { column-count: 3; } }
        @media (min-width: 1400px) { .masonry-container { column-count: 4; } }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 20px;
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          background: #f0f0f0;
        }

        /* Ẩn overlay mặc định của Antd Image để dùng overlay tự chế mượt hơn */
        .masonry-item .ant-image { display: block; width: 100%; }
        .masonry-image { width: 100%; height: auto !important; display: block; transition: transform 0.8s ease !important; }
        
        .item-info {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 40px 20px 20px 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s ease;
          pointer-events: none; /* Tránh cản trở thao tác click vào ảnh */
        }

        .masonry-item:hover .masonry-image {
          transform: scale(1.05) !important;
        }

        .masonry-item:hover .item-info {
          opacity: 1;
          transform: translateY(0);
        }

        .item-category { display: block; color: ${PRIMARY_COLOR}; font-size: 11px; letter-spacing: 2px; margin-bottom: 5px; }
        .item-title { color: #fff; font-family: ${FONT_SERIF}; font-size: 22px; margin: 0; font-weight: normal; }
      `}</style>
    </div>
  );
};

export default Galleries;
