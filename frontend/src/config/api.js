/**
 * api.js
 * Cấu hình URL gốc của backend API và Socket.IO.
 * Ưu tiên biến môi trường VITE_API_URL/VITE_SOCKET_URL.
 * Local dev fallback về localhost, production fallback về backend Render.
 */
const sanitizeUrl = (rawUrl, defaultDev, defaultProd) => {
  let url = rawUrl || (import.meta.env.DEV ? defaultDev : defaultProd);
  if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    url = url.replace("http://", "https://");
  }
  return url;
};

export const API_URL = sanitizeUrl(
  import.meta.env.VITE_API_URL,
  "http://localhost:5000/api",
  "https://caohienstudio-api.onrender.com/api"
);

export const SOCKET_URL = sanitizeUrl(
  import.meta.env.VITE_SOCKET_URL,
  "http://localhost:5000",
  "https://caohienstudio-api.onrender.com"
);

