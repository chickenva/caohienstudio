/**
 * AdminAccountForm.jsx
 * Form thêm tài khoản quản trị viên (ADMIN) mới cho hệ thống.
 */
import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  message,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

// Form tạo tài khoản mới trong hệ thống cho admin.
const AdminAccountForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/users/admin/accounts`,
        {
          full_name: values.full_name,
          email: values.email,
          password: values.password,
          phone: values.phone || undefined,
          role: values.role,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      message.success("Tạo tài khoản thành công!");
      navigate("/admin/accounts");
    } catch (err) {
      message.error(err.response?.data?.message || "Không thể tạo tài khoản");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/accounts")}
          >
            Quay lại
          </Button>
        </Space>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 12, border: "1px solid #efebe4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 0 }}>
            <UserAddOutlined style={{ marginRight: 8, color: "#BFA16A" }} />
            Thêm tài khoản mới
          </Title>
        </div>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Họ và tên"
            name="full_name"
            rules={[
              { required: true, message: "Vui lòng nhập họ tên" },
              { min: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input size="large" placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Email đăng nhập"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input size="large" placeholder="admin@caohienstudio.com" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
          >
            <Input size="large" placeholder="0901 234 567 (tùy chọn)" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Tối thiểu 6 ký tự"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirm_password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp"),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Nhập lại mật khẩu"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => navigate("/admin/accounts")}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<UserAddOutlined />}
                style={{ background: "#BFA16A", borderColor: "#BFA16A" }}
              >
                Tạo tài khoản
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminAccountForm;
