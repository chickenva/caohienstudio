/**
 * BookingConfirm.jsx
 * Trang xác nhận hợp đồng — khách đọc hợp đồng và xác nhận trước khi thanh toán.
 */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Result, Button, message, Row, Col, Spin, Divider, Input } from "antd";
import { SendOutlined, LeftOutlined, CheckCircleFilled } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
const PRIMARY_COLOR = "#BFA16A";

// Trang xác nhận lại thông tin trước khi khách gửi yêu cầu đặt lịch.
const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [servicesInfo, setServicesInfo] = useState([]);
  const [addonsInfo, setAddonsInfo] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!bookingData) {
      navigate("/booking");
      return;
    }

    // Tải chi tiết các gói dịch vụ để hiển thị bảng xác nhận.
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const mainIds = bookingData.original_service_ids || [bookingData.service_id];
        const mainServices = [];
        for (const id of mainIds) {
          const res = await axios.get(`${API_URL}/services/${id}`);
          mainServices.push(res.data);
        }
        setServicesInfo(mainServices);

        if (bookingData.extra_service_ids && bookingData.extra_service_ids.length > 0) {
          const addons = [];
          const actualAddonIds = bookingData.extra_service_ids.filter(id => !mainIds.includes(id));
          for (const id of actualAddonIds) {
            const res = await axios.get(`${API_URL}/services/${id}`);
            addons.push(res.data);
          }
          setAddonsInfo(addons);
        }
      } catch (err) {
        console.error("Lỗi tải thông tin dịch vụ:", err);
        message.error("Lỗi khi tải thông tin dịch vụ để xác nhận");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bookingData, navigate]);

  if (!bookingData) {
    return null;
  }

  // Gửi yêu cầu đặt lịch — không thanh toán ngay
  const handleSubmitRequest = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      if (!token) {
        message.warning("Vui lòng đăng nhập lại");
        navigate("/login");
        return;
      }

      const submitPayload = {
        ...bookingData,
        note: note || bookingData.note || "",
      };

      await axios.post(
        `${API_URL}/bookings/request`,
        submitPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmitted(true);
    } catch (err) {
      console.error("Booking request error:", err);
      if (err.response?.status === 409) {
        message.error(err.response.data.message || "Studio đã có lịch trong khung giờ này. Vui lòng chọn thời gian khác.");
      } else {
        message.error(err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#FAF7F2" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Màn hình thành công sau khi gửi yêu cầu (Đã nâng cấp sang trọng, chuyên nghiệp & đồng bộ)
  if (submitted) {
    const mainPrice = servicesInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
    const addonsPrice = addonsInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
    const totalPrice = mainPrice + addonsPrice;
    const depositPrice = Math.round(totalPrice * 0.3);

    return (
      <div className="home-page-container" style={{ minHeight: "100vh", padding: "80px 20px 80px", background: "#FAF7F2" }}>
        <div className="glow-spotlight-light" style={{ top: "10%", left: "10%" }}></div>
        <div className="glow-spotlight-light" style={{ top: "50%", right: "10%" }}></div>

        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="glass-panel" style={{ padding: "40px 36px", borderRadius: 12, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #D4B26F 0%, #BFA16A 100%)" }} />

            {/* Check Icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(191, 161, 106, 0.12)",
                border: `1px solid ${PRIMARY_COLOR}`,
                marginBottom: 16,
              }}>
                <CheckCircleFilled style={{ fontSize: 38, color: PRIMARY_COLOR }} />
              </div>

              <h1 className="font-serif-luxury" style={{ fontSize: 30, color: "#2F2F2F", margin: 0 }}>
                Yêu Cầu Đặt Lịch Đã Được Gửi Thành Công
              </h1>
            </div>

            <p style={{ color: "#555", fontSize: 14.5, textAlign: "center", lineHeight: 1.8, marginBottom: 36 }}>
              Cảm ơn bạn đã tin tưởng dịch vụ tại <strong>Cao Hiển Studio</strong>. Yêu cầu đặt lịch của bạn đã được ghi nhận thành công. Nhân viên sẽ liên hệ trực tiếp để tư vấn và hỗ trợ xác nhận lịch hẹn sớm nhất.
            </p>

            {/* Các nút thao tác: Đổi chỗ Nút Trang Chủ sang trái & Nút Xem Đơn sang phải */}
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                size="large"
                onClick={() => navigate("/")}
                style={{
                  height: 50,
                  padding: "0 32px",
                  borderRadius: 8,
                  borderColor: "#E8DED2",
                  color: "#555",
                  fontWeight: 500,
                  letterSpacing: 0.5,
                }}
              >
                VỀ TRANG CHỦ
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/customer/my-bookings")}
                style={{
                  background: "linear-gradient(135deg, #D4B26F 0%, #BFA16A 100%)",
                  borderColor: PRIMARY_COLOR,
                  color: "#FFFFFF",
                  height: 50,
                  padding: "0 32px",
                  borderRadius: 8,
                  letterSpacing: 1,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  boxShadow: "0 4px 14px rgba(191, 161, 106, 0.35)",
                }}
              >
                XEM ĐƠN CỦA TÔI
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tính tổng tiền để hiển thị (chỉ để tham khảo, admin sẽ xác định chính thức)
  const mainPrice = servicesInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
  const addonsPrice = addonsInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
  const totalPrice = mainPrice + addonsPrice;

  return (
    <div className="home-page-container" style={{ minHeight: "100vh", padding: "100px 0 60px", background: "#FAF7F2" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>

        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 20, color: "#555" }}
        >
          Quay lại sửa thông tin
        </Button>

        <div className="glass-panel" style={{ padding: 40, borderRadius: 12 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 className="font-serif-luxury" style={{ fontSize: 28, color: "#2F2F2F", margin: 0 }}>
              Xác nhận Yêu cầu Đặt lịch
            </h1>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.8, maxWidth: 640, margin: "10px auto 0" }}>
              Vui lòng kiểm tra kỹ các thông tin chi tiết dưới đây. Nhân viên sẽ liên hệ trực tiếp để tư vấn và hỗ trợ xác nhận lịch hẹn sớm nhất.
            </p>
          </div>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <h3 style={{ fontSize: 14, color: PRIMARY_COLOR, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
                Thông tin lịch chụp
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Hình thức chụp</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {bookingData.shooting_type === "STUDIO" ? "Chụp tại Studio" : "Chụp Ngoại cảnh"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Địa điểm</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>{bookingData.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ngày chụp</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {dayjs(bookingData.shoot_date).format("DD/MM/YYYY")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Buổi chụp</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {
                      bookingData.shooting_session === "MORNING" ? "Buổi sáng (08:00–12:00)" :
                        bookingData.shooting_session === "AFTERNOON" ? "Buổi chiều (13:00–17:00)" :
                          "Cả ngày (08:00–17:00)"
                    }
                  </div>
                </div>
                {bookingData.note && (
                  <div>
                    <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ghi chú</div>
                    <div style={{ fontSize: 14, color: "#555", fontStyle: "italic" }}>"{bookingData.note}"</div>
                  </div>
                )}
              </div>
            </Col>

            <Col xs={24} md={12}>
              <h3 style={{ fontSize: 14, color: PRIMARY_COLOR, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
                Dịch vụ đã chọn
              </h3>

              {servicesInfo.map((service) => (
                <div key={service._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>{service.name}</span>
                  <span>{Number(service.base_price || 0).toLocaleString("vi-VN")}đ</span>
                </div>
              ))}

              {addonsInfo.map(addon => (
                <div key={addon._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#555", fontSize: 14 }}>
                  <span>+ {addon.name}</span>
                  <span>{Number(addon.base_price).toLocaleString("vi-VN")}đ</span>
                </div>
              ))}

              <Divider style={{ margin: "16px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#2F2F2F" }}>Tổng tham khảo:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: PRIMARY_COLOR }}>
                  {totalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#666" }}>Tiền cọc (30%):</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#2F2F2F" }}>
                  {Math.round(totalPrice * 0.3).toLocaleString("vi-VN")}đ
                </span>
              </div>
            </Col>

            {/* Ô Ghi chú thêm kéo dài toàn bộ chiều rộng */}
            <Col xs={24}>
              <Divider style={{ margin: "8px 0 20px 0" }} />
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Ghi chú thêm (Tùy chọn)
              </div>
              <Input.TextArea
                rows={3}
                placeholder="Bạn có yêu cầu đặc biệt nào cho buổi chụp không?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ borderRadius: 8, width: "100%" }}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmitRequest}
              loading={submitting}
              style={{
                background: "linear-gradient(135deg, #D4B26F 0%, #BFA16A 100%)",
                borderColor: "#BFA16A",
                color: "#FFFFFF",
                height: 54,
                padding: "0 44px",
                fontSize: 16,
                borderRadius: 8,
                letterSpacing: 1.5,
                fontWeight: 600,
                textTransform: "uppercase",
                boxShadow: "0 4px 14px rgba(191, 161, 106, 0.35)",
              }}
            >
              GỬI YÊU CẦU ĐẶT LỊCH
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;

