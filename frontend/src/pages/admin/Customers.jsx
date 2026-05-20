import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Modal,
  Typography,
  Descriptions,
} from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API_URL = "http://localhost:5000/api";

const Customers = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchCustomers = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/users/admin/customers`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setCustomers(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách khách hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const res = await axios.get(
        `${API_URL}/users/admin/customers/${record._id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      setSelectedCustomer(res.data.customer);
      setDetailOpen(true);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải chi tiết khách hàng",
      );
    }
  };

  const handleToggleActive = async (record) => {
    setActionLoadingId(record._id);

    try {
      await axios.patch(
        `${API_URL}/users/admin/customers/${record._id}/toggle-active`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      message.success("Cập nhật trạng thái khách hàng thành công");
      fetchCustomers();
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          "Không thể cập nhật trạng thái khách hàng",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmToggle = (record) => {
    Modal.confirm({
      title: record.is_active
        ? "Ẩn tài khoản khách hàng này?"
        : "Kích hoạt lại tài khoản khách hàng này?",
      content: record.is_active
        ? "Khách hàng này sẽ bị ẩn/tạm ngưng trên hệ thống."
        : "Khách hàng này sẽ được kích hoạt lại.",
      okText: record.is_active ? "Ẩn tài khoản" : "Kích hoạt",
      cancelText: "Hủy",
      onOk: () => handleToggleActive(record),
    });
  };

  const columns = [
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            {record.full_name || "Khách hàng"}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            {record.email}
          </div>
        </div>
      ),
    },
    {
      title: "SỐ ĐIỆN THOẠI",
      dataIndex: "phone",
      key: "phone",
      width: 160,
      render: (phone) =>
        phone || <span style={{ color: "#999" }}>Chưa có</span>,
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => (
        <div>
          <div>{dayjs(date).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {dayjs(date).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "is_active",
      key: "is_active",
      width: 140,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">ĐANG HOẠT ĐỘNG</Tag>
        ) : (
          <Tag color="default">ĐÃ ẨN</Tag>
        ),
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      width: 320,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>

          <Button
            icon={<CalendarOutlined />}
            onClick={() => navigate(`/admin/orders?customer=${record._id}`)}
          >
            Lịch đặt
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
            Quản lý khách hàng
          </Title>
          <Text type="secondary">
            Xem danh sách tài khoản khách hàng đã đăng ký trên hệ thống.
          </Text>
        </div>

        <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>
          Làm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 900 }}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title="Chi tiết khách hàng"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
          selectedCustomer && (
            <Button
              key="orders"
              type="primary"
              onClick={() => {
                setDetailOpen(false);
                navigate(`/admin/orders?customer=${selectedCustomer._id}`);
              }}
            >
              Xem lịch đặt
            </Button>
          ),
        ]}
        width={720}
      >
        {selectedCustomer && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Họ tên">
              {selectedCustomer.full_name || "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Email">
              {selectedCustomer.email}
            </Descriptions.Item>

            <Descriptions.Item label="Số điện thoại">
              {selectedCustomer.phone || "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Vai trò">
              <Tag color="blue">{selectedCustomer.role}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              {selectedCustomer.is_active ? (
                <Tag color="green">ĐANG HOẠT ĐỘNG</Tag>
              ) : (
                <Tag color="default">ĐÃ ẨN</Tag>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedCustomer.createdAt).format("HH:mm DD/MM/YYYY")}
            </Descriptions.Item>

            <Descriptions.Item label="Cập nhật gần nhất">
              {dayjs(selectedCustomer.updatedAt).format("HH:mm DD/MM/YYYY")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
