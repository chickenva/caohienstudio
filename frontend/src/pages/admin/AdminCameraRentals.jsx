/**
 * AdminCameraRentals.jsx
 * Trang quản lý thiết bị cho thuê (máy ảnh, ống kính, phụ kiện) cho Admin.
 * CRUD: thêm, sửa, bật/tắt, xóa thiết bị.
 */
import React, { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, InputNumber, Select,
  Switch, Space, Tag, message, Typography, Popconfirm,
  Card, Image, Tooltip, Row, Col,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, EyeInvisibleOutlined, CameraOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;
const { TextArea } = Input;

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const CATEGORY_OPTIONS = [
  { value: "BODY", label: "Thân máy (Body)" },
  { value: "LENS", label: "Ống kính (Lens)" },
  { value: "ACCESSORY", label: "Phụ kiện" },
  { value: "KIT", label: "Bộ Kit" },
];

const CONDITION_OPTIONS = [
  { value: "NEW", label: "Mới 100%" },
  { value: "LIKE_NEW", label: "Như mới" },
  { value: "GOOD", label: "Tốt" },
];

const CONDITION_COLORS = {
  NEW: "green",
  LIKE_NEW: "blue",
  GOOD: "orange",
};

const AdminCameraRentals = ({ defaultOpenAdd = false }) => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const getToken = () => localStorage.getItem("token");
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  useEffect(() => {
    fetchCameras();
  }, []);

  useEffect(() => {
    if (defaultOpenAdd || location.pathname.endsWith("/create")) {
      openModal();
    }
  }, [defaultOpenAdd, location.pathname]);

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/camera-rentals/admin/all`, authHeaders());
      setCameras(res.data?.cameras || []);
    } catch (err) {
      message.error("Không thể tải danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (camera = null) => {
    setEditingCamera(camera);
    if (camera) {
      form.setFieldsValue({
        ...camera,
        specifications_text: (camera.specifications || []).join("\n"),
        images_text: (camera.images || []).join("\n"),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        category: "BODY",
        condition: "LIKE_NEW",
        is_available: true,
        is_active: true,
        rental_price_per_day: 0,
        deposit_amount: 0,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Chuyển specifications và images từ textarea thành mảng
      const specifications = (values.specifications_text || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const images = (values.images_text || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: values.name,
        brand: values.brand,
        category: values.category,
        description: values.description,
        specifications,
        rental_price_per_day: values.rental_price_per_day,
        deposit_amount: values.deposit_amount,
        images,
        thumbnail: values.thumbnail,
        condition: values.condition,
        is_available: values.is_available,
        is_active: values.is_active,
      };

      if (editingCamera) {
        await axios.put(`${API_URL}/camera-rentals/admin/${editingCamera._id}`, payload, authHeaders());
        message.success("Cập nhật thiết bị thành công");
      } else {
        await axios.post(`${API_URL}/camera-rentals/admin`, payload, authHeaders());
        message.success("Thêm thiết bị thành công");
      }

      setModalOpen(false);
      fetchCameras();
      if (location.pathname.endsWith("/create")) {
        navigate("/admin/camera-rentals", { replace: true });
      }
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || "Lỗi khi lưu thiết bị");
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await axios.patch(`${API_URL}/camera-rentals/admin/${id}/toggle`, {}, authHeaders());
      message.success("Đã thay đổi trạng thái thiết bị");
      fetchCameras();
    } catch (err) {
      message.error("Lỗi khi thay đổi trạng thái");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/camera-rentals/admin/${id}`, authHeaders());
      message.success("Xóa thiết bị thành công");
      fetchCameras();
    } catch (err) {
      message.error("Lỗi khi xóa thiết bị");
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 80,
      render: (url) =>
        url ? (
          <Image src={url} width={60} height={45} style={{ objectFit: "cover", borderRadius: 4 }} preview={{ mask: <EyeOutlined /> }} />
        ) : (
          <div style={{ width: 60, height: 45, background: "#f5f5f5", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>
            <CameraOutlined />
          </div>
        ),
    },
    {
      title: "Tên thiết bị",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {record.brand && (
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{record.brand}</div>
          )}
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (cat) => {
        const found = CATEGORY_OPTIONS.find((c) => c.value === cat);
        return <Tag>{found?.label || cat}</Tag>;
      },
    },
    {
      title: "Giá thuê/ngày",
      dataIndex: "rental_price_per_day",
      key: "rental_price_per_day",
      width: 140,
      align: "right",
      render: (price) => (
        <span style={{ fontWeight: 600, color: "#BFA16A" }}>
          {Number(price || 0).toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      title: "Tình trạng",
      dataIndex: "condition",
      key: "condition",
      width: 100,
      render: (cond) => (
        <Tag color={CONDITION_COLORS[cond] || "default"}>
          {CONDITION_OPTIONS.find((c) => c.value === cond)?.label || cond}
        </Tag>
      ),
    },
    {
      title: "Sẵn sàng",
      dataIndex: "is_available",
      key: "is_available",
      width: 100,
      align: "center",
      render: (available) =>
        available ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Có</Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="error">Đang thuê</Tag>
        ),
    },
    {
      title: "Hiển thị",
      dataIndex: "is_active",
      key: "is_active",
      width: 80,
      align: "center",
      render: (active) => (
        <Tag color={active ? "green" : "default"}>{active ? "Bật" : "Tắt"}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title={record.is_active ? "Tắt hiển thị" : "Bật hiển thị"}>
            <Button
              size="small"
              icon={record.is_active ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => handleToggle(record._id)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa thiết bị này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleModalClose = () => {
    setModalOpen(false);
    if (location.pathname.endsWith("/create")) {
      navigate("/admin/camera-rentals", { replace: true });
    }
  };

  const totalCount = cameras.length;
  const availableCount = cameras.filter((c) => c.is_available && c.is_active).length;
  const rentedOrHiddenCount = cameras.filter((c) => !c.is_available || !c.is_active).length;

  const filteredCameras = cameras.filter((item) => {
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchBrand = item.brand?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchDesc) return false;
    }
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
      return false;
    }
    if (statusFilter === "ACTIVE" && !item.is_active) return false;
    if (statusFilter === "HIDDEN" && item.is_active) return false;
    if (statusFilter === "AVAILABLE" && (!item.is_available || !item.is_active)) return false;
    if (statusFilter === "RENTED" && item.is_available) return false;

    return true;
  });

  return (
    <div>
      {/* Title block */}
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
          <Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
            Quản lý thuê máy ảnh
          </Title>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCameras} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
          >
            Thêm máy ảnh
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #BFA16A 0%, #9A8A78 100%)",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 14px rgba(191,161,106,0.25)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.9, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  Tổng số máy ảnh & thiết bị
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{totalCount}</div>
              </div>
              <CameraOutlined style={{ fontSize: 38, opacity: 0.85 }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 14px rgba(82,196,26,0.2)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.9, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  Thiết bị sẵn sàng cho thuê
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{availableCount}</div>
              </div>
              <CheckCircleOutlined style={{ fontSize: 38, opacity: 0.85 }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 14px rgba(250,140,22,0.2)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.9, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  Đang cho thuê / Ẩn
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{rentedOrHiddenCount}</div>
              </div>
              <ClockCircleOutlined style={{ fontSize: 38, opacity: 0.85 }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter panel */}
      <Card
        bordered={false}
        style={{ marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)", borderRadius: 12, border: "1px solid #efebe4" }}
        bodyStyle={{ padding: "18px 24px" }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Tìm kiếm thiết bị</span>
            <Input
              placeholder="Nhập tên máy ảnh, hãng sản xuất..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Loại thiết bị</span>
            <Select
              style={{ width: "100%" }}
              size="large"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "ALL", label: "Tất cả loại thiết bị" },
                ...CATEGORY_OPTIONS,
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Trạng thái</span>
            <Select
              style={{ width: "100%" }}
              size="large"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "AVAILABLE", label: "Sẵn sàng thuê" },
                { value: "RENTED", label: "Đang cho thuê" },
                { value: "ACTIVE", label: "Đang hiển thị" },
                { value: "HIDDEN", label: "Đã ẩn" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 12, border: "1px solid #efebe4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredCameras}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal Tạo/Sửa Thiết bị */}
      <Modal
        open={modalOpen}
        title={editingCamera ? "Sửa máy ảnh / thiết bị" : "Thêm máy ảnh mới"}
        onCancel={handleModalClose}
        onOk={handleSave}
        okText={editingCamera ? "Lưu" : "Thêm"}
        cancelText="Hủy"
        okButtonProps={{ style: { backgroundColor: "#BFA16A", borderColor: "#BFA16A" } }}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item
                label="Tên thiết bị"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="VD: Canon EOS R5, Sony 50mm f/1.2..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Hãng" name="brand">
                <Input placeholder="Canon, Sony..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item label="Phân loại" name="category">
                <Select options={CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Tình trạng" name="condition">
                <Select options={CONDITION_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Sẵn sàng cho thuê" name="is_available" valuePropName="checked">
                <Switch checkedChildren="Có" unCheckedChildren="Đang thuê" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Giá thuê / ngày (VND)"
                name="rental_price_per_day"
                rules={[{ required: true, message: "Vui lòng nhập giá thuê" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Tiền cọc yêu cầu (VND)" name="deposit_amount">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="URL ảnh thumbnail" name="thumbnail">
            <Input placeholder="Link ảnh đại diện thiết bị" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} placeholder="Mô tả chi tiết về thiết bị..." />
          </Form.Item>

          <Form.Item label="Thông số kỹ thuật (mỗi dòng 1 thông số)" name="specifications_text">
            <TextArea rows={4} placeholder={"45MP Full-frame CMOS\n8K RAW Video\nDual Pixel CMOS AF II\n..."} />
          </Form.Item>

          <Form.Item label="Danh sách ảnh bổ sung (mỗi dòng 1 URL)" name="images_text">
            <TextArea rows={3} placeholder={"https://link-anh-1.jpg\nhttps://link-anh-2.jpg"} />
          </Form.Item>

          <Form.Item label="Hiển thị trên website" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCameraRentals;
