/**
 * BookingConfirm.jsx
 * Trang khách xem lại thông tin và gửi yêu cầu đặt lịch.
 */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Radio, Button, message, Row, Col, Spin, Divider, Input, Modal } from "antd";
import { LeftOutlined, CheckCircleFilled } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
const PRIMARY_COLOR = "#BFA16A";
const readSessionJson = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// Trang xác nhận lại thông tin trước khi khách gửi yêu cầu đặt lịch.
const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(
    () => location.state?.bookingData || readSessionJson("pendingBookingData"),
  );
  const [contactForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [contactMode, setContactMode] = useState(() =>
    localStorage.getItem("token") ? "account" : "guest",
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [servicesInfo, setServicesInfo] = useState([]);
  const [addonsInfo, setAddonsInfo] = useState([]);
  const [note, setNote] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [submittedAsAccount, setSubmittedAsAccount] = useState(false);
  const [currentUser] = useState(readStoredUser);
  const [isAuthenticated] = useState(() => Boolean(localStorage.getItem("token") && currentUser));

  useEffect(() => {
    if (location.state?.bookingData) {
      setBookingData(location.state.bookingData);
      sessionStorage.setItem("pendingBookingData", JSON.stringify(location.state.bookingData));
    }
  }, [location.state]);

  useEffect(() => {
    if (!bookingData) {
      navigate("/booking");
      return;
    }

    setNote(bookingData.note || "");
    const savedContact = readSessionJson("pendingBookingContact");
    if (savedContact) {
      contactForm.setFieldsValue(savedContact);
    } else if (isAuthenticated && currentUser) {
      contactForm.setFieldsValue({
        full_name: currentUser.full_name || currentUser.name || "",
        phone: currentUser.phone || "",
        email: currentUser.email || "",
      });
    }
    if (isAuthenticated) {
      setContactMode("account");
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
  }, [bookingData, contactForm, currentUser, isAuthenticated, navigate]);

  if (!bookingData) {
    return null;
  }

  const submitBookingRequest = async (guestOtp = "") => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      if (contactMode === "account" && !token) {
        navigate("/login", { state: { returnTo: "/booking/confirm" } });
        return false;
      }

      const submitPayload = {
        ...bookingData,
        note: note || bookingData.note || "",
      };

      if (contactMode === "guest") {
        const guest = await contactForm.validateFields(["full_name", "phone", "email"]);
        const normalizedEmail = guest.email.trim().toLowerCase();
        submitPayload.customer_name = guest.full_name.trim();
        submitPayload.customer_phone = guest.phone.trim();
        submitPayload.customer_email = normalizedEmail;
        submitPayload.guest_otp = guestOtp.trim();
      }

      const requestConfig = contactMode === "account" && token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      await axios.post(`${API_URL}/bookings/request`, submitPayload, requestConfig);
      setSubmittedAsAccount(contactMode === "account" && Boolean(token));
      sessionStorage.removeItem("pendingBookingData");
      sessionStorage.removeItem("pendingBookingDraft");
      sessionStorage.removeItem("pendingBookingContact");

      setSubmitted(true);
      return true;
    } catch (err) {
      if (err?.errorFields) return;
      console.error("Booking request error:", err);
      if (err.response?.status === 409) {
        if (err.response.data?.code === "TRAVEL_ESTIMATE_CHANGED" && err.response.data.travel_estimate) {
          const refreshedBookingData = { ...bookingData, travel_estimate: err.response.data.travel_estimate };
          setBookingData(refreshedBookingData);
          sessionStorage.setItem("pendingBookingData", JSON.stringify(refreshedBookingData));
          message.info(err.response.data.message || "Phụ thu đã được cập nhật. Vui lòng kiểm tra lại trước khi gửi.");
        } else {
          message.error(err.response.data.message || "Lịch ngày này vừa thay đổi. Vui lòng chọn ngày khác hoặc liên hệ studio.");
        }
      } else {
        message.error(err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu");
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Khách chưa đăng nhập: gửi OTP ngay khi bấm gửi yêu cầu, sau đó xác thực trong hộp thoại.
  const handleSubmitRequest = async () => {
    if (contactMode === "account") {
      await submitBookingRequest();
      return;
    }

    try {
      const guest = await contactForm.validateFields(["full_name", "phone", "email"]);
      const normalizedEmail = guest.email.trim().toLowerCase();
      sessionStorage.setItem("pendingBookingContact", JSON.stringify({
        full_name: guest.full_name,
        phone: guest.phone,
        email: normalizedEmail,
      }));
      setOtpEmail(normalizedEmail);
      setOtpSent(false);
      setOtpModalVisible(true);
      setOtpLoading(true);
      await axios.post(`${API_URL}/contacts/send-otp`, { email: normalizedEmail });
      setOtpSent(true);
      message.success("Mã OTP đã được gửi đến email của bạn.");
    } catch (err) {
      if (err?.errorFields) return;
      setOtpModalVisible(false);
      message.error(err.response?.data?.message || "Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpConfirm = async ({ otp }) => {
    setOtpLoading(true);
    try {
      await axios.post(`${API_URL}/contacts/verify-otp`, {
        email: otpEmail,
        otp: otp.trim(),
      });
      const wasSubmitted = await submitBookingRequest(otp);
      if (wasSubmitted) setOtpModalVisible(false);
    } catch (err) {
      if (!err?.errorFields) {
        message.error(err.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn.");
      }
    } finally {
      setOtpLoading(false);
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
              {submittedAsAccount && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị giá dịch vụ và phụ thu theo báo giá của trang đặt lịch.
  const mainPrice = servicesInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
  const addonsPrice = addonsInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
  const serviceTotal = mainPrice + addonsPrice;
  const travelEstimate = bookingData.travel_estimate || null;
  const travelSurcharge = bookingData.shooting_type === "OUTDOOR" && !travelEstimate?.requiresQuote
    ? Number(travelEstimate?.surchargeAmount || 0)
    : 0;
  const totalPrice = serviceTotal + travelSurcharge;

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
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {bookingData.location || "Chưa chọn — bạn có thể trao đổi với studio sau"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ngày chụp</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {dayjs(bookingData.shoot_date).format("DD/MM/YYYY")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Buổi và giờ chụp</div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
                    Studio sẽ liên hệ để tư vấn và chốt buổi, giờ chụp sau khi nhận yêu cầu.
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

              {bookingData.shooting_type === "OUTDOOR" && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, color: "#555", fontSize: 14 }}>
                  <span>
                    Phụ thu di chuyển{travelEstimate?.distanceKm !== null && travelEstimate?.distanceKm !== undefined ? ` (${travelEstimate.distanceKm} km một chiều)` : ""}
                  </span>
                  <strong>{travelEstimate?.requiresQuote ? "Studio xác nhận" : `${travelSurcharge.toLocaleString("vi-VN")}đ`}</strong>
                </div>
              )}

              <Divider style={{ margin: "16px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#2F2F2F" }}>
                  {travelEstimate?.requiresQuote && bookingData.shooting_type === "OUTDOOR" ? "Tạm tính (chưa gồm phụ thu):" : "Tổng tham khảo:"}
                </span>
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
              {travelEstimate?.requiresQuote && bookingData.shooting_type === "OUTDOOR" && (
                <div style={{ marginTop: 8, color: "#9a6b22", fontSize: 12, lineHeight: 1.6 }}>
                  {travelEstimate.reason || "Địa điểm cần xác minh tuyến hoặc vượt 250 km. Studio sẽ báo phụ thu thực tế trước khi chốt."}
                </div>
              )}
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

          <Divider style={{ margin: "28px 0 22px" }} />
          <div>
            <h3 style={{ fontSize: 14, color: PRIMARY_COLOR, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>
              Thông tin khách hàng
            </h3>
            <Radio.Group
              value={contactMode}
              onChange={(event) => setContactMode(event.target.value)}
              style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}
            >
              <Radio value="guest">Tiếp tục không cần tài khoản</Radio>
              <Radio value="account">Đăng nhập / đăng ký</Radio>
            </Radio.Group>

            {contactMode === "guest" ? (
              <Form
                form={contactForm}
                layout="vertical"
                requiredMark={false}
                initialValues={readSessionJson("pendingBookingContact") || {
                  full_name: currentUser?.full_name || currentUser?.name || "",
                  phone: currentUser?.phone || "",
                  email: currentUser?.email || "",
                }}
                onValuesChange={(_, values) => {
                  sessionStorage.setItem("pendingBookingContact", JSON.stringify(values));
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Họ và tên"
                      name="full_name"
                      rules={[{ required: true, whitespace: true, message: "Vui lòng nhập họ và tên." }]}
                    >
                      <Input size="large" placeholder="Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[
                        { required: true, message: "Vui lòng nhập số điện thoại." },
                        { pattern: /^0[0-9]{9,10}$/, message: "Số điện thoại cần bắt đầu bằng 0 và có 10–11 chữ số." },
                      ]}
                    >
                      <Input size="large" placeholder="0912345678" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[{ required: true, type: "email", message: "Vui lòng nhập email hợp lệ." }]}
                    >
                      <Input size="large" placeholder="email@example.com" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            ) : isAuthenticated ? (
              <div style={{ background: "#fff", border: "1px solid #E8DED2", padding: "16px 18px", color: "#555", lineHeight: 1.8 }}>
                <strong>{currentUser?.full_name || currentUser?.name || "Tài khoản của bạn"}</strong>
                <div>{currentUser?.phone || "Chưa có số điện thoại"}</div>
                <div>{currentUser?.email || ""}</div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button
                  type="primary"
                  onClick={() => navigate("/login", { state: { returnTo: "/booking/confirm" } })}
                  style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
                >
                  ĐĂNG NHẬP
                </Button>
                <Button onClick={() => navigate("/register", { state: { returnTo: "/booking/confirm" } })}>
                  ĐĂNG KÝ
                </Button>
              </div>
            )}
          </div>

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
      <Modal
        title="Xác thực email để gửi yêu cầu đặt lịch"
        open={otpModalVisible}
        footer={null}
        centered
        maskClosable={false}
        destroyOnClose
        onCancel={() => {
          if (otpLoading || submitting) return;
          setOtpModalVisible(false);
          setOtpSent(false);
          otpForm.resetFields();
        }}
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          {otpSent ? (
            <>
              <p style={{ color: "#555", marginBottom: 20 }}>
                Nhập mã <strong>4 chữ số</strong> đã gửi đến <strong style={{ color: PRIMARY_COLOR }}>{otpEmail}</strong>
                <br />
                <span style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>
                  Vui lòng kiểm tra hộp thư Rác (Spam) nếu chưa nhận được email.
                </span>
              </p>
              <Form form={otpForm} onFinish={handleOtpConfirm}>
                <Form.Item
                  name="otp"
                  rules={[
                    { required: true, message: "Vui lòng nhập mã OTP." },
                    { pattern: /^\d{4}$/, message: "Mã OTP gồm 4 chữ số." },
                  ]}
                >
                  <Input
                    autoFocus
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="----"
                    style={{ textAlign: "center", fontSize: 28, letterSpacing: 12, height: 56 }}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={otpLoading || submitting}
                  block
                  style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, height: 46, letterSpacing: 1 }}
                >
                  XÁC NHẬN & GỬI YÊU CẦU ĐẶT LỊCH
                </Button>
              </Form>
            </>
          ) : (
            <div style={{ padding: "20px 0", color: "#555" }}>
              {otpLoading ? "Đang gửi mã OTP đến email của bạn..." : "Đang chuẩn bị gửi OTP..."}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BookingConfirm;

