const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
const DRIVE_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_DRIVE_IMAGE_CACHE_ITEMS = 120;
const driveImageCache = new Map();

// Khởi tạo Google Drive client bằng service account trong biến môi trường.
const getDriveClient = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: SCOPES,
  });

  return google.drive({
    version: "v3",
    auth,
  });
};

// Nhận diện link ảnh CDN googleusercontent để resize thumbnail.
const isGoogleUserContentUrl = (url = "") =>
  /googleusercontent\.com/i.test(url);

// Nhận diện link web Google Drive dạng share/view.
const isDriveWebUrl = (url = "") => /drive\.google\.com/i.test(url);

// Tách fileId từ link Google Drive dạng /file/d hoặc ?id=.
const extractDriveFileId = (input = "") => {
  if (!input || /\/folders\//i.test(input)) return "";

  const value = String(input).trim();
  const fileMatch = value.match(/\/file\/d\/([^/?#]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];

  const idMatch = value.match(/[?&]id=([^&#]+)/i);
  if (idMatch?.[1]) return idMatch[1];

  return "";
};

// Tạo link xem trực tiếp ảnh Drive từ fileId.
const buildDirectUrl = (fileId) => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

// Tạo link thumbnail Drive với kích thước mong muốn.
const buildDriveThumbnailUrl = (fileId, size = "w1600") => {
  if (!fileId) return "";
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=${size}`;
};

// Chuẩn hóa mọi kiểu link Drive/CDN về URL ảnh có kích thước phù hợp.
const normalizeDriveImageUrl = (url, size = "s1600") => {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (isDriveWebUrl(trimmedUrl)) {
    const fileId = extractDriveFileId(trimmedUrl);
    if (!fileId) return "";

    const thumbnailSize = size.startsWith("s")
      ? `w${size.slice(1)}`
      : size;

    return buildDriveThumbnailUrl(fileId, thumbnailSize);
  }

  if (!isGoogleUserContentUrl(trimmedUrl)) {
    return trimmedUrl;
  }

  // Drive thumbnails end with a size token like =s220, =s320-c,
  // or =w220-h220. Replace it so the browser never receives tiny images.
  if (/=([swh]\d+[^/?#]*)$/i.test(trimmedUrl)) {
    return trimmedUrl.replace(/=([swh]\d+[^/?#]*)$/i, `=${size}`);
  }

  return trimmedUrl;
};

// Lấy danh sách ảnh từ cache nếu còn hạn.
const getCachedImages = (folderId) => {
  const cached = driveImageCache.get(folderId);

  if (!cached) return null;

  if (Date.now() - cached.cachedAt > DRIVE_IMAGE_CACHE_TTL_MS) {
    driveImageCache.delete(folderId);
    return null;
  }

  return cached.images;
};

// Lưu danh sách ảnh vào cache và giới hạn số folder cache.
const setCachedImages = (folderId, images) => {
  if (driveImageCache.size >= MAX_DRIVE_IMAGE_CACHE_ITEMS) {
    const firstKey = driveImageCache.keys().next().value;
    driveImageCache.delete(firstKey);
  }

  driveImageCache.set(folderId, {
    cachedAt: Date.now(),
    images,
  });
};

// Map file Drive sang object ảnh nhiều kích thước cho frontend.
const mapDriveImageFile = (file) => {
  const width = Number(file.imageMediaMetadata?.width) || null;
  const height = Number(file.imageMediaMetadata?.height) || null;
  const thumbnailSource =
    file.thumbnailLink || buildDriveThumbnailUrl(file.id, "w480");

  const thumbUrl =
    normalizeDriveImageUrl(thumbnailSource, "s480") ||
    buildDriveThumbnailUrl(file.id, "w480") ||
    buildDirectUrl(file.id);
  const gridUrl =
    normalizeDriveImageUrl(thumbnailSource, "s1200") ||
    buildDriveThumbnailUrl(file.id, "w1200") ||
    buildDirectUrl(file.id);
  const coverUrl =
    normalizeDriveImageUrl(thumbnailSource, "s1800") ||
    buildDriveThumbnailUrl(file.id, "w1800") ||
    buildDirectUrl(file.id);
  const previewUrl =
    normalizeDriveImageUrl(thumbnailSource, "s2560") ||
    buildDriveThumbnailUrl(file.id, "w2560") ||
    coverUrl ||
    buildDirectUrl(file.id);

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    thumbUrl,
    gridUrl,
    coverUrl,
    imageUrl: coverUrl,
    previewUrl,
    width,
    height,
    thumbnailLink: file.thumbnailLink,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    createdTime: file.createdTime,
  };
};

exports.extractDriveFileId = extractDriveFileId;
exports.normalizeDriveImageUrl = normalizeDriveImageUrl;

// Xóa cache của một folder khi album thay đổi.
/**
 * Hàm xóa cache danh sách ảnh của một thư mục Drive.
 * Xử lý: Xóa dữ liệu cache trong bộ nhớ (Memory Cache) để tải lại ảnh mới nhất.
 * @param {String} folderId - ID của thư mục trên Drive
 */
exports.clearFolderImageCache = (folderId) => {
  if (folderId) {
    driveImageCache.delete(folderId);
  }
};

// Liệt kê ảnh trong folder Drive, có cache để giảm số lần gọi API.
/**
 * Hàm lấy danh sách hình ảnh từ thư mục Google Drive.
 * Xử lý: Gọi API Drive, kết hợp cache để tăng tốc độ phản hồi. Hỗ trợ phân trang.
 * @param {String} folderId - ID của thư mục trên Drive
 * @param {Object} options - Các tham số lọc và phân trang
 */
exports.listImagesInFolder = async (folderId, options = {}) => {
  if (!folderId) return [];

  if (!options.forceRefresh) {
    const cachedImages = getCachedImages(folderId);

    if (cachedImages) {
      return cachedImages;
    }
  }

  const drive = getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
    fields:
      "files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink, imageMediaMetadata(width,height), createdTime)",
    orderBy: "name",
    pageSize: 200,
  });

  const files = res.data.files || [];
  const images = files.map(mapDriveImageFile);

  setCachedImages(folderId, images);

  return images;
};
