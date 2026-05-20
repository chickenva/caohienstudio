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
  const [photographers, setPhotographers] = useState([]);
  const [services, setServices] = useState([]);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchOptions();

    if (isEdit) {
      fetchGalleryDetail();
    }
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [photographerRes, serviceRes] = await Promise.all([
        axios.get(`${API_URL}/users/photographers`),
        axios.get(`${API_URL}/services`),
      ]);

      setPhotographers(photographerRes.data.photographers || []);

      const serviceData = Array.isArray(serviceRes.data)
        ? serviceRes.data
        : serviceRes.data.services || [];

      setServices(serviceData);
    } catch (err) {
      message.error("Không thể tải dữ liệu thợ chụp/dịch vụ");
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
        photographer_id: gallery.photographer_id?._id,
        service_id: gallery.service_id?._id,
        featured: gallery.featured,
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
        photographer_id: values.photographer_id || null,
        service_id: values.service_id || null,
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
            featured: false,
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
                  options={[
                    { value: "WEDDING", label: "Ảnh cưới" },
                    { value: "PORTRAIT", label: "Chân dung" },
                    { value: "EVENT", label: "Sự kiện" },
                    { value: "GRADUATION", label: "Kỷ yếu" },
                  ]}
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

            <Col xs={24} md={12}>
              <Form.Item label="Nhiếp ảnh gia" name="photographer_id">
                <Select
                  allowClear
                  placeholder="Chọn thợ chụp nếu có"
                  options={photographers.map((p) => ({
                    value: p._id,
                    label: p.full_name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Gói dịch vụ liên quan" name="service_id">
                <Select
                  allowClear
                  placeholder="Chọn gói dịch vụ nếu có"
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

            <Col xs={24} md={12}>
              <Form.Item
                label="Album nổi bật"
                name="featured"
                valuePropName="checked"
              >
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Hiển thị trên website"
                name="is_active"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
              </Form.Item>
            </Col>
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
