/**
 * Contact.jsx
 * Trang liên hệ tư vấn: form OTP email, thông tin dịch vụ/lịch.
 */
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Form, Input, Button, Row, Col, message, Select, DatePicker, TimePicker, Modal, Switch, Checkbox, AutoComplete
} from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  SendOutlined,
  MessageOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const CATEGORY_LABELS = {
  ALL: "Tất cả dịch vụ",
  TRADITIONAL: "Truyền thống",
  PHOTOJOURNALISM: "Phóng sự",
  COMBO: "Kết hợp",
  PRINT: "Ảnh / Photobook",
};

const FORECAST_LOCATIONS = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh",
  "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ",
  "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng",
  "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
  "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình",
  "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

// Trang liên hệ/tư vấn cho lịch nhiều ngày hoặc nhu cầu chưa chốt đơn.
const Contact = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Dịch vụ
  const [allServices, setAllServices] = useState([]);
  const [mainServices, setMainServices] = useState([]);
  const [addonServices, setAddonServices] = useState([]);
  const selectedServiceIds = Form.useWatch("service_ids", form) || [];
  const selectedAddonIds = Form.useWatch("addon_ids", form) || [];

  // OTP (khách chưa đăng nhập)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isStudio, setIsStudio] = useState(false);

  // States & logic cho AutoComplete địa chỉ
  const [addressOptions, setAddressOptions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleAddressSearch = (searchText) => {
    if (!searchText || searchText.trim().length < 3) {
      setAddressOptions([]);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const selectedArea = form.getFieldValue("location_area");
        const cityName = selectedArea ? selectedArea.replace("TP. ", "") : "";
        const query = encodeURIComponent(`${searchText} ${cityName}`.trim());
        const url = `https://photon.komoot.io/api/?q=${query}&limit=20&lang=default&bbox=102.14,8.56,109.46,23.39`;
        const res = await axios.get(url);
        if (res.data && res.data.features) {
          const suggestions = res.data.features
            .filter((f) => f.properties.countrycode === "VN")
            .map((f, idx) => {
              const props = f.properties;
              const name = props.name || "";
              const street = props.street || "";
              const district = props.district || "";
              const city = props.city || props.state || "";
              const country = props.country || "";

              const parts = [name, street, district, city, country].filter(Boolean);
              const uniqueParts = [];
              parts.forEach(p => {
                if (!uniqueParts.some(up => up.toLowerCase().trim() === p.toLowerCase().trim())) {
                  uniqueParts.push(p);
                }
              });

              const label = uniqueParts.join(", ");
              return {
                value: label,
                label: label,
                key: `${label}-${idx}`,
              };
            })
            .filter(item => {
              if (cityName) {
                return item.label.toLowerCase().includes(cityName.toLowerCase());
              }
              return true;
            });
          setAddressOptions(suggestions);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm địa chỉ:", err);
      }
    }, 400);

    setSearchTimeout(timeout);
  };
  const [pendingValues, setPendingValues] = useState(null);

  // Mới thêm: Chế độ Studio & Chế độ chọn nhiều ngày
  const [isRangeMode, setIsRangeMode] = useState(false);

  // ===== Khởi tạo =====
  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    // Kiểm tra đăng nhập
    const token = localStorage.getItem("token");
    const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    if (token && user) {
      setIsLoggedIn(true);
      form.setFieldsValue({
        name: user.full_name || user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }

    // Fetch danh sách dịch vụ
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API_URL}/services`);
        const services = Array.isArray(res.data) ? res.data : res.data.services || [];
        setAllServices(services);
        setMainServices(services.filter(s => s.category !== "PRINT" &&
          !["gói lẻ lễ tối", "gói thêm flycam"].some(k => (s.name || "").toLowerCase().includes(k))
        ));
        setAddonServices(services.filter(s => s.category === "PRINT" ||
          ["gói lẻ lễ tối", "gói thêm flycam"].some(k => (s.name || "").toLowerCase().includes(k))
        ));
      } catch {
        // Không cần báo lỗi - form vẫn dùng được
      }
    };
    fetchServices();

    return () => { document.body.style.backgroundColor = ""; };
  }, [form]);

  // ===== Map state từ Booking page (chế độ nhiều ngày) =====
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    const patchValues = {};

    if (state.serviceIds && state.serviceIds.length > 0) {
      patchValues.service_ids = state.serviceIds;
    }
    if (state.addonIds && state.addonIds.length > 0) {
      patchValues.addon_ids = state.addonIds;
    }
    if (state.weatherCity) {
      patchValues.location_area = state.weatherCity;
    }
    if (state.location) {
      patchValues.location_detail = state.location;
      if (state.location === "Cao Hiển Studio") setIsStudio(true);
    }

    // Nếu từ Booking truyền sang state.isMultiDay -> tự động bật RangeMode
    if (state.isMultiDay) {
      setIsRangeMode(true);
      if (state.startDate && state.endDate) {
        patchValues.shoot_date = [dayjs(state.startDate), dayjs(state.endDate)];
      }
    } else if (state.startDate) {
      patchValues.shoot_date = dayjs(state.startDate);
    }

    if (state.startTime) {
      const [h, m] = state.startTime.split(":");
      patchValues.shoot_time = dayjs().hour(parseInt(h)).minute(parseInt(m));
    }

    // Tạo message mô tả sẵn
    if (state.isMultiDay) {
      const dateRange = state.startDate && state.endDate
        ? `từ ${state.startDate} đến ${state.endDate}`
        : (state.startDate || "");
      patchValues.message = `Tôi muốn tư vấn về lịch chụp nhiều ngày ${dateRange}. Vui lòng liên hệ lại để tư vấn chi tiết.`;
    } else if (state.contactMessage) {
      patchValues.message = state.contactMessage;
    }

    setTimeout(() => form.setFieldsValue(patchValues), 200);
  }, [location.state, form]);

  // ===== Scroll reveal =====
  useEffect(() => {
    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("active"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    revealElements.forEach((el) => observer.observe(el));
    return () => revealElements.forEach((el) => observer.unobserve(el));
  }, []);

  // ===== Addon services dựa theo service chính chọn =====
  const getAddonList = () => {
    const selected = allServices.filter(s => selectedServiceIds.includes(s._id));
    const addons = [...allServices.filter(s => s.category === "PRINT")];
    selected.forEach(s => {
      const name = (s.name || "").toLowerCase();
      if (name.includes("chụp truyền thống") || name.includes("combo")) {
        const item = allServices.find(a => (a.name || "").toLowerCase().includes("gói lẻ lễ tối"));
        if (item && !addons.find(a => a._id === item._id)) addons.push(item);
      }
      if (name.includes("quay") || name.includes("combo")) {
        const item = allServices.find(a => (a.name || "").toLowerCase().includes("gói thêm flycam"));
        if (item && !addons.find(a => a._id === item._id)) addons.push(item);
      }
    });
    return addons;
  };

  // ===== Submit =====
  const buildPayload = (values) => {
    const selectedMains = allServices.filter(s => (values.service_ids || []).includes(s._id));
    const selectedAddons = allServices.filter(s => (values.addon_ids || []).includes(s._id));
    let shootDateFormatted = "";
    if (values.shoot_date) {
      if (Array.isArray(values.shoot_date)) {
        shootDateFormatted = `${dayjs(values.shoot_date[0]).format("DD/MM/YYYY")} - ${dayjs(values.shoot_date[1]).format("DD/MM/YYYY")}`;
      } else {
        shootDateFormatted = dayjs(values.shoot_date).format("DD/MM/YYYY");
      }
    }

    return {
      name: values.name,
      phone: values.phone,
      email: values.email || "",
      message: values.message,
      service_names: selectedMains.map(s => s.name).join(", "),
      addon_names: selectedAddons.map(s => s.name).join(", "),
      location_area: form.getFieldValue("location_area") || values.location_area || "",
      location_detail: form.getFieldValue("location_detail") || values.location_detail || "",
      shoot_date: shootDateFormatted,
      shoot_time: values.shoot_time ? dayjs(values.shoot_time).format("HH:mm") : "",
    };
  };

  const doSubmit = async (payload) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/contacts`, payload);
      message.success("Cảm ơn bạn! Cao Hiển Studio đã nhận được lời nhắn. Nhân viên sẽ liên hệ tư vấn trong vòng 24h.");
      form.resetFields();
      // Nếu đã đăng nhập, điền lại thông tin user
      const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
      if (isLoggedIn && user) {
        form.setFieldsValue({ name: user.full_name || user.name || "", phone: user.phone || "", email: user.email || "" });
      }
    } catch (err) {
      message.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    if (isLoggedIn) {
      // Đã đăng nhập → submit thẳng
      await doSubmit(buildPayload(values));
    } else {
      // Chưa đăng nhập → yêu cầu OTP
      if (!values.email) {
        message.warning("Vui lòng nhập email để xác thực trước khi gửi.");
        return;
      }
      setPendingValues(values);
      setOtpModalVisible(true);
      // Gửi OTP
      setOtpSent(false);
      setOtpLoading(true);
      try {
        await axios.post(`${API_URL}/contacts/send-otp`, { email: values.email });
        setOtpSent(true);
        message.success("Đã gửi mã OTP đến email của bạn!");
      } catch (err) {
        message.error(err.response?.data?.message || "Không gửi được OTP. Vui lòng thử lại.");
        setOtpModalVisible(false);
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleOtpVerify = async (otpValues) => {
    setOtpLoading(true);
    try {
      await axios.post(`${API_URL}/contacts/verify-otp`, {
        email: pendingValues.email,
        otp: otpValues.otp,
      });
      setOtpModalVisible(false);
      await doSubmit(buildPayload(pendingValues));
      setPendingValues(null);
    } catch (err) {
      message.error("Mã OTP không chính xác!");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="home-page-container" style={{ background: "#FAF7F2", minHeight: "100vh", width: "100%", paddingBottom: "60px" }}>
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "45%", right: "5%" }}></div>

      {/* HEADER */}
      <div className="scroll-reveal" style={{ textAlign: "center", padding: "100px 20px 50px 20px", maxWidth: "800px", margin: "0 auto" }}>
        <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
          CONTACT US
        </span>
        <h1 className="font-serif-luxury" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 300, margin: "0 0 16px 0", color: "#1F1F1F", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          Liên Hệ{" "}
          <span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>Với Chúng Tôi</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "0 auto 20px" }}>
          <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
          <div style={{ width: 6, height: 6, background: PRIMARY_COLOR, transform: "rotate(45deg)" }} />
          <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
        </div>
        <p style={{ color: "#555555", fontSize: "15.5px", fontWeight: "300", letterSpacing: "0.5px" }}>
          Hãy để lại lời nhắn hoặc liên hệ trực tiếp, chúng tôi sẽ hỗ trợ tư vấn chi tiết cho ngày trọng đại của bạn.
        </p>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 60px 20px" }}>
        <Row gutter={[60, 60]}>
          {/* CỘT TRÁI: THÔNG TIN STUDIO */}
          <Col xs={24} md={10} className="scroll-reveal stagger-1">
            <h3 className="font-serif-luxury" style={{ fontSize: "28px", fontWeight: "300", marginBottom: "35px", color: "#2F2F2F" }}>
              Thông Tin Studio
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px", color: "#555555", fontSize: "14.5px", fontWeight: "300" }}>
              {[
                { icon: <EnvironmentOutlined style={{ fontSize: 20, color: PRIMARY_COLOR, marginTop: 4 }} />, label: "Địa Chỉ", value: "34B4 TL 887, phường An Hội, Vĩnh Long" },
                { 
                  icon: <PhoneOutlined style={{ fontSize: 20, color: PRIMARY_COLOR, marginTop: 4 }} />, 
                  label: "Hotline / Zalo", 
                  value: (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
                      <span style={{ color: "#2F2F2F" }}>(+84) 979 7676 02</span>
                      <a
                        href={import.meta.env.VITE_ZALO_URL || "https://zalo.me/0979767602"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: PRIMARY_COLOR,
                          fontWeight: 600,
                          fontSize: "12.5px",
                          textDecoration: "underline",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Chat Zalo ngay
                      </a>
                    </div>
                  )
                },
                { icon: <MailOutlined style={{ fontSize: 20, color: PRIMARY_COLOR, marginTop: 4 }} />, label: "Email", value: "caohienstudio@gmail.com" },
                { icon: <ClockCircleOutlined style={{ fontSize: 20, color: PRIMARY_COLOR, marginTop: 4 }} />, label: "Giờ Làm Việc", value: "Thứ 2 - Chủ Nhật: 09:00 AM - 05:00 PM" },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
                  {icon}
                  <div>
                    <strong style={{ display: "block", color: "#2F2F2F", marginBottom: "6px", fontSize: "12px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "600" }}>
                      {label}
                    </strong>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* BẢN ĐỒ */}
            <div style={{ marginTop: "35px", overflow: "hidden", border: "1px solid #E8DED2" }}>
              <iframe
                title="CaoHien Studio Map"
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d583.697091199096!2d106.3687414401994!3d10.210644960730347!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTDCsDEyJzM5LjgiTiAxMDbCsDIyJzA4LjEiRQ!5e0!3m2!1svi!2s!4v1778813420109!5m2!1svi!2s"
                width="100%" height="220"
                style={{ border: 0, display: "block" }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* THẺ TƯ VẤN ZALO (KHÔNG DÙNG ICON ZALO) */}
            <div
              style={{
                marginTop: "20px",
                padding: "16px 20px",
                background: "#FAF7F2",
                border: "1px solid #E8DED2",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#2F2F2F", letterSpacing: "0.5px" }}>
                  TƯ VẤN TRỰC TIẾP QUA ZALO
                </div>
                <div style={{ fontSize: "12.5px", color: "#666", marginTop: "4px" }}>
                  Hotline / Zalo: 0979 7676 02
                </div>
              </div>
              <a
                href={import.meta.env.VITE_ZALO_URL || "https://zalo.me/0979767602"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: PRIMARY_COLOR,
                  color: "#fff",
                  padding: "8px 18px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Nhắn Zalo
              </a>
            </div>
          </Col>

          {/* CỘT PHẢI: FORM */}
          <Col xs={24} md={14} className="scroll-reveal stagger-2">
            <div className="glass-panel" style={{ background: "rgba(255, 255, 255, 0.85)", padding: "40px", borderRadius: "0px" }}>



              <Form form={form} layout="vertical" onFinish={onFinish}>

                {/* THÔNG TIN CÁ NHÂN */}
                <div style={{ marginBottom: 6, fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>Thông tin liên lạc</div>
                <div style={{ height: 1, background: "#E8DED2", marginBottom: 20 }} />

                <Form.Item label="Họ và Tên" name="name" rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}>
                  <Input size="large" placeholder="Nguyễn Văn A" style={{ borderRadius: "0px" }} />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Số Điện Thoại" name="phone" rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}>
                      <Input size="large" placeholder="0912345678" style={{ borderRadius: "0px" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={isLoggedIn ? "Email" : "Email"}
                      name="email"
                      rules={[
                        { required: true, message: "Vui lòng nhập email!" },
                        { type: "email", message: "Email không hợp lệ!" }
                      ]}
                    >
                      <Input size="large" placeholder="email@gmail.com" style={{ borderRadius: "0px" }} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* THÔNG TIN DỊCH VỤ */}
                <div style={{ marginTop: 8, marginBottom: 6, fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>Thông tin dịch vụ quan tâm (tùy chọn)</div>
                <div style={{ height: 1, background: "#E8DED2", marginBottom: 20 }} />

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Gói dịch vụ chính" name="service_ids">
                      <Select
                        mode="multiple"
                        placeholder="Chọn gói dịch vụ..."
                        size="large"
                        style={{ borderRadius: 0 }}
                        maxTagCount={1}
                        maxTagPlaceholder={(o) => `+${o.length}`}
                        allowClear
                        optionLabelProp="label"
                        popupClassName="booking-select-dropdown"
                      >
                        {mainServices.map(s => (
                          <Select.Option key={s._id} value={s._id} label={s.name}>
                            <Checkbox checked={selectedServiceIds.includes(s._id)} style={{ marginRight: 8 }} className="gold-checkbox" />
                            {s.name} — {Number(s.base_price || 0).toLocaleString("vi-VN")}đ
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Gói dịch vụ đi kèm" name="addon_ids">
                      <Select
                        mode="multiple"
                        placeholder="Chọn gói đi kèm..."
                        size="large"
                        style={{ borderRadius: 0 }}
                        maxTagCount={1}
                        maxTagPlaceholder={(o) => `+${o.length}`}
                        allowClear
                        disabled={selectedServiceIds.length === 0}
                        optionLabelProp="label"
                        popupClassName="booking-select-dropdown"
                      >
                        {getAddonList().map(s => (
                          <Select.Option key={s._id} value={s._id} label={s.name}>
                            <Checkbox checked={selectedAddonIds.includes(s._id)} style={{ marginRight: 8 }} className="gold-checkbox" />
                            {s.name} (+{Number(s.base_price || 0).toLocaleString("vi-VN")}đ)
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Khu vực chụp" name="location_area">
                      <Select
                        showSearch
                        placeholder="Chọn tỉnh / thành..."
                        size="large"
                        style={{ borderRadius: 0 }}
                        allowClear
                        disabled={isStudio}
                        filterOption={(input, option) =>
                          (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {FORECAST_LOCATIONS.map(city => (
                          <Select.Option key={city} value={city}>{city}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span>Địa điểm chi tiết</span>
                          <Checkbox
                            className="gold-checkbox"
                            checked={isStudio}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsStudio(checked);
                              if (checked) {
                                form.setFieldsValue({ 
                                  location_area: "Vĩnh Long",
                                  location_detail: "Cao Hiển Studio" 
                                });
                              } else {
                                form.setFieldsValue({ 
                                  location_area: undefined,
                                  location_detail: undefined 
                                });
                              }
                            }}
                            style={{ fontSize: 13, fontWeight: "normal", textTransform: "none", color: "#BFA16A" }}
                          >
                            Chụp tại studio
                          </Checkbox>
                        </div>
                      }
                      name="location_detail"
                    >
                      <AutoComplete
                        options={addressOptions}
                        onSearch={handleAddressSearch}
                        popupClassName="booking-select-dropdown"
                        disabled={isStudio}
                      >
                        <Input size="large" prefix={<EnvironmentOutlined style={{ color: "#BFA16A" }} />} placeholder="VD: Studio Cao Hiển, 34B4 TL 887..." style={{ borderRadius: 0 }} disabled={isStudio} />
                      </AutoComplete>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span>Ngày dự kiến chụp</span>
                          <Switch
                            checkedChildren="Nhiều ngày"
                            unCheckedChildren="1 ngày"
                            checked={isRangeMode}
                            onChange={(checked) => {
                              setIsRangeMode(checked);
                              form.setFieldsValue({ shoot_date: null });
                            }}
                            style={{ background: isRangeMode ? "#BFA16A" : "#ccc", transform: "scale(0.85)", transformOrigin: "right center" }}
                          />
                        </div>
                      }
                      name="shoot_date"
                    >
                      {isRangeMode ? (
                        <DatePicker.RangePicker
                          size="large"
                          format="DD/MM/YYYY"
                          placeholder={["Từ ngày", "Đến ngày"]}
                          style={{ width: "100%", borderRadius: 0 }}
                          disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
                        />
                      ) : (
                        <DatePicker
                          size="large"
                          format="DD/MM/YYYY"
                          placeholder="Chọn ngày..."
                          style={{ width: "100%", borderRadius: 0 }}
                          disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
                        />
                      )}
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Giờ chụp dự kiến" name="shoot_time">
                      <TimePicker
                        size="large"
                        format="HH:mm"
                        placeholder="Chọn giờ..."
                        minuteStep={15}
                        style={{ width: "100%", borderRadius: 0 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* LỜI NHẮN */}
                <div style={{ marginTop: 8, marginBottom: 6, fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>Lời nhắn</div>
                <div style={{ height: 1, background: "#E8DED2", marginBottom: 20 }} />

                <Form.Item
                  label="Nội dung lời nhắn"
                  name="message"
                  rules={[{ required: true, message: "Vui lòng nhập nội dung lời nhắn!" }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Tôi muốn tư vấn về gói chụp..."
                    style={{ borderRadius: "0px" }}
                  />
                </Form.Item>

                {!isLoggedIn && (
                  <div style={{ background: "rgba(191,161,106,0.06)", border: "1px solid rgba(191,161,106,0.2)", padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#777" }}>
                    🔒 Bạn chưa đăng nhập. Sau khi điền form, hệ thống sẽ gửi mã OTP đến email của bạn để xác thực trước khi gửi.
                  </div>
                )}

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    background: PRIMARY_COLOR, color: "#FFFFFF", border: "none",
                    borderRadius: "0px", height: "50px", width: "100%",
                    fontSize: "14px", fontWeight: "500", letterSpacing: "1.5px",
                    boxShadow: "0 4px 15px rgba(191, 161, 106, 0.2)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  {isLoggedIn ? "GỬI YÊU CẦU TƯ VẤN" : "GỬI & XÁC THỰC QUA EMAIL"}
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </div>

      {/* OTP MODAL */}
      <Modal
        title={
          <span style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Xác thực email để gửi liên hệ
          </span>
        }
        open={otpModalVisible}
        footer={null}
        centered
        onCancel={() => { setOtpModalVisible(false); setPendingValues(null); }}
        maskClosable={false}
        destroyOnClose
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          {otpSent ? (
            <>
              <p style={{ color: "#555", marginBottom: 20 }}>
                Nhập mã <strong>4 chữ số</strong> đã được gửi đến{" "}
                <strong style={{ color: PRIMARY_COLOR }}>{pendingValues?.email}</strong>
                <br /><span style={{ fontSize: "12px", color: "#888", fontStyle: "italic" }}>* Vui lòng kiểm tra hộp thư Rác (Spam) nếu không nhận được email.</span>
              </p>
              <Form onFinish={handleOtpVerify}>
                <Form.Item name="otp" rules={[{ required: true, message: "Bắt buộc nhập OTP" }]}>
                  <Input
                    placeholder="----"
                    maxLength={4}
                    style={{ textAlign: "center", fontSize: "28px", letterSpacing: "12px", borderRadius: 0, height: "56px" }}
                  />
                </Form.Item>
                <Button
                  type="primary" htmlType="submit"
                  loading={otpLoading}
                  block
                  icon={<SafetyOutlined />}
                  style={{ background: PRIMARY_COLOR, border: "none", height: "46px", borderRadius: 0, letterSpacing: 1 }}
                >
                  XÁC NHẬN & GỬI LIÊN HỆ
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

export default Contact;

