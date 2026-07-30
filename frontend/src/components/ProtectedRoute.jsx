/**
 * ProtectedRoute.jsx
 * HOC bảo vệ routes yêu cầu đăng nhập và/hoặc role cụ thể.
 * - Chưa login → redirect /auth/login
 * - Sai role (admin truy cập customer route) → redirect tương ứng
 */
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * @param {ReactNode} children      - Nội dung trang cần bảo vệ
 * @param {string|null} requiredRole - Role yêu cầu: "admin" | "customer" | null (chỉ cần login)
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const user = localStorage.getItem("user");

  // Chưa đăng nhập → về trang login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const parsedUser = JSON.parse(user);

  // Kiểm tra role nếu có yêu cầu cụ thể (so sánh không phân biệt hoa thường)
  if (requiredRole) {
    const userRole = (parsedUser.role || "").toUpperCase();
    const reqRole  = requiredRole.toUpperCase();

    if (reqRole === "ADMIN" && userRole !== "ADMIN") {
      return <Navigate to="/customer" replace />;
    }
    if (reqRole === "CUSTOMER" && userRole === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
