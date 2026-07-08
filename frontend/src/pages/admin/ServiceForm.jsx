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

const API_URL = "http://localhost:5000/api";



const ServiceForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [categories, setCategories] = useState([]);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchServiceDetail();
    } else {
      form.resetFields();
      setThumbnailPreview("");
      setInitialLoading(false);
    }
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories?type=SERVICE&is_active=true`);
      setCategories(res.data.categories || []);
    } catch (error) {
      message.error("Lỗi tải danh mục");
    }
  };

  const fetchServiceDetail = async () => {
    setInitialLoading(true);

    try {
      const res = await axios.get(`${API_URL}/services/admin/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const service = res.data;

      form.setFieldsValue({
        name: service.name,
        description: service.description,
        category: service.category || "OTHER",
        features: Array.isArray(service.features) ? service.features.join("\n") : "",
        base_price: service.base_price,
        duration_hours: service.duration_hours,
        thumbnail: service.thumbnail,
        is_active: service.is_active,
        allow_addon: service.allow_addon || false,
      });

      setThumbnailPreview(service.thumbnail || "");
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải thông tin dịch vụ",
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const payload = {
        ...values,
        features: values.features
          ? values.features.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
          : [],
        base_price: Number(values.base_price),
        duration_hours: Number(values.duration_hours),
      };

      if (isEdit) {
        await axios.put(`${API_URL}/services/admin/${id}`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Cập nhật dịch vụ thành công");
      } else {
        await axios.post(`${API_URL}/services/admin`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Tạo dịch vụ thành công");
      }

      navigate("/admin/services");
    } catch (err) {
      message.error(err.response?.data?.message || "Lưu dịch vụ thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const value = e.target.value;
    setThumbnailPreview(value);
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/services")}
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          {isEdit ? "Chỉnh sửa gói dịch vụ" : "Thêm gói dịch vụ mới"}
        </Title>
        <Text type="secondary">
          Quản lý thông tin gói dịch vụ hiển thị trên website và dùng trong quy trình đặt lịch.
        </Text>
      </div>

      <Card loading={initialLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={15}>
              <Form.Item
                label="Tên gói dịch vụ"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên gói dịch vụ" }]}
              >
                <Input placeholder="VD: Chụp truyền thống 01" />
              </Form.Item>

              <Form.Item
                label="Danh mục dịch vụ"
                name="category"
                rules={[{ required: true, message: "Vui lòng chọn danh mục dịch vụ" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  options={categories.map((c) => ({
                    value: c.slug,
                    label: c.name,
                  }))}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Giá gói dịch vụ"
                    name="base_price"
                    rules={[{ required: true, message: "Vui lòng nhập giá gói dịch vụ" }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="VD: 4000000"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      addonAfter="VNĐ"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Thời lượng"
                    name="duration_hours"
                    rules={[{ required: true, message: "Vui lòng nhập thời lượng" }]}
                  >
                    <InputNumber min={1} style={{ width: "100%" }} placeholder="VD: 8" addonAfter="giờ" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Ảnh đại diện / Thumbnail" name="thumbnail">
                <Input placeholder="Dán link ảnh thumbnail" onChange={handleThumbnailChange} />
              </Form.Item>

              <Form.Item label="Mô tả gói dịch vụ" name="description">
                <TextArea
                  rows={5}
                  placeholder="Mô tả chi tiết gói dịch vụ, quyền lợi, phong cách chụp/quay, thời gian, ghi chú..."
                />
              </Form.Item>

              <Form.Item label="Quyền lợi / Nội dung gói" name="features">
                <TextArea rows={6} placeholder="Mỗi dòng là một quyền lợi hoặc nội dung gói" />
              </Form.Item>

              {isEdit && (
                <Form.Item label="Hiển thị trên website" name="is_active" valuePropName="checked">
                  <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                </Form.Item>
              )}

              <Form.Item label="Là Dịch Vụ Đi Kèm (Add-on)" name="allow_addon" valuePropName="checked">
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={9}>
              <Card title="Xem trước ảnh đại diện" bordered style={{ height: "100%" }}>
                {thumbnailPreview ? (
                  <Image
                    src={thumbnailPreview}
                    width="100%"
                    height={260}
                    style={{ objectFit: "cover", borderRadius: 8, background: "#f5f5f5" }}
                    onError={() => {
                      message.warning("Link ảnh xem trước không hợp lệ");
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 260,
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
                    Dán link thumbnail để xem trước ảnh tại đây
                  </div>
                )}

                <div style={{ marginTop: 16, color: "#777", fontSize: 13, lineHeight: 1.7 }}>
                  Ảnh này sẽ hiển thị ở trang danh sách dịch vụ và chi tiết gói. Có thể dùng link ảnh public từ Google Drive, Cloudinary hoặc ảnh có sẵn.
                </div>
              </Card>
            </Col>
          </Row>

          <Space style={{ marginTop: 20 }}>
            <Button onClick={() => navigate("/admin/services")}>Hủy</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              {isEdit ? "Lưu thay đổi" : "Tạo dịch vụ"}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default ServiceForm;
