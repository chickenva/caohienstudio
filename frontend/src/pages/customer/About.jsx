import React from "react";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const PRIMARY_COLOR = "#9a8a78";
const BG_WARM = "#fbf9f6";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const About = () => {
  const navigate = useNavigate();
  const blogs = [
    {
      date: "Mar 04, 2024",
      title: "Khoảnh Khắc Quan Trọng Không Thể Bỏ Lỡ Trong Ngày Cưới",
      image:
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
    },
    {
      date: "Mar 04, 2024",
      title: "Kinh Nghiệm Chọn Nhiếp Ảnh Gia Cưới Phù Hợp",
      image:
        "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
    },
    {
      date: "Mar 04, 2024",
      title: "Vì Sao Ảnh Cưới Tự Nhiên Đang Trở Thành Xu Hướng",
      image:
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <div style={{ width: "100%", background: "#ffffff", color: "#333" }}>
      {/* SECTION 1: ABOUT */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 90px)" }}>
        <div style={{ flex: "1", padding: "40px 0 40px 40px" }}>
          <img
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop"
            alt="Portrait"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "600px",
              objectFit: "cover",
              filter: "grayscale(100%)",
            }}
          />
        </div>
        <div
          style={{
            flex: "1",
            padding: "80px 80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: "normal",
              color: "#333",
              fontSize: "36px",
              lineHeight: "1.4",
              marginBottom: "40px",
            }}
          >
            Xin chào, tôi là Cao Hiền – Nhiếp ảnh gia Cưới & Production
          </h1>
          <div style={{ fontSize: "13px", color: "#555", lineHeight: "2.4" }}>
            <p style={{ marginBottom: "20px" }}>
              Niềm đam mê của tôi là ghi lại những khoảnh khắc yêu thương thoáng
              qua để tạo nên những bức ảnh đẹp, chân thật và có giá trị theo
              thời gian.
            </p>
            <p style={{ marginBottom: "20px" }}>
              Tôi yêu việc lưu giữ những câu chuyện của các cặp đôi, từ lễ cưới,
              lễ đính hôn cho đến những khoảnh khắc đời thường của gia đình.
              Phong cách của tôi hướng đến sự tự nhiên, tinh tế và cảm xúc chân
              thật, để mỗi bức ảnh không chỉ là hình ảnh mà còn là một kỷ niệm
              đáng trân trọng.
            </p>
            <p style={{ marginBottom: "20px" }}>
              Bên cạnh chụp ảnh cưới, tôi cũng thực hiện nhiều dự án{" "}
              <strong style={{ color: "#000" }}>
                chụp ảnh và quay phim sự kiện, hội nghị, lễ khai trương, chương
                trình doanh nghiệp và các hoạt động truyền thống khác
              </strong>
              , giúp ghi lại những khoảnh khắc quan trọng một cách chuyên nghiệp
              và ấn tượng.
            </p>
            <p style={{ marginBottom: "40px" }}>
              Tôi luôn mong được đồng hành cùng bạn để lưu giữ những khoảnh khắc
              đặc biệt - dù đó là ngày trọng đại của cuộc đời hay những sự kiện
              đáng nhớ trong hành trình phát triển của bạn.
            </p>
          </div>
          <div>
            <Button
              onClick={() => navigate("/booking")}
              style={{
                background: PRIMARY_COLOR,
                color: "#fff",
                borderRadius: "0",
                height: "45px",
                border: "none",
                padding: "0 35px",
                fontSize: "11px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              LIÊN HỆ VỚI TÔI <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 2: FAQ */}
      <div style={{ background: BG_WARM, padding: "80px 40px" }}>
        <h2
          style={{
            textAlign: "center",
            fontFamily: FONT_SERIF,
            fontSize: "32px",
            fontWeight: "normal",
            marginBottom: "60px",
          }}
        >
          Câu hỏi thường gặp
        </h2>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              background: "#fff",
              padding: "40px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              💼 Chụp TRUYỀN THỐNG là gì ?
            </h3>
            <ul
              style={{
                paddingLeft: "15px",
                fontSize: "13px",
                color: "#555",
                lineHeight: "2.2",
                margin: 0,
                listStyleType: "disc",
              }}
            >
              <li>Chụp ảnh được dàn dựng, tạo dáng theo sự chỉnh chu.</li>
              <li>Tập trung vào ảnh nghi thức, ảnh gia đình, ảnh nhóm.</li>
              <li>
                Góc chụp thường chính diện, chỉn chu. Hình ảnh thường đẹp, tinh
                tế, có tính lưu niệm.
              </li>
            </ul>
          </div>
          {/* Card 2 */}
          <div
            style={{
              background: "#fff",
              padding: "40px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              📸 Chụp PHÓNG SỰ là gì ?
            </h3>
            <ul
              style={{
                paddingLeft: "15px",
                fontSize: "13px",
                color: "#555",
                lineHeight: "2.2",
                margin: 0,
                listStyleType: "disc",
              }}
            >
              <li>Ghi lại khoảnh khắc tự nhiên, không sắp đặt.</li>
              <li>
                Chú trọng vào cảm xúc, câu chuyện, hành động. Góc chụp đa dạng,
                có thể nghiêng, cận cảnh, "bắt khoảnh khắc".
              </li>
              <li>Hình ảnh mang tính kể chuyện, sống động, chân thực.</li>
            </ul>
          </div>
          {/* Card 3 */}
          <div
            style={{
              background: "#fff",
              padding: "40px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#d9534f",
              }}
            >
              📌 Vì sao cần cả 2 phong cách chụp trong ngày cưới?
            </h3>
            <div style={{ fontSize: "13px", color: "#555", lineHeight: "2.2" }}>
              <p>
                - <strong>Máy chụp truyền thống:</strong> Ghi lại nghi thức &
                ảnh lưu niệm (ảnh gia đình, họ hàng, nghi lễ). Đây là "khung
                xương" để kể lại câu chuyện ngày cưới một cách đầy đủ.
              </p>
              <p>
                - <strong>Máy chụp phóng sự:</strong> Bắt trọn khoảnh khắc tự
                nhiên, cảm xúc chân thật. Đây là phần "gia vị" giúp bộ ảnh sống
                động & có hồn.
              </p>
            </div>
          </div>
          {/* Card 4 */}
          <div
            style={{
              background: "#fff",
              padding: "40px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              🎥 Quay TRUYỀN THỐNG là gì ?
            </h3>
            <ul
              style={{
                paddingLeft: "15px",
                fontSize: "13px",
                color: "#555",
                lineHeight: "2.2",
                margin: 0,
                listStyleType: "none",
              }}
            >
              <li>
                - <strong>Nội dung:</strong> Ghi hình đầy đủ nghi thức & các
                phần quan trọng.
              </li>
              <li>
                - <strong>Độ dài phim:</strong> 30 PHÚT - 60 PHÚT (tùy vào
                chương trình).
              </li>
              <li>
                - <strong>Cách quay:</strong> Cố định, chính diện, ít di chuyển.
              </li>
            </ul>
          </div>
          {/* Card 5 */}
          <div
            style={{
              background: "#fff",
              padding: "40px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              🎥 Quay PHÓNG SỰ là gì ?
            </h3>
            <ul
              style={{
                paddingLeft: "15px",
                fontSize: "13px",
                color: "#555",
                lineHeight: "2.2",
                margin: 0,
                listStyleType: "none",
              }}
            >
              <li>
                - <strong>Nội dung:</strong> Tập trung vào khoảnh khắc tự nhiên,
                cảm xúc thật.
              </li>
              <li>
                - <strong>Độ dài phim:</strong> CLIP NGẮN 5-10 PHÚT.
              </li>
              <li>
                - <strong>Cách quay:</strong> Nhiều góc máy sáng tạo, di chuyển
                linh hoạt.
              </li>
            </ul>
          </div>
          {/* Card 6 */}
          <div
            style={{
              background: "#fff",
              padding: "40px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "normal",
                fontFamily: FONT_SERIF,
                marginBottom: "20px",
              }}
            >
              Bao lâu sẽ nhận được sản phẩm file ảnh / film
            </h3>
            <div style={{ fontSize: "13px", color: "#555", lineHeight: "2.4" }}>
              <p>
                Đối với file ảnh thời gian nhận ảnh :{" "}
                <strong>5 - 7 ngày</strong>
              </p>
              <p>
                Đối với file phim thời gian hoàn thiện :{" "}
                <strong>10 - 12 ngày</strong>
              </p>
              <p>
                Cách thức nhận file : <strong>Google Drive</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: BLOG */}
      <div style={{ padding: "80px 40px 100px 40px", background: "#ffffff" }}>
        <h2
          style={{
            textAlign: "center",
            fontFamily: FONT_SERIF,
            fontSize: "32px",
            fontWeight: "normal",
            marginBottom: "60px",
          }}
        >
          From the blog
        </h2>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "30px",
          }}
        >
          {blogs.map((blog, index) => (
            <div key={index} style={{ textAlign: "left" }}>
              <img
                src={blog.image}
                alt="Blog cover"
                style={{
                  width: "100%",
                  height: "250px",
                  objectFit: "cover",
                  marginBottom: "20px",
                }}
              />
              <div
                style={{
                  fontSize: "11px",
                  color: "#888",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {blog.date}
              </div>
              <h3
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: "20px",
                  fontWeight: "normal",
                  color: "#333",
                  lineHeight: "1.4",
                  marginBottom: "20px",
                  minHeight: "56px",
                }}
              >
                {blog.title}
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  color: "#555",
                  borderBottom: "1px solid #333",
                  paddingBottom: "2px",
                  cursor: "pointer",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Read More
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
