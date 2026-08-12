/**
 * imageUtils.js
 * Tiện ích xử lý và chuẩn hóa URL ảnh Google Drive/CDN cho frontend.
 * Hỗ trợ nâng chất lượng ảnh (upgrade size), tải lười (lazy load),
 * phát hiện màu chủ đạo và sinh palette cho thumbnail gallery.
 */
import { API_URL } from "../config/api";

export const FALLBACK_GALLERY_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop";

const GOOGLE_SIZE_BY_VARIANT = {
  thumb: "s480",
  grid: "s1200",
  cover: "s1800",
  preview: "s2560",
};

const dimensionCache = new Map();

// Nhận diện link CDN googleusercontent để nâng chất lượng ảnh.
const isGoogleUserContentUrl = (url = "") =>
  /googleusercontent\.com/i.test(url);

// Nhận diện link Google Drive bất kỳ (link share/view, open, uc, thumbnail, cdn)
const isGoogleDriveUrl = (url = "") =>
  /drive\.google\.com/i.test(url) || /googleusercontent\.com\/d\//i.test(url);

const isDriveThumbnailUrl = (url = "") =>
  /drive\.google\.com\/thumbnail/i.test(url) || isGoogleDriveUrl(url);

/**
 * Phân biệt ảnh đã upload lên server (Cloudinary, local server, v.v.)
 * với link Google Drive/Photos.
 * Ưu tiên ảnh server khi cả hai đều tồn tại.
 * @param {string} url
 * @returns {boolean}
 */
export const isServerUploadUrl = (url = "") => {
  if (!url) return false;
  const u = url.trim();
  // Nếu là link Google Drive / Photos / googleusercontent → không phải server upload
  if (isGoogleDriveUrl(u) || isGoogleUserContentUrl(u)) return false;
  if (/photos\.google\.com/i.test(u)) return false;
  // Các domain còn lại (Cloudinary, server tự host, Unsplash fallback...) là server upload
  return true;
};

/**
 * Trích folderId từ link folder Google Drive.
 * Hỗ trợ dạng: drive.google.com/drive/folders/FOLDER_ID
 * @param {string} url
 * @returns {string|null}
 */
export const extractGoogleDriveFolderId = (url = "") => {
  if (!url) return null;
  const match = String(url).trim().match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
};

// Trích xuất File ID từ link Google Drive bất kỳ (file/d/ID, open?id=ID, uc?id=ID, thumbnail?id=ID, v.v.)
export const extractGoogleDriveFileId = (input = "") => {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();

  // Bỏ qua nếu là link folder Google Drive (/drive/folders/...)
  if (/\/drive\/folders\//i.test(str)) return null;

  // Pattern 1: /file/d/FILE_ID
  const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: ?id=FILE_ID hoặc &id=FILE_ID (open?id=, uc?id=, thumbnail?id=)
  const matchIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: googleusercontent.com/d/FILE_ID
  const matchUserContentD = str.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchUserContentD && matchUserContentD[1]) return matchUserContentD[1];

  return null;
};

// Đổi size dạng s1800 sang w1800 theo format thumbnail Drive.
const getDriveThumbnailSize = (size = "s1800") =>
  size.startsWith("s") ? `w${size.slice(1)}` : size;

