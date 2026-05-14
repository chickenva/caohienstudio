import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Spin,
  message,
  Tag,
  Descriptions,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  CameraOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", serif';

const typeLabels = {
  CAMERA: "Máy ảnh",
  LENS: "Ống kính",
  LIGHT: "Đèn",
  STUDIO: "Studio",
  ACCESSORY: "Phụ kiện",
};

const RentalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResourceDetail();
  }, [id]);

  const fetchResourceDetail = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/resources/rentals/${id}`,
      );

      setResource(res.data);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải chi tiết thiết bị",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContactRental = () => {
    navigate("/contact", {
      state: {
        contactMessage: `Tôi muốn thuê thiết bị ${resource.name}. Vui lòng tư vấn giúp tôi về giá thuê, tiền cọc, giấy tờ cần chuẩn bị, hợp đồng thuê và thời gian nhận/trả thiết bị.`,
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        Không tìm thấy thiết bị
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "50px auto", padding: "0 20px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/rentals")}
        style={{ marginBottom: 24, borderRadius: 0 }}
      >
        Quay lại danh sách
      </Button>

      <Row gutter={[40, 40]}>
        <Col xs={24} md={11}>
          <Card
            bordered={false}
            style={{
              background: "#f8f9fa",
              textAlign: "center",
              borderRadius: 8,
            }}
          >
            <img
              src={
                resource.thumbnail ||
                "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop"
              }
              alt={resource.name}
              style={{
                width: "100%",
                maxHeight: 420,
                objectFit: "contain",
                mixBlendMode: "multiply",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={13}>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">{typeLabels[resource.type] || resource.type}</Tag>
            <Tag color={resource.status === "AVAILABLE" ? "green" : "orange"}>
              {resource.status === "AVAILABLE"
                ? "Sẵn sàng cho thuê"
                : "Tạm không sẵn sàng"}
            </Tag>
          </div>

          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 40,
              fontWeight: "normal",
              marginBottom: 12,
            }}
          >
            {resource.name}
          </h1>

          <div
            style={{
              fontSize: 26,
              color: PRIMARY_COLOR,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            {resource.rental_price_per_day?.toLocaleString("vi-VN")}đ
            <span style={{ fontSize: 15, color: "#777", fontWeight: 400 }}>
              {" "}
              / ngày
            </span>
          </div>

          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Loại thiết bị">
              {typeLabels[resource.type] || resource.type}
            </Descriptions.Item>

            <Descriptions.Item label="Giá thuê mỗi ngày">
              <strong>
                {resource.rental_price_per_day?.toLocaleString("vi-VN")}đ
              </strong>
            </Descriptions.Item>

            <Descriptions.Item label="Tiền cọc yêu cầu">
              <strong>
                {resource.required_deposit_amount?.toLocaleString("vi-VN")}đ
              </strong>
            </Descriptions.Item>

            <Descriptions.Item label="Tình trạng">
              {resource.status === "AVAILABLE"
                ? "Sẵn sàng cho thuê"
                : "Tạm không sẵn sàng"}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <h3 style={{ fontSize: 18, marginBottom: 12 }}>
            <CameraOutlined style={{ marginRight: 8, color: PRIMARY_COLOR }} />
            Cấu hình nổi bật
          </h3>

          {resource.features?.length > 0 ? (
            <div style={{ marginBottom: 24 }}>
              {resource.features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    color: "#555",
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  <ToolOutlined
                    style={{ marginRight: 8, color: PRIMARY_COLOR }}
                  />
                  {feature}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#888" }}>Chưa có thông tin cấu hình.</p>
          )}

          <div
            style={{
              background: "#fdfaf6",
              padding: 16,
              borderRadius: 6,
              marginBottom: 24,
              color: "#555",
              lineHeight: 1.7,
            }}
          >
            <SafetyCertificateOutlined
              style={{ marginRight: 8, color: PRIMARY_COLOR }}
            />
            Khi thuê thiết bị, khách hàng vui lòng mang theo giấy tờ tùy thân,
            chuẩn bị tiền cọc theo yêu cầu và ký hợp đồng thuê trực tiếp tại
            studio. Các phát sinh như trễ hạn, hư hỏng hoặc thiếu phụ kiện sẽ
            được kiểm tra và tính phí khi trả thiết bị.
          </div>

          <Button
            type="primary"
            size="large"
            block
            disabled={resource.status !== "AVAILABLE"}
            icon={<PhoneOutlined />}
            onClick={handleContactRental}
            style={{
              background: resource.status === "AVAILABLE" ? "#333" : "#ccc",
              border: "none",
              height: 50,
              borderRadius: 0,
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            {resource.status === "AVAILABLE"
              ? "LIÊN HỆ THUÊ THIẾT BỊ"
              : "THIẾT BỊ TẠM KHÔNG SẴN SÀNG"}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default RentalDetail;
