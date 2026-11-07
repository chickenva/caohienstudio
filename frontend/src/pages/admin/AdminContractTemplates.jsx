import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Typography,
  Upload,
  message,
} from "antd";
import { DeleteOutlined, DownloadOutlined, FileTextOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
const getToken = () => localStorage.getItem("token");
const authConfig = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

export default function AdminContractTemplates() {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const applyTemplateList = (data) => {
    setTemplates(data.templates || []);
    setOptions(data.options || []);
  };

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/website/admin/contract-templates`, authConfig());
      applyTemplateList(response.data);
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể tải danh sách mẫu hợp đồng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { Promise.resolve().then(fetchTemplates); }, [fetchTemplates]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setSelectedFile(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setSelectedFile(null);
    form.setFieldsValue({
      display_name: template.display_name || template.original_name,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingTemplate(null);
    setSelectedFile(null);
    form.resetFields();
  };

  const chooseFile = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["docx", "xlsx"].includes(extension)) {
      message.error("Chỉ hỗ trợ file .docx hoặc .xlsx.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 15 * 1024 * 1024) {
      message.error("Dung lượng file tối đa là 15 MB.");
      return Upload.LIST_IGNORE;
    }
    setSelectedFile(file);
    return false;
  };

  const saveTemplate = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (!editingTemplate && !selectedFile) {
      message.error("Chọn file DOCX hoặc XLSX để thêm mẫu hợp đồng.");
      return;
    }

    const formData = new FormData();
    formData.append("display_name", values.display_name.trim());
    if (selectedFile) formData.append("template", selectedFile);

    setSaving(true);
    try {
      const response = editingTemplate
        ? await axios.patch(`${API_URL}/website/admin/contract-templates/${editingTemplate._id}`, formData, authConfig())
        : await axios.post(`${API_URL}/website/admin/contract-templates`, formData, authConfig());
      applyTemplateList(response.data);
      setModalOpen(false);
      setEditingTemplate(null);
      setSelectedFile(null);
      form.resetFields();
      message.success(response.data.message || "Đã lưu mẫu hợp đồng.");
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể lưu mẫu hợp đồng.");
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = async (template) => {
    setDownloadingId(template._id);
    try {
      const response = await axios.get(
        `${API_URL}/website/admin/contract-templates/${template._id}/download`,
        { ...authConfig(), responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = template.original_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      message.error("Không thể tải file mẫu hợp đồng.");
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteTemplate = async (template) => {
    setDeletingId(template._id);
    try {
      const response = await axios.delete(`${API_URL}/website/admin/contract-templates/${template._id}`, authConfig());
      applyTemplateList(response.data);
      message.success(response.data.message || "Đã xóa mẫu hợp đồng.");
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể xóa mẫu hợp đồng.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Tên mẫu",
      dataIndex: "display_name",
      key: "display_name",
      render: (value, template) => (
        <Typography.Text strong>{value || template.original_name}</Typography.Text>
      ),
    },
    {
      title: "File đã tải lên",
      dataIndex: "original_name",
      key: "original_name",
      render: (value, template) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          loading={downloadingId === template._id}
          onClick={() => downloadTemplate(template)}
          style={{ paddingInline: 0, height: "auto", whiteSpace: "normal", textAlign: "left" }}
        >
          {value}
        </Button>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      render: (_, template) => (
        <Space wrap>
          <Button size="small" onClick={() => openEditModal(template)}>Sửa</Button>
          <Popconfirm
            title="Xóa mẫu hợp đồng này?"
            description="Mẫu đang được đơn hàng sử dụng sẽ không thể xóa."
            onConfirm={() => deleteTemplate(template)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={deletingId === template._id}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space align="center" style={{ marginBottom: 24, width: "100%", justifyContent: "space-between" }}>
        <Space>
          <FileTextOutlined style={{ color: "#BFA16A", fontSize: 24 }} />
          <Typography.Title level={3} style={{ margin: 0 }}>Quản lý mẫu hợp đồng</Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} style={{ background: "#BFA16A", borderColor: "#BFA16A" }}>
          Thêm mẫu hợp đồng
        </Button>
      </Space>

      <Spin spinning={loading}>
        {options.some((option) => option.is_fallback) && (
          <Alert
            type="info"
            showIcon
            message="Đang dùng mẫu mặc định"
            description="Chưa có file tải lên. Hệ thống dùng backend/templates/contract-template.xlsx cho loại Hợp đồng chung."
            style={{ marginBottom: 20 }}
          />
        )}
        <Card style={{ borderRadius: 12 }}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={templates}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: "Chưa có mẫu hợp đồng được tải lên." }}
            scroll={{ x: 700 }}
          />
        </Card>
      </Spin>

      <Modal
        title={editingTemplate ? "Sửa mẫu hợp đồng" : "Thêm mẫu hợp đồng"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={saveTemplate}
        confirmLoading={saving}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="display_name"
            label="Tên mẫu hợp đồng"
            rules={[{ required: true, whitespace: true, message: "Nhập tên mẫu hợp đồng." }]}
          >
            <Input maxLength={120} placeholder="Ví dụ: Hợp đồng chụp cưới truyền thống" />
          </Form.Item>
          {editingTemplate && !selectedFile && (
            <Typography.Paragraph type="secondary">
              File hiện tại: {editingTemplate.original_name}. Chọn file mới bên dưới nếu muốn thay file đang dùng.
            </Typography.Paragraph>
          )}
          <Form.Item label={editingTemplate ? "File thay thế (không bắt buộc)" : "File hợp đồng"}>
            <Upload
              accept=".docx,.xlsx"
              maxCount={1}
              beforeUpload={chooseFile}
              onRemove={() => { setSelectedFile(null); return true; }}
              fileList={selectedFile ? [{ uid: "contract-template", name: selectedFile.name, status: "done" }] : []}
            >
              <Button icon={<UploadOutlined />}>{selectedFile ? "Chọn file khác" : "Chọn file DOCX/XLSX"}</Button>
            </Upload>
          </Form.Item>
          <Typography.Text type="secondary">
            Mỗi mẫu cần tên riêng. Chấp nhận DOCX hoặc XLSX, tối đa 15 MB; thay file sẽ cập nhật mẫu hiện tại.
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}
