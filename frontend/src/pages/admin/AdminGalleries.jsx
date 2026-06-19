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

const categoryLabels = {
  WEDDING: "Ảnh cưới",
  PORTRAIT: "Chân dung",
  EVENT: "Sự kiện",
  GRADUATION: "Kỷ yếu",
};

const statusConfig = {
  true: { color: "green", text: "Đang hiển thị" },
  false: { color: "default", text: "Đã ẩn" },
};

const AdminGalleries = () => {
  const navigate = useNavigate();

  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchGalleries = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/galleries?category=ALL`);
      setGalleries(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách album",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
    setActionLoadingId(record._id);

    try {
      await axios.patch(
        `${API_URL}/galleries/admin/${record._id}/toggle-active`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      message.success("Cập nhật trạng thái album thành công");
      fetchGalleries();
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái album",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xóa album khỏi hệ thống?",
      content:
        "Thao tác này chỉ xóa thông tin album trong MongoDB, không xóa folder và ảnh trên Google Drive.",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        setActionLoadingId(record._id);

        try {
          await axios.delete(`${API_URL}/galleries/admin/${record._id}`, {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          });

          message.success("Xóa album thành công");
          fetchGalleries();
        } catch (err) {
          message.error(err.response?.data?.message || "Không thể xóa album");
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "ẢNH BÌA",
      dataIndex: "coverImage",
      key: "coverImage",
      width: 110,
      render: (coverImage) => (
        <Image
          src={
            coverImage ||
            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop"
          }
          width={76}
          height={56}
          style={{ objectFit: "cover", borderRadius: 6 }}
          preview={false}
        />
      ),
    },
    {
      title: "ALBUM",
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {record.location || "Chưa cập nhật địa điểm"}
          </div>
        </div>
      ),
    },
    {
      title: "DANH MỤC",
      dataIndex: "category",
      key: "category",
      width: 140,
      render: (category) => (
        <Tag color="blue">{categoryLabels[category] || category}</Tag>
      ),
    },
    {
      title: "THỢ CHỤP",
      dataIndex: "photographer_id",
      key: "photographer_id",
      width: 180,
      render: (photographer) =>
        photographer?.full_name || (
          <span style={{ color: "#999" }}>Cao Hiển Studio</span>
        ),
    },
    {
      title: "GÓI DỊCH VỤ",
      dataIndex: "service_id",
      key: "service_id",
      width: 180,
      render: (service) =>
        service?.name || <span style={{ color: "#999" }}>Chưa gắn</span>,
    },
    {
      title: "NỔI BẬT",
      dataIndex: "featured",
      key: "featured",
      width: 100,
      render: (featured) =>
        featured ? <Tag color="gold">NỔI BẬT</Tag> : <Tag>THƯỜNG</Tag>,
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "is_active",
      key: "is_active",
      width: 140,
      render: (isActive) => {
        const config = statusConfig[String(isActive)];

        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => window.open(`/galleries/${record._id}`, "_blank")}
          >
            Xem
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/galleries/edit/${record._id}`)}
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
            Quản lý thư viện ảnh
          </Title>
          <Text type="secondary">
            Quản lý thông tin album. Ảnh trong album được lấy trực tiếp từ
            folder Google Drive.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchGalleries}>
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/galleries/create")}
          >
            Tạo album
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={galleries}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default AdminGalleries;
