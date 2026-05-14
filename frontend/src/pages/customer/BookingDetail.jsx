import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tag, Button, message, Descriptions, Spin, Space } from "antd";
import { CreditCardOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const PRIMARY_COLOR = "#9a8a78";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repayLoading, setRepayLoading] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`http://localhost:5000/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBooking(res.data.booking);
      setPayments(res.data.payments || []);
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
        `http://localhost:5000/api/bookings/${id}/repay`,
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
    } finally {
      setRepayLoading(false);
    }
  };

  const renderStatus = (status) => {
    let color = "blue";
    let text = status;

    if (status === "PENDING") {
      color = "gold";
      text = "Chờ thanh toán";
    } else if (status === "DEPOSITED") {
      color = "cyan";
      text = "Đã đặt cọc";
    } else if (status === "COMPLETED") {
      color = "green";
      text = "Hoàn thành";
    } else if (status === "CANCELED") {
      color = "red";
      text = "Đã hủy";
    }

    return <Tag color={color}>{text}</Tag>;
  };

  const latestPayment = payments?.[0];

  if (loading) return <Spin fullscreen tip="Đang tải..." />;

  if (!booking) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Không tìm thấy đơn hàng
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      <Card
        title={<span style={{ fontSize: "20px" }}>CHI TIẾT ĐƠN ĐẶT LỊCH</span>}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Mã đơn hàng">
            {booking._id}
          </Descriptions.Item>

          <Descriptions.Item label="Dịch vụ">
            {booking.service_id?.name || "Dịch vụ"}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày chụp">
            {dayjs(booking.start_time).format("DD/MM/YYYY")}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian chụp">
            {dayjs(booking.start_time).format("HH:mm")} -{" "}
            {dayjs(booking.end_time).format("HH:mm")}
          </Descriptions.Item>

          <Descriptions.Item label="Thợ chụp">
            {booking.photographer_ids?.length > 0 ? (
              <Space direction="vertical">
                {booking.photographer_ids.map((p) => (
                  <div key={p._id}>
                    <strong>{p.full_name}</strong>
                    {p.phone ? ` - ${p.phone}` : ""}
                    {p.portfolio?.specialties?.length > 0 && (
                      <div style={{ fontSize: 12, color: "#777" }}>
                        {p.portfolio.specialties.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            ) : (
              <span style={{ color: "#999" }}>Chưa có thợ chụp</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Địa điểm">
            {booking.location}
          </Descriptions.Item>

          <Descriptions.Item label="Ghi chú">
            {booking.note || "Không có"}
          </Descriptions.Item>

          <Descriptions.Item label="Tổng giá trị">
            <strong>{booking.total_amount?.toLocaleString("vi-VN")}đ</strong>
          </Descriptions.Item>

          <Descriptions.Item label="Số tiền cọc">
            <span style={{ fontWeight: "bold", color: "#cf1322" }}>
              {latestPayment?.amount
                ? `${latestPayment.amount.toLocaleString("vi-VN")}đ`
                : "Chưa có giao dịch"}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái đơn">
            {renderStatus(booking.status)}
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái thanh toán">
            {latestPayment?.status ? (
              <Tag
                color={latestPayment.status === "SUCCESS" ? "green" : "gold"}
              >
                {latestPayment.status}
              </Tag>
            ) : (
              <Tag>CHƯA CÓ</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        {booking.status === "PENDING" && (
          <div
            style={{
              marginTop: 30,
              textAlign: "center",
              background: "#fffbe6",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #ffe58f",
            }}
          >
            <p style={{ fontSize: "16px", marginBottom: "10px" }}>
              Đơn hàng của bạn đang chờ thanh toán cọc để được xác nhận chính
              thức.
            </p>

            {booking.expires_at && (
              <p
                style={{
                  color: "#cf1322",
                  fontWeight: 600,
                  marginBottom: "15px",
                }}
              >
                Vui lòng thanh toán trước:{" "}
                {dayjs(booking.expires_at).format("HH:mm DD/MM/YYYY")}
              </p>
            )}

            {!booking.expires_at ||
            dayjs(booking.expires_at).isAfter(dayjs()) ? (
              <Button
                type="primary"
                size="large"
                icon={<CreditCardOutlined />}
                onClick={handleRepay}
                loading={repayLoading}
                style={{
                  background: PRIMARY_COLOR,
                  borderColor: PRIMARY_COLOR,
                  height: "50px",
                  padding: "0 40px",
                }}
              >
                THANH TOÁN NGAY QUA VNPAY
              </Button>
            ) : (
              <p style={{ color: "#cf1322", fontWeight: 600 }}>
                Đơn này đã quá hạn thanh toán. Vui lòng đặt lịch lại.
              </p>
            )}
          </div>
        )}

        {booking.status === "EXPIRED" && (
          <div
            style={{
              marginTop: 30,
              textAlign: "center",
              background: "#fff1f0",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #ffa39e",
            }}
          >
            <p style={{ color: "#cf1322", fontWeight: 600, marginBottom: 0 }}>
              Đơn này đã quá hạn thanh toán. Vui lòng đặt lịch lại.
            </p>
          </div>
        )}

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/customer/my-bookings")}
          style={{ marginTop: 20 }}
        >
          Quay lại danh sách
        </Button>
      </Card>
    </div>
  );
};

export default BookingDetail;
