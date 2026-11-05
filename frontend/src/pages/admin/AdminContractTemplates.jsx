import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Space, Spin, Tag, Typography, Upload, message } from "antd";
import { FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
const getToken = () => localStorage.getItem("token");

export default function AdminContractTemplates() {
  const [template, setTemplate] = useState(null);
  const [fallback, setFallback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchTemplate = async () => {
    try {
      const response = await axios.get(`${API_URL}/website/admin/contract-template`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTemplate(response.data.template || null);
      setFallback(response.data.fallback || null);
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể tải cấu hình template.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Promise.resolve().then(fetchTemplate); }, []);

  const uploadTemplate = async (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["docx", "xlsx"].includes(extension)) {
      message.error("Chỉ hỗ trợ file .docx hoặc .xlsx.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 15 * 1024 * 1024) {
      message.error("Dung lượng template tối đa là 15 MB.");
      return Upload.LIST_IGNORE;
    }
    const formData = new FormData();
    formData.append("template", file);
    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/website/admin/contract-template`, formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTemplate(response.data.template);
      setFallback(null);
      message.success(response.data.message || "Đã cập nhật template hợp đồng.");
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể tải template hợp đồng.");
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <div>
      <Space align="center" style={{ marginBottom: 24 }}>
        <FileTextOutlined style={{ color: "#BFA16A", fontSize: 24 }} />
        <Typography.Title level={3} style={{ margin: 0 }}>Template hợp đồng</Typography.Title>
      </Space>

      <Spin spinning={loading}>
        <Card style={{ maxWidth: 850, borderRadius: 12 }}>
          <Typography.Paragraph>
            Template đang chọn được dùng để điền dữ liệu đơn và xuất PDF khi admin tạo hợp đồng.
            Tải lên DOCX hoặc XLSX để thay template đang hoạt động.
          </Typography.Paragraph>
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
            <Descriptions.Item label="Template đang dùng">
              <Space>
                <Typography.Text strong>{template?.original_name || fallback?.original_name || "Chưa có template"}</Typography.Text>
                {(template || fallback) && <Tag color="gold">{(template?.file_type || fallback?.file_type || "").toUpperCase()}</Tag>}
              </Space>
            </Descriptions.Item>
            {template?.template_mode === "AUTO_LABEL" && (
              <Descriptions.Item label="Cách điền">
                Tự nhận diện {Object.keys(template.field_mapping?.fields || {}).length} nhãn Excel
                {template.field_mapping?.table ? " và bảng dịch vụ" : ""}
              </Descriptions.Item>
            )}
            {template && <Descriptions.Item label="Phiên bản">v{template.version}</Descriptions.Item>}
            {template?.updatedAt && <Descriptions.Item label="Cập nhật">{new Date(template.updatedAt).toLocaleString("vi-VN")}</Descriptions.Item>}
          </Descriptions>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
            message="Quy ước trường dữ liệu trong template"
            description={(
              <div>
                DOCX cần placeholder dạng <code>{"{customer_name}"}</code>. XLSX tự dò các nhãn phổ biến như “Họ và tên”, “Địa chỉ”, “Điện thoại”, “Ngày chụp”; nếu nhãn không chuẩn, dùng <code>{"{customer_name}"}</code> hoặc <code>{"{{customer_name}}"}</code> trong ô.
                Các placeholder XLSX gồm customer_name, customer_phone, customer_email, location, shoot_date, shooting_session, main_services, addons, travel_surcharge, total_amount, deposit_amount, remaining_amount, contract_note, contract_date và item_1_name…item_5_amount.
              </div>
            )}
          />

          <Upload accept=".docx,.xlsx" maxCount={1} showUploadList={false} beforeUpload={uploadTemplate}>
            <Button type="primary" icon={<UploadOutlined />} loading={uploading} style={{ background: "#BFA16A", borderColor: "#BFA16A" }}>
              Tải template DOCX/XLSX lên
            </Button>
          </Upload>
        </Card>
      </Spin>
    </div>
  );
}
