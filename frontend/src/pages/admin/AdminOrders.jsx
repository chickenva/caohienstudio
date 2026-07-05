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
  Alert,
  Divider,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleFilled,
  CheckSquareOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const API_URL = "http://localhost:5000/api";

const statusOptions = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "DEPOSITED", label: "Đã đặt cọc" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELED", label: "Đã hủy" },
];

const statusConfig = {
  PENDING: { color: "gold", text: "Chờ thanh toán" },
  DEPOSITED: { color: "cyan", text: "Đã đặt cọc" },
  CONFIRMED: { color: "blue", text: "Đã xác nhận" },
  IN_PROGRESS: { color: "geekblue", text: "Đang thực hiện" },
  COMPLETED: { color: "green", text: "Hoàn thành" },
  CANCELED: { color: "red", text: "Đã hủy" },
};

export default function AdminOrders() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // State cho modal xác nhận hủy
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // { id, record }

  // State cho modal xác nhận hoàn thành
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);

  // State cho modal xác nhận đơn (DEPOSITED -> CONFIRMED)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  // State cho modal đang chụp (CONFIRMED -> IN_PROGRESS)
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState(null);

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
          headers: { Authorization: `Bearer ${getToken()}` },
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

  // Mở modal xác nhận hủy
  const openCancelModal = (record) => {
    setCancelTarget(record);
    setCancelModalOpen(true);
  };

  // Mở modal xác nhận hoàn thành
  const openCompleteModal = (record) => {
    setCompleteTarget(record);
    setCompleteModalOpen(true);
  };

  // Mở modal xác nhận đơn
  const openConfirmModal = (record) => {
    setConfirmTarget(record);
    setConfirmModalOpen(true);
  };

  // Mở modal đang chụp
  const openProgressModal = (record) => {
    setProgressTarget(record);
    setProgressModalOpen(true);
  };

  const executeUpdateStatus = async (bookingId, newStatus, onSuccess) => {
    setUpdatingId(bookingId);

    try {
      await axios.put(
        `${API_URL}/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      message.success("Cập nhật trạng thái thành công");
      fetchBookings();

      // Cập nhật luôn trong modal detail nếu đang mở
      if (selectedBooking?._id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    await executeUpdateStatus(cancelTarget._id, "CANCELED", () => {
      setCancelModalOpen(false);
      setCancelTarget(null);
      // Đóng modal detail nếu đơn đó đang được xem
      if (detailOpen && selectedBooking?._id === cancelTarget._id) {
        setDetailOpen(false);
      }
    });
  };

  const handleConfirmComplete = async () => {
    if (!completeTarget) return;

    await executeUpdateStatus(completeTarget._id, "COMPLETED", () => {
      setCompleteModalOpen(false);
      setCompleteTarget(null);
    });
  };

  const handleConfirmBooking = async () => {
    if (!confirmTarget) return;

    await executeUpdateStatus(confirmTarget._id, "CONFIRMED", () => {
      setConfirmModalOpen(false);
      setConfirmTarget(null);
    });
  };

  const handleStartProgress = async () => {
    if (!progressTarget) return;

    await executeUpdateStatus(progressTarget._id, "IN_PROGRESS", () => {
      setProgressModalOpen(false);
      setProgressTarget(null);
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
      key: "services",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.service_id?.name || "Dịch vụ"}</div>
          {record.extra_service_ids && record.extra_service_ids.length > 0 && (
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              + {record.extra_service_ids.map(s => s.name).join(", ")}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            {record.service_id?.duration_hours
              ? `${record.service_id.duration_hours} giờ`
              : "Chưa rõ thời lượng"}
          </div>
        </div>
      ),
    },
    {
      title: "THỢ CHỤP",
      dataIndex: "assigned_staff_ids",
      key: "assigned_staff_ids",
      render: (staff) => {
        if (!staff || staff.length === 0) {
          return <span style={{ color: "#999" }}>Chưa phân công</span>;
        }

        return staff.map((p) => (
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
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
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

      {/* Bảng danh sách */}
      <Table
        columns={columns}
        dataSource={bookings}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1200 }}
        bordered
      />

      {/* ===== MODAL XEM CHI TIẾT ===== */}
      <Modal
        title={
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            Chi tiết đơn đặt lịch
            {selectedBooking && (
              <Text
                code
                style={{ marginLeft: 8, fontSize: 13, fontWeight: 400 }}
              >
                #{selectedBooking._id.slice(-6).toUpperCase()}
              </Text>
            )}
          </span>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
          selectedBooking?.status === "DEPOSITED" && (
            <Button
              key="confirm"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setDetailOpen(false);
                openConfirmModal(selectedBooking);
              }}
              style={{ background: "#1677ff", borderColor: "#1677ff" }}
            >
              Xác nhận đơn
            </Button>
          ),
          selectedBooking?.status === "CONFIRMED" && (
            <Button
              key="progress"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setDetailOpen(false);
                openProgressModal(selectedBooking);
              }}
              style={{ background: "#2f54eb", borderColor: "#2f54eb" }}
            >
              Đánh dấu đang chụp
            </Button>
          ),
          selectedBooking?.status === "IN_PROGRESS" && (
            <Button
              key="complete"
              type="primary"
              icon={<CheckSquareOutlined />}
              onClick={() => {
                setDetailOpen(false);
                openCompleteModal(selectedBooking);
              }}
            >
              Đánh dấu hoàn thành
            </Button>
          ),
          (selectedBooking?.status === "PENDING" ||
            selectedBooking?.status === "DEPOSITED" ||
            selectedBooking?.status === "CONFIRMED") && (
            <Button
              key="cancel"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setDetailOpen(false);
                openCancelModal(selectedBooking);
              }}
            >
              Hủy đơn
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedBooking && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã đơn">
              #{selectedBooking._id.slice(-6).toUpperCase()}
            </Descriptions.Item>

            <Descriptions.Item label="Khách hàng">
              <div>
                <strong>
                  {selectedBooking.customer_id?.full_name || "Khách hàng"}
                </strong>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {selectedBooking.customer_id?.phone}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {selectedBooking.customer_id?.email}
                </div>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Gói chính">
              {selectedBooking.service_id?.name}
            </Descriptions.Item>

            <Descriptions.Item label="Gói đi kèm">
              {selectedBooking.extra_service_ids?.length > 0
                ? selectedBooking.extra_service_ids
                  .map((s) => s.name)
                  .join(", ")
                : "Không có"}
            </Descriptions.Item>

            <Descriptions.Item label="Nhân sự phân công">
              {selectedBooking.assigned_staff_ids?.length > 0
                ? selectedBooking.assigned_staff_ids
                  .map((p) => p.full_name)
                  .join(", ")
                : "Chưa phân công"}
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
              <strong style={{ fontSize: 15 }}>
                {selectedBooking.total_amount?.toLocaleString("vi-VN")}đ
              </strong>
            </Descriptions.Item>

            <Descriptions.Item label="Đã thanh toán">
              <strong
                style={{
                  color:
                    Number(selectedBooking.paid_amount) > 0
                      ? "#389e0d"
                      : "#000",
                  fontSize: 15,
                }}
              >
                {selectedBooking.paid_amount?.toLocaleString("vi-VN") || 0}đ
              </strong>
            </Descriptions.Item>

            <Descriptions.Item label="Còn lại">
              <strong
                style={{
                  color:
                    Number(selectedBooking.remaining_amount) > 0
                      ? "#cf1322"
                      : "#000",
                  fontSize: 15,
                }}
              >
                {selectedBooking.remaining_amount?.toLocaleString("vi-VN") ||
                  0}đ
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

      {/* ===== MODAL XÁC NHẬN HỦY ĐƠN ===== */}
      <Modal
        open={cancelModalOpen}
        onCancel={() => {
          if (!updatingId) {
            setCancelModalOpen(false);
            setCancelTarget(null);
          }
        }}
        footer={null}
        centered
        width={440}
        closable={!updatingId}
        maskClosable={!updatingId}
      >
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <ExclamationCircleFilled
            style={{ fontSize: 56, color: "#ff4d4f", marginBottom: 16 }}
          />

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 10,
            }}
          >
            Xác nhận hủy đơn đặt lịch?
          </div>

          <Paragraph style={{ color: "#595959", fontSize: 14, marginBottom: 6 }}>
            Bạn đang hủy đơn của khách hàng:
          </Paragraph>

          <div
            style={{
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Khách hàng: </Text>
              <Text strong>
                {cancelTarget?.customer_id?.full_name || "Khách hàng"}
              </Text>
            </div>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Dịch vụ: </Text>
              <Text strong>{cancelTarget?.service_id?.name || "Dịch vụ"}</Text>
            </div>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Ngày chụp: </Text>
              <Text strong>
                {cancelTarget?.start_time
                  ? dayjs(cancelTarget.start_time).format("DD/MM/YYYY")
                  : "—"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Mã đơn: </Text>
              <Text code>
                #{cancelTarget?._id?.slice(-8).toUpperCase()}
              </Text>
            </div>
          </div>

          <Alert
            type="warning"
            showIcon
            message="Lưu ý: Hành động này không thể hoàn tác sau khi xác nhận."
            style={{ marginBottom: 24, textAlign: "left" }}
          />

          <Space style={{ width: "100%", justifyContent: "center" }}>
            <Button
              size="large"
              onClick={() => {
                setCancelModalOpen(false);
                setCancelTarget(null);
              }}
              disabled={!!updatingId}
              style={{ minWidth: 130 }}
            >
              Không, giữ đơn
            </Button>
            <Button
              danger
              type="primary"
              size="large"
              icon={<CloseCircleOutlined />}
              loading={!!updatingId}
              onClick={handleConfirmCancel}
              style={{ minWidth: 140 }}
            >
              Xác nhận hủy
            </Button>
          </Space>
        </div>
      </Modal>

      {/* ===== MODAL XÁC NHẬN ĐƠN ===== */}
      <Modal
        open={confirmModalOpen}
        onCancel={() => {
          if (!updatingId) {
            setConfirmModalOpen(false);
            setConfirmTarget(null);
          }
        }}
        footer={null}
        centered
        width={440}
        closable={!updatingId}
        maskClosable={!updatingId}
      >
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <CheckCircleOutlined
            style={{ fontSize: 56, color: "#1677ff", marginBottom: 16 }}
          />

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 10,
            }}
          >
            Xác nhận đơn đặt lịch?
          </div>

          <Paragraph style={{ color: "#595959", fontSize: 14, marginBottom: 6 }}>
            Xác nhận lịch chụp cho đơn hàng sau:
          </Paragraph>

          <div
            style={{
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Khách hàng: </Text>
              <Text strong>
                {confirmTarget?.customer_id?.full_name || "Khách hàng"}
              </Text>
            </div>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Dịch vụ: </Text>
              <Text strong>
                {confirmTarget?.service_id?.name || "Dịch vụ"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Mã đơn: </Text>
              <Text code>
                #{confirmTarget?._id?.slice(-8).toUpperCase()}
              </Text>
            </div>
          </div>

          <Divider style={{ margin: "0 0 20px" }} />

          <Space style={{ width: "100%", justifyContent: "center" }}>
            <Button
              size="large"
              onClick={() => {
                setConfirmModalOpen(false);
                setConfirmTarget(null);
              }}
              disabled={!!updatingId}
              style={{ minWidth: 120 }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={!!updatingId}
              onClick={handleConfirmBooking}
              style={{ minWidth: 160, background: "#1677ff", borderColor: "#1677ff" }}
            >
              Xác nhận đơn
            </Button>
          </Space>
        </div>
      </Modal>

      {/* ===== MODAL ĐÁNH DẤU ĐANG CHỤP ===== */}
      <Modal
        open={progressModalOpen}
        onCancel={() => {
          if (!updatingId) {
            setProgressModalOpen(false);
            setProgressTarget(null);
          }
        }}
        footer={null}
        centered
        width={440}
        closable={!updatingId}
        maskClosable={!updatingId}
      >
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <CheckCircleOutlined
            style={{ fontSize: 56, color: "#2f54eb", marginBottom: 16 }}
          />

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 10,
            }}
          >
            Đánh dấu đang thực hiện?
          </div>

          <Paragraph style={{ color: "#595959", fontSize: 14, marginBottom: 6 }}>
            Bắt đầu buổi chụp cho đơn hàng sau:
          </Paragraph>

          <div
            style={{
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Khách hàng: </Text>
              <Text strong>
                {progressTarget?.customer_id?.full_name || "Khách hàng"}
              </Text>
            </div>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Dịch vụ: </Text>
              <Text strong>
                {progressTarget?.service_id?.name || "Dịch vụ"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Mã đơn: </Text>
              <Text code>
                #{progressTarget?._id?.slice(-8).toUpperCase()}
              </Text>
            </div>
          </div>

          <Divider style={{ margin: "0 0 20px" }} />

          <Space style={{ width: "100%", justifyContent: "center" }}>
            <Button
              size="large"
              onClick={() => {
                setProgressModalOpen(false);
                setProgressTarget(null);
              }}
              disabled={!!updatingId}
              style={{ minWidth: 120 }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={!!updatingId}
              onClick={handleStartProgress}
              style={{ minWidth: 160, background: "#2f54eb", borderColor: "#2f54eb" }}
            >
              Đang thực hiện
            </Button>
          </Space>
        </div>
      </Modal>

      {/* ===== MODAL XÁC NHẬN HOÀN THÀNH ===== */}
      <Modal
        open={completeModalOpen}
        onCancel={() => {
          if (!updatingId) {
            setCompleteModalOpen(false);
            setCompleteTarget(null);
          }
        }}
        footer={null}
        centered
        width={440}
        closable={!updatingId}
        maskClosable={!updatingId}
      >
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <CheckCircleOutlined
            style={{ fontSize: 56, color: "#52c41a", marginBottom: 16 }}
          />

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 10,
            }}
          >
            Xác nhận hoàn thành đơn?
          </div>

          <Paragraph style={{ color: "#595959", fontSize: 14, marginBottom: 6 }}>
            Đánh dấu đơn sau đây là đã hoàn thành:
          </Paragraph>

          <div
            style={{
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Khách hàng: </Text>
              <Text strong>
                {completeTarget?.customer_id?.full_name || "Khách hàng"}
              </Text>
            </div>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">Dịch vụ: </Text>
              <Text strong>
                {completeTarget?.service_id?.name || "Dịch vụ"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Mã đơn: </Text>
              <Text code>
                #{completeTarget?._id?.slice(-8).toUpperCase()}
              </Text>
            </div>
          </div>

          <Divider style={{ margin: "0 0 20px" }} />

          <Space style={{ width: "100%", justifyContent: "center" }}>
            <Button
              size="large"
              onClick={() => {
                setCompleteModalOpen(false);
                setCompleteTarget(null);
              }}
              disabled={!!updatingId}
              style={{ minWidth: 120 }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckSquareOutlined />}
              loading={!!updatingId}
              onClick={handleConfirmComplete}
              style={{ minWidth: 160, background: "#52c41a", borderColor: "#52c41a" }}
            >
              Xác nhận hoàn thành
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
