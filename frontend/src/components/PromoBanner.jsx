/**
 * PromoBanner.jsx
 * Widget hộp quà góc dưới trái + Modal poster full-screen.
 * 
 * - Widget hộp quà: hiệu ứng lắc lư (wiggle), tỏa sáng (glow pulse), sparkle particles
 * - Badge số nhỏ ở góc trên bên phải widget = số banner đang có
 * - Khi user đã xem hết poster → badge biến mất (localStorage theo session)
 * - Click widget → mở modal poster full-screen, swipe/prev/next nếu nhiều banner
 * - Không tự động mở khi vào trang
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CloseOutlined,
  GiftOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

const PromoBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAnimState, setModalAnimState] = useState("closed");
  const [hasViewed, setHasViewed] = useState(false);
  const [imgTransition, setImgTransition] = useState(false);

  const closeTimerRef = useRef(null);
  const touchStartX = useRef(null);

  const resolveImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const backendBase = API_URL.replace(/\/api\/?$/, "");
    return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Fetch active banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API_URL}/banners`);
        const activeBanners = res.data?.banners || [];
        setBanners(activeBanners);
      } catch {
        setBanners([]);
      }
    };
    fetchBanners();
  }, []);

  // Check localStorage for viewed state
  useEffect(() => {
    if (banners.length === 0) return;
    const viewedIds = JSON.parse(sessionStorage.getItem("viewed_banners") || "[]");
    const allViewed = banners.every((b) => viewedIds.includes(b._id));
    setHasViewed(allViewed);
  }, [banners]);

  // Mark all current banners as viewed
  const markAllViewed = useCallback(() => {
    const ids = banners.map((b) => b._id);
    sessionStorage.setItem("viewed_banners", JSON.stringify(ids));
    setHasViewed(true);
  }, [banners]);

  // Open modal
  const openModal = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setCurrentIndex(0);
    setModalVisible(true);
    setModalAnimState("opening");
    requestAnimationFrame(() => {
      setTimeout(() => setModalAnimState("open"), 20);
    });
  };

  // Close modal
  const closeModal = () => {
    setModalAnimState("closing");
    markAllViewed();
    closeTimerRef.current = setTimeout(() => {
      setModalVisible(false);
      setModalAnimState("closed");
    }, 350);
  };

  // Navigation
  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (banners.length <= 1) return;
    setImgTransition(true);
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    setTimeout(() => setImgTransition(false), 280);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (banners.length <= 1) return;
    setImgTransition(true);
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    setTimeout(() => setImgTransition(false), 280);
  };

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalVisible) return;
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalVisible, banners.length]);

  // Touch swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? handleNext() : handlePrev();
    }
    touchStartX.current = null;
  };

  const activeBanner = banners[currentIndex] || null;
  const bannerCount = banners.length;

  if (bannerCount === 0) return null;

  return (
    <>
      {/* ========== MODAL POSTER FULL-SCREEN ========== */}
      {modalVisible && activeBanner && (
        <div
          className={`poster-backdrop ${
            modalAnimState === "open"
              ? "pb-open"
              : modalAnimState === "closing"
              ? "pb-closing"
              : "pb-initial"
          }`}
          onClick={closeModal}
        >
          {/* Close button */}
          <button
            className="poster-close-btn"
            onClick={closeModal}
            title="Đóng (Esc)"
          >
            <CloseOutlined />
          </button>

          {/* Nav arrows */}
          {bannerCount > 1 && (
            <>
              <button
                className="poster-nav-btn poster-nav-prev"
                onClick={handlePrev}
                title="Poster trước"
              >
                <LeftOutlined />
              </button>
              <button
                className="poster-nav-btn poster-nav-next"
                onClick={handleNext}
                title="Poster kế tiếp"
              >
                <RightOutlined />
              </button>
            </>
          )}

          {/* Poster image */}
          <div
            className="poster-container"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={resolveImageUrl(activeBanner.imageUrl)}
              alt="Poster quảng cáo"
              className={`poster-img ${imgTransition ? "poster-img-transition" : ""}`}
            />
          </div>

          {/* Dots indicator */}
          {bannerCount > 1 && (
            <div className="poster-dots">
              {banners.map((_, idx) => (
                <span
                  key={idx}
                  className={`poster-dot ${idx === currentIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (idx !== currentIndex) {
                      setImgTransition(true);
                      setCurrentIndex(idx);
                      setTimeout(() => setImgTransition(false), 280);
                    }
                  }}
                />
              ))}
              <span className="poster-counter">
                {currentIndex + 1} / {bannerCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========== FLOATING GIFT WIDGET ========== */}
      <div
        className="gift-widget-container"
        onClick={openModal}
        title="Xem ưu đãi & khuyến mãi"
      >
        {/* Gift Button and concentric effects */}
        <div className="gift-btn-wrapper">
          {/* Sparkle particles */}
          <div className="gift-sparkles">
            <span className="sparkle s1" />
            <span className="sparkle s2" />
            <span className="sparkle s3" />
            <span className="sparkle s4" />
            <span className="sparkle s5" />
            <span className="sparkle s6" />
          </div>

          {/* Glow ring */}
          <div className="gift-glow-ring" />

          {/* Gift icon circle */}
          <div className="gift-circle">
            <GiftOutlined />
          </div>

          {/* Badge count */}
          {!hasViewed && bannerCount > 0 && (
            <div className="gift-badge-count">{bannerCount}</div>
          )}
        </div>

        {/* Expandable label */}
        <div className="gift-label">
          <span className="gift-label-text">Ưu Đãi HOT</span>
        </div>
      </div>

      {/* ========== STYLES ========== */}
      <style>{`
        /* ===== MODAL BACKDROP ===== */
        .poster-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(10, 8, 6, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pb-initial { opacity: 0; }
        .pb-open { opacity: 1; }
        .pb-closing { opacity: 0; }

        /* Close button */
        .poster-close-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10002;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.25);
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          backdrop-filter: blur(4px);
        }
        .poster-close-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: rotate(90deg) scale(1.1);
        }

        /* Nav arrows */
        .poster-nav-btn {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10001;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(20, 18, 16, 0.8);
          border: 2px solid #BFA16A;
          color: #F7EAD0;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(191,161,106,0.3);
        }
        .poster-nav-btn:hover {
          background: linear-gradient(135deg, #E2CE9F, #BFA16A);
          color: #161311;
          border-color: #F7EAD0;
          transform: translateY(-50%) scale(1.12);
        }
        .poster-nav-prev { left: max(16px, 3vw); }
        .poster-nav-next { right: max(16px, 3vw); }

        /* Poster container */
        .poster-container {
          max-width: 85vw;
          max-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: poster-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes poster-enter {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .poster-img {
          max-width: 100%;
          max-height: 82vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(191,161,106,0.15);
          transition: opacity 0.28s ease, transform 0.28s ease;
        }
        .poster-img-transition {
          opacity: 0.15;
          transform: scale(0.96);
        }

        /* Dots indicator */
        .poster-dots {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10001;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 12, 10, 0.7);
          padding: 6px 16px;
          border-radius: 24px;
          backdrop-filter: blur(6px);
          border: 1px solid rgba(191,161,106,0.25);
        }
        .poster-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .poster-dot.active {
          width: 20px;
          border-radius: 4px;
          background: #BFA16A;
        }
        .poster-dot:hover:not(.active) {
          background: rgba(255,255,255,0.6);
        }
        .poster-counter {
          color: rgba(255,255,255,0.6);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          margin-left: 6px;
        }

        /* ===== GIFT WIDGET ===== */
        .gift-widget-container {
          position: fixed;
          bottom: 28px;
          left: 28px;
          z-index: 998;
          cursor: pointer;
          display: flex;
          align-items: center;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        /* Gift Button Wrapper: guarantees 100% concentric alignment of circle, glow ring and sparkles */
        .gift-btn-wrapper {
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 2;
          box-sizing: border-box;
        }

        /* Sparkle particles */
        .gift-sparkles {
          position: absolute;
          width: 80px;
          height: 80px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          box-sizing: border-box;
        }
        .sparkle {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #F7EAD0;
          opacity: 0;
          animation: sparkle-float 3s infinite ease-in-out;
        }
        .sparkle.s1 { top: 0;   left: 50%; animation-delay: 0s; }
        .sparkle.s2 { top: 15%; left: 90%; animation-delay: 0.5s; }
        .sparkle.s3 { top: 70%; left: 95%; animation-delay: 1s; }
        .sparkle.s4 { top: 90%; left: 50%; animation-delay: 1.5s; }
        .sparkle.s5 { top: 70%; left: 5%;  animation-delay: 2s; }
        .sparkle.s6 { top: 15%; left: 10%; animation-delay: 2.5s; }

        @keyframes sparkle-float {
          0%, 100% { opacity: 0; transform: scale(0) translateY(0); }
          30% { opacity: 1; transform: scale(1) translateY(-6px); }
          60% { opacity: 0.7; transform: scale(0.8) translateY(-12px); }
          80% { opacity: 0; transform: scale(0.3) translateY(-18px); }
        }

        /* Glow ring */
        .gift-glow-ring {
          position: absolute;
          width: 62px;
          height: 62px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: transparent;
          box-shadow: 0 0 18px rgba(191,161,106,0.45), 0 0 40px rgba(191,161,106,0.2);
          animation: glow-pulse 2.5s infinite ease-in-out;
          pointer-events: none;
          z-index: 0;
          box-sizing: border-box;
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 14px rgba(191,161,106,0.35), 0 0 30px rgba(191,161,106,0.15); transform: translate(-50%, -50%) scale(1); }
          50% { box-shadow: 0 0 24px rgba(191,161,106,0.6), 0 0 50px rgba(191,161,106,0.3); transform: translate(-50%, -50%) scale(1.08); }
        }

        /* Gift circle */
        .gift-circle {
          position: relative;
          z-index: 2;
          width: 50px;
          height: 50px;
          box-sizing: border-box;
          border-radius: 50%;
          background: linear-gradient(135deg, #E2CE9F 0%, #BFA16A 50%, #987841 100%);
          color: #1A1613;
          border: 2.5px solid #F7EAD0;
          box-shadow: 0 4px 18px rgba(0,0,0,0.35), 0 0 14px rgba(191,161,106,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          transform-origin: center center;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
          animation: gift-wiggle 3.5s infinite ease-in-out;
        }

        @keyframes gift-wiggle {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-8deg); }
          20% { transform: rotate(8deg); }
          30% { transform: rotate(-6deg); }
          40% { transform: rotate(6deg); }
          50% { transform: rotate(0deg); }
        }

        /* Badge count */
        .gift-badge-count {
          position: absolute;
          top: -4px;
          right: -3px;
          z-index: 3;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          background: #E53935;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          box-shadow: 0 2px 8px rgba(229,57,53,0.5);
          animation: badge-bounce 1.5s infinite ease-in-out;
          pointer-events: none;
          box-sizing: border-box;
        }
        @keyframes badge-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        /* Expandable label */
        .gift-label {
          position: relative;
          z-index: 1;
          height: 42px;
          margin-left: -25px;
          background: linear-gradient(135deg, #1C1917, #2A231D);
          border: 1.5px solid transparent;
          border-radius: 25px;
          box-shadow: none;
          display: flex;
          align-items: center;
          max-width: 0;
          opacity: 0;
          padding: 0;
          overflow: hidden;
          pointer-events: none;
          white-space: nowrap;
          box-sizing: border-box;
          transition: max-width 0.38s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s ease,
                      padding 0.38s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.25s ease,
                      box-shadow 0.25s ease;
        }
        .gift-label-text {
          white-space: nowrap;
          color: #F7EAD0;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        /* Hover: expand label + scale gift */
        .gift-widget-container:hover .gift-circle,
        .gift-widget-container:active .gift-circle {
          transform: scale(1.1) rotate(-6deg);
          box-shadow: 0 8px 24px rgba(0,0,0,0.45), 0 0 22px rgba(191,161,106,0.65);
          animation: none;
        }
        .gift-widget-container:hover .gift-label,
        .gift-widget-container:active .gift-label {
          max-width: 180px;
          opacity: 1;
          border-color: #BFA16A;
          box-shadow: 0 6px 20px rgba(0,0,0,0.35);
          padding: 0 18px 0 34px;
          pointer-events: auto;
        }
        .gift-widget-container:hover .gift-glow-ring {
          animation: none;
          box-shadow: 0 0 28px rgba(191,161,106,0.7), 0 0 55px rgba(191,161,106,0.35);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .poster-nav-btn {
            width: 40px !important;
            height: 40px !important;
            font-size: 16px !important;
          }
          .poster-nav-prev { left: 8px !important; }
          .poster-nav-next { right: 8px !important; }
          .poster-close-btn {
            top: 12px !important;
            right: 12px !important;
            width: 38px !important;
            height: 38px !important;
          }
          .poster-container {
            max-width: 95vw !important;
          }
          .poster-img {
            border-radius: 8px !important;
          }
          .gift-widget-container {
            bottom: 20px !important;
            left: 16px !important;
          }
          .gift-btn-wrapper {
            width: 44px !important;
            height: 44px !important;
          }
          .gift-circle {
            width: 44px !important;
            height: 44px !important;
            font-size: 19px !important;
          }
          .gift-glow-ring {
            width: 54px !important;
            height: 54px !important;
          }
          .gift-sparkles {
            width: 70px !important;
            height: 70px !important;
          }
          .gift-label {
            height: 38px !important;
            margin-left: -22px !important;
          }
          .gift-widget-container:hover .gift-label,
          .gift-widget-container:active .gift-label {
            max-width: 155px !important;
            padding: 0 14px 0 28px !important;
          }
          .gift-badge-count {
            top: -4px !important;
            right: -3px !important;
          }
        }
      `}</style>
    </>
  );
};

export default PromoBanner;
