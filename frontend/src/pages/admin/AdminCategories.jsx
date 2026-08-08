/**
 * AdminCategories.jsx
 * Quản lý danh mục (SERVICE/GALLERY): CRUD, sắp xếp thứ tự kéo thả.
 */
import React, { useEffect, useState } from "react";
import { Table, Button, Space, message, Modal, Form, Input, Switch, Tag, Card, Typography, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, MenuOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const DragIndexContext = React.createContext({
  setActivatorNodeRef: null,
  listeners: null,
});

// Nút kéo thả dòng trong bảng sắp xếp thứ tự.
const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = React.useContext(DragIndexContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<MenuOutlined />}
      style={{ cursor: "grab", color: "#999" }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

// Bọc một dòng bảng để hỗ trợ kéo thả bằng dnd-kit.
const SortableRow = ({ children, ...props }) => {
  const id = props["data-row-key"];
  const sortable = useSortable({
    id: id || "empty-row",
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  if (!id) {
    return <tr {...props}>{children}</tr>;
  }

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 })?.replace(
      /translate3d\(([^,]+),/,
      "translate3d(0,"
    ),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999, background: "#fafafa" } : {}),
  };

  const contextValue = React.useMemo(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners]
  );

  return (
    <DragIndexContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes}>
        {children}
      </tr>
    </DragIndexContext.Provider>
  );
};

// Trang admin quản lý danh mục dịch vụ và album.
export default function AdminCategories() {
  const { type } = useParams(); // 'service' hoặc 'gallery'
  const categoryType = type === "gallery" ? "GALLERY" : "SERVICE";
  const title = type === "gallery" ? "Quản lý danh mục Thư viện ảnh" : "Quản lý danh mục Gói dịch vụ";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
  }, [categoryType]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/categories?type=${categoryType}`);
      setCategories(res.data.categories || []);
    } catch (error) {
      message.error("Lỗi khi tải danh sách danh mục");
    }
    setLoading(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = async ({ active, over }) => {
    if (active.id !== over?.id) {
      const activeIndex = categories.findIndex((i) => i._id === active.id);
      const overIndex = categories.findIndex((i) => i._id === over?.id);
      const newCategories = arrayMove(categories, activeIndex, overIndex);
      
      const reorderedItems = newCategories.map((item, index) => ({
        _id: item._id,
        order: index,
      }));

      setCategories(newCategories);

      try {
        await axios.put(
          `${API_URL}/categories/admin/reorder`,
          { items: reorderedItems },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        message.success("Cập nhật thứ tự thành công");
      } catch (err) {
        message.error("Lỗi cập nhật thứ tự, đang tải lại...");
        fetchCategories();
      }
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Bạn có chắc chắn muốn xóa danh mục này?",
      content: "Các gói/album đang sử dụng danh mục này sẽ bị ẩn khỏi bộ lọc.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/categories/admin/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          message.success("Đã xóa danh mục");
          fetchCategories();
        } catch (error) {
          message.error("Không thể xóa danh mục");
        }
      },
    });
  };

  const handleModalSubmit = async (values) => {
    try {
      const payload = { ...values, type: categoryType };
      
      if (editingCategory) {
        await axios.put(`${API_URL}/categories/admin/${editingCategory._id}`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        message.success("Đã cập nhật danh mục");
      } else {
        await axios.post(`${API_URL}/categories/admin`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        message.success("Đã thêm danh mục mới");
      }
      setIsModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi lưu danh mục");
    }
  };

  const handleToggleActive = async (record, checked) => {
    try {
      await axios.put(
        `${API_URL}/categories/admin/${record._id}`,
        { is_active: checked },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      message.success(checked ? "Đã hiện danh mục" : "Đã ẩn danh mục");
      fetchCategories();
    } catch (error) {
      message.error("Không thể thay đổi trạng thái");
    }
  };

  const columns = [
    {
      title: (
        <Tooltip title="Nhấn giữ và kéo thả icon ở mỗi dòng để thay đổi thứ tự hiển thị">
          <InfoCircleOutlined style={{ color: "#BFA16A", cursor: "pointer" }} />
        </Tooltip>
      ),
      key: "sort",
      width: 50,
      align: "center",
      render: () => <DragHandle />,
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Mã (Slug)",
      dataIndex: "slug",
      key: "slug",
      render: (text) => (
        <Tag style={{ color: "#8C6B2D", background: "#FAF6EF", borderColor: "#E8DFD1", fontWeight: 600, borderRadius: 4 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Trạng thái",
      key: "is_active",
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const { Title } = Typography;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
          {title}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
        >
          Thêm danh mục
        </Button>
      </div>

      <Card
        bordered={false}
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)", borderRadius: 12, border: "1px solid #efebe4", overflow: "hidden" }}
        bodyStyle={{ padding: "0px" }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={categories.map((i) => i._id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              components={{
                body: {
                  row: SortableRow,
                },
              }}
              columns={columns}
              dataSource={categories}
              rowKey="_id"
              loading={loading}
              bordered={false}
              pagination={false}
              style={{ borderRadius: 12 }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal
        title={editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="VD: Ảnh cưới truyền thống" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Mã định danh (Slug)"
            rules={[
              { required: true, message: "Vui lòng nhập mã danh mục!" },
              { pattern: /^[A-Z0-9_]+$/, message: "Mã chỉ được chứa chữ in hoa, số và dấu gạch dưới!" }
            ]}
          >
            <Input placeholder="VD: TRADITIONAL_WEDDING" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Nhập mô tả ngắn gọn..." rows={3} />
          </Form.Item>
          <Form.Item name="is_active" label="Trạng thái hiển thị" valuePropName="checked">
            <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}>
                Lưu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

