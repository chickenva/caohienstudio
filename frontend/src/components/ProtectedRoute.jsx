import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute - Component để bảo vệ routes
 * Nếu user chưa login, redirect về trang login
 * Nếu user là admin, redirect về admin dashboard
 * Nếu user là customer, redirect về customer page
 */
// Bảo vệ route theo token và role trước khi render trang con.
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const user = localStorage.getItem("user");

  if (!user) {
    // Chưa login - redirect về landing/auth
    return <Navigate to="/auth/login" replace />;
  }

  const parsedUser = JSON.parse(user);

  // Nếu có requirement role, check role
  if (requiredRole) {
    if (requiredRole === "admin" && parsedUser.role !== "admin") {
      return <Navigate to="/customer" replace />;
    }
    if (requiredRole === "customer" && parsedUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
