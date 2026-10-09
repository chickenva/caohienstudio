/**
 * AdminHolidays.jsx
 * Quản trị danh sách ngày lễ quốc gia và ngày nghỉ/sự kiện của studio.
 * Cho phép cấu hình đóng cửa studio, phụ thu và màu sắc hiển thị trên lịch booking.
 */
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Tag,
  Space,
  Popconfirm,
  message,
  Card,
  Tooltip,
  Radio,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const COLOR_PRESETS = [
  { label: "Đỏ lễ hội", value: "#cf1322" },
  { label: "Tím studio", value: "#722ed1" },
  { label: "Cam rực rỡ", value: "#fa8c16" },
  { label: "Vàng Gold", value: "#bfa16a" },
  { label: "Xanh dương", value: "#1890ff" },
  { label: "Xanh ngọc", value: "#13c2c2" },
];

const AdminHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("ALL");

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [form] = Form.useForm();

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/holidays`, {
        params: { is_active: "true" },
      });
      setHolidays(res.data?.holidays || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách ngày lễ:", err);
      message.error("Không thể tải danh sách ngày lễ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    form.resetFields();
    form.setFieldsValue({
      type: "NATIONAL",
      is_recurring_yearly: false,
      is_closed: false,
      color: "#cf1322",
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingHoliday(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      dateRange: [dayjs(record.start_date), dayjs(record.end_date)],
      is_recurring_yearly: record.is_recurring_yearly,
      is_closed: record.is_closed,
      color: record.color || (record.type === "STUDIO" ? "#722ed1" : "#cf1322"),
      surcharge_note: record.surcharge_note,
      description: record.description,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const [start, end] = values.dateRange;
      const payload = {
        name: values.name,
        type: values.type,
        start_date: start.format("YYYY-MM-DD"),
        end_date: end.format("YYYY-MM-DD"),
        is_recurring_yearly: values.is_recurring_yearly,
        is_closed: values.is_closed,
        color: values.color,
        surcharge_note: values.surcharge_note || "",
        description: values.description || "",
      };

      if (editingHoliday) {
        await axios.put(`${API_URL}/holidays/${editingHoliday._id}`, payload, {
          headers: getHeaders(),
        });
        message.success("Cập nhật ngày lễ thành công!");
      } else {
        await axios.post(`${API_URL}/holidays`, payload, {
          headers: getHeaders(),
        });
        message.success("Thêm mới ngày lễ thành công!");
      }

      setModalVisible(false);
      fetchHolidays();
    } catch (err) {
      console.error("Lỗi lưu ngày lễ:", err);
      message.error(err.response?.data?.message || "Không thể lưu thông tin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/holidays/${id}`, {
        headers: getHeaders(),
      });
      message.success("Xóa ngày lễ thành công");
      fetchHolidays();
    } catch (err) {
      console.error("Lỗi xóa ngày lễ:", err);
      message.error("Không thể xóa ngày lễ này");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/holidays/seed`,
        {},
        { headers: getHeaders() }
      );
      message.success("Khôi phục danh sách ngày lễ mẫu thành công!");
      fetchHolidays();
    } catch (err) {
      console.error("Lỗi seed:", err);
      message.error("Không thể khôi phục dữ liệu mẫu");
    } finally {
      setLoading(false);
    }
  };

  const filteredHolidays = holidays.filter((item) => {
    if (filterType === "ALL") return true;
    return item.type === filterType;
  });

  const columns = [
    {
      title: "Tên ngày lễ / sự kiện",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: record.color || (record.type === "STUDIO" ? "#722ed1" : "#cf1322"),
              }}
            />
            <strong style={{ fontSize: 14 }}>{text}</strong>
          </div>
          {record.description && (
            <span style={{ fontSize: 12, color: "#8c8c8c" }}>{record.description}</span>
          )}
        </Space>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "type",
      key: "type",
      width: 160,
      render: (type) => {
        if (type === "NATIONAL") {
          return <Tag color="error">🇻🇳 Lễ Quốc Gia</Tag>;
        }
        if (type === "STUDIO") {
          return <Tag color="purple">📸 Studio Nghỉ / Sự kiện</Tag>;
        }
        return <Tag color="blue">Khác</Tag>;
      },
    },
    {
      title: "Thời gian",
      key: "date",
      width: 200,
      render: (_, record) => {
        const start = dayjs(record.start_date);
        const end = dayjs(record.end_date);
        const isSame = record.start_date === record.end_date;
        const daysDiff = end.diff(start, "day") + 1;

        return (
          <div>
            <div style={{ fontWeight: 500 }}>
              {isSame
                ? start.format("DD/MM/YYYY")
                : `${start.format("DD/MM/YYYY")} — ${end.format("DD/MM/YYYY")}`}
            </div>
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              {daysDiff} ngày {record.is_recurring_yearly && "• Hàng năm"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Hoạt động Studio",
      dataIndex: "is_closed",
      key: "is_closed",
      width: 180,
      render: (is_closed) =>
        is_closed ? (
          <Tag icon={<LockOutlined />} color="volcano">
            Đóng cửa (Nghỉ nhận lịch)
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Mở cửa nhận lịch
          </Tag>
        ),
    },
    {
      title: "Phụ thu / Ghi chú",
      dataIndex: "surcharge_note",
      key: "surcharge_note",
      width: 180,
      render: (note) =>
        note ? (
          <span style={{ fontSize: 13, color: "#fa8c16", fontWeight: 500 }}>{note}</span>
        ) : (
          <span style={{ color: "#bfbfbf", fontSize: 12 }}>Không có</span>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 130,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="Xóa ngày lễ này?"
            description="Bạn có chắc chắn muốn xóa ngày lễ này khỏi hệ thống?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 4px" }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                color: "#2F2F2F",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <CalendarOutlined style={{ color: "#BFA16A" }} />
              Quản lý Lịch Ngày lễ & Ngày nghỉ Studio
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#8c8c8c", fontSize: 13 }}>
              Cấu hình các ngày lễ quốc gia (2/9, 30/4, Tết...) và lịch nghỉ định kỳ/sự kiện của Studio để hiển thị màu sắc và chặn nhận lịch trên giao diện khách hàng.
            </p>
          </div>

          <Space wrap>
            <Tooltip title="Khôi phục danh sách ngày lễ quốc gia mẫu">
              <Button icon={<ReloadOutlined />} onClick={handleSeedDefaults}>
                Nạp ngày lễ mẫu
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAdd}
              style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
            >
              Thêm ngày lễ / ngày nghỉ
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>Lọc theo loại:</span>
          <Radio.Group
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="ALL">Tất cả ({holidays.length})</Radio.Button>
            <Radio.Button value="NATIONAL">
              Lễ Quốc Gia ({holidays.filter((h) => h.type === "NATIONAL").length})
            </Radio.Button>
            <Radio.Button value="STUDIO">
              Studio Nghỉ / Sự kiện ({holidays.filter((h) => h.type === "STUDIO").length})
            </Radio.Button>
          </Radio.Group>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 8 }}>
        <Table
          columns={columns}
          dataSource={filteredHolidays}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal Thêm / Sửa ngày lễ */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: "#BFA16A" }} />
            <span>{editingHoliday ? "Chỉnh sửa ngày lễ" : "Thêm mới ngày lễ / ngày nghỉ"}</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingHoliday ? "Lưu thay đổi" : "Tạo ngày lễ"}
        cancelText="Đóng"
        okButtonProps={{ style: { backgroundColor: "#BFA16A", borderColor: "#BFA16A" } }}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên ngày lễ / Sự kiện"
            rules={[{ required: true, message: "Vui lòng nhập tên ngày lễ" }]}
          >
            <Input placeholder="Ví dụ: Quốc khánh 2/9, Studio nghỉ du lịch..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Phân loại"
                rules={[{ required: true, message: "Vui lòng chọn loại" }]}
              >
                <Select
                  onChange={(val) => {
                    if (val === "NATIONAL") {
                      form.setFieldsValue({ color: "#cf1322" });
                    } else if (val === "STUDIO") {
                      form.setFieldsValue({ color: "#722ed1" });
                    }
                  }}
                >
                  <Select.Option value="NATIONAL">🇻🇳 Ngày lễ Quốc Gia</Select.Option>
                  <Select.Option value="STUDIO">📸 Ngày nghỉ / Sự kiện Studio</Select.Option>
                  <Select.Option value="OTHER">✨ Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="color" label="Màu sắc nhận diện">
                <Select>
                  {COLOR_PRESETS.map((c) => (
                    <Select.Option key={c.value} value={c.value}>
                      <Space>
                        <span
                          style={{
                            display: "inline-block",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: c.value,
                          }}
                        />
                        {c.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dateRange"
            label="Khoảng thời gian áp dụng"
            rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian" }]}
          >
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_recurring_yearly"
                label="Lặp lại hàng năm?"
                valuePropName="checked"
                tooltip="Bật nếu là ngày lễ cố định hàng năm (như 2/9, 30/4, 1/1)"
              >
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="is_closed"
                label="Studio đóng cửa nghỉ nhận lịch?"
                valuePropName="checked"
                tooltip="Nếu bật, khách hàng sẽ không thể chọn ngày này để đặt lịch trên website"
              >
                <Switch
                  checkedChildren="Đóng cửa"
                  unCheckedChildren="Nhận lịch"
                  style={{ backgroundColor: form.getFieldValue("is_closed") ? "#cf1322" : undefined }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="surcharge_note"
            label="Thông báo phụ thu ngày lễ (nếu có)"
            tooltip="Hiển thị cho khách hàng xem khi chọn ngày này"
          >
            <Input placeholder="Ví dụ: Phụ thu 20% phí ekip ngày lễ..." />
          </Form.Item>

          <Form.Item name="description" label="Ghi chú nội bộ / Mô tả thêm">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú thêm cho ngày lễ này..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminHolidays;