// Nâng kích thước ảnh và chuyển đổi mọi định dạng link Google Drive về URL thumbnail có thể hiển thị được.
export const upgradeGoogleImageUrl = (url, size = "s1800") => {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  // 1. Nếu là bất kỳ định dạng link Google Drive nào
  if (isGoogleDriveUrl(trimmedUrl)) {
    const fileId = extractGoogleDriveFileId(trimmedUrl);
    if (fileId) {
      const thumbnailSize = getDriveThumbnailSize(size);
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=${thumbnailSize}`;
    }
  }

  // 2. Nếu là link CDN googleusercontent (lh3.googleusercontent.com/...)
  if (isGoogleUserContentUrl(trimmedUrl)) {
    if (/=([swh]\d+[^/?#]*)$/i.test(trimmedUrl)) {
      return trimmedUrl.replace(/=([swh]\d+[^/?#]*)$/i, `=${size}`);
    }
    return trimmedUrl;
  }

  return trimmedUrl;
};


// Chọn URL ảnh phù hợp nhất theo ngữ cảnh thumb/grid/cover/preview.
export const getGalleryImageUrl = (
  item,
  variant = "grid",
  fallback = FALLBACK_GALLERY_IMAGE,
) => {
  const candidatesByVariant = {
    thumb: [
      item?.coverThumbUrl,
      item?.thumbUrl,
      item?.coverGridUrl,
      item?.gridUrl,
      item?.coverImage,
      item?.thumbnailLink,
    ],
    grid: [
      item?.coverGridUrl,
      item?.gridUrl,
      item?.coverImage,
      item?.imageUrl,
      item?.coverUrl,
      item?.thumbnailLink,
    ],
    cover: [
      item?.coverPreviewUrl,
      item?.coverImage,
      item?.coverUrl,
      item?.imageUrl,
      item?.coverGridUrl,
      item?.gridUrl,
      item?.thumbnailLink,
    ],
    preview: [
      item?.coverPreviewUrl,
      item?.previewUrl,
      item?.coverImage,
      item?.coverUrl,
      item?.imageUrl,
      item?.gridUrl,
      item?.thumbnailLink,
    ],
  };

  const candidate = (candidatesByVariant[variant] || candidatesByVariant.grid)
    .find(Boolean);
  const targetSize = GOOGLE_SIZE_BY_VARIANT[variant] || GOOGLE_SIZE_BY_VARIANT.grid;

  return upgradeGoogleImageUrl(candidate || fallback, targetSize);
};

// Tạo srcSet responsive cho ảnh Google/Drive.
export const getGalleryImageSrcSet = (url) => {
  if (!isGoogleUserContentUrl(url) && !isDriveThumbnailUrl(url)) {
    return undefined;
  }

  return [
    `${upgradeGoogleImageUrl(url, "s800")} 800w`,
    `${upgradeGoogleImageUrl(url, "s1200")} 1200w`,
    `${upgradeGoogleImageUrl(url, "s1800")} 1800w`,
    `${upgradeGoogleImageUrl(url, "s2560")} 2560w`,
  ].join(", ");
};

const getBackendBaseUrl = () => {
  return (API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
};

/**
 * Chuẩn hóa và tối ưu URL hình ảnh (Local upload, Server, Google Drive)
 */
export const formatImageUrl = (url, size = "s2560") => {
  if (!url) return "";
  const trimmed = String(url).trim();

  // 1. Google Drive URLs
  if (isGoogleDriveUrl(trimmed) || isGoogleUserContentUrl(trimmed)) {
    return upgradeGoogleImageUrl(trimmed, size);
  }

  // 2. Relative URLs (/public/uploads/...)
  if (trimmed.startsWith("/")) {
    return `${getBackendBaseUrl()}${trimmed}`;
  }

  // 3. Localhost URLs when accessed from non-localhost (e.g. mobile/domain)
  if (trimmed.includes("localhost:5000") || trimmed.includes("127.0.0.1:5000")) {
    const backendBase = getBackendBaseUrl();
    return trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, backendBase);
  }

  return trimmed;
};

// Fallback ảnh nếu ảnh chính lỗi, sử dụng smart proxy & fallback an toàn.
export const getImageErrorHandler = (fallback = FALLBACK_GALLERY_IMAGE) => (event) => {
  const image = event.currentTarget;
  const currentSrc = image.src || "";

  if (image.dataset.fallbackApplied === "true") return;

  const fileId = extractGoogleDriveFileId(currentSrc) || extractGoogleDriveFileId(image.dataset.originalUrl);
  if (fileId && !image.dataset.proxyAttempted) {
    image.dataset.proxyAttempted = "true";
    image.src = `${API_URL}/upload/drive-proxy/${fileId}`;
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = fallback;
  image.removeAttribute("srcset");
};

// Tải trước một ảnh và lưu kích thước để layout masonry ổn định.
const preloadSingleImage = (url, timeoutMs) => {
  if (!url || typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    const image = new window.Image();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timer = window.setTimeout(finish, timeoutMs);

    image.decoding = "async";
    image.fetchPriority = "high";
    image.onload = () => {
      window.clearTimeout(timer);

      dimensionCache.set(url, {
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });

      if (image.decode) {
        image.decode().catch(() => {}).finally(finish);
        return;
      }

      finish();
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      finish();
    };
    image.src = url;
  });
};

// Tải trước một nhóm ảnh, giới hạn số lượng để không nghẽn trình duyệt.
export const preloadImages = async (urls, options = {}) => {
  const { limit = 8, timeoutMs = 2800 } = options;
  const uniqueUrls = [...new Set((urls || []).filter(Boolean))].slice(0, limit);

  await Promise.all(uniqueUrls.map((url) => preloadSingleImage(url, timeoutMs)));
};

// Lấy kích thước ảnh có cache để render gallery đúng tỷ lệ.
export const getImageDimensions = (url, timeoutMs = 4200) => {
  if (!url || typeof window === "undefined") {
    return Promise.resolve({ width: 1, height: 1 });
  }

  const cached = dimensionCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const image = new window.Image();
    let settled = false;

    const finish = (dimensions) => {
      if (settled) return;
      settled = true;
      const normalized = dimensions || { width: 1, height: 1 };
      dimensionCache.set(url, normalized);
      resolve(normalized);
    };

    const timer = window.setTimeout(() => finish({ width: 1, height: 1 }), timeoutMs);

    image.onload = () => {
      window.clearTimeout(timer);
      finish({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      finish({ width: 1, height: 1 });
    };
    image.src = url;
  });
};
