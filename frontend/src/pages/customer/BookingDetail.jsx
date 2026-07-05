import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tag,
  Button,
  message,
  Descriptions,
  Spin,
  Space,
  Alert,
  Statistic,
  Modal,
  Row,
  Col,
  Divider,
  Typography,
} from "antd";
import {
  CreditCardOutlined,
  ArrowLeftOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ExclamationCircleFilled,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Countdown } = Statistic;
const { Text, Paragraph } = Typography;

const API_URL = "http://localhost:5000/api";
const PRIMARY_COLOR = "#9a8a78";

const formatCurrency = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

const isExpiredPendingBooking = (booking) => {
  if (!booking || booking.status !== "PENDING") return false;
  if (!booking.expires_at) return true;

  return dayjs(booking.expires_at).isSame(dayjs()) ||
    dayjs(booking.expires_at).isBefore(dayjs());
};

const isPayableBooking = (booking) => {
  return (
    booking?.status === "PENDING" &&
    booking?.expires_at &&
    dayjs(booking.expires_at).isAfter(dayjs())
  );
};

const getDisplayOrderStatus = (booking) => {
  if (isExpiredPendingBooking(booking)) {
    return "CANCELED";
  }

  if (booking?.status === "EXPIRED" || booking?.status === "PAYMENT_FAILED") {
    return "CANCELED";
  }

  return booking?.status;
};

const getDisplayPaymentStatus = (booking) => {
  if (isExpiredPendingBooking(booking)) {
    return "Chưa thanh toán";
  }

  if (booking?.payment_status_text === "Đã hết hạn") {
    return "Chưa thanh toán";
  }

  return booking?.payment_status_text || "Chưa thanh toán";
};

const renderOrderStatus = (status) => {
  const map = {
    PENDING: { color: "gold", text: "Chờ thanh toán" },
    DEPOSITED: { color: "cyan", text: "Đã đặt cọc" },
    CONFIRMED: { color: "blue", text: "Đã xác nhận" },
    IN_PROGRESS: { color: "geekblue", text: "Đang thực hiện" },
    COMPLETED: { color: "green", text: "Hoàn thành" },
    CANCELED: { color: "red", text: "Đã hủy" },

    // Chống dữ liệu cũ
    EXPIRED: { color: "red", text: "Đã hủy" },
    PAYMENT_FAILED: { color: "red", text: "Đã hủy" },
  };

  const item = map[status] || { color: "default", text: status || "Không rõ" };

  return <Tag color={item.color}>{item.text}</Tag>;
};

const renderPaymentStatus = (text) => {
  const finalText = text === "Đã hết hạn" ? "Chưa thanh toán" : text;

  let color = "orange";

  if (finalText === "Đã thanh toán") color = "blue";
  if (finalText === "Đã tất toán") color = "green";

  return <Tag color={color}>{finalText || "Chưa thanh toán"}</Tag>;
};

const getPaidAmountColor = (amount) => {
  return Number(amount || 0) > 0 ? "#389e0d" : "#000";
};

