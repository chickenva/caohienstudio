/**
 * Register.jsx
 * Trang đăng ký tài khoản mới: OTP email, validate form.
 */
import React, { useState } from "react";
import { Form, Input, Button, Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { API_URL } from "../../config/api";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

// Trang đăng ký tài khoản customer với xác thực OTP email.
const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // XỬ LÝ BƯỚC 1: GỬI OTP
  const onFinishStep1 = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/send-register-otp`,
        { email: values.email },
      );
      setEmail(values.email);
      // Dùng message hiển thị mượt mà thay vì Modal che màn hình
      message.success(res.data.message || "Đã gửi mã OTP đến email của bạn!");
      setStep(2); // Chuyển sang bước 2
    } catch (error) {
      Modal.error({
        title: "Lỗi",
        content: error.response?.data?.message || "Có lỗi xảy ra khi gửi email",
        centered: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // XỬ LÝ BƯỚC 2: KIỂM TRA OTP & ĐĂNG KÝ (Gọi 2 API liên tiếp)
  const onFinishStep2 = async (values) => {
    setLoading(true);
    try {
      // 1. Gọi API xác thực OTP trước
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp: values.otp,
      });

      // 2. Nếu OTP hợp lệ, tự động gọi tiếp API tạo user
      await axios.post(`${API_URL}/auth/register`, {
        email,
        fullName: values.fullName,
        phone: values.phone,
        password: values.password,
      });

      Modal.success({
        title: "Đăng ký thành công!",
        content:
          "Chào mừng bạn đến với Cao Hiển Studio. Vui lòng đăng nhập để tiếp tục.",
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
        background: "#FAF7F2",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#ffffff",
          padding: "50px 40px",
          border: "1px solid #E8DED2",
          boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "28px",
              fontWeight: "normal",
              color: "#333",
              marginBottom: "10px",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            ĐĂNG KÝ TÀI KHOẢN
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

        {/* ================= BƯỚC 1: CHỈ NHẬP EMAIL ================= */}
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
              GỬI MÃ OTP <ArrowRightOutlined />
            </Button>

            <div
              style={{
                textAlign: "center",
                marginTop: "30px",
                fontSize: "12px",
                color: "#888",
              }}
            >
              Đã có tài khoản?{" "}
              <span
                onClick={() => navigate("/login")}
                style={{
                  color: PRIMARY_COLOR,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ĐĂNG NHẬP
              </span>
            </div>
          </Form>
        )}

        {/* ================= BƯỚC 2: NHẬP OTP + THÔNG TIN ================= */}
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

            {/* Ô nhập OTP nổi bật */}
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

            {/* Thông tin cá nhân */}
            <Form.Item
              name="fullName"
              rules={[
                { required: true, message: "Vui lòng nhập họ và tên!" },
                {
                  pattern:
                    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/,
                  message: "Họ tên không được chứa số hoặc ký tự đặc biệt!",
                },
              ]}
              style={{ marginBottom: "15px" }}
            >
              <Input
                placeholder="Họ và tên (VD: Nguyễn Văn A)"
                style={{
                  borderRadius: "0",
                  padding: "10px 15px",
                  border: "1px solid #ddd",
                }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập SĐT!" },
                {
                  pattern: /^0[0-9]{9,10}$/,
                  message:
                    "Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số!",
                },
              ]}
              style={{ marginBottom: "15px" }}
            >
              <Input
                placeholder="Số điện thoại (VD: 09xx xxx xxx)"
                style={{
                  borderRadius: "0",
                  padding: "10px 15px",
                  border: "1px solid #ddd",
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
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
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                {
                  pattern:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/,
                  message: "Mật khẩu chưa đạt yêu cầu bảo mật!",
                },
              ]}
              style={{ marginBottom: "15px" }}
            >
              <Input.Password
                placeholder="Mật khẩu"
                style={{
                  borderRadius: "0",
                  padding: "10px 15px",
                  border: "1px solid #ddd",
                }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error("Mật khẩu không khớp!"));
                  },
                }),
              ]}
              style={{ marginBottom: "20px" }}
            >
              <Input.Password
                placeholder="Xác nhận mật khẩu"
                style={{
                  borderRadius: "0",
                  padding: "10px 15px",
                  border: "1px solid #ddd",
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
              HOÀN TẤT ĐĂNG KÝ
            </Button>

            <div style={{ textAlign: "center" }}>
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
      </div>
    </div>
  );
};

export default Register;
