import React, { useState } from "react";
import { Card, Form, Input, Select, Button, message, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Option } = Select;

const AddStaff = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/staff", values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Thêm nhân sự mới thành công!");
      navigate("/admin/staff");
    } catch (error) {
      message.error("Không thể thêm nhân sự!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Thêm Nhân Sự Mới"
      style={{ maxWidth: 900, margin: "0 auto", borderRadius: "8px" }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ và tên"
              name="fullName"
              rules={[{ required: true, message: "Nhập tên nhân sự" }]}
            >
              <Input placeholder="VD: Nguyễn Văn A" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Vị trí / Vai trò"
              name="role"
              rules={[{ required: true }]}
            >
              <Select placeholder="Chọn vai trò">
                <Option value="Photographer">
                  Nhiếp ảnh gia (Photographer)
                </Option>
                <Option value="Makeup Artist">
                  Chuyên viên trang điểm (Makeup)
                </Option>
                <Option value="Editor">Chỉnh sửa ảnh (Editor)</Option>
                <Option value="Assistant">Trợ lý / Support</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ required: true }]}
            >
              <Input placeholder="090x xxx xxx" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email" name="email">
              <Input placeholder="example@gmail.com" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Chuyên môn chính" name="specialization">
          <Input placeholder="VD: Chụp Wedding, Makeup tone Trung, Retouch ảnh tiệc..." />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ background: "#141414", padding: "0 40px" }}
          >
            Lưu Thông Tin
          </Button>
          <Button
            onClick={() => navigate("/admin/staff")}
            style={{ marginLeft: 10 }}
          >
            Quay lại
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddStaff;
