import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Image, Button, Tag, Empty, Row, Col, Card } from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  AppstoreOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

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

    fetchGalleryDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "150px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: "#777" }}>
          Đang tải album từ Google Drive...
        </div>
      </div>
    );
  }

  if (!gallery) return null;

  const coverImage =
    gallery.coverImage || images?.[0]?.imageUrl || FALLBACK_IMAGE;

  return (
    <div style={{ width: "100%", background: "#fff", minHeight: "100vh" }}>
      {/* HEADER ALBUM */}
      <div
        style={{
          position: "relative",
          minHeight: "62vh",
          backgroundImage: `linear-gradient(rgba(0,0,0,0.58), rgba(0,0,0,0.76)), url(${coverImage})`,
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          padding: "90px 20px",
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
            padding: "6px 16px",
            border: "none",
            borderRadius: "999px",
          }}
        >
          {categoryLabels[gallery.category] || gallery.category}
        </Tag>

        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "clamp(44px, 7vw, 86px)",
            lineHeight: 1,
            fontWeight: "normal",
            margin: "0 0 22px 0",
            maxWidth: "1000px",
          }}
        >
          {gallery.title}
        </h1>

        {gallery.description && (
          <p
            style={{
              fontSize: "16px",
              maxWidth: "720px",
              color: "#eee",
              lineHeight: "1.8",
              margin: 0,
            }}
          >
            {gallery.description}
          </p>
        )}
      </div>

      {/* THÔNG TIN ALBUM */}
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "55px 20px 0" }}
      >
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ background: "#f8f5f1" }}>
              <div style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
                <PictureOutlined style={{ marginRight: 8 }} />
                Số lượng ảnh
              </div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 34,
                  marginTop: 8,
                }}
              >
                {images.length}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} style={{ background: "#f8f5f1" }}>
              <div style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                Địa điểm
              </div>
              <div style={{ marginTop: 12, color: "#444" }}>
                {gallery.location || "Chưa cập nhật"}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} style={{ background: "#f8f5f1" }}>
              <div style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
                <CameraOutlined style={{ marginRight: 8 }} />
                Nhiếp ảnh gia
              </div>
              <div style={{ marginTop: 12, color: "#444" }}>
                {gallery.photographer_id?.full_name || "Cao Hien Studio"}
              </div>
            </Card>
          </Col>

          {gallery.service_id && (
            <Col xs={24}>
              <Card bordered={false} style={{ background: "#fff" }}>
                <div style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
                  <AppstoreOutlined style={{ marginRight: 8 }} />
                  Gói chụp liên quan
                </div>

                <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>
                  {gallery.service_id.name}
                </div>

                {gallery.service_id.description && (
                  <div style={{ marginTop: 8, color: "#666", lineHeight: 1.7 }}>
                    {gallery.service_id.description}
                  </div>
                )}
              </Card>
            </Col>
          )}
        </Row>
      </div>

      {/* LƯỚI ẢNH CHI TIẾT */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "70px 20px 90px",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              color: PRIMARY_COLOR,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 3,
              marginBottom: 8,
            }}
          >
            ALBUM PHOTOS
          </div>

          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 42,
              fontWeight: "normal",
              margin: 0,
            }}
          >
            Khoảnh khắc trong album
          </h2>
        </div>

        {images.length === 0 ? (
          <Empty description="Folder Google Drive này chưa có ảnh hoặc ảnh chưa được chia sẻ quyền xem" />
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
          column-gap: 20px;
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
          margin-bottom: 20px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          background: #f2f2f2;
          box-shadow: 0 14px 34px rgba(0,0,0,0.06);
        }

        .masonry-detail-item .ant-image {
          display: block;
          width: 100%;
        }

        .masonry-detail-image {
          width: 100%;
          height: auto !important;
          display: block;
          transition: filter 0.3s ease, transform 0.5s ease !important;
        }

        .masonry-detail-item:hover .masonry-detail-image {
          transform: scale(1.03) !important;
          filter: brightness(0.88);
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
