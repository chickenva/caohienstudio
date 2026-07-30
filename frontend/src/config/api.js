/**
 * api.js
 * Cấu hình URL gốc của backend API và Socket.IO.
 * Ưu tiên biến môi trường VITE_API_URL/VITE_SOCKET_URL.
 * Local dev fallback về localhost, production fallback về backend Render.
 */
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : "https://caohienstudio-api.onrender.com");

