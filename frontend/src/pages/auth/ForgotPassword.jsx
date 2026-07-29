import React, { useState } from "react";
import { Form, Input, Button, Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

// Trang quên mật khẩu, gửi OTP và cập nhật mật khẩu mới.
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // BƯỚC 1: NHẬP EMAIL & NHẬN OTP
  const onFinishStep1 = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: values.email },
      );
      setEmail(values.email);
      // Dùng message cho mượt
      message.success(res.data.message || "Mã xác thực đã được gửi!");
      setStep(2);
    } catch (error) {
      Modal.error({
        title: "Lỗi",
        content:
          error.response?.data?.message ||
          "Không tìm thấy tài khoản với email này",
        centered: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: XÁC THỰC OTP & TẠO MẬT KHẨU MỚI (Gộp 2 API)
  const onFinishStep2 = async (values) => {
    setLoading(true);
    try {
      // 1. Verify OTP
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp: values.otp,
      });

      // 2. Reset password
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        newPassword: values.newPassword,
      });

      Modal.success({
        title: "Thành công!",
        content: "Mật khẩu đã được khôi phục. Vui lòng đăng nhập lại.",
        onOk: () => navigate("/login"),
        centered: true,
      });
    } catch (error) {
      Modal.error({
        title: "Lỗi",
        content:
          error.response?.data?.message ||
          "Mã OTP không chính xác hoặc thông tin không hợp lệ!",
        centered: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 170px)",
        padding: "40px 20px",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#ffffff",
          padding: "50px 40px",
          border: "1px solid #eaeaea",
          boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "30px",
              fontWeight: "normal",
              color: "#333",
              marginBottom: "10px",
            }}
          >
            Khôi phục mật khẩu
          </h1>
          <p
            style={{
              fontSize: "11px",
              color: "#999",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Bước {step} / 2
          </p>
        </div>

        {/* ================= BƯỚC 1 ================= */}
        {step === 1 && (
          <Form layout="vertical" onFinish={onFinishStep1} requiredMark={false}>
            <p
              style={{
                fontSize: "12px",
                color: "#888",
                letterSpacing: "0.5px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              Nhập email tài khoản để nhận mã xác thực
            </p>
            <Form.Item
              label={
                <span
                  style={{
                    fontSize: "11px",
                    color: "#555",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Email đăng ký
                </span>
              }
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Sai định dạng email!",
                },
              ]}
            >
              <Input
                placeholder="username@gmail.com"
                style={{
                  borderRadius: "0",
                  padding: "12px 15px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: PRIMARY_COLOR,
                borderRadius: "0",
                height: "45px",
                border: "none",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              NHẬN MÃ OTP <ArrowRightOutlined />
            </Button>
          </Form>
        )}

        {/* ================= BƯỚC 2 ================= */}
        {step === 2 && (
          <Form layout="vertical" onFinish={onFinishStep2} requiredMark={false}>
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#666",
              }}
            >
              Mã xác thực đã được gửi đến: <br /> <strong>{email}</strong>
              <br /><span style={{ fontSize: "12px", color: "#888", fontStyle: "italic" }}>* Vui lòng kiểm tra hộp thư Rác (Spam) nếu không nhận được email.</span>
            </div>

            <Form.Item
              name="otp"
              rules={[{ required: true, message: "Vui lòng nhập mã OTP!" }]}
            >
              <Input
                placeholder="MÃ OTP (4-6 SỐ)"
                style={{
                  borderRadius: "0",
                  padding: "12px 15px",
                  border: "1px solid #ddd",
                  textAlign: "center",
                  fontSize: "18px",
                  letterSpacing: "6px",
                }}
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              extra={
                <span
                  style={{
                    fontSize: "10px",
                    color: "#888",
                    lineHeight: "1.2",
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  Yêu cầu: 8-16 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số
                  và 1 ký tự đặc biệt.
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                {
                  pattern:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/,
                  message: "Mật khẩu chưa đạt yêu cầu bảo mật!",
                },
              ]}
              style={{ marginBottom: "15px" }}
            >
              <Input.Password
                placeholder="Mật khẩu mới"
                style={{
                  borderRadius: "0",
                  padding: "12px 15px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("newPassword") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error("Mật khẩu không khớp!"));
                  },
                }),
              ]}
              style={{ marginBottom: "20px" }}
            >
              <Input.Password
                placeholder="Xác nhận mật khẩu mới"
                style={{
                  borderRadius: "0",
                  padding: "12px 15px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: PRIMARY_COLOR,
                borderRadius: "0",
                height: "45px",
                border: "none",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              XÁC NHẬN ĐỔI MẬT KHẨU <ArrowRightOutlined />
            </Button>

            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <Button
                type="link"
                onClick={() => setStep(1)}
                icon={<ArrowLeftOutlined />}
                style={{ color: "#888", fontSize: "12px" }}
              >
                Đổi email khác
              </Button>
            </div>
          </Form>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "30px",
            fontSize: "12px",
            color: "#888",
          }}
        >
          <span
            onClick={() => navigate("/login")}
            style={{
              cursor: "pointer",
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "bold",
            }}
          >
            <ArrowLeftOutlined style={{ marginRight: "5px" }} /> Quay lại Đăng
            nhập
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
