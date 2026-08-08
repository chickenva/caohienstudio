/**
 * ServiceForm.jsx
 * Form tạo/chỉnh sửa gói dịch vụ — tên, danh mục, giá bán, thumbnail và quyền lợi gói.
 */
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
  Upload,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined, DeleteOutlined, PictureOutlined, LinkOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FALLBACK_GALLERY_IMAGE, upgradeGoogleImageUrl } from "../../utils/imageUtils";

const { Title } = Typography;
const { TextArea } = Input;

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

// Form admin tạo/cập nhật gói dịch vụ.
const ServiceForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
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
      form.setFieldsValue({ thumbnail: uploadedUrl });
      setThumbnailPreview(uploadedUrl);
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
        name:        service.name,
        category:    service.category || "OTHER",
        features:    Array.isArray(service.features) ? service.features.join("\n") : "",
        base_price:  service.base_price,
        thumbnail:   service.thumbnail,
        is_active:   service.is_active,
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
        // Luôn lấy thumbnail từ state thumbnailPreview vì Form.Item thumbnail
        // là controlled bằng state, không phải form values để tránh mất giá trị
        thumbnail: thumbnailPreview ? upgradeGoogleImageUrl(thumbnailPreview, "s1800") || thumbnailPreview : "",
        features: values.features
          ? values.features.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
          : [],
        base_price: Number(values.base_price),
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
        <Title level={3} style={{ marginBottom: 0 }}>
          {isEdit ? "Chỉnh sửa gói dịch vụ" : "Thêm gói dịch vụ mới"}
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
              {/* 1. Tên gói */}
              <Form.Item
                label="Tên gói dịch vụ"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên gói dịch vụ" }]}
              >
                <Input placeholder="VD: Chụp ảnh cưới" />
              </Form.Item>

              {/* 2. Danh mục + Giá cùng hàng */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
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
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Giá dịch vụ"
                    name="base_price"
                    rules={[{ required: true, message: "Vui lòng nhập giá" }]}
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
              </Row>


              {/* 4. Thumbnail: controlled bằng state */}
              <Form.Item label="Ảnh đại diện / Thumbnail" name="thumbnail">
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Dán link ảnh bìa (Drive/Web) hoặc chọn Upload từ máy"
                    value={thumbnailPreview}
                    onChange={(e) => {
                      const val = e.target.value;
                      setThumbnailPreview(val);
                      form.setFieldsValue({ thumbnail: val });
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

              {/* 5. Quyền lợi */}
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
              <Card
                title={
                  <Space>
                    <PictureOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Xem trước ảnh đại diện</span>
                  </Space>
                }
                extra={
                  thumbnailPreview ? (
                    <Button
                      danger
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        form.setFieldsValue({ thumbnail: "" });
                        setThumbnailPreview("");
                        message.info("Đã gỡ ảnh đại diện");
                      }}
                    >
                      Gỡ ảnh
                    </Button>
                  ) : null
                }
                bordered
                style={{ height: "100%" }}
              >
                {thumbnailPreview ? (
                  <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #eee", backgroundColor: "#f5f5f5" }}>
                    <Image
                      src={upgradeGoogleImageUrl(thumbnailPreview, "s1200")}
                      alt="Xem trước ảnh đại diện"
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
                      (Nếu bỏ trống, không có ảnh đại diện hiển thị trên website)
                    </span>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Space style={{ marginTop: 20 }}>
            <Button onClick={() => navigate("/admin/services")}>Hủy</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}>
              {isEdit ? "Lưu thay đổi" : "Tạo dịch vụ"}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default ServiceForm;
