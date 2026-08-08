/**
 * GalleryForm.jsx
 * Form tạo/chỉnh sửa album gallery — nhập link Drive, danh mục, ảnh bìa kèm xem trước ảnh bìa giống ServiceForm.jsx.
 */
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
  Upload,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
  DeleteOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FALLBACK_GALLERY_IMAGE, upgradeGoogleImageUrl } from "../../utils/imageUtils";

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

// Form admin tạo/cập nhật album từ Google Drive.
const GalleryForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const getToken = () => localStorage.getItem("token");

  const handleCustomUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = res.data.url;
      form.setFieldsValue({ coverImage: uploadedUrl });
      setCoverImagePreview(uploadedUrl);
      message.success("Tải ảnh từ máy lên thành công!");
      onSuccess(res.data, file);
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi tải ảnh lên server!");
      onError(err);
    } finally {
      setUploading(false);
    }
  };



  useEffect(() => {
    fetchOptions();

    if (isEdit) {
      fetchGalleryDetail();
    } else {
      form.resetFields();
      setCoverImagePreview("");
      setInitialLoading(false);
    }
  }, [id, isEdit]);

  const fetchOptions = async () => {
    try {
      const [serviceRes, categoryRes] = await Promise.all([
        axios.get(`${API_URL}/services`),
        axios.get(`${API_URL}/categories?type=GALLERY&is_active=true`),
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

      setCoverImagePreview(gallery.coverImage || "");
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
        // Luôn lấy coverImage từ state coverImagePreview
        // (controlled input) để tránh mất giá trị khi form re-render
        coverImage: coverImagePreview ? upgradeGoogleImageUrl(coverImagePreview, "s1800") || coverImagePreview : "",
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
        <Title level={3} style={{ marginBottom: 0 }}>
          {isEdit ? "Chỉnh sửa album" : "Tạo album mới"}
        </Title>
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
              <Row gutter={16}>
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
              </Row>

              <Form.Item
                label="Link folder album Google Drive"
                name="drive_folder_url"
                rules={[
                  {
                    required: !isEdit,
                    message: "Vui lòng dán link folder album Google Drive",
                  },
                ]}
              >
                <Input placeholder="https://drive.google.com/drive/folders/..." />
              </Form.Item>

              {isEdit && (
                <Form.Item
                  label="Google Drive Folder ID"
                  name="drive_folder_id"
                >
                  <Input disabled />
                </Form.Item>
              )}

              {/* coverImage: controlled bằng state coverImagePreview, sync vào form khi thay đổi */}
              <Form.Item
                label="Ảnh đại diện / Thumbnail"
                name="coverImage"
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Dán link ảnh bìa (Drive/Web) hoặc chọn Upload từ máy"
                    value={coverImagePreview}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCoverImagePreview(val);
                      form.setFieldsValue({ coverImage: val });
                    }}
                  />
                  <Upload
                    customRequest={handleCustomUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploading}
                      style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A", color: "#fff" }}
                    >
                      Tải ảnh từ máy
                    </Button>
                  </Upload>
                </Space.Compact>
              </Form.Item>

              <Form.Item label="Địa điểm chụp" name="location">
                <Input placeholder="VD: Đà Lạt, TP.HCM, Studio..." />
              </Form.Item>

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

              <Form.Item label="Mô tả album" name="description">
                <TextArea
                  rows={4}
                  placeholder="Mô tả về album, phong cách, kỷ niệm..."
                />
              </Form.Item>

              {isEdit && (
                <Form.Item
                  label="Hiển thị trên website"
                  name="is_active"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                </Form.Item>
              )}
            </Col>

            <Col xs={24} lg={9}>
              <Card
                title={
                  <Space>
                    <PictureOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Xem trước ảnh bìa</span>
                  </Space>
                }
                extra={
                  coverImagePreview ? (
                    <Button
                      danger
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        form.setFieldsValue({ coverImage: "" });
                        setCoverImagePreview("");
                        message.info("Đã gỡ ảnh bìa");
                      }}
                    >
                      Gỡ ảnh
                    </Button>
                  ) : null
                }
                bordered
                style={{ height: "100%" }}
              >
                {coverImagePreview ? (
                  <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #eee", backgroundColor: "#f5f5f5" }}>
                    <Image
                      src={upgradeGoogleImageUrl(coverImagePreview, "s1200")}
                      alt="Xem trước ảnh bìa"
                      width="100%"
                      height={240}
                      style={{ objectFit: "cover", display: "block" }}
                      fallback={FALLBACK_GALLERY_IMAGE}
                      onError={() => {
                        message.warning("Link ảnh xem trước không hợp lệ");
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: 240,
                      borderRadius: 8,
                      background: "#fafafa",
                      border: "1px dashed #d9d9d9",
                      color: "#8c8c8c",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: 20,
                    }}
                  >
                    <PictureOutlined style={{ fontSize: 32, color: "#ccc", marginBottom: 10 }} />
                    <span>Dán link ảnh bìa hoặc chọn 'Tải ảnh từ máy' để xem trước tại đây</span>
                    <span style={{ fontSize: 12, color: "#b0b0b0", marginTop: 8 }}>
                      (Nếu bỏ trống, hệ thống sẽ tự động lấy ảnh đầu tiên từ Google Drive)
                    </span>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Space style={{ marginTop: 20 }}>
            <Button onClick={() => navigate("/admin/galleries")}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
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
