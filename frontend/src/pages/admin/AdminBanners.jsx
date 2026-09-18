/**
 * AdminBanners.jsx
 * Trang quản lý Banner / Poster cho Admin.
 * CRUD banner đơn giản + Kéo thả sắp xếp thứ tự (dnd-kit).
 */
import React, { useEffect, useState, useMemo } from "react";
import {
  Table, Button, Modal, Form, Input, DatePicker,
  Switch, Space, Tag, message, Typography, Popconfirm,
  Card, Image, Tooltip, Row, Col, Upload,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, EyeInvisibleOutlined,
  UploadOutlined, PictureOutlined, MenuOutlined,
  InfoCircleOutlined, FacebookOutlined, LinkOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
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

const { Title } = Typography;

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

// ======= Drag & Drop Context + Components =======

const DragIndexContext = React.createContext({
  setActivatorNodeRef: null,
  listeners: null,
});

/** Nút kéo thả (drag handle) hiển thị icon ☰ */
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

/** Bọc một dòng bảng (row) để hỗ trợ kéo thả bằng dnd-kit */
const SortableRow = ({ children, ...props }) => {
  const id = props["data-row-key"];
  const sortable = useSortable({ id: id || "empty-row" });

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

// ======= Main Component =======

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form] = Form.useForm();

  const getToken = () => localStorage.getItem("token");
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/banners/admin/all`, authHeaders());
      setBanners(res.data?.banners || []);
    } catch (err) {
      message.error("Không thể tải danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  // ======= Drag & Drop handler =======
  const onDragEnd = async ({ active, over }) => {
    if (active.id !== over?.id) {
      const activeIndex = banners.findIndex((i) => i._id === active.id);
      const overIndex = banners.findIndex((i) => i._id === over?.id);
      const newBanners = arrayMove(banners, activeIndex, overIndex);

      const reorderedItems = newBanners.map((item, index) => ({
        _id: item._id,
        order: index,
      }));

      // Optimistic update
      setBanners(newBanners);

      try {
        await axios.put(
          `${API_URL}/banners/admin/reorder`,
          { items: reorderedItems },
          authHeaders()
        );
        message.success("Cập nhật thứ tự thành công");
      } catch (err) {
        message.error("Lỗi cập nhật thứ tự, đang tải lại...");
        fetchBanners();
      }
    }
  };

  const openModal = (banner = null) => {
    setEditingBanner(banner);
    if (banner) {
      form.setFieldsValue({
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || "",
        start_date: dayjs(banner.start_date),
        end_date: dayjs(banner.end_date),
        is_active: banner.is_active,
      });
      setPreviewUrl(resolveImageUrl(banner.imageUrl));
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true, linkUrl: "" });
      setPreviewUrl("");
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        imageUrl: values.imageUrl,
        linkUrl: values.linkUrl ? values.linkUrl.trim() : "",
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        is_active: values.is_active,
      };

      if (editingBanner) {
        await axios.put(`${API_URL}/banners/admin/${editingBanner._id}`, payload, authHeaders());
        message.success("Cập nhật banner thành công");
      } else {
        await axios.post(`${API_URL}/banners/admin`, payload, authHeaders());
        message.success("Tạo banner thành công");
      }

      setModalOpen(false);
      setPreviewUrl("");
      fetchBanners();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || "Lỗi khi lưu banner");
      }
    }
  };

  const handleCustomUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const uploadedUrl = res.data.url;
      form.setFieldsValue({ imageUrl: uploadedUrl });
      setPreviewUrl(resolveImageUrl(uploadedUrl));
      message.success("Tải ảnh lên thành công");
      if (onSuccess) onSuccess("ok");
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi tải ảnh lên server");
      if (onError) onError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await axios.patch(`${API_URL}/banners/admin/${id}/toggle`, {}, authHeaders());
      message.success("Đã thay đổi trạng thái banner");
      fetchBanners();
    } catch (err) {
      message.error("Lỗi khi thay đổi trạng thái");
    }
  };

  const openDeleteModal = (banner) => {
    setBannerToDelete(banner);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/banners/admin/${bannerToDelete._id}`, authHeaders());
      message.success("Xóa banner thành công");
      setDeleteModalOpen(false);
      setBannerToDelete(null);
      fetchBanners();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi xóa banner");
    } finally {
      setDeleting(false);
    }
  };

  const handleInlineDateChange = async (bannerId, dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      message.warning("Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc");
      return;
    }
    const [start, end] = dates;
    if (end.isBefore(start) || end.isSame(start)) {
      message.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    try {
      // Optimistic update
      setBanners((prev) =>
        prev.map((b) =>
          b._id === bannerId
            ? { ...b, start_date: start.toISOString(), end_date: end.toISOString() }
            : b
        )
      );

      await axios.put(
        `${API_URL}/banners/admin/${bannerId}`,
        {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
        authHeaders()
      );
      message.success("Cập nhật thời gian hiển thị thành công");
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi cập nhật thời gian");
      fetchBanners();
    }
  };

  const getBannerStatus = (banner) => {
    const now = new Date();
    if (!banner.is_active) return { label: "Tắt", color: "default" };
    if (new Date(banner.end_date) < now) return { label: "Hết hạn", color: "red" };
    if (new Date(banner.start_date) > now) return { label: "Chưa bắt đầu", color: "blue" };
    return { label: "Đang hiển thị", color: "green" };
  };

  const resolveImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const backendBase = API_URL.replace(/\/api\/?$/, "");
    return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
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
      title: "Poster",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      render: (url) =>
        url ? (
          <Image src={resolveImageUrl(url)} width={70} height={50} style={{ objectFit: "cover", borderRadius: 6 }} preview={{ mask: <EyeOutlined /> }} />
        ) : (
          <div style={{ width: 70, height: 50, background: "#f5f5f5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 18 }}>
            <PictureOutlined />
          </div>
        ),
    },
    {
      title: "Thời gian hiển thị",
      key: "dates",
      width: 360,
      align: "center",
      render: (_, record) => {
        const start = record.start_date && dayjs(record.start_date).isValid() ? dayjs(record.start_date) : null;
        const end = record.end_date && dayjs(record.end_date).isValid() ? dayjs(record.end_date) : null;

        return (
          <div style={{ whiteSpace: "nowrap", display: "flex", justifyContent: "center" }}>
            <DatePicker.RangePicker
              value={start && end ? [start, end] : null}
              showTime={{ format: "HH:mm" }}
              format="DD/MM/YYYY HH:mm"
              allowClear={false}
              onChange={(dates) => handleInlineDateChange(record._id, dates)}
              style={{ width: "100%", maxWidth: 330 }}
              placeholder={["Bắt đầu", "Kết thúc"]}
            />
          </div>
        );
      },
    },
    {
      title: "Bài viết Facebook",
      dataIndex: "linkUrl",
      key: "linkUrl",
      width: 170,
      align: "center",
      render: (url) =>
        url ? (
          <Tooltip title={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "#1877F2",
                fontWeight: 600,
                fontSize: 12,
                background: "#f0f5ff",
                padding: "4px 10px",
                borderRadius: 20,
                border: "1px solid #adc6ff",
              }}
            >
              <FacebookOutlined style={{ fontSize: 14 }} /> Xem bài viết
            </a>
          </Tooltip>
        ) : (
          <span style={{ color: "#bbb", fontSize: 12 }}>—</span>
        ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      align: "center",
      render: (_, record) => {
        const status = getBannerStatus(record);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title={record.is_active ? "Tắt hiển thị" : "Bật hiển thị"}>
            <Button
              size="small"
              icon={record.is_active ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => handleToggle(record._id)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => openDeleteModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
          Quản lý Banner quảng cáo
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
        >
          Thêm banner
        </Button>
      </div>

      <Card
        style={{ borderRadius: 12, border: "1px solid #efebe4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
        bodyStyle={{ padding: 0 }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={banners.map((b) => b._id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              components={{
                body: {
                  row: SortableRow,
                },
              }}
              columns={columns}
              dataSource={banners}
              rowKey="_id"
              loading={loading}
              pagination={false}
              scroll={{ x: 990 }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      {/* Modal Tạo/Sửa Banner */}
      <Modal
        open={modalOpen}
        title={editingBanner ? "Sửa banner" : "Thêm banner mới"}
        onCancel={() => { setModalOpen(false); setPreviewUrl(""); }}
        onOk={handleSave}
        okText={editingBanner ? "Lưu" : "Tạo"}
        cancelText="Hủy"
        okButtonProps={{ style: { backgroundColor: "#BFA16A", borderColor: "#BFA16A" } }}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Ảnh poster" required style={{ marginBottom: 12 }}>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item name="imageUrl" noStyle rules={[{ required: true, message: "Vui lòng thêm ảnh poster" }]}>
                <Input
                  placeholder="Dán URL ảnh hoặc bấm Tải ảnh..."
                  onChange={(e) => setPreviewUrl(resolveImageUrl(e.target.value))}
                />
              </Form.Item>
              <Upload
                customRequest={handleCustomUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Tải ảnh
                </Button>
              </Upload>
            </Space.Compact>
          </Form.Item>

          {/* Preview ảnh */}
          {previewUrl && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              background: "#faf7f2",
              border: "1px solid #e8ded2",
              borderRadius: 8,
              textAlign: "center",
            }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  objectFit: "contain",
                  borderRadius: 6,
                }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: "#999" }}>Xem trước poster</div>
            </div>
          )}

          <Form.Item
            label="Đường dẫn bài viết Facebook (tùy chọn)"
            name="linkUrl"
            tooltip="Khi khách bấm vào banner trên website sẽ tự động mở bài viết chi tiết này trên Facebook"
          >
            <Input
              prefix={<FacebookOutlined style={{ color: "#1877F2" }} />}
              placeholder="https://www.facebook.com/.../posts/..."
              allowClear
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Ngày bắt đầu"
                name="start_date"
                rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
              >
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Ngày kết thúc"
                name="end_date"
                rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
              >
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Kích hoạt hiển thị" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Xác nhận Xóa Banner */}
      <Modal
        open={deleteModalOpen}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#cf1322" }}>
            <ExclamationCircleOutlined style={{ fontSize: 22 }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>Xác nhận xóa banner</span>
          </div>
        }
        onCancel={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setBannerToDelete(null);
          }
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setDeleteModalOpen(false);
              setBannerToDelete(null);
            }}
            disabled={deleting}
          >
            Hủy
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleting}
            icon={<DeleteOutlined />}
            onClick={confirmDelete}
          >
            Xóa vĩnh viễn
          </Button>,
        ]}
        width={480}
        destroyOnClose
        centered
      >
        {bannerToDelete && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: "#444", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa banner này? Thao tác này sẽ xóa vĩnh viễn dữ liệu và <strong>không thể khôi phục</strong>.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                padding: 12,
                background: "#faf7f2",
                borderRadius: 8,
                border: "1px solid #efebe4",
                alignItems: "center",
              }}
            >
              {bannerToDelete.imageUrl ? (
                <img
                  src={resolveImageUrl(bannerToDelete.imageUrl)}
                  alt="Poster"
                  style={{
                    width: 90,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #e0d8cc",
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 90,
                    height: 60,
                    background: "#eee",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    flexShrink: 0,
                  }}
                >
                  <PictureOutlined style={{ fontSize: 20 }} />
                </div>
              )}

              <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, overflow: "hidden" }}>
                <div>
                  <span style={{ color: "#888" }}>Thời gian:</span>{" "}
                  <strong>{dayjs(bannerToDelete.start_date).format("DD/MM/YYYY HH:mm")}</strong>
                  {" ~ "}
                  <strong>{dayjs(bannerToDelete.end_date).format("DD/MM/YYYY HH:mm")}</strong>
                </div>
                {bannerToDelete.linkUrl ? (
                  <div style={{ color: "#1877F2", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <FacebookOutlined style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {bannerToDelete.linkUrl}
                    </span>
                  </div>
                ) : (
                  <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                    Chưa gắn link bài viết
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminBanners;
