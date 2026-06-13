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
  Modal,
  Result,
} from "antd";
import { EnvironmentOutlined, DashboardOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const API_URL = "http://localhost:5000/api";
const FONT_SERIF = "'Playfair Display', serif";

const Booking = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);

  const appointmentDate = Form.useWatch("appointmentDate", form);

  // Guard: kiểm tra role trước (không early return ở đây vì vi phạm rules of hooks)
  const isAdmin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?.role === "ADMIN";
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API_URL}/services`);
        setServices(
          Array.isArray(res.data) ? res.data : res.data.services || [],
        );
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      }
    };

    const fetchPhotographers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/photographers`);
        setPhotographers(
          Array.isArray(res.data) ? res.data : res.data.photographers || [],
        );
      } catch (err) {
        message.error("Không thể tải danh sách thợ chụp");
      }
    };

    fetchServices();
    fetchPhotographers();

    if (location.state) {
      const initialValues = {};

      if (location.state.service_id) {
        initialValues.serviceId = location.state.service_id;
      }

      if (location.state.photographer_id) {
        initialValues.photographerId = location.state.photographer_id;
      }

      if (location.state.location) {
        initialValues.location = location.state.location;
      }

      form.setFieldsValue(initialValues);
    }
  }, [location, form]);

  const getDepositInfo = () => {
    if (!appointmentDate) {
      return {
        percent: "30%",
        label: "Đặt sớm",
        color: "#389e0d",
        value: 30,
      };
    }

    const diffDays = dayjs(appointmentDate)
      .startOf("day")
      .diff(dayjs().startOf("day"), "day");

    if (diffDays < 3) {
      return {
        percent: "100%",
        label: "Đặt gấp",
        color: "#cf1322",
        value: 100,
      };
    }

    if (diffDays <= 6) {
      return {
        percent: "50%",
        label: "Đặt cận ngày",
        color: "#d48806",
        value: 50,
      };
    }

    return {
      percent: "30%",
      label: "Đặt sớm",
      color: "#389e0d",
      value: 30,
    };
  };

  const depositInfo = getDepositInfo();

  const handlePendingBookingError = (data) => {
    Modal.warning({
      title: "Bạn đang có một đơn chờ thanh toán",
      content:
        data?.message ||
        "Vui lòng thanh toán hoặc hủy đơn cũ trước khi tạo đơn mới.",
      okText: "Đi đến đơn hàng",
      cancelText: "Đóng",
      onOk: () => {
        if (data?.booking_id) {
          navigate(`/customer/my-bookings/${data.booking_id}`);
        } else {
          navigate("/customer/my-bookings");
        }
      },
    });
  };

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.warning("Vui lòng đăng nhập để đặt lịch");
        navigate("/login");
        return;
      }

      const submitData = {
        service_id: values.serviceId,
        photographer_ids: [values.photographerId],
        start_time: values.appointmentDate.toISOString(),
        location: values.location,
        note: values.note,
        deposit_percent: depositInfo.value,
      };

      const res = await axios.post(`${API_URL}/bookings/create-vnpay`, submitData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        message.error("Không tìm thấy link thanh toán");
      }
    } catch (err) {
      console.error("Booking error:", err);

      const data = err.response?.data;

      if (data?.code === "HAS_PENDING_BOOKING") {
        handlePendingBookingError(data);
        return;
      }

      if (err.response?.status === 409) {
        message.error(data?.message || "Thợ chụp đã có lịch trong khung giờ này");
        return;
      }

      message.error(data?.message || "Lỗi khởi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isAdmin ? (
        <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
          <Result
            status="403"
            title="Không có quyền truy cập"
            subTitle="Tài khoản quản trị không thể đặt lịch qua luồng khách hàng. Vui lòng dùng chức năng Tạo đơn đặt hộ trong trang quản lý."
            extra={
              <Button
                type="primary"
                icon={<DashboardOutlined />}
                onClick={() => navigate("/admin/orders/create")}
                style={{ background: "#2f2f2f", border: "none" }}
              >
                Đi đến Tạo đơn đặt hộ
              </Button>
            }
          />
        </div>
      ) : (
    <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px" }}>
      <Row gutter={[60, 40]} align="middle">
        <Col xs={24} md={10}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontFamily: FONT_SERIF, fontSize: "48px" }}>
              Đặt lịch chụp
            </h1>

            <p style={{ color: "#777", lineHeight: 1.7 }}>
              Chọn dịch vụ, nhiếp ảnh gia và thời gian phù hợp. Sau khi tạo đơn,
              bạn cần hoàn tất thanh toán trong 15 phút để giữ lịch.
            </p>

            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552"
              alt="booking"
              style={{
                width: "100%",
                marginTop: "30px",
                borderRadius: "14px",
                objectFit: "cover",
              }}
            />
          </div>
        </Col>

        <Col xs={24} md={14}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="CHỌN GÓI DỊCH VỤ"
              name="serviceId"
              rules={[{ required: true, message: "Vui lòng chọn gói dịch vụ" }]}
            >
              <Select placeholder="Chọn gói dịch vụ bạn muốn...">
                {services.map((service) => (
                  <Select.Option key={service._id} value={service._id}>
                    {service.name} -{" "}
                    {Number(service.base_price || 0).toLocaleString("vi-VN")}đ
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="CHỌN THỢ CHỤP"
              name="photographerId"
              rules={[{ required: true, message: "Vui lòng chọn thợ chụp" }]}
            >
              <Select placeholder="Chọn thợ chụp bạn muốn...">
                {photographers.map((photographer) => (
                  <Select.Option key={photographer._id} value={photographer._id}>
                    {photographer.full_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={20}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="NGÀY/GIỜ CHỤP"
                  name="appointmentDate"
                  rules={[{ required: true, message: "Chọn ngày giờ chụp" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY HH:mm"
                    showTime={{
                      format: "HH:mm",
                      minuteStep: 30,
                    }}
                    disabledDate={(date) => date && date < dayjs().startOf("day")}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
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

            <Form.Item label="GHI CHÚ" name="note">
              <Input.TextArea
                rows={4}
                placeholder="Bạn có yêu cầu đặc biệt gì cho buổi chụp không?"
              />
            </Form.Item>

            <div
              style={{
                marginBottom: "20px",
                padding: "16px",
                background: "#fdfaf6",
                border: `1px solid ${depositInfo.color}`,
                borderRadius: "10px",
              }}
            >
              <p style={{ margin: 0, fontSize: "16px" }}>
                Mức thanh toán áp dụng:{" "}
                <strong style={{ color: depositInfo.color }}>
                  {depositInfo.percent}
                </strong>
                <span style={{ marginLeft: 8, fontSize: "14px", color: "#666" }}>
                  ({depositInfo.label})
                </span>
              </p>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#cf1322",
                }}
              >
                Sau khi tạo đơn, bạn cần hoàn tất thanh toán trong 15 phút. Quá
                thời gian này, đơn sẽ tự chuyển sang trạng thái đã hủy.
              </p>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: "#9a8a78",
                height: "50px",
                fontSize: "15px",
                fontWeight: "bold",
                border: "none",
                borderRadius: 0,
                letterSpacing: "1px",
              }}
            >
              TIẾN HÀNH THANH TOÁN
            </Button>
          </Form>
        </Col>
      </Row>
    </div>
      )}
    </>
  );
};

export default Booking;