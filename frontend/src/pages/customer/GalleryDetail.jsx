import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Image, Empty, Row, Col } from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  AppstoreOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop";

const categoryLabels = {
  WEDDING: "Ảnh cưới",
  PORTRAIT: "Chân dung",
  EVENT: "Sự kiện",
  GRADUATION: "Kỷ yếu",
};

const GalleryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gallery, setGallery] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";
    fetchGalleryDetail();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [id]);

  // Scroll reveals trigger
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
  }, [loading, gallery, images]);

  const fetchGalleryDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/galleries/${id}`,
      );
      setGallery(res.data.gallery);
      setImages(res.data.images || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không tìm thấy album ảnh",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "150px 0", background: "#FAF7F2" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: "#777777", fontFamily: "Outfit", letterSpacing: "0.5px" }}>
          Đang kết nối thư viện ảnh...
        </div>
      </div>
    );
  }

  if (!gallery) return null;

  const coverImage =
    gallery.coverImage || images?.[0]?.imageUrl || FALLBACK_IMAGE;

  return (
    <div className="home-page-container" style={{ width: "100%", background: "#FAF7F2", minHeight: "100vh" }}>
      {/* Ambient spotlights */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ bottom: "10%", left: "10%" }}></div>

      {/* HEADER ALBUM (Light luxury fine-art background banner) */}
      <div
        style={{
          position: "relative",
          minHeight: "55vh",
          backgroundImage: `linear-gradient(to bottom, rgba(250, 247, 242, 0.4) 0%, rgba(250, 247, 242, 0.98) 100%), url(${coverImage})`,
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#2F2F2F",
          padding: "80px 20px 40px 20px",
          textAlign: "center",
          borderBottom: "1px solid #E8DED2"
        }}
        className="scroll-reveal"
      >
        {/* Back Button */}
        <div style={{ maxWidth: "1200px", margin: "0 auto 30px auto", width: "100%", textAlign: "left", padding: "0 20px" }}>
          <button
            onClick={() => navigate("/galleries")}
            className="btn-premium-outline"
            style={{ height: "40px", padding: "0 20px", fontSize: "11px" }}
          >
            <ArrowLeftOutlined style={{ marginRight: "6px" }} /> QUAY LẠI THƯ VIỆN
          </button>
        </div>

        {/* Category tag label */}
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "2.5px",
            fontWeight: "600",
            textTransform: "uppercase",
            padding: "4px 12px",
            border: "1px solid rgba(191, 161, 106, 0.3)",
            background: "rgba(191, 161, 106, 0.05)",
            color: "#BFA16A",
            display: "inline-block",
            marginBottom: "20px"
          }}
        >
          {categoryLabels[gallery.category] || gallery.category}
        </span>

        {/* Title */}
        <h1
          className="font-serif-luxury"
          style={{
            fontSize: "clamp(36px, 5.5vw, 68px)",
            lineHeight: 1.15,
            fontWeight: "300",
            margin: "0 0 20px 0",
            maxWidth: "1000px",
            color: "#1F1F1F"
          }}
        >
          {gallery.title}
        </h1>

        {/* Description */}
        {gallery.description && (
          <p
            style={{
              fontSize: "15.5px",
              maxWidth: "720px",
              color: "#555555",
              lineHeight: "1.8",
              margin: 0,
              fontWeight: "300"
            }}
          >
            {gallery.description}
          </p>
        )}
      </div>

      {/* THÔNG TIN CHI TIẾT ALBUM */}
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "50px 20px 0 20px" }}
        className="scroll-reveal stagger-1"
      >
        <Row gutter={[20, 20]}>
          {/* Photos count */}
          <Col xs={24} md={8}>
            <div 
              className="glass-panel" 
              style={{ padding: "26px 30px", border: "1px solid #E8DED2", background: "#FFFFFF", borderRadius: "0px" }}
            >
              <div style={{ color: PRIMARY_COLOR, fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <PictureOutlined />
                <span>Số lượng ảnh</span>
              </div>
              <div
                className="font-serif-luxury text-gold"
                style={{
                  fontSize: "36px",
                  fontWeight: "300",
                  marginTop: 8,
                }}
              >
                {images.length}
              </div>
            </div>
          </Col>

          {/* Location */}
          <Col xs={24} md={8}>
            <div 
              className="glass-panel" 
              style={{ padding: "26px 30px", border: "1px solid #E8DED2", background: "#FFFFFF", borderRadius: "0px" }}
            >
              <div style={{ color: PRIMARY_COLOR, fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <EnvironmentOutlined />
                <span>Địa điểm chụp</span>
              </div>
              <div
                className="font-serif-luxury"
                style={{
                  fontSize: "22px",
                  fontWeight: "300",
                  color: "#2F2F2F",
                  marginTop: 18,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {gallery.location || "Cao Hiển Studio"}
              </div>
            </div>
          </Col>

          {/* Photographer */}
          <Col xs={24} md={8}>
            <div 
              className="glass-panel" 
              style={{ padding: "26px 30px", border: "1px solid #E8DED2", background: "#FFFFFF", borderRadius: "0px" }}
            >
              <div style={{ color: PRIMARY_COLOR, fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CameraOutlined />
                <span>Nhiếp ảnh gia</span>
              </div>
              <div
                className="font-serif-luxury"
                style={{
                  fontSize: "22px",
                  fontWeight: "300",
                  color: "#2F2F2F",
                  marginTop: 18,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {gallery.photographer_id?.full_name || "Cao Hiển Studio"}
              </div>
            </div>
          </Col>

          {/* Related service package */}
          {gallery.service_id && (
            <Col xs={24}>
              <div 
                style={{ 
                  padding: "30px", 
                  border: "1px solid #E8DED2", 
                  background: "#FFFFFF", 
                  borderRadius: "0px", 
                  marginTop: "10px",
                  position: "relative"
                }}
              >
                <div style={{ color: PRIMARY_COLOR, fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "15px" }}>
                  <AppstoreOutlined />
                  <span>Gói dịch vụ liên quan</span>
                </div>

                <div className="font-serif-luxury" style={{ fontSize: "24px", color: "#2F2F2F", fontWeight: "300", marginBottom: "10px" }}>
                  {gallery.service_id.name}
                </div>

                {gallery.service_id.description && (
                  <p style={{ color: "#555555", lineHeight: "1.8", fontSize: "14px", fontWeight: "300", margin: 0 }}>
                    {gallery.service_id.description}
                  </p>
                )}
              </div>
            </Col>
          )}
        </Row>
      </div>

      {/* MASONRY PICTURES EXHIBIT GRID */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "70px 20px 90px 20px",
        }}
        className="scroll-reveal stagger-2"
      >
        <div style={{ marginBottom: "35px" }}>
          <div
            style={{
              color: PRIMARY_COLOR,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 3,
              marginBottom: 8,
              textTransform: "uppercase"
            }}
          >
            Curated Exhibits
          </div>

          <h2
            className="font-serif-luxury"
            style={{
              fontSize: "36px",
              fontWeight: "300",
              margin: 0,
              color: "#1F1F1F"
            }}
          >
            Khoảnh Khắc Trong Album
          </h2>
          <div style={{ width: "40px", height: "1px", background: "#BFA16A", marginTop: "20px" }}></div>
        </div>

        {images.length === 0 ? (
          <div style={{ padding: "80px 20px", textAlign: "center", background: "#FFFFFF", border: "1px solid #E8DED2" }}>
            <Empty description="Tác phẩm đang được đồng bộ từ lưu trữ đám mây. Vui lòng quay lại sau." />
          </div>
        ) : (
          <Image.PreviewGroup>
            <div className="masonry-detail-container">
              {images.map((img, idx) => (
                <div key={img.id || idx} className="masonry-detail-item">
                  <Image
                    src={img.imageUrl || img.thumbnailLink || FALLBACK_IMAGE}
                    alt={img.name || `${gallery.title} - ${idx + 1}`}
                    className="masonry-detail-image"
                    preview={{
                      src: img.imageUrl || img.webViewLink,
                    }}
                    onError={(e) => {
                      e.currentTarget.src = img.thumbnailLink || FALLBACK_IMAGE;
                    }}
                  />
                </div>
              ))}
            </div>
          </Image.PreviewGroup>
        )}
      </div>

      <style>{`
        .masonry-detail-container {
          column-count: 1;
          column-gap: 24px;
        }

        @media (min-width: 576px) {
          .masonry-detail-container {
            column-count: 2;
          }
        }

        @media (min-width: 992px) {
          .masonry-detail-container {
            column-count: 3;
          }
        }

        @media (min-width: 1400px) {
          .masonry-detail-container {
            column-count: 4;
          }
        }

        .masonry-detail-item {
          break-inside: avoid;
          margin-bottom: 24px;
          border-radius: 0px;
          border: 1px solid #E8DED2;
          padding: 10px;
          overflow: hidden;
          cursor: pointer;
          background: #FFFFFF;
          box-shadow: 0 5px 15px rgba(154, 138, 120, 0.02);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .masonry-detail-item:hover {
          border-color: ${PRIMARY_COLOR};
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(154, 138, 120, 0.08);
        }

        .masonry-detail-item .ant-image {
          display: block;
          width: 100%;
          border: 1px solid #E8DED2;
        }

        .masonry-detail-image {
          width: 100%;
          height: auto !important;
          display: block;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .masonry-detail-item:hover .masonry-detail-image {
          transform: scale(1.04) !important;
        }

        @media (max-width: 768px) {
          div[style*="background-attachment: fixed"] {
            background-attachment: scroll !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GalleryDetail;
