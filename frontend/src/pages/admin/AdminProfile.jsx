import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Avatar,
  message,
  Divider,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import axios from "axios";

const AdminProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Lấy thông tin user hiện tại từ LocalStorage
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {},
  );

  // Đổ dữ liệu vào Form khi load trang
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, form]);

  // Xử lý Cập nhật thông tin cá nhân
  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Cập nhật lại LocalStorage và State
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      message.success("Cập nhật thông tin thành công!");
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đổi mật khẩu
  const handleChangePassword = async (values) => {
    setPassLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/change-password",
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      message.success("Đổi mật khẩu thành công!");
      passwordForm.resetFields(); // Xóa trắng form đổi pass
    } catch (error) {
      message.error(error.response?.data?.message || "Mật khẩu cũ không đúng!");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "24px", fontSize: "24px" }}>
        Thông tin tài khoản Quản trị
      </h2>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: Avatar & Thông tin cơ bản */}
        <Col xs={24} md={8}>
          <Card style={{ textAlign: "center", borderRadius: "8px" }}>
            <Avatar
              size={120}
              src={user.avatar}
              icon={!user.avatar && <UserOutlined />}
              style={{ backgroundColor: "#141414", marginBottom: "16px" }}
            />
            <h3 style={{ margin: 0, fontSize: "20px" }}>{user.fullName}</h3>
            <p style={{ color: "#888", marginBottom: "16px" }}>
              {user.role === "admin" ? "Quản trị viên hệ thống" : "Khách hàng"}
            </p>
            <Divider />
            <div style={{ textAlign: "left", color: "#555" }}>
              <p>
                <MailOutlined style={{ marginRight: "8px" }} /> {user.email}
              </p>
              <p>
                <PhoneOutlined style={{ marginRight: "8px" }} />{" "}
                {user.phone || "Chưa cập nhật"}
              </p>
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI: Form chỉnh sửa */}
        <Col xs={24} md={16}>
          <Card
            title="Cập nhật thông tin"
            style={{ borderRadius: "8px", marginBottom: "24px" }}
          >
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên!" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Nhập họ và tên"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Số điện thoại" name="phone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Nhập số điện thoại"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Email (Không thể thay đổi)" name="email">
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ background: "#141414" }}
              >
                Lưu thay đổi
              </Button>
            </Form>
          </Card>

          <Card title="Đổi mật khẩu" style={{ borderRadius: "8px" }}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                label="Mật khẩu cũ"
                name="oldPassword"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu cũ!" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Mật khẩu mới"
                    name="newPassword"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập mật khẩu mới!",
                      },
                      { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Xác nhận mật khẩu mới"
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng xác nhận mật khẩu!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (
                            !value ||
                            getFieldValue("newPassword") === value
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Mật khẩu xác nhận không khớp!"),
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                htmlType="submit"
                loading={passLoading}
                style={{ background: "#141414" }}
              >
                Cập nhật mật khẩu
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminProfile;
