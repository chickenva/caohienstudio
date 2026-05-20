import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Modal,
  Image,
  Typography,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

const API_URL = "http://localhost:5000/api";

const typeLabels = {
  CAMERA: "Máy ảnh",
  LENS: "Ống kính",
  LIGHT: "Đèn",
  STUDIO: "Studio",
  ACCESSORY: "Phụ kiện",
};

const usageLabels = {
  INTERNAL: "Nội bộ",
  RENTAL: "Cho thuê",
  BOTH: "Cả hai",
};

const statusConfig = {
  AVAILABLE: { color: "green", text: "Sẵn sàng" },
  IN_USE: { color: "blue", text: "Đang sử dụng" },
  MAINTENANCE: { color: "orange", text: "Bảo trì" },
};

const Resources = () => {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [usageFilter, setUsageFilter] = useState("ALL");

  useEffect(() => {
    fetchResources();
  }, [typeFilter, statusFilter, usageFilter]);

  const getToken = () => localStorage.getItem("token");

  const fetchResources = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/resources/admin/all?type=${typeFilter}&status=${statusFilter}&usage_type=${usageFilter}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      setResources(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách tài nguyên",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
    setActionLoadingId(record._id);

    try {
      await axios.patch(
        `${API_URL}/resources/admin/${record._id}/toggle-active`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      message.success("Cập nhật trạng thái hiển thị thành công");
      fetchResources();
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          "Không thể cập nhật trạng thái tài nguyên",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Ẩn tài nguyên này?",
      content:
        "Thao tác này sẽ tạm ẩn tài nguyên khỏi website, không xóa dữ liệu khỏi hệ thống.",
      okText: "Ẩn tài nguyên",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        setActionLoadingId(record._id);

        try {
          await axios.delete(`${API_URL}/resources/admin/${record._id}`, {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          });

          message.success("Đã tạm ẩn tài nguyên");
          fetchResources();
        } catch (err) {
          message.error(
            err.response?.data?.message || "Không thể ẩn tài nguyên",
          );
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "ẢNH",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 110,
      render: (thumbnail) => (
        <Image
          src={
            thumbnail ||
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=300&auto=format&fit=crop"
          }
          width={78}
          height={58}
          style={{ objectFit: "cover", borderRadius: 6 }}
          preview={false}
        />
      ),
    },
    {
      title: "TÀI NGUYÊN",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>{record.name}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {(record.features || []).slice(0, 2).join(" • ") ||
              "Chưa có thông số nổi bật"}
          </div>
        </div>
      ),
    },
    {
      title: "LOẠI",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (type) => <Tag color="blue">{typeLabels[type] || type}</Tag>,
    },
    {
      title: "MỤC ĐÍCH",
      dataIndex: "usage_type",
      key: "usage_type",
      width: 130,
      render: (usageType) => (
        <Tag color="purple">{usageLabels[usageType] || usageType}</Tag>
      ),
    },
    {
      title: "GIÁ THUÊ/NGÀY",
      dataIndex: "rental_price_per_day",
      key: "rental_price_per_day",
      width: 150,
      align: "right",
      render: (price) => (
        <strong>{Number(price || 0).toLocaleString("vi-VN")}đ</strong>
      ),
    },
    {
      title: "TIỀN CỌC",
      dataIndex: "required_deposit_amount",
      key: "required_deposit_amount",
      width: 140,
      align: "right",
      render: (amount) => (
        <span>{Number(amount || 0).toLocaleString("vi-VN")}đ</span>
      ),
    },
    {
      title: "TÌNH TRẠNG",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };

        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "HIỂN THỊ",
      dataIndex: "is_active",
      key: "is_active",
      width: 130,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">ĐANG HIỆN</Tag>
        ) : (
          <Tag color="default">ĐÃ ẨN</Tag>
        ),
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      width: 290,
      render: (_, record) => (
        <Space>
          {(record.usage_type === "RENTAL" || record.usage_type === "BOTH") && (
            <Button
              icon={<EyeOutlined />}
              onClick={() => window.open(`/rentals/${record._id}`, "_blank")}
            >
              Xem
            </Button>
          )}

          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/resources/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Button
            icon={record.is_active ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            loading={actionLoadingId === record._id}
            onClick={() => handleToggleActive(record)}
          >
            {record.is_active ? "Ẩn" : "Hiện"}
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            loading={actionLoadingId === record._id}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

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
          <Title level={3} style={{ marginBottom: 4 }}>
            Quản lý tài nguyên / thiết bị
          </Title>
          <Text type="secondary">
            Quản lý máy ảnh, ống kính, đèn, studio và phụ kiện dùng nội bộ hoặc
            cho thuê.
          </Text>
        </div>

        <Space wrap>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            options={[
              { value: "ALL", label: "Tất cả loại" },
              { value: "CAMERA", label: "Máy ảnh" },
              { value: "LENS", label: "Ống kính" },
              { value: "LIGHT", label: "Đèn" },
              { value: "STUDIO", label: "Studio" },
              { value: "ACCESSORY", label: "Phụ kiện" },
            ]}
          />

          <Select
            value={usageFilter}
            onChange={setUsageFilter}
            style={{ width: 150 }}
            options={[
              { value: "ALL", label: "Tất cả mục đích" },
              { value: "INTERNAL", label: "Nội bộ" },
              { value: "RENTAL", label: "Cho thuê" },
              { value: "BOTH", label: "Cả hai" },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "AVAILABLE", label: "Sẵn sàng" },
              { value: "IN_USE", label: "Đang dùng" },
              { value: "MAINTENANCE", label: "Bảo trì" },
            ]}
          />

          <Button icon={<ReloadOutlined />} onClick={fetchResources}>
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/resources/add")}
          >
            Thêm tài nguyên
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={resources}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 1300 }}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default Resources;
