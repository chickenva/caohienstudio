import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Select,
  Button,
  Space,
  message,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API_URL = "http://localhost:5000/api";

const statusOptions = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "DEPOSITED", label: "Đã đặt cọc" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Quá hạn" },
  { value: "PAYMENT_FAILED", label: "Thanh toán thất bại" },
];

const statusConfig = {
  PENDING: { color: "gold", text: "Chờ thanh toán" },
  DEPOSITED: { color: "cyan", text: "Đã đặt cọc" },
  COMPLETED: { color: "green", text: "Hoàn thành" },
  CANCELED: { color: "red", text: "Đã hủy" },
  EXPIRED: { color: "default", text: "Quá hạn" },
  PAYMENT_FAILED: { color: "volcano", text: "Thanh toán thất bại" },
};

export default function Orders() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const getToken = () => localStorage.getItem("token");

  const fetchBookings = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/bookings/admin/all?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      setBookings(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    const config = statusConfig[status] || {
      color: "blue",
      text: status || "Không rõ",
    };

    return <Tag color={config.color}>{config.text.toUpperCase()}</Tag>;
  };

  const handleViewDetail = (record) => {
    setSelectedBooking(record);
    setDetailOpen(true);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    Modal.confirm({
      title: "Xác nhận cập nhật trạng thái",
      content: `Bạn có chắc muốn chuyển đơn này sang trạng thái ${newStatus}?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        setUpdatingId(bookingId);

        try {
          await axios.put(
            `${API_URL}/bookings/${bookingId}/status`,
            { status: newStatus },
            {
              headers: {
                Authorization: `Bearer ${getToken()}`,
              },
            },
          );

          message.success("Cập nhật trạng thái thành công");
          fetchBookings();

          if (selectedBooking?._id === bookingId) {
            setSelectedBooking((prev) => ({
              ...prev,
              status: newStatus,
            }));
          }
        } catch (err) {
          message.error(
            err.response?.data?.message || "Không thể cập nhật trạng thái",
          );
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "MÃ ĐƠN",
      dataIndex: "_id",
      key: "_id",
      width: 120,
      render: (id) => <Text code>#{id.slice(-6).toUpperCase()}</Text>,
    },
    {
      title: "KHÁCH HÀNG",
      dataIndex: "customer_id",
      key: "customer_id",
      render: (customer) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {customer?.full_name || "Khách hàng"}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {customer?.phone || customer?.email || "Không có thông tin"}
          </div>
        </div>
      ),
    },
    {
      title: "DỊCH VỤ",
      dataIndex: "service_id",
      key: "service_id",
      render: (service) => (
        <div>
          <div style={{ fontWeight: 600 }}>{service?.name || "Dịch vụ"}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {service?.duration_hours
              ? `${service.duration_hours} giờ`
              : "Chưa rõ thời lượng"}
          </div>
        </div>
      ),
    },
    {
      title: "THỢ CHỤP",
      dataIndex: "photographer_ids",
      key: "photographer_ids",
      render: (photographers) => {
        if (!photographers || photographers.length === 0) {
          return <span style={{ color: "#999" }}>Chưa có</span>;
        }

        return photographers.map((p) => (
          <div key={p._id} style={{ fontWeight: 500 }}>
            {p.full_name}
          </div>
        ));
      },
    },
    {
      title: "LỊCH CHỤP",
      key: "shoot_time",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {dayjs(record.start_time).format("DD/MM/YYYY")}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {dayjs(record.start_time).format("HH:mm")} -{" "}
            {dayjs(record.end_time).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "TỔNG TIỀN",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount) => (
        <strong>{amount?.toLocaleString("vi-VN") || 0}đ</strong>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: renderStatus,
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>

          {record.status === "DEPOSITED" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={updatingId === record._id}
              onClick={() => handleUpdateStatus(record._id, "COMPLETED")}
            >
              Hoàn thành
            </Button>
          )}

          {(record.status === "PENDING" || record.status === "DEPOSITED") && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              loading={updatingId === record._id}
              onClick={() => handleUpdateStatus(record._id, "CANCELED")}
            >
              Hủy
            </Button>
          )}
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
            Quản Lý Đơn Đặt Lịch
          </Title>
          <Text type="secondary">
            Theo dõi các đơn đặt lịch chụp, thanh toán và trạng thái xử lý.
          </Text>
        </div>

        <Space>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            style={{ width: 210 }}
          />

          <Button icon={<ReloadOutlined />} onClick={fetchBookings}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={bookings}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1200 }}
        bordered
      />

      <Modal
        title="Chi tiết đơn đặt lịch"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
          selectedBooking?.status === "DEPOSITED" && (
            <Button
              key="complete"
              type="primary"
              onClick={() =>
                handleUpdateStatus(selectedBooking._id, "COMPLETED")
              }
            >
              Đánh dấu hoàn thành
            </Button>
          ),
          (selectedBooking?.status === "PENDING" ||
            selectedBooking?.status === "DEPOSITED") && (
            <Button
              key="cancel"
              danger
              onClick={() =>
                handleUpdateStatus(selectedBooking._id, "CANCELED")
              }
            >
              Hủy đơn
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedBooking && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã đơn">
              #{selectedBooking._id.slice(-6).toUpperCase()}
            </Descriptions.Item>

            <Descriptions.Item label="Khách hàng">
              <div>
                <strong>
                  {selectedBooking.customer_id?.full_name || "Khách hàng"}
                </strong>
                <div>{selectedBooking.customer_id?.phone}</div>
                <div>{selectedBooking.customer_id?.email}</div>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Dịch vụ">
              {selectedBooking.service_id?.name}
            </Descriptions.Item>

            <Descriptions.Item label="Thợ chụp">
              {selectedBooking.photographer_ids?.length > 0
                ? selectedBooking.photographer_ids
                    .map((p) => p.full_name)
                    .join(", ")
                : "Chưa có"}
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian chụp">
              {dayjs(selectedBooking.start_time).format("HH:mm DD/MM/YYYY")} -{" "}
              {dayjs(selectedBooking.end_time).format("HH:mm DD/MM/YYYY")}
            </Descriptions.Item>

            <Descriptions.Item label="Địa điểm">
              {selectedBooking.location}
            </Descriptions.Item>

            <Descriptions.Item label="Ghi chú">
              {selectedBooking.note || "Không có"}
            </Descriptions.Item>

            <Descriptions.Item label="Tổng tiền">
              <strong>
                {selectedBooking.total_amount?.toLocaleString("vi-VN")}đ
              </strong>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              {renderStatus(selectedBooking.status)}
            </Descriptions.Item>

            {selectedBooking.expires_at && (
              <Descriptions.Item label="Hạn thanh toán">
                {dayjs(selectedBooking.expires_at).format("HH:mm DD/MM/YYYY")}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
