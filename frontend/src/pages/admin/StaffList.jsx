import React, { useState, useEffect } from "react";
import { Table, Card, Button, Tag, Space, Avatar, message } from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(res.data);
    } catch (error) {
      message.error("Lỗi khi tải danh sách nhân sự");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Nhân sự",
      key: "info",
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} />
          <div>
            <div style={{ fontWeight: "bold" }}>{record.fullName}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    { title: "Chuyên môn", dataIndex: "specialization", key: "specialization" },
    { title: "Liên hệ", dataIndex: "phone", key: "phone" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Đang làm việc" ? "green" : "orange"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/staff/edit/${record._id}`)}
          >
            Sửa
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản Lý Đội Ngũ Nhân Sự">
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          style={{ background: "#141414" }}
          onClick={() => navigate("/admin/staff/add")}
        >
          Thêm Nhân Sự
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={staff}
        rowKey="_id"
        loading={loading}
      />
    </Card>
  );
};

export default StaffList;
