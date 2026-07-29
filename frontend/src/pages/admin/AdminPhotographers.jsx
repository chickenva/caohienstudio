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
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

const API_URL = "http://localhost:5000/api";

// Trang admin quản lý danh sách nhiếp ảnh gia.
const AdminPhotographers = () => {
  const navigate = useNavigate();

  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchPhotographers();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchPhotographers = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/users/admin/photographers`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setPhotographers(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách nhiếp ảnh gia",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
    setActionLoadingId(record._id);

    try {
      await axios.patch(
        `${API_URL}/users/admin/photographers/${record._id}/toggle-active`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      message.success("Cập nhật trạng thái nhiếp ảnh gia thành công");
      fetchPhotographers();
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          "Không thể cập nhật trạng thái nhiếp ảnh gia",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmToggle = (record) => {
    Modal.confirm({
      title: record.is_active
        ? "Ẩn nhiếp ảnh gia này?"
        : "Hiển thị nhiếp ảnh gia này?",
      content: record.is_active
        ? "Nhiếp ảnh gia sẽ không còn hiển thị ngoài website và không nên được chọn trong booking mới."
        : "Nhiếp ảnh gia sẽ được hiển thị lại ngoài website.",
      okText: record.is_active ? "Ẩn" : "Hiện",
      cancelText: "Hủy",
      onOk: () => handleToggleActive(record),
    });
  };

  const columns = [
    {
      title: "ẢNH",
      dataIndex: "portfolio",
      key: "avatar",
      width: 110,
      render: (portfolio) => (
        <Image
          src={
            portfolio?.avatar ||
            "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=300&auto=format&fit=crop"
          }
          width={72}
          height={72}
          style={{ objectFit: "cover", borderRadius: "50%" }}
          preview={false}
        />
      ),
    },
    {
      title: "NHIẾP ẢNH GIA",
      key: "info",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>{record.full_name}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{record.email}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {record.phone || "Chưa có SĐT"}
          </div>
        </div>
      ),
    },
    {
      title: "CHUYÊN MÔN",
      dataIndex: "portfolio",
      key: "specialties",
      render: (portfolio) => {
        const specialties = portfolio?.specialties || [];

        if (specialties.length === 0) {
          return <span style={{ color: "#999" }}>Chưa cập nhật</span>;
        }

        return (
          <Space wrap>
            {specialties.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "KINH NGHIỆM",
      dataIndex: "portfolio",
      key: "years",
      width: 130,
      render: (portfolio) => (
        <Tag color="blue">{portfolio?.years_of_experience || 0} năm</Tag>
      ),
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
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() =>
              window.open(`/photographers/${record._id}`, "_blank")
            }
          >
            Xem
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/photographers/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Button
            icon={record.is_active ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            loading={actionLoadingId === record._id}
            onClick={() => confirmToggle(record)}
          >
            {record.is_active ? "Ẩn" : "Hiện"}
          </Button>
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
            Quản lý nhiếp ảnh gia
          </Title>
          <Text type="secondary">
            Quản lý đội ngũ thợ chụp của studio, portfolio và trạng thái hiển
            thị trên website.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchPhotographers}>
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/photographers/add")}
          >
            Thêm nhiếp ảnh gia
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={photographers}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default AdminPhotographers;
