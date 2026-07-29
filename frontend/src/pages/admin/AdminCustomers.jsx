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
  Select,
  Input,
  Row,
  Col,
  Card,
} from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  CalendarOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API_URL = "http://localhost:5000/api";

const statusOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
];

// Trang admin quản lý danh sách khách hàng và khóa/mở tài khoản.
const AdminCustomers = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

      message.success("Cập nhật trạng thái tài khoản thành công");
      fetchCustomers();
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          "Không thể cập nhật trạng thái tài khoản",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmToggle = (record) => {
    Modal.confirm({
      title: record.is_active
        ? "Khóa tài khoản khách hàng này?"
        : "Mở khóa tài khoản khách hàng này?",
      content: record.is_active
        ? "Tài khoản này sẽ bị khóa, khách hàng sẽ không thể đăng nhập."
        : "Tài khoản này sẽ được mở khóa và hoạt động trở lại.",
      okText: record.is_active ? "Khóa tài khoản" : "Mở khóa",
      okButtonProps: { danger: record.is_active },
      cancelText: "Hủy",
      onOk: () => handleToggleActive(record),
    });
  };

  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.is_active).length;
  const lockedCount = totalCount - activeCount;

  const filteredCustomers = customers.filter((customer) => {
    const matchSearch =
      !searchText ||
      (customer.full_name &&
        customer.full_name.toLowerCase().includes(searchText.toLowerCase())) ||
      customer.email.toLowerCase().includes(searchText.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchText));
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && customer.is_active) ||
      (statusFilter === "LOCKED" && !customer.is_active);
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: "#262626", fontSize: "14px" }}>
            <UserOutlined style={{ marginRight: 8 }} />
            {record.full_name || "Khách hàng"}
          </div>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
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
      width: 160,
      render: (isActive) =>
        isActive ? (
          <Tag color="green" style={{ fontWeight: 600, borderRadius: 4 }}>
            ĐANG HOẠT ĐỘNG
          </Tag>
        ) : (
          <Tag color="red" style={{ fontWeight: 600, borderRadius: 4 }}>
            ĐÃ KHÓA
          </Tag>
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
            onClick={() => navigate(`/admin/orders?customerName=${encodeURIComponent(record.full_name || record.email || "")}`)}
          >
            Lịch đặt
          </Button>

          <Button
            danger={record.is_active}
            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
            loading={actionLoadingId === record._id}
            onClick={() => confirmToggle(record)}
          >
            {record.is_active ? "Khóa TK" : "Mở khóa"}
          </Button>
        </Space>
      ),
    },
  ];

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
          <Title level={3} style={{ marginBottom: 4, fontWeight: 700 }}>
            Quản lý khách hàng
          </Title>
          <Text type="secondary">
            Xem danh sách, tra cứu và khóa/mở khóa tài khoản khách hàng trên hệ thống.
          </Text>
        </div>

        <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(24,144,255,0.15)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                  Tổng khách hàng
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{totalCount}</div>
              </div>
              <TeamOutlined style={{ fontSize: 36, opacity: 0.8 }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(82,196,26,0.15)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                  Đang hoạt động
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{activeCount}</div>
              </div>
              <UserOutlined style={{ fontSize: 36, opacity: 0.8 }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(255,77,79,0.15)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                  Đã khóa
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{lockedCount}</div>
              </div>
              <LockOutlined style={{ fontSize: 36, opacity: 0.8 }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter panel */}
      <Card
        bordered={false}
        style={{ marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 8 }}
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Tìm kiếm khách hàng</span>
            <Input
              placeholder="Nhập tên, email hoặc số điện thoại..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Col>
          <Col xs={24} md={8}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Lọc theo trạng thái</span>
            <Select
              placeholder="Tất cả trạng thái"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              size="large"
              dropdownStyle={{ borderRadius: 6 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card
        bordered={false}
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 8 }}
        bodyStyle={{ padding: "0px" }}
      >
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="_id"
          loading={loading}
          bordered={false}
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 8,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total} khách hàng`,
          }}
          style={{ borderRadius: 8, overflow: "hidden" }}
        />
      </Card>

      {/* Detail Modal */}
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
                navigate(`/admin/orders?customerName=${encodeURIComponent(selectedCustomer.full_name || selectedCustomer.email || "")}`);
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
                <Tag color="red">ĐÃ KHÓA</Tag>
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

export default AdminCustomers;
