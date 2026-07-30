/**
 * googleDriveService.js
 * Service layer giao tiếp với Google Drive API v3 bằng service account.
 * Hỗ trợ: liệt kê ảnh trong folder, upload ảnh, chuẩn hóa URL ảnh và cache in-memory.
 *
 * Cache: mỗi folder được cache 5 phút, tối đa 120 folder cùng lúc (LRU đơn giản).
 */
const { google } = require("googleapis");

const SCOPES                    = ["https://www.googleapis.com/auth/drive.readonly"];
const DRIVE_IMAGE_CACHE_TTL_MS  = 5 * 60 * 1000; // 5 phút
const MAX_DRIVE_IMAGE_CACHE_ITEMS = 120;
const driveImageCache           = new Map();

// ==========================================
// AUTH & CLIENT
// ==========================================

/**
 * Khởi tạo Google Drive API client dùng service account.
 * Credentials lấy từ biến môi trường GOOGLE_APPLICATION_CREDENTIALS.
 * @returns {import("googleapis").drive_v3.Drive}
 */
const getDriveClient = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes:  SCOPES,
  });

  return google.drive({ version: "v3", auth });
};

// ==========================================
// URL HELPERS
// ==========================================

/** Kiểm tra URL có phải CDN googleusercontent để resize thumbnail. */
const isGoogleUserContentUrl = (url = "") => /googleusercontent\.com/i.test(url);

/** Kiểm tra URL có phải link web Google Drive dạng share/view. */
const isDriveWebUrl = (url = "") => /drive\.google\.com/i.test(url);

/**
 * Tách fileId từ link Google Drive dạng /file/d/... hoặc ?id=...
 * Bỏ qua link folder (có /folders/).
 * @param {string} input
 * @returns {string} fileId hoặc ""
 */
