import React, { useState } from "react";
import { Form, Input, Button, Row, Col, message } from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", serif';

const Contact = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/contacts", values);
      message.success("Cảm ơn bạn! CaoHien Studio đã nhận được lời nhắn.");
      form.resetFields(); // Gửi xong thì xóa trắng form
    } catch (err) {
      message.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* HEADER LIÊN HỆ */}
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px 40px 20px",
          background: "#fdfaf6",
        }}
      >
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "46px",
            fontWeight: "normal",
            margin: "0 0 15px 0",
          }}
        >
          Liên Hệ Với Chúng Tôi
        </h1>
        <p style={{ color: "#666", fontSize: "15px", letterSpacing: "1px" }}>
          Hãy để lại lời nhắn, chúng tôi sẽ giúp bạn lưu giữ những khoảnh khắc
          đẹp nhất.
        </p>
      </div>

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px" }}
      >
        <Row gutter={[60, 60]}>
          {/* CỘT TRÁI: THÔNG TIN STUDIO (Code Cứng) */}
          <Col xs={24} md={12}>
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "28px",
                marginBottom: "30px",
              }}
            >
              Thông Tin Studio
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "25px",
                color: "#555",
                fontSize: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                <EnvironmentOutlined
                  style={{
                    fontSize: "20px",
                    color: PRIMARY_COLOR,
                    marginTop: "4px",
                  }}
                />
                <div>
                  <strong
                    style={{
                      display: "block",
                      color: "#000",
                      marginBottom: "5px",
                    }}
                  >
                    Địa Chỉ:
                  </strong>
                  123 Đường Số 1, Phường Linh Trung, Thủ Đức (Quận 9 cũ), TP.
                  HCM
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                <PhoneOutlined
                  style={{
                    fontSize: "20px",
                    color: PRIMARY_COLOR,
                    marginTop: "4px",
                  }}
                />
                <div>
                  <strong
                    style={{
                      display: "block",
                      color: "#000",
                      marginBottom: "5px",
                    }}
                  >
                    Hotline:
                  </strong>
                  (+84) 979 7676 02
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                <MailOutlined
                  style={{
                    fontSize: "20px",
                    color: PRIMARY_COLOR,
                    marginTop: "4px",
                  }}
                />
                <div>
                  <strong
                    style={{
                      display: "block",
                      color: "#000",
                      marginBottom: "5px",
                    }}
                  >
                    Email:
                  </strong>
                  caohienstudio@gmail.com
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                <ClockCircleOutlined
                  style={{
                    fontSize: "20px",
                    color: PRIMARY_COLOR,
                    marginTop: "4px",
                  }}
                />
                <div>
                  <strong
                    style={{
                      display: "block",
                      color: "#000",
                      marginBottom: "5px",
                    }}
                  >
                    Giờ Làm Việc:
                  </strong>
                  Thứ 2 - Chủ Nhật: 08:00 AM - 09:00 PM
                </div>
              </div>
            </div>

            {/* BẢN ĐỒ GOOGLE MAPS (Iframe code cứng) */}
            <div
              style={{
                marginTop: "40px",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #eee",
              }}
            >
              <iframe
                title="CaoHien Studio Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1m3!1d3918.42059489658!2d106.77259021533446!3d10.852136061614275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175276e02613d5b%3A0x8cf66eb855848bb2!2sHo%20Chi%20Minh%20City%20University%20of%20Technology%20and%20Education!5e0!3m2!1sen!2s!4v1680000000000!5m2!1sen!2s"
                width="100%"
                height="250"
                style={{ border: 0, display: "block" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </Col>

          {/* CỘT PHẢI: FORM GỬI LỜI NHẮN (Gắn API) */}
          <Col xs={24} md={12}>
            <div
              style={{
                background: "#fdfaf6",
                padding: "40px",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: "24px",
                  marginBottom: "25px",
                }}
              >
                Gửi Lời Nhắn
              </h3>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                  label="Họ và Tên"
                  name="name"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên của bạn!" },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    style={{ borderRadius: "0" }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Số Điện Thoại"
                      name="phone"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập số điện thoại!",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="0987..."
                        style={{ borderRadius: "0" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Email (Tùy chọn)" name="email">
                      <Input
                        size="large"
                        placeholder="abc@gmail.com"
                        style={{ borderRadius: "0" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Bạn đang quan tâm đến dịch vụ nào?"
                  name="message"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng để lại vài dòng lời nhắn!",
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={5}
                    placeholder="Ví dụ: Mình muốn tham khảo gói chụp Pre-wedding ngoại cảnh..."
                    style={{ borderRadius: "0" }}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                  style={{
                    background: "#333",
                    border: "none",
                    height: "50px",
                    width: "100%",
                    fontSize: "15px",
                    letterSpacing: "1px",
                    borderRadius: "0",
                    marginTop: "10px",
                  }}
                >
                  GỬI YÊU CẦU TƯ VẤN
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Contact;
