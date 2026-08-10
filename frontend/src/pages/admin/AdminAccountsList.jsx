/**
 * AdminAccountsList.jsx
 * Danh sách tài khoản hệ thống (ADMIN): xem, khóa/kích hoạt tài khoản.
 */
import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Modal,
  Typography,
  Input,
  Select,
  Row,
  Col,
  Card,
} from "antd";
import {
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  SearchOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title } = Typography;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

const statusOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
];

const roleColors = {
  ADMIN: "blue",
};

const roleLabels = {
  ADMIN: "Quản trị viên",
};

const AdminAccountsList = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    let data = Array.isArray(accounts) ? [...accounts] : [];
    if (statusFilter === "ACTIVE") {
      data = data.filter((a) => a && a.is_active === true);
    } else if (statusFilter === "LOCKED") {
      data = data.filter((a) => a && a.is_active === false);
    }
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      data = data.filter(
        (a) =>
          a &&
          (a.full_name?.toLowerCase().includes(keyword) ||
            a.email?.toLowerCase().includes(keyword) ||
            a.phone?.toLowerCase().includes(keyword)),
      );
    }
    setFiltered(data);
  }, [accounts, statusFilter, searchText]);

  const getToken = () => localStorage.getItem("token");

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/admin/accounts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.accounts || []);
      setAccounts(data);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách tài khoản",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
    if (!record?._id) return;
    setActionLoadingId(record._id);
    try {
      await axios.patch(
        `${API_URL}/users/admin/accounts/${record._id}/toggle-active`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      message.success(
        record.is_active
          ? "Đã khóa tài khoản thành công"
          : "Đã kích hoạt tài khoản thành công",
      );
      fetchAccounts();
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmToggle = (record) => {
    if (!record) return;
    Modal.confirm({
      title: record.is_active ? "Khóa tài khoản này?" : "Kích hoạt tài khoản?",
      content: record.is_active
        ? `Tài khoản "${record.full_name || record.email}" sẽ bị khóa và không thể đăng nhập.`
        : `Tài khoản "${record.full_name || record.email}" sẽ được kích hoạt lại.`,
      okText: record.is_active ? "Khóa" : "Kích hoạt",
      okType: record.is_active ? "danger" : "primary",
      cancelText: "Hủy",
      onOk: () => handleToggleActive(record),
    });
  };

  const columns = [
    {
      title: "HỌ TÊN",
      key: "info",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: record?.role === "ADMIN" ? "#1677ff22" : "#722ed122",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserOutlined
              style={{
                color: record?.role === "ADMIN" ? "#1677ff" : "#722ed1",
                fontSize: 16,
              }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{record?.full_name || "Tài khoản"}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{record?.email || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone) => phone || <span style={{ color: "#bbb" }}>—</span>,
    },
    {
      title: "VAI TRÒ",
      dataIndex: "role",
      key: "role",
      width: 160,
      render: (role) => (
        <Tag color={roleColors[role] || "default"}>
          {roleLabels[role] || role || "N/A"}
        </Tag>
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
          <Tag color="red">ĐÃ KHÓA</Tag>
        ),
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—",
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      width: 140,
      render: (_, record) => (
        <Button
          icon={record?.is_active ? <LockOutlined /> : <UnlockOutlined />}
          loading={actionLoadingId === record?._id}
          danger={record?.is_active}
          onClick={() => confirmToggle(record)}
        >
          {record?.is_active ? "Khóa" : "Kích hoạt"}
        </Button>
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
          <Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
            Danh sách tài khoản Quản trị viên
          </Title>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAccounts} loading={loading} />
        </Space>
      </div>

      <Card
        bordered={false}
        style={{
          marginBottom: 20,
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          borderRadius: 12,
          border: "1px solid #efebe4",
        }}
        bodyStyle={{ padding: "18px 24px" }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={14}>
            <span
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
                color: "#595959",
              }}
            >
              Tìm kiếm tài khoản
            </span>
            <Input
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={10}>
            <span
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
                color: "#595959",
              }}
            >
              Lọc theo trạng thái
            </span>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              style={{ width: "100%" }}
              size="large"
              dropdownStyle={{ borderRadius: 8 }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        bordered={false}
        style={{
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          borderRadius: 12,
          border: "1px solid #efebe4",
          overflow: "hidden",
        }}
        bodyStyle={{ padding: "0px" }}
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          bordered={false}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10 }}
          style={{ borderRadius: 12 }}
        />
      </Card>
    </div>
  );
};

export default AdminAccountsList;
