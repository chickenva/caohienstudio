import React from "react";
import { Card, Button, Table } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const PRIMARY_COLOR = "#9a8a78";

const AdminPlaceholder = ({ title, description = "Chức năng đang phát triển" }) => {
  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Tên", dataIndex: "name", key: "name" },
    { title: "Trạng Thái", dataIndex: "status", key: "status" },
    {
      title: "Hành Động",
      key: "actions",
      render: () => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </div>
      ),
    },
  ];

  const data = [
    { id: 1, name: "Item 1", status: "Hoạt Động" },
    { id: 2, name: "Item 2", status: "Hoạt Động" },
  ];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", margin: 0 }}>{title}</h1>
        <Button
          icon={<PlusOutlined />}
          style={{
            background: PRIMARY_COLOR,
            color: "#fff",
            borderRadius: "4px",
            border: "none",
            fontSize: "12px",
          }}
        >
          Thêm Mới
        </Button>
      </div>

      <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} rowKey="id" />
      </Card>
    </div>
  );
};

export default AdminPlaceholder;
