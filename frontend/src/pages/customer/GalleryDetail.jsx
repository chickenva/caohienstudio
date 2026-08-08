/**
 * GalleryDetail.jsx
 * Trang chi tiết album ảnh với lightbox xem từng ảnh.
 */
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Image, Empty, Row, Col } from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  AppstoreOutlined,
  PictureOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";
import {
  getGalleryImageSrcSet,
  getGalleryImageUrl,
  getImageDimensions,
  getImageErrorHandler,
  preloadImages,
  isServerUploadUrl,
  upgradeGoogleImageUrl,
} from "../../utils/imageUtils";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
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
  const [relatedServices, setRelatedServices] = useState([]);
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

      // Xử lý gói dịch vụ liên quan
      const linkedServices = (fetchedGallery.service_ids || []).filter(Boolean);
      try {
        const sRes = await axios.get(`${API_URL}/services`);
        const allServices = Array.isArray(sRes.data) ? sRes.data : sRes.data.services || [];
        
        // Ưu tiên gói được link trong album, nếu thiếu thì tự động bổ sung gói cùng danh mục/khác để tròn 3 card
        const linkedIds = new Set(linkedServices.map(s => s._id || s));
        const extraServices = allServices.filter(s => !linkedIds.has(s._id));
        const combined = [...linkedServices, ...extraServices].slice(0, 3);
        setRelatedServices(combined);
      } catch (e) {
        setRelatedServices(linkedServices.slice(0, 3));
      }
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
          minHeight: "60vh",
          backgroundImage: `linear-gradient(180deg, rgba(15, 12, 10, 0.38) 0%, rgba(15, 12, 10, 0.28) 45%, rgba(250, 247, 242, 0.75) 85%, #FAF7F2 100%), url(${coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          padding: "60px 20px 50px 20px",
          textAlign: "center",
          borderBottom: "1px solid #E8DED2",
        }}
        className="scroll-reveal"
      >
        {/* Top Back Navigation Bar */}
        <div style={{ maxWidth: "1200px", margin: "0 auto 40px auto", width: "100%", textAlign: "left", padding: "0 10px" }}>
          <button
            onClick={() => navigate("/galleries")}
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              height: "42px",
              padding: "0 24px",
              fontSize: "11px",
              letterSpacing: "2px",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(191, 161, 106, 0.85)";
              e.currentTarget.style.borderColor = PRIMARY_COLOR;
              e.currentTarget.style.color = "#FFF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.45)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
          >
            <ArrowLeftOutlined /> QUAY LẠI THƯ VIỆN
          </button>
        </div>

        {/* Category tag label */}
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "3px",
            fontWeight: "600",
            textTransform: "uppercase",
            padding: "6px 18px",
            border: "1px solid rgba(212, 177, 106, 0.8)",
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "#F5D796",
            display: "inline-block",
            marginBottom: "24px",
            borderRadius: "2px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
          }}
        >
          {categoryLabels[gallery.category] || gallery.category}
        </div>

        {/* Title */}
        <h1
          className="font-serif-luxury"
          style={{
            fontSize: "clamp(38px, 6vw, 72px)",
            lineHeight: 1.12,
            fontWeight: "300",
            margin: "0 0 22px 0",
            maxWidth: "1000px",
            color: "#FFFFFF",
            textShadow: "0 3px 18px rgba(0, 0, 0, 0.75), 0 1px 4px rgba(0, 0, 0, 0.9)",
            letterSpacing: "-0.5px",
          }}
        >
          {gallery.title}
        </h1>

        {/* Description */}
        {gallery.description && (
          <p
            style={{
              fontSize: "16.5px",
              maxWidth: "750px",
              color: "#FFFFFF",
              lineHeight: "1.85",
              margin: "0 auto",
              fontWeight: "300",
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.85), 0 1px 3px rgba(0, 0, 0, 0.95)",
            }}
          >
            {gallery.description}
          </p>
        )}
      </div>

      {/* THÔNG TIN CHI TIẾT ALBUM METADATA */}
      <div
        style={{ maxWidth: "1200px", margin: "-35px auto 0 auto", padding: "0 20px", position: "relative", zIndex: 10 }}
        className="scroll-reveal stagger-1"
      >
        <Row gutter={[16, 16]}>
          {/* Photos count */}
          <Col xs={24} md={8}>
            <div 
              style={{
                padding: "16px 22px",
                border: "1px solid #E8DED2",
                background: "#FFFFFF",
                borderRadius: "2px",
                boxShadow: "0 8px 25px rgba(154, 138, 120, 0.06)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ color: PRIMARY_COLOR, fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                <PictureOutlined style={{ fontSize: "14px" }} />
                <span>Số lượng ảnh</span>
              </div>
              <div
                className="font-serif-luxury text-gold"
                style={{
                  fontSize: "28px",
                  fontWeight: "300",
                  marginTop: 4,
                  lineHeight: 1.1,
                }}
              >
                {images.length}
              </div>
            </div>
          </Col>

          {/* Location */}
          <Col xs={24} md={8}>
            <div 
              style={{
                padding: "16px 22px",
                border: "1px solid #E8DED2",
                background: "#FFFFFF",
                borderRadius: "2px",
                boxShadow: "0 8px 25px rgba(154, 138, 120, 0.06)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ color: PRIMARY_COLOR, fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                <EnvironmentOutlined style={{ fontSize: "14px" }} />
                <span>Địa điểm chụp</span>
              </div>
              <div
                className="font-serif-luxury"
                style={{
                  fontSize: "18px",
                  fontWeight: "300",
                  color: "#1F1F1F",
                  marginTop: 6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {gallery.location || "Cao Hiển Studio"}
              </div>
            </div>
          </Col>

          {/* Phong cách */}
          <Col xs={24} md={8}>
            <div 
              style={{
                padding: "16px 22px",
                border: "1px solid #E8DED2",
                background: "#FFFFFF",
                borderRadius: "2px",
                boxShadow: "0 8px 25px rgba(154, 138, 120, 0.06)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ color: PRIMARY_COLOR, fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CameraOutlined style={{ fontSize: "14px" }} />
                <span>Phong cách</span>
              </div>
              <div
                className="font-serif-luxury"
                style={{
                  fontSize: "18px",
                  fontWeight: "300",
                  color: "#1F1F1F",
                  marginTop: 6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {categoryLabels[gallery.category] ? `${categoryLabels[gallery.category]} Fine-Art` : "Fine Art Cinematic"}
              </div>
            </div>
          </Col>

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

      {/* GÓI CHỤP TƯƠNG TỰ (Đưa xuống DƯỚI phần Khoảnh khắc trong Album) */}
      {relatedServices.length > 0 && (
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "20px 20px 100px 20px",
          }}
          className="scroll-reveal stagger-1"
        >
          <div style={{ marginBottom: "35px", textAlign: "center" }}>
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
              RECOMMENDED PACKAGES
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
              GÓI CHỤP TƯƠNG TỰ
            </h2>
            <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "18px auto 0 auto" }}></div>
          </div>

          <Row gutter={[24, 24]}>
            {relatedServices.slice(0, 3).map((item, idx) => (
              <Col xs={24} sm={12} md={8} key={item._id || idx}>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8DED2",
                    borderRadius: "2px",
                    padding: "20px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(154, 138, 120, 0.04)"
                  }}
                  onClick={() => navigate(`/services/${item._id}`)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = PRIMARY_COLOR;
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 15px 30px rgba(191, 161, 106, 0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#E8DED2";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(154, 138, 120, 0.04)";
                  }}
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div style={{ width: "100%", height: "200px", overflow: "hidden", marginBottom: "16px", borderRadius: "2px", background: "#FAF7F2" }}>
                      <img
                        src={
                          isServerUploadUrl(item.thumbnail)
                            ? item.thumbnail
                            : upgradeGoogleImageUrl(item.thumbnail, "s800") || FALLBACK_IMAGE
                        }
                        alt={item.name}
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      />
                    </div>

                    {/* Service Name */}
                    <h3
                      className="font-serif-luxury"
                      style={{
                        fontSize: "20px",
                        fontWeight: "400",
                        color: "#1F1F1F",
                        marginBottom: "10px",
                        lineHeight: "1.3"
                      }}
                    >
                      {item.name}
                    </h3>

                    {/* Price */}
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "600",
                        color: PRIMARY_COLOR,
                        marginBottom: "16px"
                      }}
                    >
                      {Number(item.base_price || 0).toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  {/* Action Link */}
                  <div
                    style={{
                      borderTop: "1px solid #F0E8DD",
                      paddingTop: "14px",
                      marginTop: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: PRIMARY_COLOR,
                      fontWeight: "500",
                      fontSize: "13px",
                      letterSpacing: "1px"
                    }}
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRightOutlined />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

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

