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

// Nhận diện link thumbnail Google Drive do backend trả về.
const isDriveThumbnailUrl = (url = "") =>
  /drive\.google\.com\/thumbnail/i.test(url);

// Đổi size dạng s1800 sang w1800 theo format thumbnail Drive.
const getDriveThumbnailSize = (size = "s1800") =>
  size.startsWith("s") ? `w${size.slice(1)}` : size;

// Nâng kích thước ảnh Google/Drive để gallery không bị mờ.
export const upgradeGoogleImageUrl = (url, size = "s1800") => {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (isDriveThumbnailUrl(trimmedUrl)) {
    const thumbnailSize = getDriveThumbnailSize(size);

    try {
      const parsedUrl = new URL(trimmedUrl);
      parsedUrl.searchParams.set("sz", thumbnailSize);
      return parsedUrl.toString();
    } catch (error) {
      if (/[?&]sz=/i.test(trimmedUrl)) {
        return trimmedUrl.replace(/([?&]sz=)[^&#]*/i, `$1${thumbnailSize}`);
      }

      const separator = trimmedUrl.includes("?") ? "&" : "?";
      return `${trimmedUrl}${separator}sz=${thumbnailSize}`;
    }
  }

  if (!isGoogleUserContentUrl(trimmedUrl)) {
    return trimmedUrl;
  }

  if (/=([swh]\d+[^/?#]*)$/i.test(trimmedUrl)) {
    return trimmedUrl.replace(/=([swh]\d+[^/?#]*)$/i, `=${size}`);
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

// Fallback ảnh nếu ảnh chính lỗi, tránh giao diện bị vỡ.
export const getImageErrorHandler = (fallback = FALLBACK_GALLERY_IMAGE) => (event) => {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") return;

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
