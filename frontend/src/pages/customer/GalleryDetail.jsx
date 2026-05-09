import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Image, Button, Tag } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const GalleryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGalleryDetail = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/galleries/${id}`,
        );
        setGallery(res.data);
      } catch (err) {
        message.error("Không tìm thấy album ảnh");
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryDetail();
  }, [id]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "150px" }}>
        <Spin size="large" />
      </div>
    );

  if (!gallery) return null;

  return (
    <div style={{ width: "100%", background: "#fff", minHeight: "100vh" }}>
      {/* HEADER ALBUM (Lấy coverImage làm hình nền mờ) */}
      <div
        style={{
          position: "relative",
          height: "60vh",
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(${gallery.coverImage})`,
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/galleries")}
          style={{
            position: "absolute",
            top: "40px",
            left: "40px",
            color: "#fff",
            fontSize: "12px",
            letterSpacing: "2px",
          }}
        >
          QUAY LẠI THƯ VIỆN
        </Button>

        <Tag
          color={PRIMARY_COLOR}
          style={{
            letterSpacing: "2px",
            marginBottom: "20px",
            padding: "5px 15px",
            border: "none",
          }}
        >
          {gallery.category}
        </Tag>
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "52px",
            fontWeight: "normal",
            margin: "0 0 20px 0",
          }}
        >
          {gallery.title}
        </h1>
        <p
          style={{
            fontSize: "15px",
            maxWidth: "600px",
            color: "#eee",
            lineHeight: "1.8",
          }}
        >
          {gallery.description}
        </p>
      </div>

      {/* LƯỚI ẢNH CHI TIẾT (MASONRY) */}
      <div
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 20px" }}
      >
        {!gallery.images || gallery.images.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#888",
              fontStyle: "italic",
              padding: "50px",
            }}
          >
            Album này đang được cập nhật hình ảnh...
          </div>
        ) : (
          <Image.PreviewGroup>
            <div className="masonry-detail-container">
              {gallery.images.map((imgUrl, idx) => (
                <div key={idx} className="masonry-detail-item">
                  <Image
                    src={imgUrl}
                    alt={`${gallery.title} - ${idx}`}
                    className="masonry-detail-image"
                  />
                </div>
              ))}
            </div>
          </Image.PreviewGroup>
        )}
      </div>

      {/* CSS CHO MASONRY DETAIL */}
      <style>{`
        .masonry-detail-container {
          column-count: 1;
          column-gap: 20px;
        }
        @media (min-width: 576px) { .masonry-detail-container { column-count: 2; } }
        @media (min-width: 992px) { .masonry-detail-container { column-count: 3; } }
        @media (min-width: 1400px) { .masonry-detail-container { column-count: 4; } }

        .masonry-detail-item {
          break-inside: avoid;
          margin-bottom: 20px;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
        }

        .masonry-detail-item .ant-image { display: block; width: 100%; }
        .masonry-detail-image { 
          width: 100%; 
          height: auto !important; 
          display: block; 
          transition: filter 0.3s ease, transform 0.5s ease !important; 
        }

        .masonry-detail-item:hover .masonry-detail-image {
          transform: scale(1.03) !important;
          filter: brightness(0.85);
        }
      `}</style>
    </div>
  );
};

export default GalleryDetail;
