import React, { useState } from "react";
import { Card, Form, Input, InputNumber, Select, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Option } = Select;
const { TextArea } = Input;

const AddResource = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/resources", values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Thêm tài nguyên thành công!");
      form.resetFields();
      navigate("/admin/resources"); // Thêm xong đá về trang danh sách
    } catch (error) {
      message.error("Lỗi khi thêm tài nguyên!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Thêm Tài Nguyên Mới"
      style={{ maxWidth: 800, margin: "0 auto", borderRadius: "8px" }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tên thiết bị"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên thiết bị" }]}
        >
          <Input placeholder="VD: Sony A7IV, Lens 85mm f1.4..." />
        </Form.Item>

        <div style={{ display: "flex", gap: "20px" }}>
          <Form.Item
            label="Phân loại"
            name="category"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Chọn loại">
              <Option value="Máy ảnh">Máy ảnh</Option>
              <Option value="Ống kính">Ống kính</Option>
              <Option value="Đèn & Flash">Đèn & Flash</Option>
              <Option value="Phụ kiện">Phụ kiện (Chân máy, hắt sáng...)</Option>
              <Option value="Trang phục">Trang phục / Đạo cụ</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="quantity"
            initialValue={1}
            style={{ flex: 1 }}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Tình trạng"
            name="status"
            initialValue="Tốt"
            style={{ flex: 1 }}
          >
            <Select>
              <Option value="Mới 100%">Mới 100%</Option>
              <Option value="Tốt">Hoạt động Tốt</Option>
              <Option value="Cần bảo trì">Cần bảo trì</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item label="Ghi chú" name="notes">
          <TextArea
            rows={4}
            placeholder="Nhập tình trạng chi tiết hoặc số seri..."
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ background: "#141414" }}
          >
            Lưu Tài Nguyên
          </Button>
          <Button
            onClick={() => navigate("/admin/resources")}
            style={{ marginLeft: 10 }}
          >
            Hủy
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddResource;
