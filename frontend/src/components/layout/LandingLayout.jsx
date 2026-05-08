import React from "react";
import { Outlet } from "react-router-dom";

/**
 * LandingLayout - Layout đơn giản cho Landing page
 * Không có header/footer phức tạp của SharedLayout
 */
const LandingLayout = () => {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Outlet />
    </div>
  );
};

export default LandingLayout;
