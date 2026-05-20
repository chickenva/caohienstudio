import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, message, Row, Col, Typography } from "antd";
import { InstagramOutlined, CameraOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Paragraph, Text } = Typography;
const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const Photographer = () => {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffs = async () => {
      setLoading(true);

      try {
        const res = await axios.get(
          "http://localhost:5000/api/users/photographers",
        );

        setStaffs(res.data.photographers || []);
      } catch (err) {
        message.error("Không thể tải danh sách nhiếp ảnh gia");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffs();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "150px" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div style={{ background: "#fff", width: "100%", overflow: "hidden" }}>
      {/* HEADER GIỚI THIỆU */}
      <div
        style={{
          textAlign: "center",
          padding: "100px 20px 60px 20px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "48px",
            fontWeight: "normal",
            marginBottom: "20px",
          }}
        >
          Những Người Kể Chuyện
        </h1>
        <p
          style={{
            color: "#666",
            fontSize: "16px",
            lineHeight: "1.8",
            letterSpacing: "1px",
          }}
        >
          Phía sau mỗi khung hình hoàn hảo là sự nhạy cảm, kỹ thuật và tâm hồn
          của người nghệ sĩ. Gặp gỡ đội ngũ nhiếp ảnh gia tài năng của CaoHien
          Studio.
        </p>
      </div>

      {/* DANH SÁCH THỢ CHỤP (ZIG-ZAG LAYOUT) */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {staffs.map((staff, index) => {
          // Kỹ thuật so le: Số chẵn thì Ảnh trái - Info phải. Số lẻ thì ngược lại.
          const isEven = index % 2 === 0;
          const { portfolio } = staff;

          return (
            <Row
              key={staff._id}
              style={{
                minHeight: "85vh",
                flexDirection: isEven ? "row" : "row-reverse", // Đảo chiều linh hoạt
                background: isEven ? "#fff" : "#faf9f8",
              }}
            >
              {/* CỘT 1: THÔNG TIN VÀ ẢNH CHÂN DUNG */}
              <Col
                xs={24}
                lg={10}
                style={{
                  padding: "8% 6%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: PRIMARY_COLOR,
                    letterSpacing: "3px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {portfolio?.years_of_experience || 1}+ NĂM KINH NGHIỆM
                </Text>

                <Title
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: "56px",
                    margin: "10px 0 30px 0",
                    fontWeight: "normal",
                  }}
                >
                  {staff.full_name}
                </Title>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "30px",
                    flexWrap: "wrap",
                  }}
                >
                  {(portfolio?.specialties || ["Portrait", "Wedding"]).map(
                    (spec) => (
                      <span
                        key={spec}
                        style={{
                          border: "1px solid #ddd",
                          padding: "5px 15px",
                          fontSize: "11px",
                          letterSpacing: "1px",
                          borderRadius: "30px",
                        }}
                      >
                        {spec.toUpperCase()}
                      </span>
                    ),
                  )}
                </div>

                <Paragraph
                  style={{
                    color: "#666",
                    fontSize: "15px",
                    lineHeight: "2",
                    marginBottom: "40px",
                  }}
                >
                  {portfolio?.bio ||
                    "Một nhiếp ảnh gia đam mê việc bắt trọn những khoảnh khắc chân thực nhất."}
                </Paragraph>

                {/* Chữ ký / Avatar nhỏ */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <img
                    src={
                      portfolio?.avatar ||
                      "https://images.unsplash.com/photo-1554151228-14d9def656e4"
                    }
                    alt="avatar"
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    onClick={() => navigate(`/photographers/${staff._id}`)}
                    style={{
                      cursor: "pointer",
                      fontSize: "13px",
                      letterSpacing: "1px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <InstagramOutlined style={{ fontSize: "18px" }} /> XEM CHI
                    TIẾT
                  </div>
                </div>
              </Col>

              {/* CỘT 2: SHOWCASE ẢNH ĐẸP (ASYMMETRICAL GRID) */}
              <Col xs={24} lg={14} style={{ padding: "5%" }}>
                <div className="portfolio-grid">
                  <div className="grid-item item-large">
                    <img
                      src={
                        portfolio?.featured_images?.[0] ||
                        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc"
                      }
                      alt="featured-1"
                    />
                  </div>
                  <div className="grid-item item-small">
                    <img
                      src={
                        portfolio?.featured_images?.[1] ||
                        "https://images.unsplash.com/photo-1519741497674-611481863552"
                      }
                      alt="featured-2"
                    />
                  </div>
                  <div className="grid-item item-small">
                    <img
                      src={
                        portfolio?.featured_images?.[2] ||
                        "https://images.unsplash.com/photo-1537633552985-df8429e8048b"
                      }
                      alt="featured-3"
                    />
                  </div>
                </div>
              </Col>
            </Row>
          );
        })}
      </div>

      <style>{`
        /* Lưới 3 ảnh bất đối xứng nghệ thuật */
        .portfolio-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr; /* Cột trái to hơn cột phải */
          grid-template-rows: 1fr 1fr;
          gap: 20px;
          height: 100%;
          min-height: 500px;
        }

        .grid-item { overflow: hidden; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .grid-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .grid-item:hover img { transform: scale(1.05); }

        .item-large { grid-column: 1 / 2; grid-row: 1 / 3; } /* Ảnh số 1 chiếm hết chiều dọc cột trái */
        .item-small { grid-column: 2 / 3; } /* 2 ảnh còn lại xếp chồng bên cột phải */

        @media (max-width: 991px) {
          .portfolio-grid { min-height: 400px; }
        }
      `}</style>
    </div>
  );
};

export default Photographer;
