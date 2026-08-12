/**
 * ContractReview.jsx
 * Trang xem hợp đồng online qua token bảo mật (không cần login).
 * Flow: Khách xem hợp đồng PDF do Admin upload & chuyển khoản cọc qua QR Studio.
 */
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Spin,
  Button,
  Tag,
  Alert,
  Typography,
} from "antd";
import {
  CheckCircleFilled,
  WarningOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
const PRIMARY_COLOR = "#BFA16A";
const PAYMENT_QR_URL = import.meta.env.VITE_PAYMENT_QR_URL || null;

const formatCurrency = (val) => `${Number(val || 0).toLocaleString("vi-VN")}đ`;

const ContractReview = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [paymentQrUrl, setPaymentQrUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId || !token) {
      setError("Link hợp đồng không hợp lệ hoặc đã hết hạn.");
      setLoading(false);
      return;
    }

    const fetchContract = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/bookings/contract/${bookingId}?token=${token}`
        );
        setBooking(res.data.booking);
        setPdfUrl(res.data.pdf_url);
        setPaymentQrUrl(res.data.payment_qr_url || PAYMENT_QR_URL);
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#FAF7F2" }}>
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#888" }}>Đang tải hợp đồng...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#FAF7F2", padding: "0 24px" }}>
        <div style={{ maxWidth: 500, textAlign: "center" }}>
          <WarningOutlined style={{ fontSize: 56, color: "#ff4d4f", marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, color: "#2F2F2F", marginBottom: 12 }}>Không thể tải hợp đồng</h2>
          <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 24 }}>{error}</p>
          <Button onClick={() => navigate("/")} style={{ borderRadius: 8 }}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const totalAmount = booking.total_amount || 0;
  const depositAmount = booking.deposit_amount || Math.round(totalAmount * (booking.deposit_percent || 30) / 100);
  const isAlreadyConfirmed = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status);
  const bookingCode = String(booking._id).slice(-8).toUpperCase();
  const qrImageSrc = paymentQrUrl || PAYMENT_QR_URL;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", padding: "80px 0 60px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "0 24px" }}>

        {/* Header Eyebrow đồng bộ website */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 16px",
              background: "rgba(191, 161, 106, 0.08)",
              border: "1px solid rgba(191, 161, 106, 0.25)",
              borderRadius: 20,
              marginBottom: 16,
            }}
          >
            <SafetyCertificateOutlined style={{ color: PRIMARY_COLOR, fontSize: 12 }} />
            <span
              style={{
                fontSize: 11,
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
              margin: 0,
            }}
          >
            Hợp Đồng{" "}
            <span style={{ fontStyle: "italic", color: PRIMARY_COLOR, fontWeight: 400 }}>
              Dịch Vụ Nhiếp Ảnh
            </span>
          </h1>
        </div>

        <div className="glass-panel" style={{ borderRadius: 12, overflow: "hidden" }}>
          {/* Studio Info Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #2F2F2F 0%, #1A1A1A 100%)",
              padding: "24px 32px",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontFamily: '"Playfair Display", serif', marginBottom: 6 }}>
                Cao Hiển Studio
              </div>
              <div>
                <Tag color="gold" style={{ borderRadius: 4 }}>
                  Mã đơn: #{bookingCode}
                </Tag>
                {isAlreadyConfirmed ? (
                  <Tag color="green" style={{ borderRadius: 4, marginLeft: 6 }}>Lịch đã xác nhận</Tag>
                ) : (
                  <Tag color="orange" style={{ borderRadius: 4, marginLeft: 6 }}>Chờ đặt cọc</Tag>
                )}
              </div>
            </div>

            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Button icon={<DownloadOutlined />} style={{ borderRadius: 6, fontWeight: 500 }}>
                  Tải file PDF hợp đồng
                </Button>
              </a>
            )}
          </div>

          <div style={{ padding: "32px 32px" }}>
            {/* Embed PDF hợp đồng */}
            {pdfUrl ? (
              <div style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 28,
                height: "620px",
                background: "#f0f2f5"
              }}>
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                >
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <p>Trình duyệt không hỗ trợ xem PDF trực tiếp.</p>
                    <a href={pdfUrl} target="_blank" rel="noreferrer">
                      <Button type="primary" icon={<DownloadOutlined />}>Tải PDF hợp đồng</Button>
                    </a>
                  </div>
                </object>
              </div>
            ) : (
              <Alert
                type="warning"
                message="File hợp đồng PDF đang được cập nhật."
                style={{ marginBottom: 28 }}
              />
            )}

            {/* Thông tin tổng tiền & tiền cọc */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(191, 161, 106, 0.08)",
                border: "1px solid rgba(191, 161, 106, 0.25)",
                borderRadius: 8,
                padding: "18px 24px",
                marginBottom: 28,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#2F2F2F" }}>
                  Số tiền cọc thanh toán ({booking.deposit_percent || 30}%)
                </div>
                <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>
                  Tổng giá trị hợp đồng: <strong>{formatCurrency(totalAmount)}</strong>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 26, fontWeight: 700, color: PRIMARY_COLOR }}>
                  {formatCurrency(depositAmount)}
                </span>
              </div>
            </div>

            {/* ĐÃ XÁC NHẬN CỌC */}
            {isAlreadyConfirmed ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircleFilled style={{ fontSize: 48, color: "#52c41a", marginBottom: 14 }} />
                <h2 style={{ fontSize: 22, color: "#2F2F2F", marginBottom: 8 }}>
                  Hợp đồng đã được xác nhận giữ lịch!
                </h2>
                <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 20 }}>
                  Cao Hiển Studio đã ghi nhận khoản tiền cọc và xác nhận lịch chụp của bạn.
                </p>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate("/customer/my-bookings")}
                  style={{ background: "#2F2F2F", borderColor: "#2F2F2F", borderRadius: 8 }}
                >
                  Xem đơn hàng của tôi
                </Button>
              </div>
            ) : (
              /* CHƯA XÁC NHẬN CỌC -> HIỂN THỊ HÌNH QR TO VÀ DÒNG LƯU Ý */
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8dcc8",
                  borderRadius: 12,
                  padding: "36px 24px 28px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  textAlign: "center",
                }}
              >
                {/* Hình QR To & Rõ */}
                {qrImageSrc ? (
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        border: "3px solid #e8dcc8",
                        borderRadius: 16,
                        padding: 16,
                        background: "#fff",
                        display: "inline-block",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      }}
                    >
                      <img
                        src={qrImageSrc}
                        alt="QR Thanh Toán Studio"
                        style={{
                          width: 320,
                          height: 320,
                          maxWidth: "100%",
                          display: "block",
                          borderRadius: 8,
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 12, fontWeight: 500 }}>
                      Quét mã QR để chuyển khoản cọc ({formatCurrency(depositAmount)})
                    </div>
                  </div>
                ) : (
                  <Alert type="warning" message="Chưa có ảnh QR thanh toán." style={{ marginBottom: 20 }} />
                )}

                {/* Dòng lưu ý Zalo */}
                <div
                  style={{
                    background: "#fffbe6",
                    border: "1px solid #ffe58f",
                    borderRadius: 8,
                    padding: "16px 20px",
                    fontSize: 14,
                    color: "#876800",
                    lineHeight: 1.7,
                    textAlign: "left",
                    maxWidth: 640,
                    margin: "0 auto",
                  }}
                >
                  <PhoneOutlined style={{ marginRight: 8, color: "#faad14", fontSize: 16 }} />
                  <strong>Lưu ý:</strong> Sau khi chuyển khoản, quý khách vui lòng <strong>gửi bill / ảnh màn hình giao dịch qua Zalo của Cao Hiển Studio</strong> để đối soát và xác nhận giữ lịch chính thức.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractReview;
