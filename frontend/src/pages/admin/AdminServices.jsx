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

const AdminServices = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchServices = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/services/admin/all`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setServices(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách dịch vụ",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
    setActionLoadingId(record._id);

    try {
      await axios.patch(
        `${API_URL}/services/admin/${record._id}/toggle-active`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      message.success("Cập nhật trạng thái dịch vụ thành công");
      fetchServices();
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái dịch vụ",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Ẩn gói dịch vụ này?",
      content:
        "Thao tác này sẽ tạm ẩn dịch vụ khỏi website khách hàng, không xóa dữ liệu khỏi hệ thống.",
      okText: "Ẩn dịch vụ",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        setActionLoadingId(record._id);

        try {
          await axios.delete(`${API_URL}/services/admin/${record._id}`, {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          });

          message.success("Đã tạm ẩn dịch vụ");
          fetchServices();
        } catch (err) {
          message.error(err.response?.data?.message || "Không thể ẩn dịch vụ");
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
            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop"
          }
          width={78}
          height={58}
          style={{ objectFit: "cover", borderRadius: 6 }}
          preview={false}
        />
      ),
    },
    {
      title: "GÓI DỊCH VỤ",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>{record.name}</div>
          <div
            style={{
              fontSize: 12,
              color: "#888",
              maxWidth: 420,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {record.description || "Chưa có mô tả"}
          </div>
        </div>
      ),
    },
    {
      title: "GIÁ",
      dataIndex: "base_price",
      key: "base_price",
      width: 160,
      align: "right",
      render: (price) => (
        <strong>{Number(price || 0).toLocaleString("vi-VN")}đ</strong>
      ),
    },
    {
      title: "THỜI LƯỢNG",
      dataIndex: "duration_hours",
      key: "duration_hours",
      width: 130,
      render: (hours) => <Tag color="blue">{hours} giờ</Tag>,
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "is_active",
      key: "is_active",
      width: 140,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">ĐANG HIỂN THỊ</Tag>
        ) : (
          <Tag color="default">ĐÃ ẨN</Tag>
        ),
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      width: 300,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => window.open(`/services/${record._id}`, "_blank")}
          >
            Xem
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/services/edit/${record._id}`)}
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
            Quản lý gói dịch vụ
          </Title>
          <Text type="secondary">
            Thêm, chỉnh sửa, ẩn/hiện các gói dịch vụ chụp ảnh trên website.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchServices}>
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/services/add")}
          >
            Thêm dịch vụ
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={services}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default AdminServices;
