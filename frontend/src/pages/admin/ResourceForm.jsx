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

const typeOptions = [
  { value: "CAMERA", label: "Máy ảnh" },
  { value: "LENS", label: "Ống kính" },
  { value: "LIGHT", label: "Đèn" },
  { value: "STUDIO", label: "Studio" },
  { value: "ACCESSORY", label: "Phụ kiện" },
];

const usageOptions = [
  { value: "INTERNAL", label: "Nội bộ" },
  { value: "RENTAL", label: "Cho thuê" },
  { value: "BOTH", label: "Cả hai" },
];

const statusOptions = [
  { value: "AVAILABLE", label: "Sẵn sàng" },
  { value: "IN_USE", label: "Đang sử dụng" },
  { value: "MAINTENANCE", label: "Bảo trì" },
];

const ResourceForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    if (isEdit) {
      fetchResourceDetail();
    }
  }, [id]);

  const fetchResourceDetail = async () => {
    setInitialLoading(true);

    try {
      const res = await axios.get(`${API_URL}/resources/admin/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const resource = res.data;

      form.setFieldsValue({
        name: resource.name,
        type: resource.type,
        usage_type: resource.usage_type,
        rental_price_per_day: resource.rental_price_per_day,
        required_deposit_amount: resource.required_deposit_amount,
        thumbnail: resource.thumbnail,
        features_text: (resource.features || []).join("\n"),
        status: resource.status,
        is_active: resource.is_active,
      });

      setThumbnailPreview(resource.thumbnail || "");
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải thông tin tài nguyên",
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const features = values.features_text
        ? values.features_text
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const payload = {
        name: values.name,
        type: values.type,
        usage_type: values.usage_type,
        rental_price_per_day: Number(values.rental_price_per_day || 0),
        required_deposit_amount: Number(values.required_deposit_amount || 0),
        thumbnail: values.thumbnail || "",
        features,
        status: values.status,
        is_active: values.is_active,
      };

      if (isEdit) {
        await axios.put(`${API_URL}/resources/admin/${id}`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Cập nhật tài nguyên thành công");
      } else {
        await axios.post(`${API_URL}/resources/admin`, payload, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        message.success("Tạo tài nguyên thành công");
      }

      navigate("/admin/resources");
    } catch (err) {
      message.error(err.response?.data?.message || "Lưu tài nguyên thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e) => {
    setThumbnailPreview(e.target.value);
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/resources")}
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          {isEdit ? "Chỉnh sửa tài nguyên" : "Thêm tài nguyên mới"}
        </Title>
        <Text type="secondary">
          Quản lý thiết bị, tài nguyên nội bộ và các sản phẩm cho thuê của
          studio.
        </Text>
      </div>

      <Card loading={initialLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            usage_type: "RENTAL",
            status: "AVAILABLE",
            rental_price_per_day: 0,
            required_deposit_amount: 0,
            is_active: true,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={15}>
              <Form.Item
                label="Tên tài nguyên / thiết bị"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên tài nguyên",
                  },
                ]}
              >
                <Input placeholder="VD: Sony A7 IV, Canon RF 50mm f/1.2..." />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Loại"
                    name="type"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn loại tài nguyên",
                      },
                    ]}
                  >
                    <Select placeholder="Chọn loại" options={typeOptions} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Mục đích sử dụng"
                    name="usage_type"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn mục đích sử dụng",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn mục đích"
                      options={usageOptions}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Tình trạng"
                    name="status"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn tình trạng",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn tình trạng"
                      options={statusOptions}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Giá thuê mỗi ngày"
                    name="rental_price_per_day"
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="VD: 700000"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      addonAfter="VNĐ/ngày"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tiền cọc thiết bị"
                    name="required_deposit_amount"
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="VD: 5000000"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      addonAfter="VNĐ"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Ảnh thiết bị / Thumbnail" name="thumbnail">
                <Input
                  placeholder="Dán link ảnh thiết bị"
                  onChange={handleThumbnailChange}
                />
              </Form.Item>

              <Form.Item
                label="Thông số / tính năng nổi bật"
                name="features_text"
                extra="Mỗi dòng là một thông số hoặc tính năng nổi bật."
              >
                <TextArea
                  rows={6}
                  placeholder={`Full-frame 33MP\nQuay 4K 60fps\nChống rung 5 trục`}
                />
              </Form.Item>

              <Form.Item
                label="Hiển thị trên website"
                name="is_active"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={9}>
              <Card title="Xem trước ảnh thiết bị" bordered>
                {thumbnailPreview ? (
                  <Image
                    src={thumbnailPreview}
                    width="100%"
                    height={280}
                    style={{
                      objectFit: "cover",
                      borderRadius: 8,
                      background: "#f5f5f5",
                    }}
                    onError={() => {
                      message.warning("Link ảnh xem trước không hợp lệ");
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 280,
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
                    Dán link ảnh để xem trước thiết bị tại đây
                  </div>
                )}

                <div
                  style={{
                    marginTop: 16,
                    color: "#777",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  Thiết bị có <b>usage_type = RENTAL</b> hoặc <b>BOTH</b> và
                  đang active sẽ hiển thị ở trang thuê thiết bị.
                </div>
              </Card>
            </Col>
          </Row>

          <Space style={{ marginTop: 24 }}>
            <Button onClick={() => navigate("/admin/resources")}>Hủy</Button>

            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              {isEdit ? "Lưu thay đổi" : "Tạo tài nguyên"}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default ResourceForm;
