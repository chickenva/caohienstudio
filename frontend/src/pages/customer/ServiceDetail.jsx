import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Button, Tag, Spin, message, Divider } from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", serif';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/services/${id}`);
        setService(res.data);
      } catch (err) {
        message.error("Không tìm thấy thông tin dịch vụ");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 20px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/services")}
        type="text"
        style={{ marginBottom: "20px" }}
      >
        Quay lại bảng giá
      </Button>

      <Row gutter={[50, 50]}>
        <Col xs={24} md={12}>
          <img
            src={
              service.thumbnail ||
              "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop"
            }
            alt={service.name}
            style={{
              width: "100%",
              height: "600px",
              objectFit: "cover",
              boxShadow: "20px 20px 0 #f5f5f5",
            }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Tag color={PRIMARY_COLOR}>
            {service.category?.toUpperCase() || "CAO HIỀN STUDIO"}
          </Tag>
          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "48px",
              margin: "20px 0",
              fontWeight: "normal",
            }}
          >
            {service.name}
          </h1>

          {/* Đã cập nhật lấy giá từ trường base_price */}
          <div
            style={{
              fontSize: "28px",
              color: PRIMARY_COLOR,
              fontWeight: 600,
              marginBottom: "15px",
            }}
          >
            {service.base_price?.toLocaleString()}đ
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#555",
              marginBottom: "30px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ClockCircleOutlined style={{ marginRight: "8px" }} /> Thời lượng
            chụp ước tính:{" "}
            <strong>&nbsp;{service.duration_hours || 4} giờ</strong>
          </div>

          <p style={{ color: "#666", lineHeight: "2", fontSize: "15px" }}>
            {service.details ||
              service.description ||
              "Gói chụp ảnh cao cấp giúp bạn lưu giữ lại những khoảnh khắc tuyệt vời nhất."}
          </p>

          <Divider />

          <h4 style={{ marginBottom: "20px", letterSpacing: "1px" }}>
            GÓI DỊCH VỤ BAO GỒM:
          </h4>
          <Row>
            {/* Fallback an toàn */}
            {(
              service.features || [
                "Chụp ảnh không giới hạn file",
                "Hỗ trợ concept chụp",
                "Chỉnh sửa 30 file retouch",
                "Giao toàn bộ file gốc",
              ]
            ).map((feat, idx) => (
              <Col
                span={24}
                key={idx}
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CheckCircleOutlined
                  style={{ color: PRIMARY_COLOR, marginRight: "10px" }}
                />
                <span>{feat}</span>
              </Col>
            ))}
          </Row>

          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            style={{
              background: "#333",
              border: "none",
              borderRadius: 0,
              height: "55px",
              padding: "0 50px",
              marginTop: "40px",
              fontSize: "14px",
              letterSpacing: "2px",
            }}
            onClick={() =>
              // CỰC KỲ QUAN TRỌNG: Phải truyền thêm service_id sang trang Đặt Lịch để lưu vào Database mới
              navigate("/booking", {
                state: {
                  service_id: service._id,
                  serviceName: service.name,
                  base_price: service.base_price,
                },
              })
            }
          >
            ĐẶT LỊCH NGAY
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default ServiceDetail;
