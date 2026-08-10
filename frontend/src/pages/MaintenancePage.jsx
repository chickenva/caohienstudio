import React from "react";
import { PhoneOutlined, MailOutlined, InstagramOutlined, FacebookOutlined } from "@ant-design/icons";
import "./MaintenancePage.css";

const MaintenancePage = () => {
  return (
    <div className="maintenance-page">
      <div className="maintenance-bg-top" />
      <div className="maintenance-bg-ornament">&#x2736;</div>

      <div className="maintenance-card">
        {/* Eyebrow */}
        <div className="maintenance-top-section">
          <div className="maintenance-eyebrow">
            <span>ĐANG BẢO TRÌ HỆ THỐNG</span>
          </div>
        </div>

        <h1 className="maintenance-title">
          Website Tạm Thời<br />
          <em>Ngừng Hoạt Động</em>
        </h1>

        <div className="maintenance-divider" />

        <p className="maintenance-subtitle">
          Chúng tôi sẽ sớm quay trở lại
        </p>

        <p className="maintenance-desc">
          Cao Hiển Studio đang trong quá trình bảo trì và nâng cấp hệ thống để mang đến trải nghiệm tốt hơn cho bạn.
          Xin lỗi vì sự bất tiện này và cảm ơn sự kiên nhẫn của bạn.
        </p>

        <div className="maintenance-contact-title">Liên hệ trực tiếp</div>

        <div className="maintenance-contact">
          <a href="tel:0979767602" className="maintenance-contact-item">
            <PhoneOutlined />
            <span>0979 767 602</span>
          </a>
          <a href="https://zalo.me/0979767602" target="_blank" rel="noreferrer" className="maintenance-contact-item">
            <span style={{ fontSize: 14, color: "#BFA16A", fontWeight: 600 }}>Z</span>
            <span>Zalo: 0979 767 602</span>
          </a>
          <a href="mailto:caohienstudio@gmail.com" className="maintenance-contact-item">
            <MailOutlined />
            <span>caohienstudio@gmail.com</span>
          </a>
          <a href="https://www.facebook.com/caohienstudio" target="_blank" rel="noreferrer" className="maintenance-contact-item">
            <FacebookOutlined />
            <span>Cao Hiển Studio</span>
          </a>
          <a href="https://www.instagram.com/caohien.photojournalism" target="_blank" rel="noreferrer" className="maintenance-contact-item">
            <InstagramOutlined />
            <span>@caohien.photojournalism</span>
          </a>
        </div>

        <div className="maintenance-footer">
          &copy; {new Date().getFullYear()} Cao Hiển Studio &middot; Elegant &amp; Cinematic Photography
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
