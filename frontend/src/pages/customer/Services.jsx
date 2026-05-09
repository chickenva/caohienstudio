import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Spin, message, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", serif';

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/services");
        setServices(res.data);
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "42px",
            fontWeight: "normal",
          }}
        >
          Bảng giá dịch vụ
        </h1>
        <p style={{ color: "#888", letterSpacing: "1px" }}>
          Lưu giữ khoảnh khắc hạnh phúc của bạn bằng sự tận tâm
        </p>
      </div>

      <Row gutter={[30, 30]}>
        {services.map((item) => (
          <Col xs={24} md={8} key={item._id}>
            <Card
              hoverable
              cover={
                <img
                  alt={item.name}
                  src={
                    item.thumbnail ||
                    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop"
                  }
                  style={{ height: "280px", objectFit: "cover" }}
                />
              }
              style={{ borderRadius: 0, border: "1px solid #eee" }}
            >
              <div style={{ textAlign: "center" }}>
                <h3
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: "22px",
                    marginBottom: "10px",
                  }}
                >
                  {item.name}
                </h3>

                {/* Đã cập nhật lấy giá từ trường base_price */}
                <div
                  style={{
                    fontSize: "20px",
                    color: PRIMARY_COLOR,
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  {item.base_price?.toLocaleString()}đ
                </div>

                {/* Hiển thị thêm thời lượng chụp */}
                <div
                  style={{
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "20px",
                  }}
                >
                  <ClockCircleOutlined style={{ marginRight: "5px" }} /> Thời
                  gian: {item.duration_hours || 4} giờ
                </div>

                <div
                  style={{
                    textAlign: "left",
                    marginBottom: "30px",
                    minHeight: "120px",
                  }}
                >
                  {/* Fallback an toàn nếu features bị undefined */}
                  {(
                    item.features || [
                      "Chụp ảnh không giới hạn file",
                      "Hỗ trợ concept chụp",
                      "Chỉnh sửa 30 file retouch",
                      "Giao toàn bộ file gốc",
                    ]
                  )
                    .slice(0, 4)
                    .map((feat, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          marginBottom: "8px",
                        }}
                      >
                        <CheckOutlined
                          style={{ marginRight: "8px", color: PRIMARY_COLOR }}
                        />{" "}
                        {feat}
                      </div>
                    ))}
                </div>

                <Button
                  block
                  style={{
                    background: PRIMARY_COLOR,
                    color: "#fff",
                    border: "none",
                    borderRadius: 0,
                    height: "45px",
                  }}
                  onClick={() => navigate(`/services/${item._id}`)}
                >
                  XEM CHI TIẾT <ArrowRightOutlined />
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Services;
