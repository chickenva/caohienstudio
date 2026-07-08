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
  TimePicker,
  InputNumber,
  List,
  Tag,
  Alert,
  Checkbox,
  Switch,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_URL = "http://localhost:5000/api";

// Options removed to hardcode CONFIRMED status and MANUAL payment method

const OrdersCreate = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [mainServices, setMainServices] = useState([]);
  const [addonServices, setAddonServices] = useState([]);

  const [selectedMainIds, setSelectedMainIds] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isStudio, setIsStudio] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [isRangeMode, setIsRangeMode] = useState(false);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const serviceRes = await axios.get(`${API_URL}/services`);

      const allServices = Array.isArray(serviceRes.data) ? serviceRes.data : (serviceRes.data.services || []);
      setMainServices(allServices.filter(s => s.category !== "PRINT" &&
        !["gói lẻ lễ tối", "gói thêm flycam"].some(k => (s.name || "").toLowerCase().includes(k))
      ));
      setAddonServices(allServices.filter(s => s.category === "PRINT" ||
        ["gói lẻ lễ tối", "gói thêm flycam"].some(k => (s.name || "").toLowerCase().includes(k))
      ));
    } catch (err) {
      message.error("Không thể tải dịch vụ");
    }
  };

  const handleSearchCustomer = async () => {
    const keyword = form.getFieldValue("customer_search");

    if (!keyword || keyword.trim().length < 2) {
      message.warning("Vui lòng nhập email, số điện thoại hoặc tên khách hàng");
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
      message.error(err.response?.data?.message || "Không thể tìm khách hàng");
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

  const calculateTotalAmount = (mainIds, addonIds) => {
    let price = 0;
    mainIds.forEach(id => {
      const service = mainServices.find(s => s._id === id);
      if (service) price += service.base_price || 0;
    });
    addonIds.forEach(id => {
      const addon = addonServices.find(a => a._id === id);
      if (addon) price += addon.base_price || 0;
    });
    return price;
  };

  const handleServiceChange = (serviceIds) => {
    setSelectedMainIds(serviceIds);
    const price = calculateTotalAmount(serviceIds, selectedAddons);
    const deposit = Math.round(price * 0.3);
    form.setFieldsValue({ total_amount: price, paid_amount: deposit });
    setTotalAmount(price);
    setPaidAmount(deposit);
  };

  const handleAddonsChange = (addonIds) => {
    setSelectedAddons(addonIds);
    const price = calculateTotalAmount(selectedMainIds, addonIds);
    const deposit = Math.round(price * 0.3);
    form.setFieldsValue({ total_amount: price, paid_amount: deposit });
    setTotalAmount(price);
    setPaidAmount(deposit);
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const firstService = mainServices.find((item) => item._id === values.service_id[0]);
      
      const shootDate = values.shoot_date;
      const shootTime = values.shoot_time || dayjs().hour(0).minute(0);
      let startDateTime, endDateTime;

      if (isRangeMode && Array.isArray(shootDate)) {
        startDateTime = dayjs(shootDate[0]).hour(shootTime.hour()).minute(shootTime.minute());
        endDateTime = dayjs(shootDate[1]).hour(shootTime.hour()).minute(shootTime.minute());
      } else {
        startDateTime = dayjs(shootDate).hour(shootTime.hour()).minute(shootTime.minute());
        endDateTime = startDateTime.add(firstService?.duration_hours || 4, "hour");
      }

      const payload = {
        customer_id: values.customer_id || undefined,
        customer_full_name: values.customer_full_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone,

        service_id: values.service_id[0],
        extra_service_ids: [...values.service_id.slice(1), ...(values.extra_service_ids || [])],
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: values.location,
        note: values.note,

        total_amount: values.total_amount,
        status: "CONFIRMED",
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
            "Nhiếp ảnh gia đã có lịch trong khung giờ này",
        );
      } else {
        message.error(err.response?.data?.message || "Tạo đơn đặt hộ thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

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
        <Title level={3} style={{ marginBottom: 4 }}>
          Tạo đơn đặt lịch hộ khách
        </Title>
        <Text type="secondary">
          Dùng cho trường hợp khách gọi điện, nhắn Zalo hoặc đến trực tiếp nhờ
          studio đặt lịch.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          paid_amount: 0,
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={10}>
            <Card title="1. Thông tin khách hàng" style={{ marginBottom: 20 }}>
              <Form.Item
                label="Tìm khách hàng bằng email / SĐT / tên"
                name="customer_search"
              >
                <Input.Search
                  placeholder="VD: 0909..., vana@gmail.com, Nguyễn Văn A"
                  enterButton={
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      loading={searchingCustomer}
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

              {selectedCustomer ? (
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
              ) : (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Nếu không chọn khách có sẵn, hệ thống sẽ tự tạo tài khoản CUSTOMER tạm."
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
            <Card title="2. Thông tin lịch chụp" style={{ marginBottom: 20 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Gói dịch vụ chính"
                    name="service_id"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn gói dịch vụ",
                      },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn một hoặc nhiều gói dịch vụ"
                      onChange={handleServiceChange}
                      options={mainServices.map((service) => ({
                        value: service._id,
                        label: `${service.name} - ${Number(
                          service.base_price || 0,
                        ).toLocaleString("vi-VN")}đ`,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Dịch vụ đi kèm"
                    name="extra_service_ids"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn dịch vụ đi kèm (nếu có)"
                      onChange={handleAddonsChange}
                      options={addonServices.map((a) => ({
                        value: a._id,
                        label: `${a.name} (+${Number(a.base_price || 0).toLocaleString("vi-VN")}đ)`,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <span>Ngày chụp</span>
                        <Switch
                          checkedChildren="Nhiều ngày"
                          unCheckedChildren="1 ngày"
                          checked={isRangeMode}
                          onChange={(checked) => {
                            setIsRangeMode(checked);
                            form.setFieldsValue({ shoot_date: null });
                          }}
                          style={{ background: isRangeMode ? "#1677ff" : "#ccc", transform: "scale(0.85)", transformOrigin: "right center" }}
                        />
                      </div>
                    }
                    name="shoot_date"
                    rules={[{ required: true, message: "Vui lòng chọn ngày chụp" }]}
                  >
                    {isRangeMode ? (
                      <DatePicker.RangePicker
                        size="large"
                        format="DD/MM/YYYY"
                        placeholder={["Từ ngày", "Đến ngày"]}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <DatePicker
                        size="large"
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày..."
                        style={{ width: "100%" }}
                      />
                    )}
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item 
                    label="Giờ chụp" 
                    name="shoot_time"
                    rules={[{ required: true, message: "Vui lòng chọn giờ chụp" }]}
                  >
                    <TimePicker
                      size="large"
                      format="HH:mm"
                      placeholder="Chọn giờ..."
                      minuteStep={15}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label={
                      <Space>
                        <span>Địa điểm chụp</span>
                        <Checkbox
                          checked={isStudio}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsStudio(checked);
                            if (checked) {
                              form.setFieldsValue({ location: "Cao Hiển Studio" });
                            } else {
                              form.setFieldsValue({ location: undefined });
                            }
                          }}
                        >
                          Chụp tại studio
                        </Checkbox>
                      </Space>
                    }
                    name="location"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập địa điểm chụp",
                      },
                    ]}
                  >
                    <Input disabled={isStudio} placeholder="VD: Cao Hiển Studio, Đà Lạt, TP.HCM..." />
                  </Form.Item>
                </Col>

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

            <Card title="3. Thanh toán / trạng thái">
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
                  <Form.Item label="Trạng thái đơn">
                    <Tag color="green" style={{ fontSize: 14, padding: "4px 12px" }}>
                      Đã xác nhận (CONFIRMED)
                    </Tag>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Số tiền khách đã trả (thanh toán thủ công)" name="paid_amount">
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
                        <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>TỔNG TIỀN</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                          {totalAmount.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>ĐÃ TRẢ</div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#389e0d" }}>
                          {paidAmount.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>CÒN LẠI</div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: totalAmount - paidAmount > 0 ? "#cf1322" : "#389e0d",
                          }}
                        >
                          {Math.max(0, totalAmount - paidAmount).toLocaleString("vi-VN")}đ
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
          >
            Tạo đơn đặt hộ
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default OrdersCreate;