const getRemainingAmountColor = (amount) => {
  return Number(amount || 0) > 0 ? "#cf1322" : "#000";
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repayLoading, setRepayLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBooking(res.data.booking);
      setPayments(res.data.payments || res.data.booking?.payments || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải chi tiết đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    setRepayLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/bookings/${id}/repay`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        message.error("Không tìm thấy link thanh toán");
      }
    } catch (err) {
      message.error(
        err.response?.data?.message || "Lỗi khởi tạo thanh toán lại",
      );
      fetchBooking();
    } finally {
      setRepayLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/bookings/${id}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      message.success(res.data.message || "Hủy đơn thành công");
      fetchBooking();
    } catch (err) {
      message.error(err.response?.data?.message || "Không thể hủy đơn");
      setCancelModalOpen(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRebook = () => {
    // Map các ID dịch vụ chính (bao gồm cả original_service_ids nếu có)
    const mainServiceIds = booking.original_service_ids?.length
      ? booking.original_service_ids.map(s => typeof s === "string" ? s : s._id).filter(Boolean)
      : booking.service_id?._id ? [booking.service_id._id] : [];

    // Map các ID dịch vụ đi kèm
    const addonIds = (booking.extra_service_ids || [])
      .filter(s => !mainServiceIds.includes(typeof s === "string" ? s : s._id))
      .map(s => typeof s === "string" ? s : s._id)
      .filter(Boolean);

    navigate("/booking", {
      state: {
        service_id: mainServiceIds[0] || booking.service_id?._id,
        serviceIds: mainServiceIds,
        addonIds: addonIds,
        location: booking.location,
      },
    });
  };

  const deadline = useMemo(() => {
    if (!booking?.expires_at) return null;
    return dayjs(booking.expires_at).valueOf();
  }, [booking]);

  const canPay = isPayableBooking(booking);
  const isPendingExpired = isExpiredPendingBooking(booking);
  const displayOrderStatus = getDisplayOrderStatus(booking);
  const displayPaymentStatus = getDisplayPaymentStatus(booking);

  if (loading) return <Spin fullscreen tip="Đang tải..." />;

  if (!booking) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Không tìm thấy đơn hàng
      </div>
    );
  }

  const handleCountdownFinish = async () => {
    message.warning("Đơn hàng đã quá hạn thanh toán. Đang cập nhật trạng thái...");

    try {
      const token = localStorage.getItem("token");

      await axios.get(`${API_URL}/bookings/${id}/check-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchBooking();
    } catch (err) {
      fetchBooking();
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
      <Card
        title={<span style={{ fontSize: "20px" }}>CHI TIẾT ĐƠN ĐẶT LỊCH</span>}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchBooking}>
            Làm mới
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Card size="small">
              <div style={{ color: "#888" }}>Tổng giá trị</div>
              <strong style={{ fontSize: 22 }}>
                {formatCurrency(booking.total_amount)}
              </strong>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small">
              <div style={{ color: "#888" }}>Đã thanh toán</div>
              <strong style={{ fontSize: 22, color: getPaidAmountColor(booking.paid_amount) }}>
                {formatCurrency(booking.paid_amount)}
              </strong>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small">
              <div style={{ color: "#888" }}>Còn lại</div>
              <strong
                style={{
                  fontSize: 22,
                  color: getRemainingAmountColor(booking.remaining_amount)
                }}
              >
                {formatCurrency(booking.remaining_amount)}
              </strong>
              {booking.remaining_amount > 0 && (
                <div style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 4, lineHeight: "1.2" }}>
                  * Thanh toán khi nhận ảnh (3-4 ngày sau chụp)
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Descriptions bordered column={1}>
          <Descriptions.Item label="Mã đơn hàng">
            {booking._id}
          </Descriptions.Item>

          <Descriptions.Item label="Gói chính">
            {booking.service_id?.name || "Dịch vụ"}
          </Descriptions.Item>

          <Descriptions.Item label="Gói đi kèm">
            {booking.extra_service_ids?.length > 0
              ? booking.extra_service_ids.map(s => s.name).join(", ")
              : "Không có"}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày chụp">
            {dayjs(booking.start_time).format("DD/MM/YYYY")}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian chụp">
            {dayjs(booking.start_time).format("HH:mm")} -{" "}
            {dayjs(booking.end_time).format("HH:mm")}
          </Descriptions.Item>

          <Descriptions.Item label="Thợ chụp/Nhân sự">
            {booking.assigned_staff_ids?.length > 0 ? (
              <Space direction="vertical">
                {booking.assigned_staff_ids.map((staff) => (
                  <div key={staff._id}>
                    <strong>{staff.full_name}</strong>
                    {staff.phone ? ` - ${staff.phone}` : ""}
                  </div>
                ))}
              </Space>
            ) : (
              <span style={{ color: "#999" }}>Chưa phân công</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Địa điểm">
            {booking.location}
          </Descriptions.Item>

          <Descriptions.Item label="Ghi chú">
            {booking.note || "Không có"}
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái đơn">
            {renderOrderStatus(displayOrderStatus)}
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái thanh toán">
            {renderPaymentStatus(displayPaymentStatus)}
          </Descriptions.Item>

          <Descriptions.Item label="Phương thức thanh toán">
            {booking.latest_payment?.payment_method || "Chưa có"}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian thanh toán">
            {booking.latest_payment?.paid_at ? (
              dayjs(booking.latest_payment.paid_at).format("HH:mm DD/MM/YYYY")
            ) : (
              renderPaymentStatus("Chưa thanh toán")
            )}
          </Descriptions.Item>
        </Descriptions>

        {canPay && (
          <div
            style={{
              marginTop: 30,
              background: "#fffbe6",
              padding: "22px",
              borderRadius: "8px",
              border: "1px solid #ffe58f",
            }}
          >
            <Alert
              type="warning"
              showIcon
              message="Đơn hàng đang chờ thanh toán"
              description="Bạn cần hoàn tất thanh toán trong 15 phút để giữ lịch chụp. Nếu quá hạn, đơn sẽ tự chuyển sang trạng thái đã hủy."
              style={{ marginBottom: 18 }}
            />

            <div style={{ textAlign: "center" }}>
              <Countdown
                title="Thời gian thanh toán còn lại"
                value={deadline}
                format="mm:ss"
                onFinish={handleCountdownFinish}
              />

              <Space wrap style={{ marginTop: 18 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CreditCardOutlined />}
                  onClick={handleRepay}
                  loading={repayLoading}
                  style={{
                    background: PRIMARY_COLOR,
                    borderColor: PRIMARY_COLOR,
                    height: "46px",
                    padding: "0 32px",
                  }}
                >
                  THANH TOÁN NGAY QUA VNPAY
                </Button>

                <Button
                  danger
                  size="large"
                  icon={<CloseCircleOutlined />}
                  loading={cancelLoading}
                  onClick={() => setCancelModalOpen(true)}
                  style={{
                    height: "46px",
                    padding: "0 28px",
                  }}
                >
                  HỦY ĐƠN
                </Button>

                {/* Modal xác nhận hủy đơn */}
                <Modal
                  open={cancelModalOpen}
                  onCancel={() => setCancelModalOpen(false)}
                  footer={null}
                  centered
                  width={440}
                  closable={!cancelLoading}
                  maskClosable={!cancelLoading}
                >
                  <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                    {/* Icon cảnh báo */}
                    <ExclamationCircleFilled
                      style={{
                        fontSize: 56,
                        color: "#ff4d4f",
                        marginBottom: 16,
                      }}
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

                    <Paragraph
                      style={{
                        color: "#595959",
                        fontSize: 14,
                        marginBottom: 6,
                      }}
                    >
                      Bạn đang yêu cầu hủy đơn:
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
                        <Text type="secondary">Dịch vụ: </Text>
                        <Text strong>
                          {booking?.service_id?.name || booking?.serviceName || "Dịch vụ"}
                        </Text>
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <Text type="secondary">Ngày chụp: </Text>
                        <Text strong>
                          {booking?.start_time
                            ? dayjs(booking.start_time).format("DD/MM/YYYY")
                            : "—"}
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary">Mã đơn: </Text>
                        <Text code>#{id?.slice(-8).toUpperCase()}</Text>
                      </div>
                    </div>

                    <Alert
                      type="warning"
                      showIcon
                      message="Theo chính sách của Studio, tiền cọc sẽ KHÔNG ĐƯỢC HOÀN LẠI nếu bạn hủy lịch."
                      description={
                        <>
                          <div style={{ marginBottom: 8 }}>Hành động hủy đơn này không thể hoàn tác.</div>
                          <div><strong>Gợi ý:</strong> Nếu bạn chỉ muốn dời ngày chụp, vui lòng giữ nguyên đơn và liên hệ trực tiếp với Studio để được hỗ trợ <strong>bảo lưu tiền cọc trong vòng 6 tháng</strong>.</div>
                        </>
                      }
                      style={{ marginBottom: 24, textAlign: "left" }}
                    />

                    <Space style={{ width: "100%", justifyContent: "center" }}>
                      <Button
                        size="large"
                        onClick={() => setCancelModalOpen(false)}
                        disabled={cancelLoading}
                        style={{ minWidth: 120 }}
                      >
                        Không, giữ đơn
                      </Button>
                      <Button
                        danger
                        type="primary"
                        size="large"
                        icon={<CloseCircleOutlined />}
                        loading={cancelLoading}
                        onClick={handleCancelBooking}
                        style={{ minWidth: 140 }}
                      >
                        Xác nhận hủy
                      </Button>
                    </Space>
                  </div>
                </Modal>
              </Space>
            </div>
          </div>
        )}

        {isPendingExpired && (
          <div
            style={{
              marginTop: 30,
              background: "#fff1f0",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #ffa39e",
            }}
          >
            <Alert
              type="error"
              showIcon
              message="Đơn hàng đã quá hạn thanh toán"
              description="Đơn này đã quá hạn thanh toán nên không thể tiếp tục thanh toán. Vui lòng đặt lại nếu bạn vẫn muốn sử dụng dịch vụ."
            />
          </div>
        )}

        {displayOrderStatus === "CANCELED" && !isPendingExpired && (
          <div
            style={{
              marginTop: 30,
              background: "#fff1f0",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #ffa39e",
            }}
          >
            <Alert
              type="error"
              showIcon
              message="Đơn đã hủy"
              description="Đơn này đã bị hủy do khách hủy thanh toán, hủy trên website hoặc quá hạn thanh toán."
            />
          </div>
        )}

        {displayOrderStatus === "CONFIRMED" && (
          <div
            style={{
              marginTop: 30,
              background: "#e6f4ff",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #91caff",
            }}
          >
            <Alert
              type="info"
              showIcon
              message="Lịch hẹn đã được xác nhận"
              description="Cao Hiển Studio đã nhận và xác nhận lịch hẹn của bạn. Vui lòng đến đúng giờ để buổi chụp diễn ra tốt đẹp."
            />
          </div>
        )}

        {displayOrderStatus === "IN_PROGRESS" && (
          <div
            style={{
              marginTop: 30,
              background: "#f6ffed",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #b7eb8f",
            }}
          >
            <Alert
              type="success"
              showIcon
              message="Đang thực hiện buổi chụp"
              description="Buổi chụp của bạn đang được tiến hành. Cảm ơn bạn đã lựa chọn Cao Hiển Studio!"
            />
          </div>
        )}

        <Divider />

        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/customer/my-bookings")}
          >
            Quay lại danh sách
          </Button>

          {(displayOrderStatus === "CANCELED" || displayOrderStatus === "COMPLETED") && (
            <Button
              icon={<CalendarOutlined />}
              onClick={handleRebook}
              style={{
                background: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
                color: "#fff",
              }}
            >
              Đặt lại
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default BookingDetail;