import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Form, Input, Button, Row, Col, message } from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';

const Contact = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    if (location.state?.contactMessage) {
      form.setFieldsValue({
        message: location.state.contactMessage,
      });
    }

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [location, form]);

  // Scroll reveal observer
  useEffect(() => {
    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observerOptions = {
      root: null,
      threshold: 0.1,
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
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/contacts", values);
      message.success("Cảm ơn bạn! Cao Hiển Studio đã nhận được lời nhắn.");
      form.resetFields();
    } catch (err) {
      console.error("Contact submit error:", err);
      message.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page-container" style={{ background: "#FAF7F2", minHeight: "100vh", width: "100%", paddingBottom: "60px" }}>
      {/* Glow ambient spotlights */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }}></div>

      {/* HEADER LIÊN HỆ */}
      <div
        className="scroll-reveal"
        style={{
          textAlign: "center",
          padding: "100px 20px 60px 20px",
          background: "#FAF7F2",
          maxWidth: "800px",
          margin: "0 auto"
        }}
      >
        <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
          Contact Us
        </span>
        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "44px",
            fontWeight: "300",
            margin: "10px 0 15px 0",
            color: "#1F1F1F"
          }}
        >
          Liên Hệ Với Chúng Tôi
        </h1>
        <div style={{ width: "40px", height: "1px", background: "#BFA16A", margin: "20px auto 25px auto" }}></div>
        <p style={{ color: "#555555", fontSize: "15.5px", fontWeight: "300", letterSpacing: "0.5px" }}>
          Hãy để lại lời nhắn hoặc liên hệ trực tiếp, chúng tôi sẽ hỗ trợ tư vấn chi tiết cho ngày trọng đại của bạn.
        </p>
      </div>

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px 60px 20px" }}
      >
        <Row gutter={[60, 60]}>
          {/* CỘT TRÁI: THÔNG TIN STUDIO */}
          <Col xs={24} md={12} className="scroll-reveal stagger-1">
            <h3
              className="font-serif-luxury"
              style={{
                fontSize: "28px",
                fontWeight: "300",
                marginBottom: "35px",
                color: "#2F2F2F"
              }}
            >
              Thông Tin Studio
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "30px",
                color: "#555555",
                fontSize: "14.5px",
                fontWeight: "300"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "18px",
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
                      color: "#2F2F2F",
                      marginBottom: "6px",
                      fontSize: "12px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      fontWeight: "600"
                    }}
                  >
                    Địa Chỉ
                  </strong>
                  34B4 TL 887, phường An Hội, Vĩnh Long
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "18px",
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
                      color: "#2F2F2F",
                      marginBottom: "6px",
                      fontSize: "12px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      fontWeight: "600"
                    }}
                  >
                    Hotline
                  </strong>
                  (+84) 979 7676 02
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "18px",
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
                      color: "#2F2F2F",
                      marginBottom: "6px",
                      fontSize: "12px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      fontWeight: "600"
                    }}
                  >
                    Email
                  </strong>
                  caohienstudio@gmail.com
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "18px",
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
                      color: "#2F2F2F",
                      marginBottom: "6px",
                      fontSize: "12px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      fontWeight: "600"
                    }}
                  >
                    Giờ Làm Việc
                  </strong>
                  Thứ 2 - Chủ Nhật: 09:00 AM - 05:00 PM
                </div>
              </div>
            </div>

            {/* BẢN ĐỒ GOOGLE MAPS */}
            <div
              style={{
                marginTop: "45px",
                borderRadius: "0px",
                overflow: "hidden",
                border: "1px solid #E8DED2",
              }}
            >
              <iframe
                title="CaoHien Studio Map"
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d583.697091199096!2d106.3687414401994!3d10.210644960730347!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTDCsDEyJzM5LjgiTiAxMDbCsDIyJzA4LjEiRQ!5e0!3m2!1svi!2s!4v1778813420109!5m2!1svi!2s"
                width="100%"
                height="260"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </Col>

          {/* CỘT PHẢI: FORM GỬI LỜI NHẮN */}
          <Col xs={24} md={12} className="scroll-reveal stagger-2">
            <div
              className="glass-panel"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                padding: "40px",
                borderRadius: "0px",
              }}
            >
              <h3
                className="font-serif-luxury"
                style={{
                  fontSize: "24px",
                  fontWeight: "300",
                  marginBottom: "30px",
                  color: "#2F2F2F"
                }}
              >
                Gửi Lời Nhắn
              </h3>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                  label="Họ và Tên"
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập họ và tên của bạn!",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Nguyễn Văn A"
                    style={{ borderRadius: "0px" }}
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
                        placeholder="0912345678"
                        style={{ borderRadius: "0px" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Email (Tùy chọn)"
                      name="email"
                      rules={[
                        {
                          type: "email",
                          message: "Email không hợp lệ!",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="email@gmail.com"
                        style={{ borderRadius: "0px" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Lời Nhắn / Dịch Vụ Cần Tư Vấn"
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
                    placeholder="Tôi muốn tư vấn về gói chụp..."
                    style={{ borderRadius: "0px" }}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                  style={{
                    background: "#BFA16A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "0px",
                    height: "50px",
                    width: "100%",
                    fontFamily: "Outfit",
                    fontSize: "14px",
                    fontWeight: "500",
                    letterSpacing: "1.5px",
                    boxShadow: "0 4px 15px rgba(191, 161, 106, 0.2)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "10px",
                    transition: "all 0.3s"
                  }}
                  className="btn-submit-contact"
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