const extractDriveFileId = (input = "") => {
  if (!input || /\/folders\//i.test(input)) return "";

  const value     = String(input).trim();
  const fileMatch = value.match(/\/file\/d\/([^/?#]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];

  const idMatch = value.match(/[?&]id=([^&#]+)/i);
  if (idMatch?.[1]) return idMatch[1];

  return "";
};

/**
 * Tạo link xem trực tiếp ảnh Drive từ fileId (dạng export=view).
 * @param {string} fileId
 */
const buildDirectUrl = (fileId) =>
  `https://drive.google.com/uc?export=view&id=${fileId}`;

/**
 * Tạo link thumbnail Drive với kích thước chỉ định (ví dụ: w480, w1200, w1800).
 * @param {string} fileId
 * @param {string} size - Chuỗi kích thước theo định dạng Drive thumbnail API
 */
const buildDriveThumbnailUrl = (fileId, size = "w1600") => {
  if (!fileId) return "";
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=${size}`;
};

/**
 * Chuẩn hóa mọi kiểu link Drive/CDN về URL ảnh với kích thước phù hợp.
 * - Link drive.google.com → tạo thumbnail URL từ fileId
 * - Link googleusercontent (CDN) → thay kích thước cuối chuỗi
 * - Link khác → trả nguyên
 * @param {string} url
 * @param {string} size - Ví dụ: "s480", "s1200", "s1800", "s2560"
 * @returns {string}
 */
const normalizeDriveImageUrl = (url, size = "s1600") => {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (isDriveWebUrl(trimmedUrl)) {
    const fileId = extractDriveFileId(trimmedUrl);
    if (!fileId) return "";

    // Drive thumbnail API dùng "w" thay vì "s"
    const thumbnailSize = size.startsWith("s") ? `w${size.slice(1)}` : size;
    return buildDriveThumbnailUrl(fileId, thumbnailSize);
  }

  if (!isGoogleUserContentUrl(trimmedUrl)) {
    return trimmedUrl;
  }

  // CDN thumbnail Drive: URL kết thúc bằng token kích thước dạng =s220, =w220-h220
  // Thay token cũ bằng kích thước mong muốn
  if (/=([swh]\d+[^/?#]*)$/i.test(trimmedUrl)) {
    return trimmedUrl.replace(/=([swh]\d+[^/?#]*)$/i, `=${size}`);
  }

  return trimmedUrl;
};

// ==========================================
// CACHE HELPERS
// ==========================================

/**
 * Lấy danh sách ảnh từ cache nếu còn trong TTL.
 * @param {string} folderId
 * @returns {Array|null}
 */
const getCachedImages = (folderId) => {
  const cached = driveImageCache.get(folderId);

  if (!cached) return null;

  if (Date.now() - cached.cachedAt > DRIVE_IMAGE_CACHE_TTL_MS) {
    driveImageCache.delete(folderId);
    return null;
  }

  return cached.images;
};

/**
 * Lưu danh sách ảnh vào cache.
 * Nếu cache đã đầy (>= MAX), xóa entry cũ nhất (FIFO).
 * @param {string} folderId
 * @param {Array}  images
 */
const setCachedImages = (folderId, images) => {
  if (driveImageCache.size >= MAX_DRIVE_IMAGE_CACHE_ITEMS) {
    const firstKey = driveImageCache.keys().next().value;
    driveImageCache.delete(firstKey);
  }

  driveImageCache.set(folderId, { cachedAt: Date.now(), images });
};

// ==========================================
// FILE MAPPING
// ==========================================

/**
 * Map metadata file Drive sang object ảnh gồm nhiều kích thước URL.
 * @param {Object} file - File metadata từ Drive API
 */
const mapDriveImageFile = (file) => {
  const width  = Number(file.imageMediaMetadata?.width)  || null;
  const height = Number(file.imageMediaMetadata?.height) || null;
  const thumbnailSource =
    file.thumbnailLink || buildDriveThumbnailUrl(file.id, "w480");

  const thumbUrl   = normalizeDriveImageUrl(thumbnailSource, "s480")  || buildDriveThumbnailUrl(file.id, "w480")  || buildDirectUrl(file.id);
  const gridUrl    = normalizeDriveImageUrl(thumbnailSource, "s1200") || buildDriveThumbnailUrl(file.id, "w1200") || buildDirectUrl(file.id);
  const coverUrl   = normalizeDriveImageUrl(thumbnailSource, "s1800") || buildDriveThumbnailUrl(file.id, "w1800") || buildDirectUrl(file.id);
  const previewUrl = normalizeDriveImageUrl(thumbnailSource, "s2560") || buildDriveThumbnailUrl(file.id, "w2560") || coverUrl || buildDirectUrl(file.id);

  return {
    id:              file.id,
    name:            file.name,
    mimeType:        file.mimeType,
    thumbUrl,
    gridUrl,
    coverUrl,
    imageUrl:        coverUrl,
    previewUrl,
    width,
    height,
    thumbnailLink:   file.thumbnailLink,
    webViewLink:     file.webViewLink,
    webContentLink:  file.webContentLink,
    createdTime:     file.createdTime,
  };
};

// ==========================================
// EXPORTS
// ==========================================

exports.extractDriveFileId     = extractDriveFileId;
exports.normalizeDriveImageUrl = normalizeDriveImageUrl;

/**
 * Xóa cache ảnh của một folder Drive.
 * Gọi khi admin tạo/cập nhật album để đảm bảo lấy ảnh mới nhất.
 * @param {string} folderId
 */
exports.clearFolderImageCache = (folderId) => {
  if (folderId) driveImageCache.delete(folderId);
};

/**
 * Lấy danh sách hình ảnh từ thư mục Google Drive.
 * Tự động dùng cache nếu còn hạn (TTL 5 phút).
 * @param {string} folderId - ID thư mục Drive
 * @param {Object} options  - { forceRefresh: boolean } để bỏ qua cache
 * @returns {Promise<Array>} Mảng object ảnh nhiều kích thước
 */
exports.listImagesInFolder = async (folderId, options = {}) => {
  if (!folderId) return [];

  // Trả về cache nếu còn hạn và không yêu cầu refresh
  if (!options.forceRefresh) {
    const cachedImages = getCachedImages(folderId);
    if (cachedImages) return cachedImages;
  }

  const drive = getDriveClient();

  const res = await drive.files.list({
    q:        `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
    fields:   "files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink, imageMediaMetadata(width,height), createdTime)",
    orderBy:  "name",
    pageSize: 200,
  });

  const files  = res.data.files || [];
  const images = files.map(mapDriveImageFile);

  setCachedImages(folderId, images);

  return images;
};
