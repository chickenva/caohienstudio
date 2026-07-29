import React, { useEffect, useState } from "react";
import { Collapse, Row, Col, Typography } from "antd";
import { useLocation } from "react-router-dom";
import "../../Home.css";

const { Title, Paragraph, Text } = Typography;

const PRIMARY_COLOR = "#BFA16A";
const SECONDARY_COLOR = "#FAF7F2";

const faqData = [
  {
    category: "Phong cách nghệ thuật",
    items: [
      {
        id: "photo-styles",
        question: "Phong cách chụp: Phân biệt / Lựa chọn Truyền thống & Phóng sự",
        answer: (
          <div>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <h4 style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>📸 Chụp TRUYỀN THỐNG</h4>
                <ul style={{ paddingLeft: 20, color: "#555" }}>
                  <li>Ảnh được dàn dựng, tạo dáng theo yêu cầu.</li>
                  <li>Tập trung vào ảnh nghi thức, ảnh gia đình, ảnh nhóm.</li>
                  <li>Góc chụp thường chính diện, chỉn chu.</li>
                  <li>Hình ảnh thường đẹp, chỉnh tề, có tính lưu niệm.</li>
                </ul>
              </Col>
              <Col xs={24} md={12}>
                <h4 style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>📸 Chụp PHÓNG SỰ</h4>
                <ul style={{ paddingLeft: 20, color: "#555" }}>
                  <li>Ghi lại khoảnh khắc tự nhiên, không sắp đặt.</li>
                  <li>Chú trọng vào cảm xúc, câu chuyện, hành động.</li>
                  <li>Góc chụp đa dạng, có thể nghiêng, cận cảnh, "bắt khoảnh khắc".</li>
                  <li>Hình ảnh mang tính kể chuyện, sống động, chân thực.</li>
                </ul>
              </Col>
            </Row>
            <div style={{ marginTop: 20, padding: 15, background: SECONDARY_COLOR, borderRadius: 8 }}>
              <strong>*** KẾT LUẬN:</strong><br/>
              • Chụp TRUYỀN THỐNG = dàn dựng, lưu niệm.<br/>
              • Chụp PHÓNG SỰ = tự nhiên, kể chuyện.<br/><br/>
              <strong>📌 Vì sao cần cả 2 phong cách chụp trong ngày cưới?</strong><br/>
              - <em>Truyền thống</em> là "khung xương" ghi lại nghi thức đầy đủ.<br/>
              - <em>Phóng sự</em> là "gia vị" giúp bộ ảnh sống động & có hồn.<br/>
              👉 Khi kết hợp cả hai: Khách hàng sẽ nhận được một câu chuyện cưới đầy đủ & giàu cảm xúc – vừa đẹp, chỉnh chu vừa chân thật, tự nhiên.
            </div>
          </div>
        )
      },
      {
        id: "video-styles",
        question: "Phong cách quay: Phân biệt / Lựa chọn Truyền thống & Phóng sự",
        answer: (
          <div>
             <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <h4 style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>🎥 Quay TRUYỀN THỐNG</h4>
                <ul style={{ paddingLeft: 20, color: "#555" }}>
                  <li>Nội dung: Ghi hình đầy đủ nghi thức & các phần quan trọng.</li>
                  <li>Độ dài phim: 30 PHÚT - 60 PHÚT (tuỳ vào chương trình).</li>
                  <li>Cách quay: Cố định, chính diện, ít di chuyển.</li>
                  <li>Thành phẩm: Video đầy đủ, chỉn chu, mang tính ghi lại sự kiện.</li>
                </ul>
              </Col>
              <Col xs={24} md={12}>
                <h4 style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>🎥 Quay PHÓNG SỰ</h4>
                <ul style={{ paddingLeft: 20, color: "#555" }}>
                  <li>Nội dung: Tập trung vào khoảnh khắc tự nhiên, cảm xúc thật.</li>
                  <li>Độ dài phim: CLIP NGẮN 5-10 PHÚT.</li>
                  <li>Cách quay: Nhiều góc máy sáng tạo, di chuyển linh hoạt.</li>
                  <li>Thành phẩm: Video ngắn gọn, cô đọng, mang tính nghệ thuật.</li>
                </ul>
              </Col>
            </Row>
            <div style={{ marginTop: 15, padding: 15, background: SECONDARY_COLOR, borderRadius: 8 }}>
              <strong>*** KẾT LUẬN:</strong><br/>
              • Quay TRUYỀN THỐNG = đủ & trọn vẹn (lưu niệm).<br/>
              • Quay PHÓNG SỰ = cảm xúc & nghệ thuật (kể chuyện).
            </div>
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px dashed #E8DED2", color: "#555" }}>
              <strong style={{ color: PRIMARY_COLOR }}>📌 Tại sao nên chọn cả 2 thể loại quay phim trong ngày cưới?</strong>
              <p style={{ marginTop: 10, marginBottom: 10 }}>
                - <strong>Phim truyền thống:</strong> Ghi lại đầy đủ nghi thức & sự kiện (lễ cưới, phát biểu, rước dâu). Giúp gia đình, người thân có một tư liệu trọn vẹn để xem lại.
              </p>
              <p style={{ marginBottom: 10 }}>
                - <strong>Phim phóng sự:</strong> Bắt trọn khoảnh khắc tự nhiên & cảm xúc chân thật. Thành phẩm ngắn gọn, giàu tính nghệ thuật, dễ chia sẻ.
              </p>
              <div style={{ marginTop: 15, padding: 15, background: SECONDARY_COLOR, borderRadius: 8 }}>
                👉 <strong>Kết hợp cả hai:</strong> Bộ phim cưới vừa trọn vẹn, vừa giàu cảm xúc. Gia đình có tư liệu đầy đủ để lưu giữ, và cặp đôi có phim phóng sự để kể lại câu chuyện tình yêu.
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    category: "Quy trình và Thời gian",
    items: [
      {
        id: "full-session",
        question: "Chụp / Quay 1 buổi full là gì?",
        answer: (
          <div style={{ color: "#555" }}>
            <p>Thời gian: chọn một nửa ngày để chụp/quay.</p>
            <ul>
              <li>Buổi từ sáng đến khi kết thúc buổi trưa.</li>
              <li>Hoặc từ buổi chiều đến tối.</li>
            </ul>
          </div>
        )
      },
      {
        id: "delivery-time",
        question: "Bao lâu sẽ nhận được phim / file ảnh chỉnh sửa / in ấn?",
        answer: (
          <div style={{ color: "#555" }}>
            <ul>
              <li><strong>Phim (video dựng hoàn chỉnh):</strong> Bàn giao sau 10 ngày kể từ ngày quay.</li>
              <li><strong>File ảnh (file ảnh chỉnh sửa):</strong> Bàn giao sau 05 ngày kể từ ngày chụp.</li>
              <li><strong>In ảnh hoàn thành:</strong> Bàn giao sau 7 ngày kể từ ngày khách chọn ảnh xong.</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    category: "Sản phẩm và In ấn",
    items: [
      {
        id: "edited-files",
        question: "File ảnh chỉnh sửa là gì?",
        answer: (
          <div style={{ color: "#555" }}>
            <p>Ảnh bàn giao không phải ảnh gốc thô, mà đã được:</p>
            <ul>
              <li><strong>Lọc file:</strong> chọn những khoảnh khắc đẹp, tránh ảnh trùng hoặc lỗi.</li>
              <li><strong>Chỉnh sửa màu sắc & ánh sáng:</strong> đảm bảo ánh sáng – tối cân đối, hài hòa.</li>
              <li><strong>Chỉnh theo phong cách riêng:</strong>
                <ul>
                  <li>Ảnh TRUYỀN THỐNG = chỉnh màu trong trẻo, rõ ràng, lưu niệm.</li>
                  <li>Ảnh PHÓNG SỰ = chỉnh gu màu riêng của tiệm, giàu cảm xúc, mang chất kể chuyện.</li>
                </ul>
              </li>
            </ul>
          </div>
        )
      },
      {
        id: "printing",
        question: "Tại sao gói dịch vụ lại KHÔNG BAO GỒM IN ẢNH?",
        answer: (
          <div style={{ color: "#555" }}>
            <ul>
              <li><strong>Giảm chi phí ban đầu:</strong> Khi book gói dịch vụ, khách hàng chỉ thanh toán cho chụp & chỉnh sửa file ảnh. Nhờ đó, chi phí gói chụp hợp lý và linh hoạt hơn.</li>
              <li><strong>Quyết định sau khi xem ảnh:</strong> Sau khi nhận bộ ảnh hoàn chỉnh, khách hàng có thể tự do lựa chọn ảnh nào muốn in, kích thước và số lượng.</li>
              <li><strong>Tránh lãng phí:</strong> Tránh in dư, in thừa hoặc in những ảnh chưa ưng ý.</li>
            </ul>
            <div style={{ marginTop: 15, padding: 15, background: SECONDARY_COLOR, borderRadius: 8 }}>
              👉 Nói ngắn gọn: Không in sẵn để giúp khách hàng tiết kiệm chi phí & chủ động hơn trong việc chọn ảnh in.
            </div>
          </div>
        )
      }
    ]
  }
];

// Trang câu hỏi thường gặp về dịch vụ, thanh toán và chuẩn bị chụp.
const FAQ = () => {
  const location = useLocation();
  const [activeKeys, setActiveKeys] = useState([]);

  // IntersectionObserver for scroll-reveal animations
  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observerOptions = {
      root: null,
      threshold: 0.05,
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
      document.body.style.backgroundColor = "";
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Hash-based deep linking logic with scroll-reveal compatibility
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      faqData.forEach((category) => {
        const itemIndex = category.items.findIndex(item => item.id === hash);
        if (itemIndex !== -1) {
          // Open the specific collapse item
          setActiveKeys(prev => {
            if (prev.includes(hash)) return prev;
            return [...prev, hash];
          });
          
          // Scroll to the element and reveal parent containers immediately
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              // Mark parent scroll-reveal sections active immediately
              let parent = element.closest(".scroll-reveal");
              while (parent) {
                parent.classList.add("active");
                parent = parent.parentElement?.closest(".scroll-reveal");
              }

              element.scrollIntoView({ behavior: "smooth", block: "center" });
              
              // Apply highlight background effect
              element.style.transition = "background-color 1s ease";
              element.style.backgroundColor = "rgba(191, 161, 106, 0.1)";
              setTimeout(() => {
                element.style.backgroundColor = "";
              }, 2000);
            }
          }, 400);
        }
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="home-page-container" style={{ background: "#FAF7F2", minHeight: "100vh", padding: "80px 20px 120px 20px", position: "relative" }}>
      {/* Ambient spotlights */}
      <div className="glow-spotlight-light" style={{ top: "10%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "60%", right: "5%" }}></div>

      <div style={{ maxWidth: 850, margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: 65 }} className="scroll-reveal">
          <span style={{ color: PRIMARY_COLOR, letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
            Frequently Asked Questions
          </span>
          <h1
            className="font-serif-luxury"
            style={{
              fontSize: "clamp(36px, 5vw, 48px)",
              fontWeight: "300",
              color: "#1F1F1F",
              margin: 0
            }}
          >
            Giải Đáp Thắc Mắc
          </h1>
          <div style={{ width: "40px", height: "1px", background: PRIMARY_COLOR, margin: "25px auto 20px auto" }}></div>
          <Paragraph style={{ color: "#777", fontSize: "15px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.8", fontWeight: "300" }}>
            Những thông tin chi tiết và phản hồi hữu ích giúp bạn thấu hiểu hơn về các dịch vụ nghệ thuật tại Cao Hiển Studio.
          </Paragraph>
        </div>

        {/* Categories & Collapse Panels */}
        {faqData.map((category, idx) => (
          <div key={idx} style={{ marginBottom: 55 }} className={`scroll-reveal stagger-${(idx % 3) + 1}`}>
            <h3 className="font-serif-luxury" style={{ fontSize: "22px", fontWeight: "400", color: "#2F2F2F", borderBottom: `1px solid ${PRIMARY_COLOR}`, paddingBottom: 12, marginBottom: 25, letterSpacing: "0.5px" }}>
              {category.category}
            </h3>
            
            <Collapse
              className="faq-collapse"
              bordered={false}
              activeKey={activeKeys}
              onChange={(keys) => setActiveKeys(keys)}
              expandIconPosition="end"
            >
              {category.items.map((item) => (
                <Collapse.Panel
                  header={item.question}
                  key={item.id}
                  id={item.id}
                >
                  <div style={{ padding: "5px 0" }}>
                    {item.answer}
                  </div>
                </Collapse.Panel>
              ))}
            </Collapse>
          </div>
        ))}
        
        {/* Call to Action Box */}
        <div className="scroll-reveal glass-panel" style={{ textAlign: "center", marginTop: 70, padding: "50px 40px", borderRadius: "0px" }}>
          <h3 className="font-serif-luxury" style={{ fontSize: "24px", fontWeight: "300", color: "#1F1F1F", marginBottom: "15px" }}>
            Bạn vẫn còn câu hỏi khác?
          </h3>
          <Paragraph style={{ color: "#777", marginBottom: "30px", fontSize: "14.5px", fontWeight: "300" }}>
            Đừng ngần ngại liên hệ với chúng tôi để nhận được tư vấn chi tiết và chu đáo nhất cho ngày trọng đại của bạn.
          </Paragraph>
          <a href="/contact" className="btn-premium-gold" style={{ textDecoration: "none", display: "inline-flex" }}>
            LIÊN HỆ NGAY
          </a>
        </div>
      </div>

      {/* Styled JSX for the luxury FAQ page component */}
      <style>{`
        /* Custom styled FAQ collapse */
        .faq-collapse {
          background: transparent !important;
          border: none !important;
        }
        
        .faq-collapse .ant-collapse-item {
          margin-bottom: 18px !important;
          background: rgba(255, 255, 255, 0.78) !important;
          backdrop-filter: blur(15px) !important;
          -webkit-backdrop-filter: blur(15px) !important;
          border: 1px solid #E8DED2 !important;
          border-radius: 0px !important; /* Square corners */
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        
        .faq-collapse .ant-collapse-item:hover {
          border-color: #C8A96A !important;
          box-shadow: 0 12px 24px rgba(154, 138, 120, 0.06) !important;
          background: #FFFFFF !important;
        }
        
        .faq-collapse .ant-collapse-header {
          padding: 22px 28px !important;
          font-family: 'Outfit', sans-serif !important;
          font-weight: 500 !important;
          font-size: 15.5px !important;
          color: #2F2F2F !important;
          transition: all 0.3s ease !important;
          letter-spacing: 0.3px !important;
        }
        
        .faq-collapse .ant-collapse-item-active {
          border-color: #BFA16A !important;
          background: #FFFFFF !important;
          box-shadow: 0 12px 24px rgba(191, 161, 106, 0.05) !important;
        }
        
        .faq-collapse .ant-collapse-item-active .ant-collapse-header {
          color: #BFA16A !important;
          font-weight: 600 !important;
        }
        
        .faq-collapse .ant-collapse-content {
          background: #FFFFFF !important;
          border-top: 1px solid rgba(232, 222, 210, 0.6) !important;
        }
        
        .faq-collapse .ant-collapse-content-box {
          padding: 24px 28px 28px 28px !important;
          font-size: 14px !important;
          line-height: 2 !important;
          color: #555555 !important;
        }
        
        .faq-collapse .ant-collapse-arrow {
          color: #BFA16A !important;
          font-size: 13px !important;
          transition: transform 0.3s ease !important;
        }
      `}</style>
    </div>
  );
};

export default FAQ;

