/**
 * AdminProfile.jsx
 * Trang hồ sơ Admin: xem/chỉnh thông tin cá nhân và đổi mật khẩu.
 */
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
  Typography,
  Space,
  Tag,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

// Trang admin cập nhật thông tin hồ sơ cá nhân.
const AdminProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fillForm(user);
    fetchCurrentUser();
  }, []);

  const fillForm = (userData) => {
    form.setFieldsValue({
      full_name: userData?.full_name || userData?.fullName || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
    });
  };

  const saveUserToLocal = (userData) => {
    const normalizedUser = {
      ...user,
      ...userData,
      full_name: userData.full_name || userData.fullName || user.full_name,
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    fillForm(normalizedUser);
  };

  const requestWithFallback = async (method, urls, data = null) => {
    let lastError = null;

    for (const url of urls) {
      try {
        return await axios({
          method,
          url: `${API_URL}${url}`,
          data,
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
      } catch (error) {
        lastError = error;

        // Nếu route tồn tại nhưng lỗi do validation/quyền/token thì không thử route khác nữa
        if (![404, 405].includes(error.response?.status)) {
          throw error;
        }
      }
    }

    throw lastError;
  };

  const fetchCurrentUser = async () => {
    setFetching(true);

    try {
      const res = await requestWithFallback("get", [
        "/auth/me",
        "/users/me",
        "/users/profile",
      ]);

      const currentUser = res.data.user || res.data.data || res.data;

      if (currentUser) {
        saveUserToLocal(currentUser);
      }
    } catch (error) {
      // Không báo đỏ nếu chỉ lỗi fetch profile, vì localStorage vẫn có user để hiển thị
      fillForm(user);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    setLoading(true);

    try {
      const payload = {
        full_name: values.full_name,
        phone: values.phone,
      };

      const res = await requestWithFallback(
        "put",
        ["/auth/update-profile", "/auth/me/update-profile", "/users/profile"],
        payload,
      );

      const updatedUser = res.data.user || res.data.data || res.data;

      saveUserToLocal(updatedUser);

      message.success("Cập nhật thông tin tài khoản thành công");
    } catch (error) {
      message.error(
        error.response?.data?.message || "Lỗi cập nhật thông tin tài khoản",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setPassLoading(true);

    try {
      const payload = {
        oldPassword: values.oldPassword,
        old_password: values.oldPassword,
        currentPassword: values.oldPassword,
        current_password: values.oldPassword,

        newPassword: values.newPassword,
        new_password: values.newPassword,
        password: values.newPassword,
      };

      await requestWithFallback(
        "put",
        [
          "/users/change-password",
          "/auth/change-password",
          "/auth/update-profile",
          "/auth/me/update-profile",
        ],
        payload,
      );

      message.success("Đổi mật khẩu thành công");
      passwordForm.resetFields();
    } catch (error) {
      message.error(
        error.response?.data?.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu cũ.",
      );
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            Tài khoản quản trị
          </Title>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchCurrentUser}
          loading={fetching}
        >
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              textAlign: "center",
              borderRadius: 12,
              border: "1px solid #efebe4",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              background: "#ffffff",
            }}
          >
            <Avatar
              size={110}
              src={user.avatar || user.portfolio?.avatar}
              icon={<UserOutlined />}
              style={{
                backgroundColor: "#BFA16A",
                marginBottom: 18,
              }}
            />

            <Title level={4} style={{ marginBottom: 6, fontWeight: 700 }}>
              {user.full_name || user.fullName || "Admin"}
            </Title>

            <Tag color="gold" style={{ marginBottom: 16, borderRadius: 4, fontWeight: 600, padding: "2px 10px" }}>
              {user.role === "ADMIN" ? "QUẢN TRỊ VIÊN" : user.role || "ADMIN"}
            </Tag>

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ textAlign: "left" }}>
              <p style={{ marginBottom: 12, color: "#595959" }}>
                <MailOutlined style={{ marginRight: 8, color: "#BFA16A" }} />
                {user.email || "Chưa có email"}
              </p>

              <p style={{ marginBottom: 0, color: "#595959" }}>
                <PhoneOutlined style={{ marginRight: 8, color: "#BFA16A" }} />
                {user.phone || "Chưa cập nhật số điện thoại"}
              </p>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Cập nhật thông tin</span>}
            bordered={false}
            style={{
              borderRadius: 12,
              border: "1px solid #efebe4",
              marginBottom: 24,
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="full_name"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập họ tên",
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Nhập họ và tên"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Số điện thoại" name="phone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Nhập số điện thoại"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Email" name="email">
                <Input prefix={<MailOutlined />} disabled size="large" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                style={{
                  background: "#BFA16A",
                  borderColor: "#BFA16A",
                  borderRadius: 8,
                  height: 40,
                  padding: "0 24px",
                }}
              >
                Lưu thay đổi
              </Button>
            </Form>
          </Card>

          <Card
            title={<span style={{ fontWeight: 700 }}>Đổi mật khẩu</span>}
            bordered={false}
            style={{
              borderRadius: 12,
              border: "1px solid #efebe4",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                label="Mật khẩu hiện tại"
                name="oldPassword"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mật khẩu hiện tại",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu hiện tại"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mật khẩu mới"
                    name="newPassword"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập mật khẩu mới",
                      },
                      {
                        min: 6,
                        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Nhập mật khẩu mới"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Xác nhận mật khẩu mới"
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng xác nhận mật khẩu mới",
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
                            new Error("Mật khẩu xác nhận không khớp"),
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Nhập lại mật khẩu mới"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LockOutlined />}
                  loading={passLoading}
                  style={{
                    background: "#BFA16A",
                    borderColor: "#BFA16A",
                    borderRadius: 8,
                    height: 40,
                    padding: "0 24px",
                  }}
                >
                  Cập nhật mật khẩu
                </Button>

                <Button onClick={() => passwordForm.resetFields()}>
                  Xóa form
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminProfile;

