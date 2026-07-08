import React, { useState, useEffect } from "react";
import { Spin, message, Empty, Row, Col } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowRightOutlined,
  CameraOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";
import {
  FALLBACK_GALLERY_IMAGE,
  getGalleryImageSrcSet,
  getGalleryImageUrl,
  getImageErrorHandler,
  preloadImages,
} from "../../utils/imageUtils";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

const categoryLabels = {
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

  const [categories, setCategories] = useState([
    { key: "ALL", index: "01", label: "TẤT CẢ" }
  ]);

  const currentCategory = searchParams.get("cat") || "ALL";

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [catsRes, galsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/categories?type=GALLERY&is_active=true"),
          axios.get(`http://localhost:5000/api/galleries?category=${currentCategory}`)
        ]);

        const dynamicCategories = (catsRes.data.categories || []).map((c, i) => ({
          key: c.slug,
          index: String(i + 2).padStart(2, '0'),
          label: c.name.toUpperCase()
        }));

        setCategories([
          { key: "ALL", index: "01", label: "TẤT CẢ" },
          ...dynamicCategories
        ]);

        const fetchedGalleries = Array.isArray(galsRes.data) ? galsRes.data : [];
        await preloadImages(
          fetchedGalleries.slice(0, 8).map((item, index) =>
            getGalleryImageUrl(
              item,
              index === 0 ? "cover" : "grid",
              FALLBACK_GALLERY_IMAGE,
            ),
          ),
          { limit: 8, timeoutMs: 3200 },
        );
        setGalleries(fetchedGalleries);
      } catch (err) {
        message.error("Không thể tải thư viện ảnh");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [currentCategory]);

  // Intersection Observer for scroll animations
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
  }, [loading, galleries]);

  const handleCategoryClick = (key) => {
    setSearchParams({ cat: key });
  };


  // Pre-curated high-end demo fallbacks to keep the page visually stunning if API is empty
  const demoGalleries = [
    {
      _id: "demo-gal-1",
      title: "Eternal Romance in Da Lat",
      category: "WEDDING",
      coverImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200",
      location: "Đà Lạt, Lâm Đồng",
      description: "Album phóng sự cưới Fine-Art ngập tràn ánh hoàng hôn ấm áp giữa đồi thông thơ mộng tại Đà Lạt."
    },
    {
      _id: "demo-gal-2",
      title: "Sài Gòn Sunrise Stories",
      category: "PORTRAIT",
      coverImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200",
      location: "Quận 1, TP. HCM",
      description: "Chân dung nghệ thuật đường phố ngập tràn ánh nắng ban mai rực rỡ và những khoảnh khắc đời thường tinh tế."
    },
    {
      _id: "demo-gal-3",
      title: "Sweet Dreamer Studio",
      category: "WEDDING",
      coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200",
      location: "Cao Hiển Studio",
      description: "Bộ ảnh concept cưới tối giản trong studio tập trung trọn vẹn vào nụ cười ngọt ngào và ánh mắt hạnh phúc."
    },
    {
      _id: "demo-gal-4",
      title: "Luxury Fashion Editorial",
      category: "EVENT",
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200",
      location: "TP. HCM",
      description: "Phóng sự sự kiện thời trang xa xỉ với góc máy điện ảnh, bắt trọn từng bộ sưu tập sắc nét và dàn khách mời đẳng cấp."
    },
    {
      _id: "demo-gal-5",
      title: "Youthful Days in HCMC",
      category: "GRADUATION",
      coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200",
      location: "TP. HCM",
      description: "Kỷ yếu thanh xuân trong veo của nhóm bạn thân dưới mái trường cổ kính, mang màu sắc hoài niệm đầy cảm xúc."
    }
  ];

  const displayGalleries = galleries.length > 0 
    ? galleries 
    : (currentCategory === "ALL" 
        ? demoGalleries 
        : demoGalleries.filter(item => item.category === currentCategory));

  return (
    <div className="home-page-container" style={{ width: "100%", background: "#FAF7F2", minHeight: "100vh" }}>
      {/* Glow spotlight backgrounds */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ bottom: "10%", left: "10%" }}></div>

      {/* LUXURY FINE ART HERO */}
      <section style={{ padding: "80px 20px 60px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Row gutter={[40, 40]} align="middle">
            {/* Left Column: Heading and curation values */}
            <Col xs={24} lg={11} className="scroll-reveal">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: "rgba(191, 161, 106, 0.08)", border: "1px solid rgba(191, 161, 106, 0.2)", marginBottom: "25px" }}>
                <CameraOutlined style={{ color: "#BFA16A" }} />
                <span style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#BFA16A", fontWeight: "600" }}>
                  Fine Art Curations
                </span>
              </div>

              <h1 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "clamp(42px, 5.5vw, 76px)", fontWeight: "300", lineHeight: "1.15", margin: "0 0 25px 0", letterSpacing: "-1px" }}>
                Nghệ Thuật <br/>
                <span className="text-gold" style={{ fontStyle: "italic", fontWeight: "400" }}>Lưu Giữ</span> Ánh Sáng
              </h1>

              <p style={{ color: "#555555", fontSize: "16.5px", lineHeight: "1.8", marginBottom: "40px", fontWeight: "300" }}>
                Mỗi album ảnh là một tác phẩm nghệ thuật, được biên tập tỉ mỉ để giữ trọn vẹn những câu chuyện lãng mạn, cảm xúc chân thực và thần thái tự nhiên.
              </p>

              {/* Grid Curation Stats */}
              <div style={{ display: "flex", gap: "35px", borderTop: "1px solid #E8DED2", paddingTop: "30px" }}>
                <div>
                  <div className="font-serif-luxury text-gold" style={{ fontSize: "36px", fontWeight: "300" }}>{displayGalleries.length || 24}+</div>
                  <div style={{ fontSize: "11px", color: "#777777", letterSpacing: "2px", textTransform: "uppercase", marginTop: "5px" }}>Tác Phẩm Trưng Bày</div>
                </div>
                <div>
                  <div className="font-serif-luxury text-gold" style={{ fontSize: "36px", fontWeight: "300" }}>100%</div>
                  <div style={{ fontSize: "11px", color: "#777777", letterSpacing: "2px", textTransform: "uppercase", marginTop: "5px" }}>Cảm Xúc Nguyên Bản</div>
                </div>
              </div>
            </Col>

            {/* Right Column: Layered 3D Floating Collage Exhibit */}
            <Col xs={24} lg={13} className="scroll-reveal stagger-1">
              <div className="museum-collage-container">
                <div className="museum-collage-item collage-1">
                  <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop" alt="stacked-1" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="museum-collage-item collage-2">
                  <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop" alt="stacked-2" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="museum-collage-item collage-3">
                  <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop" alt="stacked-3" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* CATALOG-STYLE CATEGORY NAVIGATOR */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <div className="catalog-selector scroll-reveal">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className={`catalog-link ${currentCategory === cat.key ? "active" : ""}`}
              onClick={() => handleCategoryClick(cat.key)}
            >
              <span className="catalog-num">{cat.index}</span>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MUSEUM GALLERY GRID */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 100px 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "120px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: "15px", color: "#777777", letterSpacing: "1px" }}>Đang giám tuyển trưng bày...</p>
          </div>
        ) : displayGalleries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }} className="glass-panel">
            <Empty description="Không có tác phẩm nào hiển thị cho mục này." />
          </div>
        ) : (
          <div className="museum-grid">
            {displayGalleries.map((item, index) => {
              const imageUrl = getGalleryImageUrl(
                item,
                index === 0 ? "cover" : "grid",
                FALLBACK_GALLERY_IMAGE,
              );
              const imageSrcSet = getGalleryImageSrcSet(imageUrl);

              return (
                <div
                  key={item._id}
                  className={`museum-col-4 scroll-reveal stagger-${(index % 3) + 1}`}
                  onClick={() => navigate(`/galleries/${item._id}`)}
                >
                  <div className="museum-card">
                    <div className="museum-image-wrapper">
                      <img
                        src={imageUrl}
                        srcSet={imageSrcSet}
                        sizes="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 380px"
                        alt={item.title}
                        loading={index <= 5 ? "eager" : "lazy"}
                        fetchPriority={index <= 2 ? "high" : "auto"}
                        decoding="async"
                        onError={getImageErrorHandler(FALLBACK_GALLERY_IMAGE)}
                      />
                    </div>

                    <div className="museum-card-info">
                      <span className="museum-card-category">
                        {categoryLabels[item.category] || item.category}
                      </span>

                      <h3 className="museum-card-title">{item.title}</h3>

                      {item.description && <p className="museum-card-desc">{item.description}</p>}

                      <div className="museum-card-footer">
                        <span className="museum-card-location"><EnvironmentOutlined /> {item.location || "Cao Hien Studio"}</span>
                        <span className="museum-card-action">XEM CHI TI?T <ArrowRightOutlined /></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        /* 3D Collage Exhibit Styles */
        .museum-collage-container {
          position: relative;
          height: 420px;
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }

        .museum-collage-item {
          position: absolute;
          width: 250px;
          height: 330px;
          border: 10px solid #FFFFFF;
          box-shadow: 0 15px 35px rgba(154, 138, 120, 0.12);
          overflow: hidden;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .collage-1 {
          top: 10px;
          left: 10px;
          transform: rotate(-6deg);
          z-index: 1;
        }

        .collage-2 {
          top: 40px;
          right: 10px;
          transform: rotate(5deg);
          z-index: 2;
        }

        .collage-3 {
          bottom: 10px;
          left: 120px;
          transform: rotate(-2deg);
          z-index: 3;
        }

        .museum-collage-container:hover .collage-1 {
          transform: translate(-30px, -15px) rotate(-10deg);
        }

        .museum-collage-container:hover .collage-2 {
          transform: translate(30px, -20px) rotate(9deg);
        }

        .museum-collage-container:hover .collage-3 {
          transform: translate(0px, 20px) rotate(1deg) scale(1.05);
          z-index: 4;
          box-shadow: 0 20px 45px rgba(154, 138, 120, 0.2);
        }

        /* Catalog index navigation */
        .catalog-selector {
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
          margin: 40px 0 60px 0;
          padding: 15px 20px;
          border-top: 1px solid #E8DED2;
          border-bottom: 1px solid #E8DED2;
        }

        .catalog-link {
          font-family: 'Outfit', sans-serif;
          font-size: 12.5px;
          letter-spacing: 2.5px;
          color: #777777;
          cursor: pointer;
          transition: all 0.4s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          position: relative;
          padding: 8px 12px;
        }

        .catalog-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 1px;
          background-color: #BFA16A;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .catalog-link:hover::after,
        .catalog-link.active::after {
          width: 80%;
          left: 10%;
        }

        .catalog-link:hover,
        .catalog-link.active {
          color: #BFA16A;
        }

        .catalog-num {
          font-size: 9px;
          color: #BFA16A;
          font-weight: 600;
          position: relative;
          top: -4px;
        }

        /* Museum Fine Art Card */
        .museum-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px;
          align-items: stretch;
        }

        .museum-col-4 {
          min-width: 0;
        }

        .museum-card {
          background: #FFFFFF;
          border: 1px solid #E8DED2;
          padding: 14px;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          border-radius: 0px;
        }

        .museum-card:hover {
          border-color: ${PRIMARY_COLOR};
          transform: translateY(-6px);
          box-shadow: 0 16px 34px rgba(154, 138, 120, 0.09);
        }

        .museum-image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #FAF7F2;
          border: 1px solid #E8DED2;
        }

        .museum-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 1.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .museum-card:hover .museum-image-wrapper img {
          transform: scale(1.06);
        }

        .museum-card-info {
          padding: 20px 4px 4px;
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 205px;
        }

        .museum-card-category {
          font-size: 10.5px;
          color: #BFA16A;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
        }

        .museum-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 23px;
          font-weight: 300;
          color: #2F2F2F;
          margin: 0 0 12px 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .museum-card-desc {
          font-size: 13.5px;
          color: #666666;
          line-height: 1.7;
          margin: 0 0 20px 0;
          font-weight: 300;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .museum-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px dashed #E8DED2;
        }

        .museum-card-location {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #888888;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .museum-card-location .anticon {
          color: #BFA16A;
          flex: 0 0 auto;
        }

        .museum-card-action {
          flex: 0 0 auto;
          font-size: 11px;
          letter-spacing: 1.3px;
          text-transform: uppercase;
          font-weight: 500;
          color: #2F2F2F;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.3s;
        }

        .museum-card:hover .museum-card-action {
          color: #BFA16A;
        }

        @media (max-width: 991px) {
          .museum-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px;
          }
          .museum-collage-container {
            height: 380px;
          }
          .museum-collage-item {
            width: 220px;
            height: 290px;
          }
          .collage-3 {
            left: 100px;
          }
        }

        @media (max-width: 767px) {
          .museum-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }
          .museum-card-info {
            min-height: 0;
          }
          .catalog-selector {
            justify-content: flex-start;
            overflow-x: auto;
            white-space: nowrap;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Galleries;
