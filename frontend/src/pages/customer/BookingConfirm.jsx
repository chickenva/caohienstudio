import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Result, Button, message, Card, Row, Col, Spin, Divider, Input, Modal } from "antd";
import { CheckCircleOutlined, LeftOutlined, CreditCardOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = "http://localhost:5000/api";

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [servicesInfo, setServicesInfo] = useState([]);
  const [addonsInfo, setAddonsInfo] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!bookingData) {
      navigate("/booking");
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Fetch main services
        const mainIds = bookingData.original_service_ids || [bookingData.service_id];
        const mainServices = [];
        for (const id of mainIds) {
          const res = await axios.get(`${API_URL}/services/${id}`);
          mainServices.push(res.data);
        }
        setServicesInfo(mainServices);

        // Fetch addons (filter out those that are main services)
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

  const handlePayment = async () => {
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
        note: note,
      };

      const res = await axios.post(
        `${API_URL}/bookings/create-vnpay`,
        submitPayload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data && res.data.paymentUrl) {
        message.loading("Đang chuyển hướng đến cổng thanh toán VNPay...", 1.5);
        setTimeout(() => {
          window.location.href = res.data.paymentUrl;
        }, 1500);
      } else {
        message.error("Không thể tạo URL thanh toán");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      if (err.response?.status === 409) {
        Modal.error({
          title: "Lịch Trùng",
          content: err.response.data.message || "Đã có khách hàng đặt lịch trùng khung giờ của bạn, vui lòng chọn lại thời gian.",
          onOk: () => navigate("/booking")
        });
      } else {
        message.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán");
      }
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

  // Calculate totals
  const mainPrice = servicesInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
  const addonsPrice = addonsInfo.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
  const totalPrice = mainPrice + addonsPrice;
  const discountAmount = bookingData.discount_amount || 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);
  const depositPercent = bookingData.deposit_percent || 30;
  const depositAmount = (finalPrice * depositPercent) / 100;

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
            <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", width: 64, height: 64, borderRadius: "50%", background: "rgba(191, 161, 106, 0.1)", color: "#BFA16A", fontSize: 32, marginBottom: 16 }}>
              <CheckCircleOutlined />
            </div>
            <h1 className="font-serif-luxury" style={{ fontSize: 28, color: "#2F2F2F", margin: 0 }}>Xác nhận Đặt lịch</h1>
            <p style={{ color: "#777", marginTop: 8 }}>Vui lòng kiểm tra lại thông tin trước khi thanh toán</p>
          </div>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <h3 style={{ fontSize: 16, color: "#BFA16A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Thông tin lịch chụp</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Thời gian</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {bookingData.end_time ? (
                      `${dayjs(bookingData.start_time).format("HH:mm - DD/MM/YYYY")} đến ${dayjs(bookingData.end_time).format("DD/MM/YYYY")}`
                    ) : (
                      dayjs(bookingData.start_time).format("HH:mm - DD/MM/YYYY")
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Địa điểm</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2F2F2F" }}>
                    {bookingData.location}
                  </div>
                </div>
                {bookingData.note && (
                  <div>
                    <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Ghi chú</div>
                    <div style={{ fontSize: 15, fontWeight: 400, color: "#555", fontStyle: "italic" }}>
                      "{bookingData.note}"
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>Ghi chú thêm (Tùy chọn)</div>
                <Input.TextArea
                  rows={4}
                  placeholder="Bạn có yêu cầu đặc biệt gì cho buổi chụp không?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ borderRadius: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
               <h3 style={{ fontSize: 16, color: "#BFA16A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Dịch vụ đã chọn</h3>
               
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
               
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                 <span style={{ fontSize: 15, color: "#555" }}>Tổng cộng dịch vụ:</span>
                 <span style={{ fontSize: 16, fontWeight: 600 }}>{totalPrice.toLocaleString("vi-VN")}đ</span>
               </div>

               {discountAmount > 0 && (
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, color: "#cf1322" }}>
                   <span style={{ fontSize: 15 }}>Giảm giá ({bookingData.coupon_code}):</span>
                   <span style={{ fontSize: 16, fontWeight: 600 }}>-{discountAmount.toLocaleString("vi-VN")}đ</span>
                 </div>
               )}

               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                 <span style={{ fontSize: 15, color: "#555", fontWeight: 600 }}>Tổng thanh toán:</span>
                 <span style={{ fontSize: 18, fontWeight: 700, color: "#2F2F2F" }}>{finalPrice.toLocaleString("vi-VN")}đ</span>
               </div>

               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(191, 161, 106, 0.08)", padding: "12px 16px", borderRadius: 8, marginTop: 12 }}>
                 <div>
                   <span style={{ fontSize: 16, fontWeight: 600, color: "#2F2F2F", display: "block" }}>Cọc trước ({depositPercent}%)</span>
                   <span style={{ fontSize: 12, color: "#777" }}>Để giữ chỗ cho buổi chụp</span>
                 </div>
                 <span style={{ fontSize: 24, fontWeight: 700, color: "#BFA16A" }}>
                   {depositAmount.toLocaleString("vi-VN")}đ
                 </span>
               </div>
             </Col>
          </Row>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<CreditCardOutlined />}
              onClick={handlePayment}
              loading={submitting}
              style={{ 
                background: "linear-gradient(135deg, #2F2F2F 0%, #1A1A1A 100%)", 
                borderColor: "#2F2F2F", 
                height: 54, 
                padding: "0 40px", 
                fontSize: 16, 
                borderRadius: 8,
                letterSpacing: 1
              }}
            >
              Thanh toán VNPay
            </Button>
            <div style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
              Bằng việc xác nhận, bạn đồng ý với các chính sách đặt lịch của Cao Hiển Studio.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;
