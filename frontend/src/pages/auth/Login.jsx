import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        values,
      );

      const user = res.data.user;

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));

      message.success("Đăng nhập thành công!");

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "PHOTOGRAPHER") {
        navigate("/");
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
              fontSize: "32px",
              fontWeight: "normal",
              color: "#333",
              marginBottom: "10px",
            }}
          >
            Đăng nhập
          </h1>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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
              textAlign: "right",
              marginBottom: "30px",
              fontSize: "12px",
            }}
          >
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
