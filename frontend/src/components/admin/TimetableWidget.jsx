/**
 * TimetableWidget.jsx
 * Widget nổi (floating) hiển thị Thời khóa biểu để Admin bật/tắt ngay khi đang
 * tạo / sửa đơn hàng mà không phải rời trang hay che mất form.
 * - Chế độ gọn (mặc định): dải 7 ngày + lịch chi tiết 1 ngày.
 * - Chế độ mở rộng: lưới 7 cột cả tuần.
 * - Trạng thái bật/tắt & mở rộng được nhớ trong localStorage.
 */
import React, { useState, useCallback } from "react";
import { Button, Tooltip } from "antd";
import {
  CalendarOutlined,
  CloseOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import StudioTimetable from "./StudioTimetable";

const OPEN_KEY = "timetableWidgetOpen";
const EXPANDED_KEY = "timetableWidgetExpanded";

const readFlag = (key) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

/** Hook quản lý trạng thái bật/tắt widget (có nhớ giữa các trang). */
export function useTimetableWidgetState() {
  const [open, setOpenState] = useState(() => readFlag(OPEN_KEY));
  const setOpen = useCallback((value) => {
    setOpenState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(OPEN_KEY, next ? "1" : "0");
      } catch {
        /* bỏ qua */
      }
      return next;
    });
  }, []);
  return [open, setOpen];
}

export default function TimetableWidget({
  open,
  onOpenChange,
  initialDate = null,
  highlightBookingId = null,
  onSelectSlot = null,
  onScheduleUpdated = null,
}) {
  const [expanded, setExpanded] = useState(() => readFlag(EXPANDED_KEY));

  const toggleExpanded = () => {
    setExpanded((prev) => {
      try {
        localStorage.setItem(EXPANDED_KEY, !prev ? "1" : "0");
      } catch {
        /* bỏ qua */
      }
      return !prev;
    });
  };

  if (!open) {
    return (
      <Tooltip title="Mở Thời khóa biểu" placement="left">
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 950,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 18px",
            borderRadius: 999,
            border: "1px solid #a98c55",
            background: "linear-gradient(135deg, #cdb07a 0%, #BFA16A 100%)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13.5,
            cursor: "pointer",
            boxShadow: "0 8px 22px rgba(191, 161, 106, 0.45)",
          }}
        >
          <CalendarOutlined style={{ fontSize: 16 }} />
          Thời khóa biểu
        </button>
      </Tooltip>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 950,
        width: expanded ? "min(1280px, calc(100vw - 48px))" : 470,
        maxWidth: "calc(100vw - 48px)",
        height: "min(82vh, 780px)",
        display: "flex",
        flexDirection: "column",
        background: "#FAF7F2",
        border: "1px solid #d9cdb6",
        borderRadius: 14,
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "linear-gradient(135deg, #2b251d 0%, #1f1f1f 100%)",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14 }}>
          <CalendarOutlined style={{ color: "#BFA16A" }} />
          Thời khóa biểu
        </span>
        <span style={{ display: "flex", gap: 4 }}>
          <Tooltip title="Mở trang Thời khóa biểu (tab mới)">
            <Button
              type="text"
              size="small"
              icon={<ExportOutlined />}
              style={{ color: "#d9d0c3" }}
              onClick={() => window.open("/admin/timetable", "_blank")}
            />
          </Tooltip>
          <Tooltip title={expanded ? "Thu gọn" : "Mở rộng xem cả tuần"}>
            <Button
              type="text"
              size="small"
              icon={expanded ? <ShrinkOutlined /> : <ExpandAltOutlined />}
              style={{ color: "#d9d0c3" }}
              onClick={toggleExpanded}
            />
          </Tooltip>
          <Tooltip title="Đóng widget">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              style={{ color: "#d9d0c3" }}
              onClick={() => onOpenChange(false)}
            />
          </Tooltip>
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 12 }}>
        <StudioTimetable
          key={expanded ? "wide" : "narrow"}
          variant={expanded ? "page" : "widget"}
          columnMinWidth={expanded ? 160 : 190}
          initialDate={initialDate}
          highlightBookingId={highlightBookingId}
          onSelectSlot={onSelectSlot}
          onScheduleUpdated={onScheduleUpdated}
        />
      </div>
    </div>
  );
}
