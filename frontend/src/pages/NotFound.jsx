import React from "react";
import { useNavigate } from "react-router-dom";
import { PhoneOutlined, MailOutlined, InstagramOutlined, FacebookOutlined } from "@ant-design/icons";
import "./NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-bg-ornament">404</div>

      <div className="notfound-card">
        <div className="notfound-top-section">
          <div className="notfound-eyebrow">
            <span>LỖI 404 &middot; KHÔNG TÌM THẤY TRANG</span>
          </div>
        </div>

        <div className="notfound-code">
          4<span>0</span>4
        </div>

        <div className="notfound-divider" />

        <h1 className="notfound-title">Trang Không Tồn Tại</h1>

        <p className="notfound-desc">
          Trang bạn đang tìm kiếm có thể đã được di chuyển, đổi tên hoặc không còn tồn tại.
          Hãy quay lại trang chủ hoặc khám phá các dịch vụ của chúng tôi.
        </p>

        <div className="notfound-actions">
          <button className="btn-notfound-gold" onClick={() => navigate("/")}>
            Về Trang Chủ
          </button>
          <button className="btn-notfound-outline" onClick={() => navigate("/galleries")}>
            Xem Thư Viện Ảnh
          </button>
          <button className="btn-notfound-outline" onClick={() => navigate("/booking")}>
            Đặt Lịch Chụp
          </button>
        </div>

        <div className="notfound-contact">
          <a href="tel:0979767602" className="notfound-contact-item">
            <PhoneOutlined />
            <span>0979 767 602</span>
          </a>
          <a href="https://zalo.me/0979767602" target="_blank" rel="noreferrer" className="notfound-contact-item">
            <span style={{ fontSize: 14, color: "#BFA16A", fontWeight: 600 }}>Z</span>
            <span>Zalo: 0979 767 602</span>
          </a>
          <a href="mailto:caohienstudio@gmail.com" className="notfound-contact-item">
            <MailOutlined />
            <span>caohienstudio@gmail.com</span>
          </a>
          <a href="https://www.facebook.com/caohienstudio" target="_blank" rel="noreferrer" className="notfound-contact-item">
            <FacebookOutlined />
            <span>Cao Hiển Studio</span>
          </a>
          <a href="https://www.instagram.com/caohien.photojournalism" target="_blank" rel="noreferrer" className="notfound-contact-item">
            <InstagramOutlined />
            <span>@caohien.photojournalism</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
