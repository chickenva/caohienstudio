import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Image,
  Typography,
  Select,
  Input,
  Row,
  Col,
  Card,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SearchOutlined,
  CameraOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
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

const { Title, Text } = Typography;

const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";


const statusOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hiển thị" },
  { value: "HIDDEN", label: "Đã ẩn" },
];

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

// Trang admin quản lý dịch vụ, kéo thả thứ tự và ẩn/hiện gói.
const AdminServices = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories?type=SERVICE`);
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error("Lỗi khi tải danh mục dịch vụ:", error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = async ({ active, over }) => {
    if (active.id !== over?.id) {
      const activeIndex = services.findIndex((i) => i._id === active.id);
      const overIndex = services.findIndex((i) => i._id === over?.id);
      const newServices = arrayMove(services, activeIndex, overIndex);
      
      // Calculate new orders. The backend sorted ascending by order, so let's just reassign them.
      // If we just send back the items with their new order (e.g. index), it's fine.
      const reorderedItems = newServices.map((item, index) => ({
        _id: item._id,
        order: index,
      }));

      // Update state optimistically
      setServices(newServices);

      try {
        await axios.put(
          `${API_URL}/services/admin/reorder`,
          { items: reorderedItems },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        message.success("Cập nhật thứ tự thành công");
      } catch (err) {
        message.error("Lỗi cập nhật thứ tự, đang tải lại...");
        fetchServices();
      }
    }
  };

  const getToken = () => localStorage.getItem("token");

  const fetchServices = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/services/admin/all`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setServices(res.data || []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách dịch vụ",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
    setActionLoadingId(record._id);

    try {
      await axios.patch(
        `${API_URL}/services/admin/${record._id}/toggle-active`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      message.success("Cập nhật trạng thái dịch vụ thành công");
      fetchServices();
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái dịch vụ",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalCount = services.length;
  const activeCount = services.filter((s) => s.is_active).length;
  const hiddenCount = totalCount - activeCount;

  const filteredServices = services.filter((service) => {
    const matchSearch =
      !searchText ||
      (service?.name && service.name.toLowerCase().includes(searchText.toLowerCase())) ||
      (service?.description &&
        service.description.toLowerCase().includes(searchText.toLowerCase()));
    const catSlug = typeof service?.category === 'object' ? service.category?.slug : service?.category;
    const matchCategory =
      categoryFilter.length === 0 || categoryFilter.includes(catSlug);
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && service?.is_active) ||
      (statusFilter === "HIDDEN" && !service?.is_active);
    return matchSearch && matchCategory && matchStatus;
  });

  const isFiltering = searchText !== "" || categoryFilter.length > 0 || statusFilter !== "ALL";

  const columns = [
    {
      key: "sort",
      width: 50,
      align: "center",
      render: () => isFiltering ? (
        <Tooltip title="Vui lòng xóa bộ lọc để sắp xếp">
          <Button type="text" size="small" icon={<MenuOutlined />} disabled style={{ color: "#d9d9d9" }} />
        </Tooltip>
      ) : (
        <DragHandle />
      ),
    },
    {
      title: "ẢNH",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 110,
      render: (thumbnail) => (
        <Image
          src={
            thumbnail ||
            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop"
          }
          width={78}
          height={58}
          style={{ objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
          preview={false}
        />
      ),
    },
    {
      title: "GÓI DỊCH VỤ",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: "#262626", fontSize: "14px" }}>{record?.name || "Chưa có tên"}</div>
          <div
            style={{
              fontSize: 12,
              color: "#8c8c8c",
              maxWidth: 420,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 4,
            }}
          >
            {record.description || "Chưa có mô tả"}
          </div>
        </div>
      ),
    },
    {
      title: "DANH MỤC",
      dataIndex: "category",
      key: "category",
      width: 190,
      render: (category) => {
        const catSlug = typeof category === 'object' ? category?.slug : category;
        const cat = categories.find((c) => c.slug === catSlug);
        const displayName = cat ? cat.name?.toUpperCase() : (typeof category === 'object' ? category?.name : category) || "KHÁC";
        return (
          <Tag color="gold" style={{ fontWeight: 500, borderRadius: 4 }}>
            {typeof displayName === 'string' ? displayName : "KHÁC"}
          </Tag>
        );
      },
    },

    {
      title: "GIÁ BÁN",
      dataIndex: "base_price",
      key: "base_price",
      width: 160,
      align: "right",
      render: (price) => (
        <strong style={{ color: "#d4b106", fontSize: "14px" }}>
          {Number(price || 0).toLocaleString("vi-VN")}đ
        </strong>
      ),
    },
    {
      title: "THỜI LƯỢNG",
      dataIndex: "duration_hours",
      key: "duration_hours",
      width: 130,
      render: (hours) => (
        <Tag color="purple" style={{ fontWeight: 500, borderRadius: 4 }}>
          {hours} giờ
        </Tag>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "is_active",
      key: "is_active",
      width: 140,
      render: (isActive) =>
        isActive ? (
          <Tag color="green" style={{ fontWeight: 600, borderRadius: 4 }}>
            ĐANG HIỂN THỊ
          </Tag>
        ) : (
          <Tag color="default" style={{ fontWeight: 600, borderRadius: 4 }}>
            ĐÃ ẨN
          </Tag>
        ),
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      width: 240,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => window.open(`/services/${record._id}`, "_blank")}
          >
            Xem
          </Button>

          <Button
            type="primary"
            ghost
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/services/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Button
            danger={record.is_active}
            icon={record.is_active ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            loading={actionLoadingId === record._id}
            onClick={() => handleToggleActive(record)}
          >
            {record.is_active ? "Ẩn" : "Hiện"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Title block */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 4, fontWeight: 700 }}>
            Quản lý gói dịch vụ
          </Title>
          <Text type="secondary">
            Thêm, chỉnh sửa, ẩn/hiện và sắp xếp thứ tự hiển thị của các gói chụp ảnh trên website.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchServices}>
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/services/add")}
            style={{ fontWeight: 600 }}
          >
            Thêm dịch vụ
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(24,144,255,0.15)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                  Tổng số gói dịch vụ
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{totalCount}</div>
              </div>
              <CameraOutlined style={{ fontSize: 36, opacity: 0.8 }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(82,196,26,0.15)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                  Gói đang hiển thị
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{activeCount}</div>
              </div>
              <EyeOutlined style={{ fontSize: 36, opacity: 0.8 }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #bfbfbf 0%, #8c8c8c 100%)",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(140,140,140,0.15)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                  Gói đang ẩn
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{hiddenCount}</div>
              </div>
              <EyeInvisibleOutlined style={{ fontSize: 36, opacity: 0.8 }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter panel */}
      <Card
        bordered={false}
        style={{ marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 8 }}
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Tìm kiếm gói dịch vụ</span>
            <Input
              placeholder="Nhập tên gói hoặc mô tả..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Lọc theo danh mục</span>
            <Select
              mode="multiple"
              placeholder="Tất cả danh mục"
              style={{ width: "100%" }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories.map((c) => ({
                value: c?.slug,
                label: c?.name,
              }))}
              maxTagCount="responsive"
              allowClear
              size="large"
              dropdownStyle={{ borderRadius: 6 }}
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Lọc theo trạng thái</span>
            <Select
              placeholder="Tất cả trạng thái"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              size="large"
              dropdownStyle={{ borderRadius: 6 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card
        bordered={false}
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 8 }}
        bodyStyle={{ padding: "0px" }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={filteredServices.map((i) => i._id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              components={{
                body: {
                  row: SortableRow,
                },
              }}
              columns={columns}
              dataSource={filteredServices}
              rowKey="_id"
              loading={loading}
              bordered={false}
              scroll={{ x: 1000 }}
              pagination={false}
              style={{ borderRadius: 8, overflow: "hidden" }}
            />
          </SortableContext>
        </DndContext>
      </Card>
    </div>
  );
};

export default AdminServices;
