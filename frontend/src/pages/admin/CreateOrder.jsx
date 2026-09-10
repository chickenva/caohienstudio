/**
 * CreateOrder.jsx
 * Admin tạo đơn đặt lịch hộ khách hàng từ trang quản lý.
 * Đồng bộ flow với trang đặt lịch khách hàng: chọn gói dịch vụ chính + addon.
 */
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  message,
  Typography,
  Row,
  Col,
  Space,
  DatePicker,
  InputNumber,
  List,
  Tag,
  Alert,
  Tooltip,
  Checkbox,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SearchOutlined,
  UserOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const OrdersCreate = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [allServices, setAllServices] = useState([]);

  const [selectedMainIds, setSelectedMainIds] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  // isStudio: xác định shooting_type; mặc định true (Chụp tại Studio)
  const [isStudio, setIsStudio] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const serviceRes = await axios.get(`${API_URL}/services`);
      const services = Array.isArray(serviceRes.data)
        ? serviceRes.data
        : serviceRes.data.services || [];
      setAllServices(services);
    } catch (err) {
      message.error("Không thể tải dịch vụ");
    }
  };

  // === LỌC GÓI CHÍNH: loại PRINT, gói lẻ lễ tối, gói thêm flycam ===
  const getMainServicesToDisplay = () => {
    return allServices.filter((s) => {
      if (s.category === "PRINT") return false;
      const nameLow = (s.name || "").toLowerCase();
      if (nameLow.includes("gói lẻ lễ tối") || nameLow.includes("gói thêm flycam")) return false;
      return true;
    });
  };

  // === LỌC GÓI ĐI KÈM (ADDON): giống logic Booking.jsx ===
  const getAddonServicesToDisplay = (mainIds = selectedMainIds) => {
    const addons = [];
    const selectedMains = allServices.filter((s) => mainIds.includes(s._id));

    // PRINT luôn hiển thị
    addons.push(...allServices.filter((s) => s.category === "PRINT"));

    selectedMains.forEach((selectedMain) => {
      const mainName = (selectedMain.name || "").toLowerCase();
      if (mainName.includes("chụp truyền thống") || mainName.includes("combo")) {
        const goiLe = allServices.find((s) => (s.name || "").toLowerCase().includes("gói lẻ lễ tối"));
        if (goiLe && !addons.some((a) => a._id === goiLe._id)) addons.push(goiLe);
      }
      if (mainName.includes("quay") || mainName.includes("combo")) {
        const flycam = allServices.find((s) => (s.name || "").toLowerCase().includes("gói thêm flycam"));
        if (flycam && !addons.some((a) => a._id === flycam._id)) addons.push(flycam);
      }
    });

    // Loại trùng
    const uniqueAddons = addons.filter(
      (item, index, self) => index === self.findIndex((t) => t._id === item._id)
    );
    uniqueAddons.sort((a, b) => {
      const aIsSpecial = (a.name || "").toLowerCase().includes("gói lẻ lễ tối") || (a.name || "").toLowerCase().includes("gói thêm flycam");
      const bIsSpecial = (b.name || "").toLowerCase().includes("gói lẻ lễ tối") || (b.name || "").toLowerCase().includes("gói thêm flycam");
      if (aIsSpecial && !bIsSpecial) return -1;
      if (!aIsSpecial && bIsSpecial) return 1;
      return 0;
    });

    return uniqueAddons;
  };

  const mainServicesList = getMainServicesToDisplay();
  const addonServicesList = getAddonServicesToDisplay(selectedMainIds);

  // === TÍNH GIÁ ===
  const calculateTotalAmount = (mainIds, addonIds) => {
    let price = 0;
    mainIds.forEach((id) => {
      const service = allServices.find((s) => s._id === id);
      if (service) price += service.base_price || 0;
    });
    addonIds.forEach((id) => {
      const addon = allServices.find((a) => a._id === id);
      if (addon) price += addon.base_price || 0;
    });
    return price;
  };

  const handleMainServiceChange = (serviceIds) => {
    setSelectedMainIds(serviceIds);
    form.setFieldsValue({ serviceId: serviceIds });

    // Xóa addon không còn hợp lệ dựa trên serviceIds mới
    const newAddonList = getAddonServicesToDisplay(serviceIds);
    const validAddonIds = selectedAddonIds.filter((id) =>
      newAddonList.some((a) => a._id === id)
    );
    setSelectedAddonIds(validAddonIds);
    form.setFieldsValue({ extra_service_ids: validAddonIds });

    const price = calculateTotalAmount(serviceIds, validAddonIds);
    const deposit = Math.round(price * 0.3);
    form.setFieldsValue({ total_amount: price, paid_amount: deposit });
    setTotalAmount(price);
    setPaidAmount(deposit);
  };

  const handleAddonsChange = (addonIds) => {
    setSelectedAddonIds(addonIds);
    form.setFieldsValue({ extra_service_ids: addonIds });

    const price = calculateTotalAmount(selectedMainIds, addonIds);
    const deposit = Math.round(price * 0.3);
    form.setFieldsValue({ total_amount: price, paid_amount: deposit });
    setTotalAmount(price);
    setPaidAmount(deposit);
  };

  // === CUSTOMER ===
  const handleSearchCustomer = async () => {
    const keyword = form.getFieldValue("customer_search");

    if (!keyword || keyword.trim().length < 2) {
      message.warning(
        "Vui lòng nhập email, số điện thoại hoặc tên khách hàng",
      );
      return;
    }

    setSearchingCustomer(true);

    try {
      const res = await axios.get(
        `${API_URL}/users/admin/customers/search?keyword=${encodeURIComponent(
          keyword.trim(),
        )}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      setCustomerResults(res.data || []);

      if ((res.data || []).length === 0) {
        message.info(
          "Không tìm thấy khách hàng, bạn có thể nhập thông tin mới",
        );
      }
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tìm khách hàng",
      );
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);

    form.setFieldsValue({
      customer_id: customer._id,
      customer_full_name: customer.full_name,
      customer_email: customer.email,
      customer_phone: customer.phone,
    });

    message.success("Đã chọn khách hàng có sẵn");
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    form.setFieldsValue({
      customer_id: undefined,
      customer_full_name: "",
      customer_email: "",
      customer_phone: "",
    });
  };

  // === SUBMIT ===
  const handleSubmit = async (values) => {
    if (selectedMainIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 gói dịch vụ chính");
      return;
    }

    setLoading(true);

    try {
      const shootDateFormatted = values.shoot_date
        ? values.shoot_date.format("YYYY-MM-DD")
        : undefined;

      const payload = {
        customer_id: values.customer_id || undefined,
        customer_full_name: values.customer_full_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone,

        service_id: selectedMainIds[0],
        original_service_ids: selectedMainIds,
        extra_service_ids: [
          ...selectedMainIds.slice(1),
          ...selectedAddonIds,
        ],
        shoot_date: shootDateFormatted,
        shooting_type: isStudio ? "STUDIO" : "OUTDOOR",
        shooting_session: values.shooting_session,
        location: values.location,
        note: values.note,

        total_amount: values.total_amount,
        status: values.status || "REQUESTED",
        paid_amount: values.paid_amount,
        payment_method: "MANUAL",
      };

      await axios.post(`${API_URL}/bookings/admin/create`, payload, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      message.success("Tạo đơn đặt hộ thành công");
      navigate("/admin/orders");
    } catch (err) {
      if (err.response?.data?.code === "HAS_PENDING_BOOKING") {
        message.error(
          `Khách hàng đang có đơn chờ thanh toán (mã: #${err.response.data.booking_id?.slice(-6).toUpperCase()}). Vui lòng xử lý đơn đó trước.`,
        );
      } else if (err.response?.status === 409) {
        message.error(
          err.response?.data?.message ||
            "Studio/Ekip đã có lịch trong buổi này",
        );
      } else {
        message.error(
          err.response?.data?.message || "Tạo đơn đặt hộ thất bại",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Tính giá gói đã chọn hiển thị inline
  const selectedMainServices = allServices.filter((s) => selectedMainIds.includes(s._id));
  const selectedAddonServices = allServices.filter((s) => selectedAddonIds.includes(s._id));

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/orders")}
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>
          Tạo đơn đặt lịch hộ khách
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          paid_amount: 0,
          status: "REQUESTED",
          shooting_type_ui: "STUDIO",
          location: "Cao Hiển Studio",
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={10}>
            <Card
              title={
                <span>
                  1. Thông tin khách hàng{" "}
                  <Tooltip title="Nếu không chọn khách có sẵn, hệ thống sẽ tự tạo tài khoản CUSTOMER tạm.">
                    <InfoCircleOutlined style={{ color: "#BFA16A", fontSize: 15, marginLeft: 6, cursor: "pointer" }} />
                  </Tooltip>
                </span>
              }
              style={{ marginBottom: 20, borderRadius: 12, border: "1px solid #efebe4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
            >
              <Form.Item
                label="Tìm kiếm khách hàng"
                name="customer_search"
              >
                <Input.Search
                  placeholder="Nhập email, SĐT hoặc họ tên khách hàng..."
                  enterButton={
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      loading={searchingCustomer}
                      style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
                    >
                      Tìm
                    </Button>
                  }
                  onSearch={handleSearchCustomer}
                />
              </Form.Item>

              {customerResults.length > 0 && (
                <List
                  size="small"
                  bordered
                  style={{ marginBottom: 16 }}
                  dataSource={customerResults}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          onClick={() => handleSelectCustomer(item)}
                        >
                          Chọn
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<UserOutlined />}
                        title={
                          <Space>
                            <span>{item.full_name}</span>
                            {selectedCustomer?._id === item._id && (
                              <Tag color="green">Đã chọn</Tag>
                            )}
                          </Space>
                        }
                        description={`${item.email || ""} ${
                          item.phone ? `• ${item.phone}` : ""
                        }`}
                      />
                    </List.Item>
                  )}
                />
              )}

              {selectedCustomer && (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Đang dùng tài khoản khách hàng có sẵn"
                  description={
                    <div>
                      <div>{selectedCustomer.full_name}</div>
                      <div>{selectedCustomer.email}</div>
                      <div>{selectedCustomer.phone}</div>
                      <Button
                        size="small"
                        style={{ marginTop: 8 }}
                        onClick={handleClearCustomer}
                      >
                        Bỏ chọn khách này
                      </Button>
                    </div>
                  }
                />
              )}

              <Form.Item name="customer_id" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                label="Họ tên khách hàng"
                name="customer_full_name"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập họ tên khách hàng",
                  },
                ]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="customer_email"
                rules={[
                  {
                    type: "email",
                    message: "Email không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="vana@gmail.com" />
              </Form.Item>

              <Form.Item label="Số điện thoại" name="customer_phone">
                <Input placeholder="0909123456" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            {/* === Card 2: GÓI DỊCH VỤ (ĐỒNG BỘ VỚI FLOW KHÁCH HÀNG) === */}
            <Card
              title={
                <span>
                  2. Gói dịch vụ{" "}
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: "normal" }}>
                    (Đồng bộ theo luồng chọn gói dịch vụ của khách hàng)
                  </Text>
                </span>
              }
              style={{ marginBottom: 20, borderRadius: 12, border: "1px solid #efebe4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <span>
                        <span style={{ color: "#cf1322", marginRight: 4 }}>*</span>
                        <strong>Gói dịch vụ chính</strong>
                      </span>
                    }
                    name="serviceId"
                    rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 gói dịch vụ chính" }]}
                  >
                    <Select
                      mode="multiple"
                      maxTagCount={1}
                      maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                      optionLabelProp="label"
                      placeholder="Chọn gói dịch vụ chính..."
                      size="large"
                      value={selectedMainIds}
                      onChange={handleMainServiceChange}
                      style={{ width: "100%" }}
                    >
                      {mainServicesList.map((service) => (
                        <Select.Option key={service._id} value={service._id} label={service.name}>
                          <Checkbox checked={selectedMainIds.includes(service._id)} style={{ marginRight: 8 }} />
                          {service.name} — {Number(service.base_price || 0).toLocaleString("vi-VN")}đ
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={<strong>Gói dịch vụ đi kèm (Addon / In ấn)</strong>}
                    name="extra_service_ids"
                  >
                    <Select
                      mode="multiple"
                      maxTagCount={1}
                      maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                      optionLabelProp="label"
                      placeholder={selectedMainIds.length === 0 ? "Vui lòng chọn gói chính trước để mở khóa addon..." : "Chọn các gói đi kèm..."}
                      size="large"
                      value={selectedAddonIds}
                      onChange={handleAddonsChange}
                      disabled={selectedMainIds.length === 0}
                      style={{ width: "100%" }}
                    >
                      {addonServicesList.map((service) => (
                        <Select.Option key={service._id} value={service._id} label={service.name}>
                          <Checkbox checked={selectedAddonIds.includes(service._id)} style={{ marginRight: 8 }} />
                          {service.name} (+{Number(service.base_price || 0).toLocaleString("vi-VN")}đ)
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Chi tiết gói đã chọn & Tóm tắt chi phí giống Booking.jsx */}
              <div
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #E8DED2",
                  borderRadius: 10,
                  padding: "16px 20px",
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "1.5px" }}>
                  Tóm Tắt Chi Phí Dịch Vụ
                </div>
                <Row gutter={[24, 16]} align="top">
                  {/* Cột 1: Dịch vụ chính */}
                  <Col xs={24} md={10}>
                    <span style={{ color: "#888", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 8 }}>
                      Dịch Vụ Chính
                    </span>
                    {selectedMainServices.length > 0 ? (
                      selectedMainServices.map((s) => (
                        <div key={s._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#2F2F2F", marginBottom: 6 }}>
                          <span>• {s.name}</span>
                          <span style={{ fontWeight: 600, color: "#555" }}>{Number(s.base_price || 0).toLocaleString("vi-VN")}đ</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Chưa chọn gói chính</div>
                    )}
                  </Col>

                  {/* Cột 2: Các gói đi kèm */}
                  <Col xs={24} md={8} style={{ borderLeft: "1px solid #E8DED2" }}>
                    <span style={{ color: "#888", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 8 }}>
                      Các Gói Đi Kèm
                    </span>
                    {selectedAddonServices.length > 0 ? (
                      selectedAddonServices.map((s) => (
                        <div key={s._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#2F2F2F", marginBottom: 6 }}>
                          <span>+ {s.name}</span>
                          <span style={{ fontWeight: 500, color: "#666" }}>+{Number(s.base_price || 0).toLocaleString("vi-VN")}đ</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Chưa chọn gói đi kèm</div>
                    )}
                  </Col>

                  {/* Cột 3: Tổng cộng & Tiền cọc */}
                  <Col xs={24} md={6} style={{ borderLeft: "1px solid #E8DED2", textAlign: "right" }}>
                    <span style={{ color: "#888", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 4 }}>
                      Tổng Cộng
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#BFA16A" }}>
                      {calculateTotalAmount(selectedMainIds, selectedAddonIds).toLocaleString("vi-VN")}đ
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4, fontWeight: 500 }}>
                      Tiền cọc (30%): <span style={{ color: "#2F2F2F", fontWeight: 600 }}>{Math.round(calculateTotalAmount(selectedMainIds, selectedAddonIds) * 0.3).toLocaleString("vi-VN")}đ</span>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>

            {/* === Card 3: THÔNG TIN LỊCH CHỤP === */}
            <Card title="3. Thông tin lịch chụp" style={{ marginBottom: 20, borderRadius: 12, border: "1px solid #efebe4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <Row gutter={16}>
                {/* Ngày chụp */}
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Ngày chụp"
                    name="shoot_date"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày chụp" },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày..."
                      style={{ width: "100%" }}
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                    />
                  </Form.Item>
                </Col>

                {/* Hình thức chụp */}
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Hình thức chụp"
                    name="shooting_type_ui"
                  >
                    <Select
                      size="large"
                      options={[
                        { value: "STUDIO", label: "Tại Studio" },
                        { value: "OUTDOOR", label: "Ngoại cảnh" },
                      ]}
                      onChange={(val) => {
                        const studio = val === "STUDIO";
                        setIsStudio(studio);
                        form.setFieldsValue({
                          location: studio ? "Cao Hiển Studio" : undefined,
                        });
                      }}
                    />
                  </Form.Item>
                </Col>

                {/* Buổi chụp */}
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Buổi chụp"
                    name="shooting_session"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn buổi chụp",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Chọn buổi..."
                      options={[
                        { value: "MORNING", label: "Sáng (08:00 – 12:00)" },
                        {
                          value: "AFTERNOON",
                          label: "Chiều (13:00 – 17:00)",
                        },
                        {
                          value: "FULL_DAY",
                          label: "Cả ngày (08:00 – 17:00)",
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>

                {/* Địa điểm */}
                <Col xs={24}>
                  <Form.Item
                    label="Địa điểm chụp"
                    name="location"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập địa điểm chụp",
                      },
                    ]}
                  >
                    <Input
                      disabled={isStudio}
                      placeholder="VD: Cao Hiển Studio, Đà Lạt, TP.HCM..."
                    />
                  </Form.Item>
                </Col>

                {/* Ghi chú */}
                <Col xs={24}>
                  <Form.Item label="Ghi chú" name="note">
                    <TextArea
                      rows={4}
                      placeholder="VD: Khách gọi điện đặt lịch, đã chuyển khoản cọc..."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* === Card 4: THANH TOÁN / TRẠNG THÁI === */}
            <Card title="4. Thanh toán / trạng thái" style={{ marginBottom: 20, borderRadius: 12, border: "1px solid #efebe4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tổng tiền"
                    name="total_amount"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tổng tiền",
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      addonAfter="VNĐ"
                      onChange={(v) => setTotalAmount(Number(v) || 0)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Trạng thái đơn"
                    name="status"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn trạng thái đơn",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      options={[
                        {
                          value: "REQUESTED",
                          label: "Chờ xử lý (REQUESTED)",
                        },
                        {
                          value: "CONFIRMED",
                          label:
                            "Đã xác nhận & Đã thanh toán cọc (CONFIRMED)",
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Số tiền khách đã trả (thanh toán thủ công)"
                    name="paid_amount"
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      addonAfter="VNĐ"
                      onChange={(v) => setPaidAmount(Number(v) || 0)}
                    />
                  </Form.Item>
                </Col>

                {/* Preview số tiền còn lại */}
                {totalAmount > 0 && (
                  <Col xs={24}>
                    <div
                      style={{
                        background: "#fafafa",
                        border: "1px solid #f0f0f0",
                        borderRadius: 10,
                        padding: "12px 16px",
                        display: "flex",
                        gap: 32,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#999",
                            marginBottom: 2,
                          }}
                        >
                          TỔNG TIỀN
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                          {totalAmount.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#999",
                            marginBottom: 2,
                          }}
                        >
                          {"ĐÃ TRẢ"}
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#389e0d",
                          }}
                        >
                          {paidAmount.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#999",
                            marginBottom: 2,
                          }}
                        >
                          {"CÒN LẠI"}
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color:
                              totalAmount - paidAmount > 0
                                ? "#cf1322"
                                : "#389e0d",
                          }}
                        >
                          {Math.max(0, totalAmount - paidAmount).toLocaleString(
                            "vi-VN",
                          )}
                          đ
                        </div>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        </Row>

        <Space style={{ marginTop: 24 }}>
          <Button onClick={() => navigate("/admin/orders")}>Hủy</Button>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
          >
            Tạo đơn đặt hộ
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default OrdersCreate;
