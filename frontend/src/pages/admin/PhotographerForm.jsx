import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Switch,
  Card,
  message,
  Typography,
  Row,
  Col,
  Space,
  Image,
  Select,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";

const specialtyOptions = [
  "Wedding",
  "Pre-Wedding",
  "Couple",
  "Portrait",
  "Cinematic",
  "Fashion",
  "Event",
  "Graduation",
];

// Form admin tạo/cập nhật hồ sơ nhiếp ảnh gia.
const PhotographerForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [featuredPreview, setFeaturedPreview] = useState([]);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    if (isEdit) {
      fetchPhotographerDetail();
    }
  }, [id]);

  const fetchPhotographerDetail = async () => {
    setInitialLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/users/admin/photographers/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      const photographer = res.data.photographer;
      const portfolio = photographer.portfolio || {};

      form.setFieldsValue({
        full_name: photographer.full_name,
        email: photographer.email,
        phone: photographer.phone,
        is_active: photographer.is_active,

        avatar: portfolio.avatar,
        bio: portfolio.bio,
        specialties: portfolio.specialties || [],
        years_of_experience: portfolio.years_of_experience || 1,
        featured_images_text: (portfolio.featured_images || []).join("\n"),
        google_drive_folder_id: portfolio.google_drive_folder_id,
        google_drive_folder_url: portfolio.google_drive_folder_url,
      });

      setAvatarPreview(portfolio.avatar || "");
      setFeaturedPreview(portfolio.featured_images || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải thông tin nhiếp ảnh gia",
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const featuredImages = values.featured_images_text
        ? values.featured_images_text
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const portfolio = {
        avatar: values.avatar || "",
        bio: values.bio || "",
        specialties: values.specialties || [],
        years_of_experience: Number(values.years_of_experience || 1),
        featured_images: featuredImages,
        google_drive_folder_id: values.google_drive_folder_id || "",
        google_drive_folder_url: values.google_drive_folder_url || "",
      };

      const payload = {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        is_active: values.is_active,
        portfolio,
      };

      if (!isEdit) {
        payload.password = values.password;
      }

      if (isEdit) {
        await axios.put(`${API_URL}/users/admin/photographers/${id}`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Cập nhật nhiếp ảnh gia thành công");
      } else {
        await axios.post(`${API_URL}/users/admin/photographers`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Tạo nhiếp ảnh gia thành công");
      }

      navigate("/admin/photographers");
    } catch (err) {
      message.error(
        err.response?.data?.message || "Lưu nhiếp ảnh gia thất bại",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    setAvatarPreview(e.target.value);
  };

  const handleFeaturedChange = (e) => {
    const images = e.target.value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setFeaturedPreview(images);
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/photographers")}
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          {isEdit ? "Chỉnh sửa nhiếp ảnh gia" : "Thêm nhiếp ảnh gia mới"}
        </Title>
        <Text type="secondary">
          Quản lý thông tin tài khoản và portfolio của nhiếp ảnh gia trong đội
          ngũ Cao Hiển Studio.
        </Text>
      </div>

      <Card loading={initialLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            years_of_experience: 1,
            specialties: [],
          }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={15}>
              <Card
                title="Thông tin tài khoản"
                bordered
                style={{ marginBottom: 20 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Họ tên"
                      name="full_name"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập họ tên",
                        },
                      ]}
                    >
                      <Input placeholder="VD: Andy Nguyễn" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập email",
                        },
                        {
                          type: "email",
                          message: "Email không hợp lệ",
                        },
                      ]}
                    >
                      <Input placeholder="andy.nguyen@caohienstudio.com" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Số điện thoại" name="phone">
                      <Input placeholder="0987654321" />
                    </Form.Item>
                  </Col>

                  {!isEdit && (
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập mật khẩu",
                          },
                          {
                            min: 6,
                            message: "Mật khẩu tối thiểu 6 ký tự",
                          },
                        ]}
                      >
                        <Input.Password placeholder="Nhập mật khẩu tài khoản" />
                      </Form.Item>
                    </Col>
                  )}

                  <Col xs={24}>
                    <Form.Item
                      label="Hiển thị trên website"
                      name="is_active"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Thông tin portfolio" bordered>
                <Form.Item label="Avatar" name="avatar">
                  <Input
                    placeholder="Dán link ảnh đại diện"
                    onChange={handleAvatarChange}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Chuyên môn"
                      name="specialties"
                      extra="Có thể chọn nhiều chuyên môn."
                    >
                      <Select
                        mode="tags"
                        placeholder="Wedding, Portrait, Event..."
                        options={specialtyOptions.map((item) => ({
                          value: item,
                          label: item,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Số năm kinh nghiệm"
                      name="years_of_experience"
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Giới thiệu / Bio" name="bio">
                  <TextArea
                    rows={5}
                    placeholder="Mô tả phong cách chụp, kinh nghiệm và cá tính của nhiếp ảnh gia..."
                  />
                </Form.Item>

                <Form.Item
                  label="Ảnh portfolio nổi bật"
                  name="featured_images_text"
                  extra="Mỗi dòng là 1 link ảnh. Dùng để hiển thị ở trang chi tiết nhiếp ảnh gia."
                >
                  <TextArea
                    rows={5}
                    placeholder={`https://...\nhttps://...\nhttps://...`}
                    onChange={handleFeaturedChange}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Google Drive Folder ID"
                      name="google_drive_folder_id"
                    >
                      <Input placeholder="Tùy chọn, dùng sau nếu muốn lấy portfolio từ Drive" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Google Drive Folder URL"
                      name="google_drive_folder_url"
                    >
                      <Input placeholder="Tùy chọn" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={9}>
              <Card title="Xem trước" bordered style={{ marginBottom: 20 }}>
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    width="100%"
                    height={320}
                    style={{
                      objectFit: "cover",
                      borderRadius: 8,
                      background: "#f5f5f5",
                    }}
                    onError={() => {
                      message.warning("Link avatar xem trước không hợp lệ");
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 320,
                      borderRadius: 8,
                      background: "#f5f5f5",
                      color: "#999",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: 20,
                    }}
                  >
                    Dán link avatar để xem trước tại đây
                  </div>
                )}
              </Card>

              <Card title="Ảnh portfolio nổi bật" bordered>
                {featuredPreview.length === 0 ? (
                  <div style={{ color: "#999" }}>
                    Chưa có ảnh portfolio nổi bật
                  </div>
                ) : (
                  <Row gutter={[10, 10]}>
                    {featuredPreview.slice(0, 6).map((img, index) => (
                      <Col span={12} key={index}>
                        <Image
                          src={img}
                          width="100%"
                          height={120}
                          style={{
                            objectFit: "cover",
                            borderRadius: 6,
                            background: "#f5f5f5",
                          }}
                          preview={false}
                        />
                      </Col>
                    ))}
                  </Row>
                )}
              </Card>
            </Col>
          </Row>

          <Space style={{ marginTop: 24 }}>
            <Button onClick={() => navigate("/admin/photographers")}>
              Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              {isEdit ? "Lưu thay đổi" : "Tạo nhiếp ảnh gia"}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default PhotographerForm;
