import React, { useEffect, useState } from "react";
import { Row, Col, Button, Spin, message, Tag, Card } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const PhotographerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [photographer, setPhotographer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotographerDetail();
  }, [id]);

  const fetchPhotographerDetail = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/photographers/${id}`,
      );

      setPhotographer(res.data.photographer);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải chi tiết nhiếp ảnh gia",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    navigate("/booking", {
      state: {
        photographer_id: photographer._id,
        photographer_name: photographer.full_name,
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!photographer) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        Không tìm thấy nhiếp ảnh gia
      </div>
    );
  }

  const portfolio = photographer.portfolio || {};

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "50px 20px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/photographers")}
          style={{ marginBottom: 30, borderRadius: 0 }}
        >
          Quay lại danh sách
        </Button>

        <Row gutter={[50, 40]} align="middle">
          <Col xs={24} md={10}>
            <Card
              bordered={false}
              style={{
                background: "#f8f6f3",
                borderRadius: 8,
                overflow: "hidden",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <img
                src={
                  portfolio.avatar ||
                  "https://images.unsplash.com/photo-1554151228-14d9def656e4"
                }
                alt={photographer.full_name}
                style={{
                  width: "100%",
                  height: 520,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Card>
          </Col>

          <Col xs={24} md={14}>
            <div
              style={{
                color: PRIMARY_COLOR,
                letterSpacing: 3,
                fontSize: 12,
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              {portfolio.years_of_experience || 1}+ NĂM KINH NGHIỆM
            </div>

            <h1
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 56,
                fontWeight: "normal",
                margin: "0 0 20px",
              }}
            >
              {photographer.full_name}
            </h1>

            <div style={{ marginBottom: 28 }}>
              {(portfolio.specialties || ["Wedding", "Portrait"]).map(
                (item) => (
                  <Tag
                    key={item}
                    style={{
                      borderRadius: 30,
                      padding: "5px 14px",
                      marginBottom: 8,
                      letterSpacing: 1,
                    }}
                  >
                    {item.toUpperCase()}
                  </Tag>
                ),
              )}
            </div>

            <p
              style={{
                color: "#666",
                fontSize: 16,
                lineHeight: 2,
                marginBottom: 35,
              }}
            >
              {portfolio.bio ||
                "Một nhiếp ảnh gia đam mê việc bắt trọn những khoảnh khắc chân thực nhất."}
            </p>

            <Button
              type="primary"
              size="large"
              icon={<CalendarOutlined />}
              onClick={handleBooking}
              style={{
                background: "#333",
                border: "none",
                borderRadius: 0,
                height: 50,
                padding: "0 36px",
                letterSpacing: 1,
                fontWeight: 600,
              }}
            >
              ĐẶT LỊCH
            </Button>
          </Col>
        </Row>

        <div style={{ marginTop: 70 }}>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 34,
              fontWeight: "normal",
              marginBottom: 28,
            }}
          >
            <CameraOutlined style={{ marginRight: 10 }} />
            Portfolio nổi bật
          </h2>

          <Row gutter={[24, 24]}>
            {(portfolio.featured_images || []).map((img, index) => (
              <Col xs={24} md={8} key={index}>
                <div
                  style={{
                    height: 320,
                    overflow: "hidden",
                    borderRadius: 6,
                    background: "#f5f5f5",
                  }}
                >
                  <img
                    src={img}
                    alt={`portfolio-${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default PhotographerDetail;
