/**
 * Login.jsx
 * Trang đăng nhập: email + mật khẩu, redirect theo role.
 */
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config/api";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

// Trang đăng nhập, lưu token và điều hướng theo role user.
const Login = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Tự động điền email và mật khẩu nếu người dùng từng chọn "Nhớ mật khẩu"
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail && savedPassword) {
      form.setFieldsValue({
        email: savedEmail,
        password: savedPassword,
        remember: true,
      });
    }
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: values.email,
          password: values.password,
        },
      );

      const user = res.data.user;

      // Xử lý lưu / xóa mật khẩu ghi nhớ
      if (values.remember) {
        localStorage.setItem("rememberedEmail", values.email);
        localStorage.setItem("rememberedPassword", values.password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || "Email hoặc mật khẩu không đúng!",
      );
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
              fontSize: "30px",
              fontWeight: "normal",
              color: "#333",
              marginBottom: "10px",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            ĐĂNG NHẬP
          </h1>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} initialValues={{ remember: false }}>
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
                Email
              </span>
            }
            name="email"
            rules={[{ required: true, message: "Nhập Email!" }]}
          >
            <Input
              placeholder="admin@gmail.com"
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
                Mật khẩu
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu!" }]}
            style={{ marginBottom: "15px" }}
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
              fontSize: "12px",
            }}
          >
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox style={{ fontSize: "12px", color: "#555" }}>
                Nhớ mật khẩu
              </Checkbox>
            </Form.Item>
            <span
              onClick={() => navigate("/forgot-password")}
              style={{
                cursor: "pointer",
                color: PRIMARY_COLOR,
                letterSpacing: "0.5px",
              }}
            >
              Quên mật khẩu?
            </span>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              background: PRIMARY_COLOR,
              color: "#fff",
              borderRadius: "0",
              height: "45px",
              border: "none",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            ĐĂNG NHẬP
          </Button>

          <div style={{ textAlign: "center", fontSize: "12px", color: "#555" }}>
            Bạn chưa có tài khoản?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{
                cursor: "pointer",
                color: PRIMARY_COLOR,
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Đăng ký ngay
            </span>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
