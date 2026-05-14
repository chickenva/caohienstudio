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
import { useLocation } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const FONT_SERIF = "'Playfair Display', serif";

const Booking = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);

  const appointmentDate = Form.useWatch("appointmentDate", form);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/services");
        setServices(
          Array.isArray(res.data) ? res.data : res.data.services || [],
        );
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      }
    };

    const fetchPhotographers = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/users/photographers",
        );
        setPhotographers(res.data.photographers || []);
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

      form.setFieldsValue(initialValues);
    }
  }, [location, form]);

  const getDepositInfo = () => {
    if (!appointmentDate)
      return { percent: "30%", label: "Đặt sớm", color: "#333", value: 30 };

    const diffDays = dayjs(appointmentDate)
      .startOf("day")
      .diff(dayjs().startOf("day"), "day");

    if (diffDays < 3)
      return {
        percent: "100%",
        label: "Đặt gấp",
        color: "#cf1322",
        value: 100,
      };
    if (diffDays <= 6)
      return {
        percent: "50%",
        label: "Đặt cận ngày",
        color: "#d48806",
        value: 50,
      };
    return { percent: "30%", label: "Đặt sớm", color: "#389e0d", value: 30 };
  };

  const depositInfo = getDepositInfo();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.warning("Vui lòng đăng nhập để đặt lịch!");
        setLoading(false);
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

      const res = await axios.post(
        "http://localhost:5000/api/bookings/create-vnpay",
        submitData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      console.error("Booking error:", err);

      if (err.response?.status === 409) {
        message.error(
          err.response?.data?.message ||
            "Thợ chụp đã có lịch trong khung giờ này",
        );
        return;
      }

      message.error(err.response?.data?.message || "Lỗi khởi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px" }}>
      <Row gutter={[60, 40]} align="middle">
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
                    {s.name} - {s.base_price?.toLocaleString()}đ
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
                {photographers.map((p) => (
                  <Select.Option key={p._id} value={p._id}>
                    {p.full_name}
                    {p.portfolio?.specialties?.length > 0
                      ? ` - ${p.portfolio.specialties.join(", ")}`
                      : ""}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={20}>
              <Col span={12}>
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
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                  color: "#cf1322",
                  fontStyle: "italic",
                }}
              >
                * Sau khi tạo đơn, bạn cần hoàn tất thanh toán trong 15 phút.
                Quá thời gian này, lịch sẽ tự hết hạn và không còn giữ thợ chụp.
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
