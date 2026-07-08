import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Switch,
  Card,
  message,
  Typography,
  Row,
  Col,
  Space,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_URL = "http://localhost:5000/api";

const GalleryForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchOptions();

    if (isEdit) {
      fetchGalleryDetail();
    } else {
      form.resetFields();
    }
  }, [id, isEdit]);

  const fetchOptions = async () => {
    try {
      const [serviceRes, categoryRes] = await Promise.all([
        axios.get(`${API_URL}/services`),
        axios.get(`${API_URL}/categories?type=GALLERY&is_active=true`)
      ]);

      const serviceData = Array.isArray(serviceRes.data)
        ? serviceRes.data
        : serviceRes.data.services || [];
      setServices(serviceData);
      
      setCategories(categoryRes.data.categories || []);
    } catch (err) {
      message.error("Không thể tải dữ liệu dịch vụ hoặc danh mục");
    }
  };

  const fetchGalleryDetail = async () => {
    setInitialLoading(true);

    try {
      const res = await axios.get(`${API_URL}/galleries/${id}`);
      const gallery = res.data.gallery;

      form.setFieldsValue({
        title: gallery.title,
        category: gallery.category,
        description: gallery.description,
        location: gallery.location,
        drive_folder_url: gallery.drive_folder_url,
        drive_folder_id: gallery.drive_folder_id,
        coverImage: gallery.coverImage,
        service_ids: gallery.service_ids?.map((s) => s._id) || [],
        is_active: gallery.is_active,
      });
    } catch (err) {
      message.error(err.response?.data?.message || "Không thể tải album");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const payload = {
        ...values,
        service_ids: values.service_ids || [],
      };

      if (isEdit) {
        await axios.put(`${API_URL}/galleries/admin/${id}`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Cập nhật album thành công");
      } else {
        await axios.post(`${API_URL}/galleries/admin`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Tạo album thành công");
      }

      navigate("/admin/galleries");
    } catch (err) {
      message.error(err.response?.data?.message || "Lưu album thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/galleries")}
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          {isEdit ? "Chỉnh sửa album" : "Tạo album mới"}
        </Title>
        <Text type="secondary">
          Tạo album bằng cách dán link folder Google Drive. Sau này chỉ cần thêm
          hoặc xóa ảnh trong folder Drive, album trên web sẽ tự cập nhật.
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
          <Row gutter={20}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên album"
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tên album" }]}
              >
                <Input placeholder="VD: Minh Anh & Hoài Nam" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  options={categories.map((c) => ({
                    value: c.slug,
                    label: c.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Link folder Google Drive"
                name="drive_folder_url"
                rules={[
                  {
                    required: !isEdit,
                    message: "Vui lòng dán link folder Google Drive",
                  },
                ]}
                extra={
                  isEdit
                    ? "Khi sửa album, có thể để trống nếu không muốn đổi folder Google Drive."
                    : "Dán link folder Google Drive chứa ảnh của album."
                }
              >
                <Input placeholder="https://drive.google.com/drive/folders/..." />
              </Form.Item>
            </Col>

            {isEdit && (
              <Col xs={24}>
                <Form.Item
                  label="Google Drive Folder ID"
                  name="drive_folder_id"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            )}

            <Col xs={24}>
              <Form.Item
                label="Ảnh bìa tùy chọn"
                name="coverImage"
                extra="Có thể bỏ trống. Nếu bỏ trống, hệ thống sẽ lấy ảnh đầu tiên trong folder Drive làm ảnh bìa."
              >
                <Input placeholder="Dán link ảnh bìa nếu muốn cố định ảnh bìa" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Địa điểm chụp" name="location">
                <Input placeholder="VD: Đà Lạt, TP.HCM, Studio..." />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Gói dịch vụ liên quan" name="service_ids">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Chọn các gói dịch vụ nếu có"
                  options={services.map((s) => ({
                    value: s._id,
                    label: s.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Mô tả album" name="description">
                <TextArea
                  rows={5}
                  placeholder="Mô tả phong cách, câu chuyện hoặc điểm nổi bật của album..."
                />
              </Form.Item>
            </Col>

            {isEdit && (
              <Col xs={24} md={12}>
                <Form.Item
                  label="Hiển thị trên website"
                  name="is_active"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Space>
            <Button onClick={() => navigate("/admin/galleries")}>Hủy</Button>

            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              {isEdit ? "Lưu thay đổi" : "Tạo album"}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default GalleryForm;
