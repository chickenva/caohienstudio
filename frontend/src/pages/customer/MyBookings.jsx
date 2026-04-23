import React, { useState, useEffect } from "react";
import { Table, Tag, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", serif';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/bookings/my-bookings",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setBookings(res.data);
    } catch (err) {
      message.error("Không thể tải danh sách đơn đặt lịch");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "NGÀY CHỤP",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "DỊCH VỤ",
      dataIndex: "serviceName",
      key: "serviceName",
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color =
          status === "Completed"
            ? "green"
            : status === "Pending"
              ? "gold"
              : status === "Cancelled"
                ? "red"
                : "blue";
        let text =
          status === "Completed"
            ? "Hoàn thành"
            : status === "Pending"
              ? "Chờ xác nhận"
              : status === "Cancelled"
                ? "Đã hủy"
                : "Đã xác nhận";
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: "TỔNG TIỀN",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price.toLocaleString()}đ`,
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => navigate(`/my-bookings/${record._id}`)}
          style={{ borderRadius: 0 }}
        >
          CHI TIẾT
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
      <h1
        style={{
          fontFamily: FONT_SERIF,
          fontSize: "32px",
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        Danh sách đơn đặt lịch
      </h1>
      <Table
        columns={columns}
        dataSource={bookings}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        style={{ background: "#fff", border: "1px solid #eee" }}
      />
    </div>
  );
};

export default MyBookings;
