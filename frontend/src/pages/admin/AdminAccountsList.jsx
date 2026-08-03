/**
 * AdminAccountsList.jsx
 * Danh sách tài khoản hệ thống (ADMIN + PHOTOGRAPHER): xem, ẩn/kích hoạt tài khoản.
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
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

const roleOptions = [
  { value: "ALL", label: "Tất cả" },
  { value: "ADMIN", label: "Quản trị viên" },
];

const roleColors = {
  ADMIN: "blue",
};

const roleLabels = {
  ADMIN: "Quản trị viên",
};

// Trang admin quản lý danh sách tài khoản ADMIN và PHOTOGRAPHER.
const AdminAccountsList = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    let data = [...accounts];
    if (roleFilter !== "ALL") {
      data = data.filter((a) => a.role === roleFilter);
    }
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      data = data.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(keyword) ||
          a.email?.toLowerCase().includes(keyword) ||
          a.phone?.toLowerCase().includes(keyword),
      );
    }
    setFiltered(data);
  }, [accounts, roleFilter, searchText]);

  const getToken = () => localStorage.getItem("token");

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/admin/accounts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setAccounts(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách tài khoản",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
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
    Modal.confirm({
      title: record.is_active ? "Khóa tài khoản này?" : "Kích hoạt tài khoản?",
      content: record.is_active
        ? `Tài khoản "${record.full_name}" sẽ bị khóa và không thể đăng nhập.`
        : `Tài khoản "${record.full_name}" sẽ được kích hoạt lại.`,
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
              background: record.role === "ADMIN" ? "#1677ff22" : "#722ed122",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserOutlined
              style={{
                color: record.role === "ADMIN" ? "#1677ff" : "#722ed1",
                fontSize: 16,
              }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{record.full_name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{record.email}</div>
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
          {roleLabels[role] || role}
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
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      width: 140,
      render: (_, record) => (
        <Button
          icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
          loading={actionLoadingId === record._id}
          danger={record.is_active}
          onClick={() => confirmToggle(record)}
        >
          {record.is_active ? "Khóa" : "Kích hoạt"}
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
          <Title level={3} style={{ marginBottom: 4 }}>
            Danh sách tài khoản
          </Title>
          <Text type="secondary">
            Quản lý tài khoản quản trị viên của hệ thống.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAccounts}>
          </Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={14}>
          <Input
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={10}>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: "100%" }}
          >
            {roleOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 800 }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AdminAccountsList;
