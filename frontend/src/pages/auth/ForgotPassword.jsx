import React, { useState } from "react";
import { Form, Input, Button, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onFinishStep1 = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: values.email },
      );
      setEmail(values.email);
      Modal.success({
        title: "Thành công",
        content: res.data.message,
        onOk: () => setStep(2),
        centered: true,
      });
    } catch (error) {
      Modal.error({
        title: "Lỗi",
        content: error.response?.data?.message || "Không tìm thấy tài khoản",
        centered: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinishStep2 = async (values) => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp: values.otp,
      });
      setStep(3);
    } catch (error) {
      Modal.error({
        title: "Lỗi",
        content: error.response?.data?.message || "Mã OTP không chính xác!",
        centered: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinishStep3 = async (values) => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        newPassword: values.newPassword,
      });
      Modal.success({
        title: "Thành công!",
        content: "Mật khẩu đã được đổi. Vui lòng đăng nhập lại.",
        onOk: () => navigate("/login"),
        centered: true,
      });
    } catch (error) {
      Modal.error({
        title: "Lỗi",
        content: error.response?.data?.message || "Lỗi server",
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
            style={{ fontSize: "12px", color: "#888", letterSpacing: "0.5px" }}
          >
            {step === 1 && "Nhập email tài khoản để nhận mã xác thực"}
            {step === 2 && "Nhập mã xác thực gồm 4 chữ số vừa được gửi"}
            {step === 3 && "Tạo mật khẩu mới cho tài khoản của bạn"}
          </p>
        </div>

        {step === 1 && (
          <Form layout="vertical" onFinish={onFinishStep1} requiredMark={false}>
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
                { required: true, type: "email", message: "Sai định dạng!" },
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

        {step === 2 && (
          <Form layout="vertical" onFinish={onFinishStep2} requiredMark={false}>
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
                  Mã OTP
                </span>
              }
              name="otp"
              rules={[{ required: true, message: "Nhập OTP!" }]}
            >
              <Input
                placeholder="****"
                style={{
                  borderRadius: "0",
                  padding: "12px 15px",
                  border: "1px solid #ddd",
                  textAlign: "center",
                  fontSize: "20px",
                  letterSpacing: "10px",
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
                marginBottom: "15px",
              }}
            >
              XÁC NHẬN MÃ <ArrowRightOutlined />
            </Button>
            <div style={{ textAlign: "center" }}>
              <Button
                type="link"
                onClick={() => setStep(1)}
                icon={<ArrowLeftOutlined />}
                style={{ color: "#888", fontSize: "12px" }}
              >
                Quay lại nhập mail
              </Button>
            </div>
          </Form>
        )}

        {step === 3 && (
          <Form layout="vertical" onFinish={onFinishStep3} requiredMark={false}>
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
                  Mật khẩu mới
                </span>
              }
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
                  và 1 ký tự đặc biệt (!@#$%^&*()&gt;.).
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
            >
              <Input.Password
                placeholder="******"
                style={{
                  borderRadius: "0",
                  padding: "12px 15px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                }}
              />
            </Form.Item>

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
                  Xác nhận mật khẩu mới
                </span>
              }
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("newPassword") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error("Mật khẩu không khớp!"));
                  },
                }),
              ]}
              style={{ marginTop: "5px" }}
            >
              <Input.Password
                placeholder="******"
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
                marginTop: "10px",
              }}
            >
              XÁC NHẬN ĐỔI MẬT KHẨU <ArrowRightOutlined />
            </Button>
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
