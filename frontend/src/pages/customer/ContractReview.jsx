/**
 * ContractReview.jsx
 * Trang xem hợp đồng online qua token bảo mật (không cần login).
 */
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Spin,
  Button,
  Divider,
  Tag,
  Alert,
  message,
  Modal,
} from "antd";
import {
  CheckCircleFilled,
  FileTextOutlined,
  CreditCardOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
const PRIMARY_COLOR = "#BFA16A";

// Định dạng tiền VND trên trang hợp đồng.
const formatCurrency = (val) =>
  `${Number(val || 0).toLocaleString("vi-VN")}đ`;

// Trang khách mở từ email/QR để xem PDF hợp đồng và xác nhận thanh toán cọc.
const ContractReview = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [error, setError] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!bookingId || !token) {
      setError("Link hợp đồng không hợp lệ hoặc đã hết hạn.");
      setLoading(false);
      return;
    }

    // Lấy booking, token hợp đồng và link PDF từ backend.
    const fetchContract = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/bookings/contract/${bookingId}?token=${token}`
        );
        setBooking(res.data.booking);
        setPdfUrl(res.data.pdf_url);
        setAlreadyConfirmed(res.data.already_confirmed);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Không thể tải hợp đồng. Link có thể đã hết hạn hoặc không đúng."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [bookingId, token]);

  // Khách đồng ý hợp đồng; backend tạo payment rồi trả link VNPay.
  const handleConfirmContract = async () => {
    try {
      setConfirming(true);
      const res = await axios.post(
        `${API_URL}/bookings/${bookingId}/confirm-contract`,
        { token }
      );

      if (res.data.already_paid) {
        setAlreadyPaid(true);
        return;
      }

      if (res.data.paymentUrl) {
        setPaymentUrl(res.data.paymentUrl);
        setShowConfirmModal(false);
        // Auto redirect sau 2 giây
        message.loading("Đang chuyển đến trang thanh toán VNPay...", 2);
        setTimeout(() => {
          window.location.href = res.data.paymentUrl;
        }, 2000);
      }
    } catch (err) {
      message.error(
        err.response?.data?.message || "Có lỗi xảy ra khi xác nhận hợp đồng"
      );
    } finally {
      setConfirming(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#FAF7F2",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#888" }}>
            Đang tải hợp đồng...
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#FAF7F2",
          padding: "0 24px",
        }}
      >
        <div style={{ maxWidth: 500, textAlign: "center" }}>
          <WarningOutlined style={{ fontSize: 56, color: "#ff4d4f", marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, color: "#2F2F2F", marginBottom: 12 }}>
            Không thể tải hợp đồng
          </h2>
          <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 24 }}>{error}</p>
          <Button onClick={() => navigate("/")} style={{ borderRadius: 8 }}>
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }



  if (!booking) return null;

  const totalAmount = booking.total_amount || 0;
  const depositAmount = booking.deposit_amount || Math.round(totalAmount * (booking.deposit_percent || 30) / 100);

  return (
    <div
      style={{ minHeight: "100vh", background: "#FAF7F2", padding: "80px 0 60px" }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 20px",
              background: "rgba(191, 161, 106, 0.08)",
              border: "1px solid rgba(191, 161, 106, 0.2)",
              marginBottom: 20,
            }}
          >
            <SafetyCertificateOutlined style={{ color: PRIMARY_COLOR }} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              Hợp Đồng Đặt Lịch
            </span>
          </div>
          <h1
            className="font-serif-luxury"
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              color: "#2F2F2F",
              fontWeight: 300,
              margin: "0 0 12px",
            }}
          >
            Hợp Đồng{" "}
            <span style={{ fontStyle: "italic", color: PRIMARY_COLOR, fontWeight: 400 }}>
              Dịch Vụ Nhiếp Ảnh
            </span>
          </h1>
          <p style={{ color: "#777", fontSize: 14, lineHeight: 1.8 }}>
            Vui lòng đọc kỹ thông tin hợp đồng trước khi xác nhận
          </p>
        </div>

        <div className="glass-panel" style={{ borderRadius: 12, overflow: "hidden" }}>
          {/* Studio Info Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #2F2F2F 0%, #1A1A1A 100%)",
              padding: "28px 36px",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontFamily: '"Playfair Display", serif', marginBottom: 4 }}>
                Cao Hiển Studio
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
                Studio nhiếp ảnh chuyên nghiệp • Hợp đồng dịch vụ chụp ảnh
              </div>
              <div style={{ marginTop: 12 }}>
                <Tag color="gold" style={{ borderRadius: 4 }}>
                  Mã đơn: #{String(booking._id).slice(-8).toUpperCase()}
                </Tag>
                <Tag color="purple" style={{ borderRadius: 4, marginLeft: 8 }}>
                  Chờ xác nhận
                </Tag>
              </div>
            </div>
            
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Button 
                  icon={<DownloadOutlined />} 
                  style={{ borderRadius: 6, fontWeight: 500 }}
                >
                  Tải file PDF
                </Button>
              </a>
            )}
          </div>

          <div style={{ padding: "32px 36px" }}>
            
            {/* Embed PDF */}
            {pdfUrl ? (
              <div style={{ 
                border: "1px solid #e0e0e0", 
                borderRadius: 8, 
                overflow: "hidden",
                marginBottom: 32,
                height: "600px",
                background: "#f0f2f5" 
              }}>
                <object 
                  data={pdfUrl} 
                  type="application/pdf" 
                  width="100%" 
                  height="100%"
                >
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <p>Trình duyệt của bạn không hỗ trợ xem PDF trực tiếp.</p>
                    <a href={pdfUrl} target="_blank" rel="noreferrer">
                      <Button type="primary" icon={<DownloadOutlined />}>Tải PDF về máy</Button>
                    </a>
                  </div>
                </object>
              </div>
            ) : (
              <Alert 
                type="error" 
                message="Không tìm thấy file hợp đồng PDF." 
                style={{ marginBottom: 32 }} 
              />
            )}

            {/* Thông tin chốt */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(191, 161, 106, 0.08)",
                border: "1px solid rgba(191, 161, 106, 0.2)",
                borderRadius: 8,
                padding: "20px 24px",
                marginBottom: 32,
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "#2F2F2F" }}>
                  Tổng tiền cọc cần thanh toán ({booking.deposit_percent || 30}%)
                </div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                  Tổng giá trị hợp đồng: <strong>{formatCurrency(totalAmount)}</strong>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: PRIMARY_COLOR }}>
                  {formatCurrency(depositAmount)}
                </span>
              </div>
            </div>

            {/* CTA */}
            {(alreadyPaid || ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status)) ? (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <CheckCircleFilled style={{ fontSize: 48, color: "#52c41a", marginBottom: 16 }} />
                <h2 style={{ fontSize: 22, color: "#2F2F2F", marginBottom: 12 }}>
                  Hợp đồng đã được xác nhận!
                </h2>
                <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 24 }}>
                  Hợp đồng và thanh toán cọc đã hoàn tất. Studio sẽ liên hệ với bạn trước buổi chụp.
                </p>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate("/customer/my-bookings")}
                  style={{ background: "#2F2F2F", borderRadius: 8, height: 44, padding: "0 28px" }}
                >
                  Xem đơn của tôi
                </Button>
              </div>
            ) : booking.status === "WAITING_PAYMENT" ? (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <Alert
                  type="info"
                  showIcon
                  message="Bạn đã xác nhận hợp đồng. Vui lòng thanh toán tiền cọc để giữ lịch chính thức."
                  style={{ marginBottom: 24, textAlign: "left", borderRadius: 8 }}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<CreditCardOutlined />}
                  loading={confirming}
                  onClick={handleConfirmContract}
                  style={{
                    background: "linear-gradient(135deg, #2F2F2F 0%, #1A1A1A 100%)",
                    borderColor: "#2F2F2F",
                    height: 54,
                    padding: "0 40px",
                    fontSize: 16,
                    borderRadius: 8,
                  }}
                >
                  Thanh toán ngay
                </Button>
              </div>
            ) : (
              <>
                <Alert
                  type="warning"
                  showIcon
                  message="Bằng cách bấm 'Tôi đồng ý hợp đồng', bạn xác nhận đã đọc, hiểu và chấp thuận toàn bộ điều khoản trong file PDF hợp đồng trên."
                  style={{ marginBottom: 24, borderRadius: 8 }}
                />

                <div style={{ textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleFilled />}
                    loading={confirming}
                    onClick={() => setShowConfirmModal(true)}
                    style={{
                      background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #9a7a50 100%)`,
                      borderColor: PRIMARY_COLOR,
                      height: 54,
                      padding: "0 48px",
                      fontSize: 16,
                      borderRadius: 8,
                      letterSpacing: 0.5,
                      boxShadow: "0 4px 15px rgba(191, 161, 106, 0.3)",
                    }}
                  >
                    Tôi đồng ý hợp đồng
                  </Button>
                  <div style={{ marginTop: 12, fontSize: 13, color: "#888" }}>
                    Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán VNPay
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal xác nhận cuối */}
      <Modal
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={null}
        centered
        width={480}
      >
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <FileTextOutlined style={{ fontSize: 52, color: PRIMARY_COLOR, marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>
            Xác nhận hợp đồng?
          </div>
          <p style={{ color: "#595959", fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
            Bạn xác nhận đã đọc và đồng ý toàn bộ điều khoản hợp đồng với{" "}
            <strong>Cao Hiển Studio</strong>.
          </p>
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
            <div style={{ marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: "#888" }}>Tiền cọc cần thanh toán: </span>
              <strong style={{ color: PRIMARY_COLOR, fontSize: 16 }}>
                {formatCurrency(depositAmount)}
              </strong>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "#888" }}>Tổng hợp đồng: </span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Button
              size="large"
              onClick={() => setShowConfirmModal(false)}
              style={{ minWidth: 120 }}
            >
              Xem lại
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CreditCardOutlined />}
              loading={confirming}
              onClick={handleConfirmContract}
              style={{
                background: "#2F2F2F",
                borderColor: "#2F2F2F",
                minWidth: 160,
              }}
            >
              Đồng ý & Thanh toán
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ContractReview;

