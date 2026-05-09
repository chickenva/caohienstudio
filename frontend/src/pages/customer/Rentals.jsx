import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Spin, message, Tabs, Tag } from "antd";
import {
  CameraOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", serif';

const Rentals = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("ALL");

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resources/rentals?type=${currentTab}`,
        );
        setEquipment(res.data);
      } catch (err) {
        message.error("Không thể tải danh sách thiết bị");
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [currentTab]);

  const tabItems = [
    { key: "ALL", label: "TẤT CẢ" },
    { key: "CAMERA", label: "MÁY ẢNH (BODY)" },
    { key: "LENS", label: "ỐNG KÍNH (LENS)" },
    { key: "LIGHT", label: "ĐÈN & STUDIO" },
    { key: "ACCESSORY", label: "PHỤ KIỆN KHÁC" },
  ];

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "60px auto",
        padding: "0 20px",
        minHeight: "80vh",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "42px",
            fontWeight: "normal",
          }}
        >
          Cho Thuê Thiết Bị
        </h1>
        <p
          style={{
            color: "#888",
            letterSpacing: "1px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Trải nghiệm các dòng máy ảnh và ống kính chuyên nghiệp nhất với thủ
          tục đơn giản, giá cả hợp lý.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "40px",
        }}
        className="rental-tabs"
      >
        <Tabs
          activeKey={currentTab}
          onChange={setCurrentTab}
          items={tabItems}
          size="large"
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px" }}>
          <Spin size="large" />
        </div>
      ) : equipment.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#888",
            padding: "50px",
            fontSize: "16px",
          }}
        >
          Chưa có thiết bị nào trong danh mục này.
        </div>
      ) : (
        <Row gutter={[30, 30]}>
          {equipment.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item._id}>
              <Card
                hoverable
                cover={
                  <div
                    style={{
                      padding: "30px",
                      background: "#f8f9fa",
                      textAlign: "center",
                    }}
                  >
                    <img
                      alt={item.name}
                      src={item.thumbnail}
                      style={{
                        height: "180px",
                        objectFit: "contain",
                        mixBlendMode: "multiply",
                      }}
                    />
                  </div>
                }
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #eaeaea",
                }}
                bodyStyle={{ padding: "24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: FONT_SERIF,
                      fontSize: "20px",
                      margin: 0,
                    }}
                  >
                    {item.name}
                  </h3>
                  <Tag
                    color={item.status === "AVAILABLE" ? "success" : "error"}
                  >
                    {item.status === "AVAILABLE"
                      ? "SẴN SÀNG"
                      : "ĐANG ĐƯỢC THUÊ"}
                  </Tag>
                </div>

                <div
                  style={{
                    fontSize: "18px",
                    color: PRIMARY_COLOR,
                    fontWeight: 600,
                    marginBottom: "20px",
                  }}
                >
                  {item.rental_price_per_day?.toLocaleString()}đ{" "}
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#888",
                      fontWeight: "normal",
                    }}
                  >
                    / ngày
                  </span>
                </div>

                <div style={{ minHeight: "80px", marginBottom: "20px" }}>
                  {(item.features || []).slice(0, 3).map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        marginBottom: "6px",
                      }}
                    >
                      <CameraOutlined
                        style={{ marginRight: "8px", color: PRIMARY_COLOR }}
                      />{" "}
                      {feat}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginBottom: "20px",
                    padding: "10px",
                    background: "#fdfaf6",
                    borderRadius: "4px",
                  }}
                >
                  <SafetyCertificateOutlined style={{ marginRight: "5px" }} />{" "}
                  Yêu cầu cọc:{" "}
                  <strong>
                    {item.required_deposit_amount?.toLocaleString()}đ
                  </strong>{" "}
                  hoặc giấy tờ tùy thân.
                </div>

                <Button
                  block
                  type="primary"
                  disabled={item.status !== "AVAILABLE"}
                  icon={<ShoppingCartOutlined />}
                  style={{
                    background: item.status === "AVAILABLE" ? "#333" : "#ccc",
                    border: "none",
                    height: "45px",
                    letterSpacing: "1px",
                  }}
                >
                  {item.status === "AVAILABLE" ? "THUÊ NGAY" : "TẠM HẾT HÀNG"}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <style>{`
        .rental-tabs .ant-tabs-tab { font-size: 13px; letter-spacing: 1px; color: #888; transition: all 0.3s; }
        .rental-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${PRIMARY_COLOR} !important; font-weight: 600; }
        .rental-tabs .ant-tabs-ink-bar { background: ${PRIMARY_COLOR}; }
      `}</style>
    </div>
  );
};

export default Rentals;
