/**
 * AdminWebsiteImages.jsx
 * Trang quản lý hình ảnh website dành cho Admin:
 * - Trang chủ (Hero Banner)
 * - Trang Giới thiệu (Chân dung nhiếp ảnh gia)
 * - Trang Thư viện ảnh (3 ảnh nổi bật xếp lớp nghệ thuật — mặc định lấy 3 ảnh bìa album đầu tiên hoặc tùy chọn upload)
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
  Row,
  Col,
  Alert,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FALLBACK_GALLERY_IMAGE,
  getGalleryImageUrl,
} from "../../utils/imageUtils";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

const PRIMARY_COLOR = "#BFA16A";

const DEFAULT_FALLBACK_IMAGES = {
  HOME: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop",
  ABOUT: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop",
  GALLERY: FALLBACK_GALLERY_IMAGE,
};

const INITIAL_GALLERY_SLOTS = [
  {
    key: "gallery_hero_1",
    slotLabel: "Vị trí 1: Bên trái (Nghiêng trái)",
    title: "Ảnh nổi bật 1",
    imageUrl: "",
    initialUrl: "",
    docId: null,
  },
  {
    key: "gallery_hero_2",
    slotLabel: "Vị trí 2: Bên phải (Nghiêng phải)",
    title: "Ảnh nổi bật 2",
    imageUrl: "",
    initialUrl: "",
    docId: null,
  },
  {
    key: "gallery_hero_3",
    slotLabel: "Vị trí 3: Ở giữa (Nổi bật chính)",
    title: "Ảnh nổi bật 3",
    imageUrl: "",
    initialUrl: "",
    docId: null,
  },
];

const AdminWebsiteImages = ({ defaultPage = "HOME" }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  // Dữ liệu cho trang HOME & ABOUT (ảnh đơn)
  const [currentImageDoc, setCurrentImageDoc] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [initialImageUrl, setInitialImageUrl] = useState("");

  // Dữ liệu cho trang GALLERY (3 ảnh nổi bật)
  const [gallerySlots, setGallerySlots] = useState(INITIAL_GALLERY_SLOTS);
  const [topAlbums, setTopAlbums] = useState([]);

  const defaultImageForTab =
    DEFAULT_FALLBACK_IMAGES[activeTab] || DEFAULT_FALLBACK_IMAGES.HOME;
  const displayImage = imageUrlInput.trim() || defaultImageForTab;
  const isUsingDefault =
    !imageUrlInput.trim() || imageUrlInput.trim() === defaultImageForTab;

  // Kiểm tra thay đổi cho tab đơn lẻ (HOME / ABOUT)
  const hasSingleChanged = imageUrlInput.trim() !== initialImageUrl.trim();

  // Kiểm tra thay đổi cho tab GALLERY (3 ảnh)
  const hasGalleryChanged = gallerySlots.some(
    (slot) => (slot.imageUrl || "").trim() !== (slot.initialUrl || "").trim()
  );

  // Tải dữ liệu hình ảnh từ server
  const fetchImageData = async (pageKey = activeTab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (pageKey === "GALLERY") {
        const [imagesRes, galleriesRes] = await Promise.allSettled([
          axios.get(`${API_URL}/website/admin/images?page=GALLERY`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/galleries`),
        ]);

        if (galleriesRes.status === "fulfilled") {
          const list = Array.isArray(galleriesRes.value.data)
            ? galleriesRes.value.data
            : (galleriesRes.value.data?.galleries || []);
          setTopAlbums(list.slice(0, 3));
        }

        const backendImages =
          imagesRes.status === "fulfilled" && imagesRes.value.data?.images
            ? imagesRes.value.data.images
            : [];

        setGallerySlots((prev) =>
          prev.map((slot) => {
            const found = backendImages.find((img) => img.key === slot.key);
            const loadedUrl = found?.imageUrl || "";
            return {
              ...slot,
              imageUrl: loadedUrl,
              initialUrl: loadedUrl,
              docId: found?._id || null,
            };
          })
        );
      } else {
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
    fetchImageData(defaultPage);
  }, [defaultPage]);

  // Chuyển tab qua thanh điều hướng
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === "HOME") navigate("/admin/website/home-images");
    else if (key === "ABOUT") navigate("/admin/website/about-images");
    else if (key === "GALLERY") navigate("/admin/website/gallery-images");
  };

  // Upload ảnh cho HOME / ABOUT
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

  // Upload ảnh cho từng slot GALLERY
  const handleCustomUploadGallery = (slotIndex) => async ({ file, onSuccess, onError }) => {
    setUploadingSlot(slotIndex);
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
      setGallerySlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { ...next[slotIndex], imageUrl: uploadedUrl };
        return next;
      });
      message.success(`Tải ảnh cho ${gallerySlots[slotIndex].title} thành công! Nhấn "Lưu Thay Đổi" để hoàn tất.`);
      onSuccess(res.data);
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      message.error(error.response?.data?.message || "Tải ảnh lên thất bại!");
      onError(error);
    } finally {
      setUploadingSlot(null);
    }
  };

  // Đặt lại slot GALLERY về mặc định (xóa link custom)
  const handleResetSlot = (slotIndex) => {
    setGallerySlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], imageUrl: "" };
      return next;
    });
    message.info(
      `Đã xóa ảnh tùy chọn. Vị trí này sẽ tự động lấy ảnh bìa album #${slotIndex + 1}. Nhấn "Lưu Thay Đổi" để áp dụng.`
    );
  };

  // Lưu cho HOME / ABOUT
  const handleSaveSingle = async () => {
    if (!hasSingleChanged) return;

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
          { headers: { Authorization: `Bearer ${token}` } }
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
      message.error(error.response?.data?.message || "Lưu hình ảnh thất bại!");
    } finally {
      setSaving(false);
    }
  };

  // Lưu cho GALLERY (3 slots)
  const handleSaveGallery = async () => {
    if (!hasGalleryChanged) return;

    setSaving(true);
    const token = localStorage.getItem("token");

    const payload = {
      page: "GALLERY",
      images: gallerySlots.map((slot, index) => ({
        key: slot.key,
        title: slot.title,
        description: `Ảnh nổi bật ${index + 1} đầu trang Thư viện ảnh`,
        imageUrl: (slot.imageUrl || "").trim(),
        order: index + 1,
        isActive: true,
      })),
    };

    try {
      await axios.post(`${API_URL}/website/admin/images`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success("Đã cập nhật cấu hình 3 ảnh nổi bật Thư viện ảnh thành công!");
      setGallerySlots((prev) =>
        prev.map((slot) => ({ ...slot, initialUrl: (slot.imageUrl || "").trim() }))
      );
    } catch (error) {
      console.error("Lỗi khi lưu ảnh Thư viện ảnh:", error);
      message.error(error.response?.data?.message || "Lưu hình ảnh thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const getPageInfo = () => {
    switch (activeTab) {
      case "ABOUT":
        return {
          title: "Trang Giới Thiệu",
          path: "/about",
          btnLabel: "LƯU THAY ĐỔI",
        };
      case "GALLERY":
        return {
          title: "Trang Thư Viện Ảnh",
          path: "/galleries",
          btnLabel: "LƯU CẤU HÌNH 3 ẢNH NỔI BẬT",
        };
      default:
        return {
          title: "Trang Chủ",
          path: "/",
          btnLabel: "LƯU THAY ĐỔI",
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <Card
        style={{
          borderRadius: "8px",
          border: "1px solid #e8e0d8",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        {/* Header Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "16px",
            borderBottom: "1px solid #f0e6dc",
            paddingBottom: "8px",
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            style={{ marginBottom: 0 }}
            items={[
              {
                key: "HOME",
                label: (
                  <span>
                    <HomeOutlined /> Trang Chủ
                  </span>
                ),
              },
              {
                key: "ABOUT",
                label: (
                  <span>
                    <InfoCircleOutlined /> Trang Giới Thiệu
                  </span>
                ),
              },
              {
                key: "GALLERY",
                label: (
                  <span>
                    <PictureOutlined /> Trang Thư Viện Ảnh
                  </span>
                ),
              },
            ]}
          />

          <Space>
            <Tooltip title="Tải lại dữ liệu">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchImageData(activeTab)}
                loading={loading}
              />
            </Tooltip>
            <Button
              icon={<EyeOutlined />}
              onClick={() => window.open(pageInfo.path, "_blank")}
            >
              Xem trước trang
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
          </div>
        ) : activeTab === "GALLERY" ? (
          /* ==========================================
              GIAO DIỆN QUẢN LÝ 3 ẢNH NỔI BẬT GALLERY
             ========================================== */
          <div style={{ padding: "8px 0" }}>
            <Alert
              type="info"
              showIcon
              message={
                <span style={{ fontWeight: "600" }}>
                  Cơ chế hiển thị 3 hình xếp lớp ở đầu trang Thư viện ảnh:
                </span>
              }
              description={
                <div style={{ fontSize: "13px", lineHeight: "1.7" }}>
                  <div>
                    ✦ <strong>Mặc định:</strong> Hệ thống tự động lấy ảnh bìa của 3 album đầu tiên trong danh sách để hiển thị, khi khách click vào sẽ mở chi tiết album đó.
                  </div>
                  <div>
                    ✦ <strong>Tùy chọn:</strong> Nếu bạn tải lên ảnh riêng ở vị trí nào, hệ thống sẽ ưu tiên hiển thị ảnh đó. Khi muốn quay về dùng ảnh bìa album, bạn chỉ cần bấm nút <em>"Khôi phục ảnh album"</em> và nhấn <em>"Lưu cấu hình"</em>.
                  </div>
                </div>
              }
              style={{ marginBottom: "24px", background: "#FAF7F2", borderColor: "#E8DED2" }}
            />

            <Row gutter={[20, 24]}>
              {gallerySlots.map((slot, index) => {
                const albumFallback = topAlbums[index];
                const fallbackUrl = albumFallback
                  ? getGalleryImageUrl(albumFallback, "cover", FALLBACK_GALLERY_IMAGE)
                  : FALLBACK_GALLERY_IMAGE;

                const hasCustomUrl = Boolean(slot.imageUrl?.trim());
                const previewUrl = hasCustomUrl ? slot.imageUrl.trim() : fallbackUrl;

                return (
                  <Col xs={24} lg={8} key={slot.key}>
                    <Card
                      size="small"
                      title={
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "600", fontSize: "14px", color: "#1F1F1F" }}>
                            {slot.title}
                          </span>
                          <span style={{ fontSize: "11px", color: "#888888" }}>
                            {index === 0 ? "Bên trái" : index === 1 ? "Bên phải" : "Ở giữa"}
                          </span>
                        </div>
                      }
                      style={{
                        height: "100%",
                        border: "1px solid #E8DED2",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      bodyStyle={{ flex: 1, display: "flex", flexDirection: "column" }}
                    >
                      {/* Trạng thái ảnh */}
                      <div style={{ marginBottom: "12px", minHeight: "26px" }}>
                        {hasCustomUrl ? (
                          <Tag color="cyan" style={{ fontSize: "11px" }}>
                            ẢNH TÙY CHỌN CỦA ADMIN
                          </Tag>
                        ) : (
                          <Tag color="gold" style={{ fontSize: "11px" }}>
                            MẶC ĐỊNH: ALBUM #{index + 1}
                            {albumFallback?.title ? ` (${albumFallback.title})` : ""}
                          </Tag>
                        )}
                      </div>

                      {/* Khung Preview ảnh */}
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "4 / 3",
                          background: "#FAF7F2",
                          borderRadius: "4px",
                          overflow: "hidden",
                          border: "1px dashed #d9d9d9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <Image
                          src={previewUrl}
                          alt={slot.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          fallback="https://via.placeholder.com/400x300?text=Loi+Anh"
                        />
                      </div>

                      {/* Ô nhập link & Tải từ máy */}
                      <div style={{ marginTop: "auto" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            marginBottom: "6px",
                            color: "#555555",
                          }}
                        >
                          Đường dẫn ảnh hoặc tải từ máy tính:
                        </label>
                        <Input
                          placeholder="Dán URL ảnh hoặc bấm Tải từ máy..."
                          value={slot.imageUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGallerySlots((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], imageUrl: val };
                              return next;
                            });
                          }}
                          allowClear
                          suffix={
                            <Upload
                              customRequest={handleCustomUploadGallery(index)}
                              showUploadList={false}
                              accept="image/*"
                            >
                              <Button
                                size="small"
                                type="primary"
                                icon={<UploadOutlined />}
                                loading={uploadingSlot === index}
                                style={{
                                  backgroundColor: PRIMARY_COLOR,
                                  borderColor: PRIMARY_COLOR,
                                }}
                              >
                                Tải
                              </Button>
                            </Upload>
                          }
                        />

                        {hasCustomUrl && (
                          <div style={{ marginTop: "8px", textAlign: "right" }}>
                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleResetSlot(index)}
                              style={{ padding: 0, fontSize: "12px" }}
                            >
                              Khôi phục ảnh bìa album
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <Divider />

            <div style={{ textAlign: "right" }}>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={saving}
                disabled={!hasGalleryChanged}
                onClick={handleSaveGallery}
                style={{
                  backgroundColor: hasGalleryChanged ? PRIMARY_COLOR : "#d9d9d9",
                  borderColor: hasGalleryChanged ? PRIMARY_COLOR : "#d9d9d9",
                  padding: "0 40px",
                  height: "48px",
                  fontSize: "15px",
                  fontWeight: "500",
                  cursor: hasGalleryChanged ? "pointer" : "not-allowed",
                }}
              >
                {pageInfo.btnLabel}
              </Button>
            </div>
          </div>
        ) : (
          /* ==========================================
              GIAO DIỆN QUẢN LÝ ẢNH ĐƠN (HOME / ABOUT)
             ========================================== */
          <div style={{ padding: "16px 0" }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#1f1f1f",
                marginBottom: "16px",
              }}
            >
              Hình Ảnh Xem Trước Cho {pageInfo.title.toUpperCase()}:
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
                  <Tag
                    color="gold"
                    style={{
                      fontSize: "12px",
                      padding: "3px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    <Space size={6}>
                      <span>ĐANG HIỂN THỊ ẢNH MẶC ĐỊNH HỆ THỐNG</span>
                      <Tooltip title="Nếu bạn không chọn hoặc không tải ảnh mới lên, hình ảnh hiển thị bên dưới sẽ được hệ thống sử dụng làm mặc định cho website.">
                        <InfoCircleOutlined
                          style={{ color: "#b78103", cursor: "pointer" }}
                        />
                      </Tooltip>
                    </Space>
                  </Tag>
                </div>
              )}
              <Image
                src={displayImage}
                alt={`Hình ảnh ${pageInfo.title}`}
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
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
                  disabled={!hasSingleChanged}
                  onClick={handleSaveSingle}
                  style={{
                    backgroundColor: hasSingleChanged
                      ? PRIMARY_COLOR
                      : "#d9d9d9",
                    borderColor: hasSingleChanged ? PRIMARY_COLOR : "#d9d9d9",
                    padding: "0 40px",
                    height: "48px",
                    fontSize: "15px",
                    fontWeight: "500",
                    cursor: hasSingleChanged ? "pointer" : "not-allowed",
                  }}
                >
                  {pageInfo.btnLabel}
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
