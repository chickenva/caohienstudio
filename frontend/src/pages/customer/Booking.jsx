import React, { useState, useEffect } from "react";
import {
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  Input,
  Button,
  message,
} from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

// Khai báo Font chữ nếu bạn chưa định nghĩa global
const FONT_SERIF = "'Playfair Display', serif";

const Booking = () => {
  const [form] = Form.useForm();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Theo dõi ngày chọn để cập nhật UI mức cọc ngay lập tức
  const appointmentDate = Form.useWatch("appointmentDate", form);

  // 1. Lấy danh sách gói dịch vụ từ Backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/services");
        setServices(res.data);
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      }
    };
    fetchServices();
  }, []);

  // 2. Logic tính toán mức cọc hiển thị
  const getDepositInfo = () => {
    if (!appointmentDate)
      return { percent: "30%", label: "Đặt sớm", color: "#333" };

    const diffDays = dayjs(appointmentDate)
      .startOf("day")
      .diff(dayjs().startOf("day"), "day");

    if (diffDays < 3)
      return { percent: "100%", label: "Đặt gấp", color: "#cf1322" };
    if (diffDays <= 6)
      return { percent: "50%", label: "Đặt cận ngày", color: "#d48806" };
    return { percent: "30%", label: "Đặt sớm", color: "#389e0d" };
  };

  const depositInfo = getDepositInfo();

  // 3. Xử lý khi nhấn nút Thanh toán
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.warning("Vui lòng đăng nhập để đặt lịch!");
        return;
      }

      // Gọi API tạo đơn và lấy Link VNPay
      const res = await axios.post(
        "http://localhost:5000/api/bookings/create-vnpay",
        values,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.paymentUrl) {
        // Chuyển hướng sang cổng thanh toán VNPay
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      console.error("Booking error:", err);
      message.error(err.response?.data?.message || "Lỗi khởi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px" }}>
      <Row gutter={[60, 40]} align="middle">
        {/* Bên trái: Hình ảnh & Tiêu đề */}
        <Col xs={24} md={10}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontFamily: FONT_SERIF, fontSize: "48px" }}>
              Đặt lịch chụp
            </h1>
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552"
              alt="booking-img"
              style={{ width: "100%", marginTop: "30px", borderRadius: "8px" }}
            />
          </div>
        </Col>

        {/* Bên phải: Form đặt lịch */}
        <Col xs={24} md={14}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="CHỌN GÓI DỊCH VỤ"
              name="serviceId"
              rules={[{ required: true, message: "Vui lòng chọn gói dịch vụ" }]}
            >
              <Select placeholder="Chọn gói dịch vụ bạn muốn...">
                {services.map((s) => (
                  <Select.Option key={s._id} value={s._id}>
                    {s.name} - {s.price?.toLocaleString()}đ
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={20}>
              <Col span={12}>
                <Form.Item
                  label="NGÀY CHỤP"
                  name="appointmentDate"
                  rules={[{ required: true, message: "Chọn ngày chụp" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    disabledDate={(d) => d && d < dayjs().startOf("day")}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ĐỊA ĐIỂM"
                  name="location"
                  rules={[{ required: true, message: "Nhập địa điểm" }]}
                >
                  <Input
                    prefix={<EnvironmentOutlined />}
                    placeholder="Ví dụ: Studio Cao Hien"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="GHI CHÚ (YÊU CẦU RIÊNG)" name="note">
              <Input.TextArea
                rows={4}
                placeholder="Bạn có yêu cầu đặc biệt gì cho buổi chụp không?"
              />
            </Form.Item>

            {/* Thông báo mức cọc động */}
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                background: "#fdfaf6",
                border: `1px solid ${depositInfo.color}`,
                borderRadius: "8px",
              }}
            >
              <p style={{ margin: 0, fontSize: "16px" }}>
                Mức đặt cọc áp dụng:{" "}
                <strong style={{ color: depositInfo.color }}>
                  {depositInfo.percent}
                </strong>
                <span
                  style={{ marginLeft: 8, fontSize: "14px", color: "#666" }}
                >
                  ({depositInfo.label})
                </span>
              </p>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                {depositInfo.label === "Đặt gấp"
                  ? "* Lưu ý: Đơn đặt gấp (< 3 ngày) sẽ thanh toán 100% và không hỗ trợ hoàn tiền."
                  : "* Hỗ trợ hoàn cọc 100% nếu bạn hủy đơn trong vòng 12h kể từ lúc thanh toán."}
              </p>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: "#333",
                height: "50px",
                fontSize: "16px",
                fontWeight: "bold",
                border: "none",
              }}
            >
              TIẾN HÀNH THANH TOÁN ĐẶT CỌC
            </Button>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default Booking;
