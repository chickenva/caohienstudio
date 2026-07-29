import React, { useState, useEffect, useMemo } from "react";
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
import {
  getGalleryImageSrcSet,
  getGalleryImageUrl,
  getImageDimensions,
  getImageErrorHandler,
  preloadImages,
} from "../../utils/imageUtils";

const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";
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

// Trang chi tiết album, render ảnh theo layout responsive.
const GalleryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gallery, setGallery] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masonryColumnCount, setMasonryColumnCount] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({});

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

  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;

      if (width >= 1400) {
        setMasonryColumnCount(4);
      } else if (width >= 992) {
        setMasonryColumnCount(3);
      } else if (width >= 576) {
        setMasonryColumnCount(2);
      } else {
        setMasonryColumnCount(1);
      }
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);

    return () => {
      window.removeEventListener("resize", updateColumnCount);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (images.length === 0) {
      setImageDimensions({});
      return () => {
        cancelled = true;
      };
    }

    const loadDimensions = async () => {
      const entries = await Promise.all(
        images.map(async (img, idx) => {
          const key = img.id || String(idx);
          const storedWidth = Number(img.width || img.imageMediaMetadata?.width);
          const storedHeight = Number(img.height || img.imageMediaMetadata?.height);

          if (storedWidth > 0 && storedHeight > 0) {
            return [key, { width: storedWidth, height: storedHeight }];
          }

          const url = getGalleryImageUrl(img, "grid", FALLBACK_IMAGE);
          const dimensions = await getImageDimensions(url);

          return [key, dimensions];
        }),
      );

      if (!cancelled) {
        setImageDimensions(Object.fromEntries(entries));
      }
    };

    loadDimensions();

    return () => {
      cancelled = true;
    };
  }, [images]);

  const masonryColumns = useMemo(() => {
    const columns = Array.from({ length: masonryColumnCount }, () => ({
      height: 0,
      items: [],
    }));

    images.forEach((img, idx) => {
      const key = img.id || String(idx);
      const dimensions = imageDimensions[key];
      const width = Number(img.width || img.imageMediaMetadata?.width || dimensions?.width);
      const height = Number(img.height || img.imageMediaMetadata?.height || dimensions?.height);
      const ratio = width > 0 && height > 0 ? width / height : 1.35;
      const estimatedHeight = 1 / Math.max(ratio, 0.25);
      const targetColumnIndex = columns.reduce(
        (bestIndex, column, columnIndex) =>
          column.height < columns[bestIndex].height ? columnIndex : bestIndex,
        0,
      );

      columns[targetColumnIndex].items.push({ img, idx });
      columns[targetColumnIndex].height += estimatedHeight + 0.08;
    });

    return columns.map((column) => column.items);
  }, [images, imageDimensions, masonryColumnCount]);

  const fetchGalleryDetail = async () => {
    setLoading(true);
    
    // Xử lý dữ liệu mẫu cho demo galleries
    if (id && id.startsWith("demo-gal-")) {
      const demoGalleries = {
        "demo-gal-1": {
          title: "Eternal Romance in Da Lat",
          category: "WEDDING",
          coverImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200",
          location: "Đà Lạt, Lâm Đồng",
          description: "Album phóng sự cưới Fine-Art ngập tràn ánh hoàng hôn ấm áp giữa đồi thông thơ mộng tại Đà Lạt."
        },
        "demo-gal-2": {
          title: "Sài Gòn Sunrise Stories",
          category: "PORTRAIT",
          coverImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200",
          location: "Quận 1, TP. HCM",
          description: "Chân dung nghệ thuật đường phố ngập tràn ánh nắng ban mai rực rỡ và những khoảnh khắc đời thường tinh tế."
        },
        "demo-gal-3": {
          title: "Sweet Dreamer Studio",
          category: "WEDDING",
          coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200",
          location: "Cao Hiển Studio",
          description: "Bộ ảnh concept cưới tối giản trong studio tập trung trọn vẹn vào nụ cười ngọt ngào và ánh mắt hạnh phúc."
        },
        "demo-gal-4": {
          title: "Luxury Fashion Editorial",
          category: "EVENT",
          coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200",
          location: "TP. HCM",
          description: "Phóng sự sự kiện thời trang xa xỉ với góc máy điện ảnh, bắt trọn từng bộ sưu tập sắc nét và dàn khách mời đẳng cấp."
        },
        "demo-gal-5": {
          title: "Youthful Days in HCMC",
          category: "GRADUATION",
          coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200",
          location: "TP. HCM",
          description: "Kỷ yếu thanh xuân trong veo của nhóm bạn thân dưới mái trường cổ kính, mang màu sắc hoài niệm đầy cảm xúc."
        }
      };

      const demoImages = [
        { id: 1, imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200" },
        { id: 2, imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200" },
        { id: 3, imageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200" },
        { id: 4, imageUrl: "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=1200" },
        { id: 5, imageUrl: "https://images.unsplash.com/photo-1522673607200-1648832cee98?q=80&w=1200" },
        { id: 6, imageUrl: "https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=1200" },
      ];

      const demoGallery = demoGalleries[id] || demoGalleries["demo-gal-1"];
      await preloadImages(
        [
          getGalleryImageUrl(demoGallery, "cover", FALLBACK_IMAGE),
          ...demoImages.slice(0, 8).map((img) =>
            getGalleryImageUrl(img, "grid", FALLBACK_IMAGE),
          ),
        ],
        { limit: 9, timeoutMs: 2800 },
      );

      setGallery(demoGallery);
      setImages(demoImages);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/galleries/${id}`,
      );
      const fetchedGallery = res.data.gallery;
      const fetchedImages = res.data.images || [];
      const firstImageFallback = getGalleryImageUrl(
        fetchedImages[0],
        "cover",
        FALLBACK_IMAGE,
      );

      await preloadImages(
        [
          getGalleryImageUrl(fetchedGallery, "cover", firstImageFallback),
          ...fetchedImages.slice(0, 10).map((img) =>
            getGalleryImageUrl(img, "grid", FALLBACK_IMAGE),
          ),
        ],
        { limit: 11, timeoutMs: 3500 },
      );

      setGallery(fetchedGallery);
      setImages(fetchedImages);
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

  const coverImage = getGalleryImageUrl(
    gallery,
    "cover",
    getGalleryImageUrl(images?.[0], "cover", FALLBACK_IMAGE),
  );

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
          {gallery.service_ids && gallery.service_ids.length > 0 && (
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

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {gallery.service_ids.map((service, index) => (
                    <div key={index}>
                      <div className="font-serif-luxury" style={{ fontSize: "24px", color: "#2F2F2F", fontWeight: "300", marginBottom: "10px" }}>
                        {service.name}
                      </div>

                      {service.description && (
                        <p style={{ color: "#555555", lineHeight: "1.8", fontSize: "14px", fontWeight: "300", margin: 0 }}>
                          {service.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
            <div
              className="masonry-detail-container"
              style={{ "--masonry-columns": masonryColumnCount }}
            >
              {masonryColumns.map((column, columnIndex) => (
                <div className="masonry-detail-column" key={columnIndex}>
                  {column.map(({ img, idx }) => {
                    const imageUrl = getGalleryImageUrl(img, "grid", FALLBACK_IMAGE);
                    const previewUrl = getGalleryImageUrl(img, "preview", imageUrl);
                    const imageSrcSet = getGalleryImageSrcSet(imageUrl);

                    return (
                      <div key={img.id || idx} className="masonry-detail-item">
                        <Image
                          src={imageUrl}
                          srcSet={imageSrcSet}
                          sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, (max-width: 1399px) 33vw, 25vw"
                          alt={img.name || `${gallery.title} - ${idx + 1}`}
                          className="masonry-detail-image"
                          loading={idx < 8 ? "eager" : "lazy"}
                          fetchPriority={idx < 4 ? "high" : "auto"}
                          decoding="async"
                          preview={{
                            src: previewUrl,
                          }}
                          onError={getImageErrorHandler(FALLBACK_IMAGE)}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Image.PreviewGroup>
        )}
      </div>

      <style>{`
        .masonry-detail-container {
          display: grid;
          grid-template-columns: repeat(var(--masonry-columns), minmax(0, 1fr));
          gap: 24px;
          align-items: start;
        }

        .masonry-detail-column {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .masonry-detail-item {
          break-inside: avoid;
          margin-bottom: 0;
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

        @media (max-width: 575px) {
          .masonry-detail-container,
          .masonry-detail-column {
            gap: 18px;
          }
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
