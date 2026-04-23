import React, { useState, useEffect } from "react";
import { Table, Card, Button, Tag, Space, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ResourceList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResources(res.data);
    } catch (error) {
      message.error("Không thể tải danh sách tài nguyên");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên thiết bị",
      dataIndex: "name",
      key: "name",
      fontWeight: "bold",
    },
    { title: "Phân loại", dataIndex: "category", key: "category" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "Tình trạng",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color =
          status === "Tốt" || status === "Mới 100%" ? "green" : "volcano";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    { title: "Ghi chú", dataIndex: "notes", key: "notes" },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {/* Nút sửa sẽ dẫn đến route có kèm ID của món đồ */}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/resources/edit/${record._id}`)}
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
    <Card title="Kho Tài Nguyên & Thiết Bị" style={{ borderRadius: "8px" }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: "#141414" }}
          onClick={() => navigate("/admin/resources/add")}
        >
          Thêm Mới
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={resources}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
};

export default ResourceList;
