/**
 * AdminWebsiteImages.jsx
 * Trang quản lý hình ảnh đơn giản dành cho Admin:
 * Chọn tab (Trang chủ / Trang giới thiệu) -> Tải ảnh từ máy hoặc dán URL -> Lưu thay đổi.
 */
import React, { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Button,
  Input,
  Upload,
  message,
  Spin,
  Image,
  Space,
  Divider,
  Tag,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

const PRIMARY_COLOR = "#BFA16A";

const DEFAULT_FALLBACK_IMAGES = {
  HOME: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop",
  ABOUT: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop",
};

const AdminWebsiteImages = ({ defaultPage = "HOME" }) => {
  const [activeTab, setActiveTab] = useState(defaultPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Lưu thông tin bản ghi hình ảnh của trang hiện tại
  const [currentImageDoc, setCurrentImageDoc] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [initialImageUrl, setInitialImageUrl] = useState("");

  const defaultImageForTab = DEFAULT_FALLBACK_IMAGES[activeTab] || DEFAULT_FALLBACK_IMAGES.HOME;
  const displayImage = imageUrlInput.trim() || defaultImageForTab;
  const isUsingDefault = !imageUrlInput.trim() || imageUrlInput.trim() === defaultImageForTab;

  // Kiểm tra xem hình ảnh đã có thay đổi chưa (up ảnh mới, dán link khác, hoặc xóa link)
  const hasChanged = imageUrlInput.trim() !== initialImageUrl.trim();

  // Tải hình ảnh hiện tại từ server theo tab
  const fetchCurrentImage = async (pageKey = activeTab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/website/admin/images?page=${pageKey}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success && res.data?.images?.length > 0) {
        const doc = res.data.images[0];
        const loadedUrl = doc.imageUrl || "";
        setCurrentImageDoc(doc);
        setImageUrlInput(loadedUrl);
        setInitialImageUrl(loadedUrl);
      } else {
        setCurrentImageDoc(null);
        setImageUrlInput("");
        setInitialImageUrl("");
      }
    } catch (error) {
      console.error("Lỗi khi tải hình ảnh website:", error);
      message.error(
        error.response?.data?.message || "Không thể tải thông tin hình ảnh"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(defaultPage);
    fetchCurrentImage(defaultPage);
  }, [defaultPage]);

  // Upload file từ máy tính
  const handleCustomUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const uploadedUrl = res.data.url;
      setImageUrlInput(uploadedUrl);
      message.success("Tải ảnh lên thành công! Nhấn 'Lưu Thay Đổi' để hoàn tất.");
      onSuccess(res.data);
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      message.error(error.response?.data?.message || "Tải ảnh lên thất bại!");
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  // Lưu thay đổi hình ảnh
  const handleSave = async () => {
    if (!hasChanged) return;

    setSaving(true);
    const token = localStorage.getItem("token");
    const isHome = activeTab === "HOME";

    const payload = {
      page: activeTab,
      key: isHome ? "hero_banner" : "artist_portrait",
      title: isHome ? "Hình ảnh Trang Chủ" : "Hình ảnh Trang Giới Thiệu",
      imageUrl: imageUrlInput.trim(),
      isActive: true,
      order: 1,
    };

    try {
      let res;
      if (currentImageDoc?._id) {
        res = await axios.put(
          `${API_URL}/website/admin/images/${currentImageDoc._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        res = await axios.post(`${API_URL}/website/admin/images`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      message.success(
        `Đã cập nhật hình ảnh ${isHome ? "Trang Chủ" : "Trang Giới Thiệu"} thành công!`
      );

      const savedUrl = res.data?.image?.imageUrl || imageUrlInput.trim();
      setInitialImageUrl(savedUrl);
      if (res.data?.image) {
        setCurrentImageDoc(res.data.image);
      }
    } catch (error) {
      console.error("Lỗi khi lưu hình ảnh:", error);
      message.error(
        error.response?.data?.message || "Lưu hình ảnh thất bại!"
      );
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = defaultPage === "HOME" ? "Trang Chủ" : "Trang Giới Thiệu";
  const targetWebPath = defaultPage === "HOME" ? "/" : "/about";

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Main Content Card */}
      <Card
        style={{
          borderRadius: "8px",
          border: "1px solid #e8e0d8",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        {/* Header với Tiêu đề trang & Nút hành động ở góc phải */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #f0e6dc",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1f1f1f",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <PictureOutlined style={{ color: PRIMARY_COLOR }} />
            <span>Hình Ảnh {pageTitle.toUpperCase()}</span>
          </div>

          <Space>
            <Tooltip title="Làm mới">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchCurrentImage(defaultPage)}
                loading={loading}
              />
            </Tooltip>
            <Button
              icon={<EyeOutlined />}
              onClick={() => window.open(targetWebPath, "_blank")}
            >
              Xem trước trang
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ padding: "16px 0" }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#1f1f1f",
                marginBottom: "16px",
              }}
            >
              Hình Ảnh Xem Trước Cho {pageTitle.toUpperCase()}:
            </div>

            {/* Xem trước ảnh hiện tại / mặc định */}
            <div
              style={{
                marginBottom: "24px",
                textAlign: "center",
                background: "#FAF7F2",
                padding: "20px",
                borderRadius: "8px",
                border: "1px dashed #e8d0a9",
                position: "relative",
              }}
            >
              {isUsingDefault && (
                <div style={{ marginBottom: "12px" }}>
                  <Tag color="gold" style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "4px" }}>
                    <Space size={6}>
                      <span>ĐANG HIỂN THỊ ẢNH MẶC ĐỊNH HỆ THỐNG</span>
                      <Tooltip title="Nếu bạn không chọn hoặc không tải ảnh mới lên, hình ảnh hiển thị bên dưới sẽ được hệ thống sử dụng làm mặc định cho website.">
                        <InfoCircleOutlined style={{ color: "#b78103", cursor: "pointer" }} />
                      </Tooltip>
                    </Space>
                  </Tag>
                </div>
              )}
              <Image
                src={displayImage}
                alt={`Hình ảnh ${pageTitle}`}
                style={{
                  maxHeight: "360px",
                  maxWidth: "100%",
                  objectFit: "cover",
                  borderRadius: "6px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                }}
                fallback="https://via.placeholder.com/600x360?text=Loi+Duong+Dan+Anh"
              />
            </div>

            <Divider />

            {/* Bộ điều khiển gộp: Nhập URL hoặc Tải từ máy ở cuối ô */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#2f2f2f",
                  }}
                >
                  Đường dẫn hình ảnh hoặc tải ảnh mới từ máy tính:
                </label>
                <Input
                  size="large"
                  placeholder="Dán đường dẫn URL ảnh (Google Drive / Web) hoặc bấm Tải từ máy bên cạnh..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  allowClear
                  suffix={
                    <Upload
                      customRequest={handleCustomUpload}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        loading={uploading}
                        style={{
                          backgroundColor: PRIMARY_COLOR,
                          borderColor: PRIMARY_COLOR,
                          borderRadius: "4px",
                        }}
                      >
                        Tải từ máy
                      </Button>
                    </Upload>
                  }
                />
              </div>

              <div style={{ marginTop: "16px", textAlign: "right" }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={saving}
                  disabled={!hasChanged}
                  onClick={handleSave}
                  style={{
                    backgroundColor: hasChanged ? PRIMARY_COLOR : "#d9d9d9",
                    borderColor: hasChanged ? PRIMARY_COLOR : "#d9d9d9",
                    padding: "0 40px",
                    height: "48px",
                    fontSize: "15px",
                    fontWeight: "500",
                    cursor: hasChanged ? "pointer" : "not-allowed",
                  }}
                >
                  LƯU THAY ĐỔI
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminWebsiteImages;
