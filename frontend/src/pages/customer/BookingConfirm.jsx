import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Result, Button, message, Row, Col, Spin, Divider, Input } from "antd";
import { SendOutlined, LeftOutlined, CheckCircleFilled } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = "http://localhost:5000/api";
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

  // Màn hình thành công sau khi gửi yêu cầu
  if (submitted) {
    return (
      <div className="home-page-container" style={{ minHeight: "100vh", padding: "100px 0 60px", background: "#FAF7F2" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px" }}>
          <div className="glass-panel" style={{ padding: 48, borderRadius: 12, textAlign: "center" }}>
            <div style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(191, 161, 106, 0.12)",
              marginBottom: 24,
            }}>
              <CheckCircleFilled style={{ fontSize: 44, color: PRIMARY_COLOR }} />
            </div>

            <h1 className="font-serif-luxury" style={{ fontSize: 26, color: "#2F2F2F", marginBottom: 16 }}>
              Yêu cầu đã được gửi!
            </h1>

            <p style={{ color: "#666", fontSize: 15, lineHeight: 1.8, marginBottom: 8 }}>
              Studio <strong>Cao Hiển</strong> đã nhận được yêu cầu đặt lịch của bạn.
            </p>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.8, marginBottom: 32 }}>
              Đội ngũ sẽ kiểm tra thông tin, chỉnh đơn nếu cần và <strong>gửi hợp đồng xác nhận qua email</strong> trong thời gian sớm nhất.
              Sau khi nhận hợp đồng, bạn sẽ tiến hành xác nhận và đặt cọc để giữ lịch.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/customer/my-bookings")}
                style={{
                  background: "linear-gradient(135deg, #2F2F2F 0%, #1A1A1A 100%)",
                  borderColor: "#2F2F2F",
                  height: 48,
                  padding: "0 28px",
                  borderRadius: 8,
                  letterSpacing: 0.5,
                }}
              >
                Xem đơn của tôi
              </Button>
              <Button
                size="large"
                onClick={() => navigate("/")}
                style={{ height: 48, padding: "0 28px", borderRadius: 8 }}
              >
                Về trang chủ
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
            <div style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(191, 161, 106, 0.1)",
              color: PRIMARY_COLOR,
              fontSize: 28,
              marginBottom: 16,
            }}>
              <SendOutlined />
            </div>
            <h1 className="font-serif-luxury" style={{ fontSize: 28, color: "#2F2F2F", margin: 0 }}>
              Xác nhận Yêu cầu Đặt lịch
            </h1>
            <p style={{ color: "#777", marginTop: 8, lineHeight: 1.8 }}>
              Kiểm tra lại thông tin trước khi gửi yêu cầu đến studio.
              Studio sẽ xem xét và gửi hợp đồng xác nhận trước khi bạn thanh toán.
            </p>
          </div>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <h3 style={{ fontSize: 14, color: PRIMARY_COLOR, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
                Thông tin lịch chụp
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Hình thức & Buổi chụp</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {bookingData.shooting_type === "STUDIO" ? "Chụp tại Studio" : "Chụp Ngoại cảnh"} — {
                      bookingData.shooting_session === "MORNING" ? "Buổi sáng (08:00–12:00)" :
                      bookingData.shooting_session === "AFTERNOON" ? "Buổi chiều (13:00–17:00)" :
                      "Cả ngày (08:00–17:00)"
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ngày chụp</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {dayjs(bookingData.shoot_date).format("DD/MM/YYYY")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Địa điểm</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>{bookingData.location}</div>
                </div>
                {bookingData.note && (
                  <div>
                    <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ghi chú</div>
                    <div style={{ fontSize: 14, color: "#555", fontStyle: "italic" }}>"{bookingData.note}"</div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Ghi chú thêm (Tùy chọn)</div>
                <Input.TextArea
                  rows={3}
                  placeholder="Bạn có yêu cầu đặc biệt nào cho buổi chụp không?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ borderRadius: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <h3 style={{ fontSize: 14, color: PRIMARY_COLOR, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
                Dịch vụ đã chọn
              </h3>

              {servicesInfo.map((service, index) => (
                <div key={service._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>{index === 0 ? "" : "+ "}{service.name}</span>
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#2F2F2F" }}>Tổng tham khảo:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#2F2F2F" }}>
                  {totalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>

              <div style={{
                background: "rgba(191, 161, 106, 0.06)",
                border: "1px solid rgba(191, 161, 106, 0.2)",
                borderRadius: 8,
                padding: "12px 16px",
              }}>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>💡 Lưu ý về thanh toán</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                  Tổng tiền và tiền cọc <strong>chính xác</strong> sẽ được studio xác nhận trong hợp đồng.
                  Bạn chỉ thanh toán <strong>sau khi đọc và đồng ý hợp đồng</strong>.
                </div>
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSubmitRequest}
              loading={submitting}
              style={{
                background: "linear-gradient(135deg, #2F2F2F 0%, #1A1A1A 100%)",
                borderColor: "#2F2F2F",
                height: 54,
                padding: "0 44px",
                fontSize: 16,
                borderRadius: 8,
                letterSpacing: 1,
              }}
            >
              Gửi yêu cầu đặt lịch
            </Button>
            <div style={{ marginTop: 12, fontSize: 13, color: "#888" }}>
              Studio sẽ xem xét yêu cầu và liên hệ xác nhận với bạn.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;
