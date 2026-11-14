/**
 * StudioTimetable.jsx
 * Thời khóa biểu lịch chụp theo tuần dành cho Admin:
 * - Quản lý trực quan lịch chụp 7 ngày trong tuần (Thứ 2 -> Chủ Nhật) kèm Âm lịch & Ngày lễ.
 * - Hỗ trợ Admin vừa xem lịch rảnh/bận vừa tư vấn chốt thời gian với khách hàng.
 * - Cho phép tùy chỉnh thời gian bắt đầu / kết thúc dự kiến của từng đơn trên thời khóa biểu
 *   (ví dụ: đơn chụp ngoại cảnh TP.HCM buổi sáng nhưng cộng thêm giờ di chuyển đến 15:00).
 * - Tự động cảnh báo lấn ca hoặc trùng khung giờ tác nghiệp giữa các đơn.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  TimePicker,
  Modal,
  Form,
  Input,
  Switch,
  Tooltip,
  Badge,
  Alert,
  Spin,
  Typography,
  Divider,
  Row,
  Col,
  message,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CarOutlined,
  HomeOutlined,
  UserOutlined,
  PhoneOutlined,
  PlusOutlined,
  EditOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useNavigate } from "react-router-dom";
import { getLunarInfo } from "../../utils/lunarSolar";

dayjs.extend(isoWeek);

const { Text } = Typography;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const SESSION_CONFIG = {
  MORNING: {
    label: "Buổi sáng",
    defaultStart: "08:00",
    defaultEnd: "12:00",
    color: "#d48806",
    bg: "#fffbe6",
    border: "#ffe58f",
  },
  AFTERNOON: {
    label: "Buổi chiều",
    defaultStart: "13:00",
    defaultEnd: "17:00",
    color: "#096dd9",
    bg: "#e6f7ff",
    border: "#91d5ff",
  },
  EVENING: {
    label: "Buổi tối",
    defaultStart: "17:30",
    defaultEnd: "21:30",
    color: "#531dab",
    bg: "#f9f0ff",
    border: "#d3adf7",
  },
  FULL_DAY: {
    label: "Cả ngày",
    defaultStart: "08:00",
    defaultEnd: "17:00",
    color: "#c41d7f",
    bg: "#fff0f6",
    border: "#ffadd2",
  },
  CUSTOM: {
    label: "Giờ tùy chỉnh",
    defaultStart: "08:00",
    defaultEnd: "12:00",
    color: "#08979c",
    bg: "#e6fffb",
    border: "#87e8de",
  },
};

const STATUS_BADGE = {
  REQUESTED: { color: "orange", text: "Yêu cầu mới", border: "#ffa940", bg: "#fff7e6" },
  WAITING_PAYMENT: { color: "gold", text: "Chờ cọc", border: "#ffc53d", bg: "#feffe6" },
  CONTRACT_SENT: { color: "gold", text: "Chờ cọc", border: "#ffc53d", bg: "#feffe6" },
  CONFIRMED: { color: "green", text: "Đã chốt cọc", border: "#73d13d", bg: "#f6ffed" },
  IN_PROGRESS: { color: "blue", text: "Đang chụp", border: "#40a9ff", bg: "#e6f7ff" },
  COMPLETED: { color: "default", text: "Hoàn thành", border: "#d9d9d9", bg: "#fafafa" },
  CANCELED: { color: "red", text: "Đã hủy", border: "#ff7875", bg: "#fff1f0" },
};

const WEEKDAY_LABELS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];

const parseMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== "string") return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatDurationText = (startStr, endStr) => {
  const diff = parseMinutes(endStr) - parseMinutes(startStr);
  if (diff <= 0) return "";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h${mins}p`;
  if (hours > 0) return `${hours} giờ`;
  return `${mins} phút`;
};

const DATE_FMT = "YYYY-MM-DD";
const SHORT_WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// 3 ca chuẩn dùng để hiển thị trạng thái rảnh/bận trong ngày
const SESSION_SLOTS = [
  { key: "MORNING", label: "Sáng", start: 8 * 60, end: 12 * 60, range: "08:00–12:00" },
  { key: "AFTERNOON", label: "Chiều", start: 13 * 60, end: 17 * 60, range: "13:00–17:00" },
  { key: "EVENING", label: "Tối", start: 17 * 60 + 30, end: 21 * 60 + 30, range: "17:30–21:30" },
];

const minutesToHHmm = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// Tính trạng thái từng ca (trống / trống một phần / kín / nghỉ) từ các đơn trong ngày
const getSessionStatuses = (dayBookings, isClosed) =>
  SESSION_SLOTS.map((slot) => {
    if (isClosed) return { ...slot, state: "closed" };
    const blockers = (dayBookings || []).filter(
      (b) =>
        b.status !== "CANCELED" &&
        parseMinutes(b.start_time_str) < slot.end &&
        parseMinutes(b.end_time_str) > slot.start
    );
    if (blockers.length === 0) return { ...slot, state: "free" };
    const maxEnd = Math.max(...blockers.map((b) => parseMinutes(b.end_time_str)));
    const minStart = Math.min(...blockers.map((b) => parseMinutes(b.start_time_str)));
    if (minStart <= slot.start + 30 && maxEnd <= slot.end - 90) {
      return { ...slot, state: "partial", freeAfter: minutesToHHmm(maxEnd) };
    }
    return { ...slot, state: "busy" };
  });

const SESSION_STATE_STYLE = {
  free: { bg: "#f6ffed", border: "#b7eb8f", color: "#389e0d", text: "Trống" },
  partial: { bg: "#fff7e6", border: "#ffd591", color: "#d46b08", text: "Trống 1 phần" },
  busy: { bg: "#fff1f0", border: "#ffa39e", color: "#cf1322", text: "Kín" },
  closed: { bg: "#f5f5f5", border: "#d9d9d9", color: "#8c8c8c", text: "Nghỉ" },
};

// Thanh timeline 07:00 → 22:00 hiển thị trực quan các khung giờ đã có đơn
const TL_START = 7 * 60;
const TL_END = 22 * 60;
function DayTimelineBar({ dayBookings, height = 12, showTicks = false }) {
  const pct = (m) => Math.min(100, Math.max(0, ((m - TL_START) / (TL_END - TL_START)) * 100));
  const active = (dayBookings || []).filter((b) => b.status !== "CANCELED");
  return (
    <div>
      <div
        style={{
          position: "relative",
          height,
          background: "#f3efe7",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {[12 * 60, 17 * 60].map((m) => (
          <div
            key={m}
            style={{ position: "absolute", left: `${pct(m)}%`, top: 0, bottom: 0, width: 1, background: "#e3dccd" }}
          />
        ))}
        {active.map((b) => {
          const s = parseMinutes(b.start_time_str);
          const e = parseMinutes(b.end_time_str);
          const isOutdoor = b.shooting_type === "OUTDOOR";
          return (
            <Tooltip
              key={b._id}
              title={`${b.start_time_str} – ${b.end_time_str} · ${isOutdoor ? "Ngoại cảnh" : "Tại Studio"}`}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${pct(s)}%`,
                  width: `${Math.max(pct(e) - pct(s), 2)}%`,
                  top: 1,
                  bottom: 1,
                  borderRadius: 4,
                  background: isOutdoor ? "#fa8c16" : "#BFA16A",
                  opacity: 0.88,
                }}
              />
            </Tooltip>
          );
        })}
      </div>
      {showTicks && (
        <div style={{ position: "relative", height: 14, fontSize: 10, color: "#aaa", marginTop: 2 }}>
          {[8, 12, 17, 21].map((h) => (
            <span
              key={h}
              style={{ position: "absolute", left: `${pct(h * 60)}%`, transform: "translateX(-50%)" }}
            >
              {h}h
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// 3 ô trạng thái Sáng / Chiều / Tối (bấm được khi đang chọn lịch cho đơn)
function SessionPills({ statuses, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
      {statuses.map((s) => {
        const st = SESSION_STATE_STYLE[s.state];
        const clickable = onPick && (s.state === "free" || s.state === "partial");
        return (
          <Tooltip
            key={s.key}
            title={`${s.label} ${s.range}${s.freeAfter ? ` · trống sau ${s.freeAfter}` : ""}`}
          >
            <div
              onClick={clickable ? () => onPick(s) : undefined}
              style={{
                background: st.bg,
                border: `1px solid ${st.border}`,
                borderRadius: 6,
                padding: "3px 2px",
                textAlign: "center",
                lineHeight: 1.25,
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{s.label}</div>
              <div style={{ fontSize: 10, color: st.color }}>
                {s.state === "partial" ? `từ ${s.freeAfter}` : st.text}
              </div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

// Thẻ đơn hàng trên thời khóa biểu
function BookingCard({ item, highlightBookingId, onEdit, onDetail }) {
  const sessionCfg = SESSION_CONFIG[item.shooting_session] || SESSION_CONFIG.MORNING;
  const statusCfg = STATUS_BADGE[item.status] || STATUS_BADGE.REQUESTED;
  const isOutdoor = item.shooting_type === "OUTDOOR";
  const isHighlighted = highlightBookingId && String(item._id) === String(highlightBookingId);
  const hasOverlaps = Array.isArray(item.overlapping_bookings) && item.overlapping_bookings.length > 0;
  const customerName = item.customer_full_name || item.customer_id?.full_name || "Khách hàng";
  const customerPhone = item.customer_phone || item.customer_id?.phone || "";
  const serviceName =
    item.original_service_ids?.length > 0
      ? item.original_service_ids.map((s) => s.name).join(" + ")
      : item.service_id?.name || "Gói chụp";
  const durationLabel = formatDurationText(item.start_time_str, item.end_time_str);
  const showTravelSuggestion =
    isOutdoor &&
    item.suggested_travel_buffer_minutes > 0 &&
    !item.is_custom_schedule_time &&
    item.suggested_end_time_str &&
    item.suggested_end_time_str !== item.end_time_str;

  return (
    <div
      id={`tt-booking-${item._id}`}
      style={{
        borderRadius: 8,
        border: isHighlighted
          ? "2px solid #BFA16A"
          : hasOverlaps
            ? "1.5px solid #ff4d4f"
            : "1px solid #ece6dc",
        borderLeft: `4px solid ${isOutdoor ? "#fa8c16" : "#BFA16A"}`,
        background: isHighlighted ? "#fffdf6" : "#ffffff",
        padding: "8px 10px",
        boxShadow: isHighlighted ? "0 0 0 3px rgba(191, 161, 106, 0.2)" : "0 1px 4px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 700,
            fontSize: 12.5,
            color: "#1F1F1F",
            background: sessionCfg.bg,
            border: `1px solid ${sessionCfg.border}`,
            padding: "1px 7px",
            borderRadius: 5,
          }}
        >
          <ClockCircleOutlined style={{ color: sessionCfg.color }} />
          {item.start_time_str} – {item.end_time_str}
          {durationLabel && (
            <span style={{ fontSize: 10.5, fontWeight: 500, color: "#666" }}>({durationLabel})</span>
          )}
        </span>
        <Tag color={statusCfg.color} style={{ margin: 0, fontSize: 10, lineHeight: "16px", padding: "0 5px" }}>
          {statusCfg.text}
        </Tag>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#262626" }}>
        <UserOutlined style={{ color: "#BFA16A", marginRight: 4 }} />
        {customerName}
        {customerPhone && (
          <span style={{ fontWeight: 400, color: "#666", fontSize: 11.5 }}> · {customerPhone}</span>
        )}
      </div>

      <div
        style={{ fontSize: 11.5, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        title={serviceName}
      >
        📸 {serviceName}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        <Tag
          style={{
            margin: 0,
            fontSize: 10.5,
            background: isOutdoor ? "#fff7e6" : "#f0f5ff",
            color: isOutdoor ? "#d46b08" : "#1d39c4",
            borderColor: isOutdoor ? "#ffd591" : "#adc6ff",
          }}
        >
          {isOutdoor ? (
            <>
              <CarOutlined /> Ngoại cảnh{item.travel_distance_km ? ` (${item.travel_distance_km}km)` : ""}
            </>
          ) : (
            <>
              <HomeOutlined /> Tại Studio
            </>
          )}
        </Tag>
        <span style={{ fontSize: 11, color: "#999" }}>#{String(item._id).slice(-6).toUpperCase()}</span>
        {!item.shooting_session && (
          <Tag color="volcano" style={{ margin: 0, fontSize: 10 }}>
            Chờ chốt buổi
          </Tag>
        )}
        {item.is_custom_schedule_time && (
          <Tooltip title="Admin đã tùy chỉnh thời gian dự kiến trên Thời khóa biểu">
            <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>
              Đã chỉnh giờ
            </Tag>
          </Tooltip>
        )}
      </div>

      {isOutdoor && item.location && (
        <div
          style={{ fontSize: 11, color: "#777", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          title={item.location}
        >
          <EnvironmentOutlined style={{ color: "#d48806", marginRight: 3 }} />
          {item.location}
        </div>
      )}

      {item.spans_into_afternoon && (
        <div
          style={{
            fontSize: 11,
            color: "#d46b08",
            background: "#fff7e6",
            border: "1px dashed #ffd591",
            borderRadius: 4,
            padding: "2px 6px",
            fontWeight: 500,
          }}
        >
          ⚠️ Kéo dài lấn sang ca chiều (đến {item.end_time_str})
        </div>
      )}

      {hasOverlaps && (
        <div
          style={{
            fontSize: 11,
            color: "#cf1322",
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            borderRadius: 4,
            padding: "3px 6px",
            fontWeight: 600,
          }}
        >
          ⛔ Trùng giờ với{" "}
          {item.overlapping_bookings
            .map((o) => `#${o.booking_code} (${o.start_time_str}-${o.end_time_str})`)
            .join(", ")}
        </div>
      )}

      {showTravelSuggestion && (
        <div
          onClick={() => onEdit(item, item.suggested_end_time_str)}
          style={{
            fontSize: 11,
            color: "#874d00",
            background: "linear-gradient(90deg, #fffbe6 0%, #fff1b8 100%)",
            border: "1px solid #ffe58f",
            borderRadius: 5,
            padding: "3px 7px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 500,
          }}
          title="Bấm để mở khung chỉnh giờ kết thúc dự kiến đã cộng thời gian đi lại"
        >
          <ThunderboltOutlined style={{ color: "#d48806" }} />
          <span>
            Đi xa {item.travel_distance_km}km: gợi ý kết thúc → <strong>{item.suggested_end_time_str}</strong>
          </span>
        </div>
      )}

      {item.schedule_note && (
        <div
          style={{
            fontSize: 11,
            color: "#595959",
            background: "#f7f5f0",
            padding: "3px 6px",
            borderRadius: 4,
            fontStyle: "italic",
          }}
        >
          📝 {item.schedule_note}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 2, paddingTop: 6, borderTop: "1px dashed #f0ebe1" }}>
        <Button
          size="small"
          type="primary"
          icon={<ClockCircleOutlined />}
          style={{ flex: 1, fontSize: 11.5, background: "#BFA16A", borderColor: "#BFA16A" }}
          onClick={() => onEdit(item)}
        >
          Chỉnh giờ
        </Button>
        <Button size="small" icon={<FileTextOutlined />} style={{ fontSize: 11.5 }} onClick={() => onDetail(item)}>
          Chi tiết
        </Button>
      </div>
    </div>
  );
}

/**
 * variant:
 *  - "page": lưới 7 cột theo tuần (trang Thời khóa biểu / widget mở rộng)
 *  - "widget": dải 7 ngày + lịch chi tiết 1 ngày (gọn, dùng trong widget nổi)
 * onSelectSlot({ date: "YYYY-MM-DD", session: "MORNING" | ... | null })
 */
export default function StudioTimetable({
  initialDate = null,
  highlightBookingId = null,
  onSelectSlot = null,
  onScheduleUpdated = null,
  variant = "page",
  columnMinWidth = 190,
}) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isWidget = variant === "widget";

  const [weekStart, setWeekStart] = useState(() =>
    (initialDate ? dayjs(initialDate) : dayjs()).startOf("isoWeek")
  );
  const [selectedDayStr, setSelectedDayStr] = useState(() =>
    (initialDate ? dayjs(initialDate) : dayjs()).format(DATE_FMT)
  );
  const [shootingTypeFilter, setShootingTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // State cho Modal tùy chỉnh thời gian dự kiến trên Thời khóa biểu
  const [editingBooking, setEditingBooking] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const watchShootDate = Form.useWatch("shoot_date", form);
  const watchSession = Form.useWatch("shooting_session", form);
  const watchStartTime = Form.useWatch("custom_start_time", form);
  const watchEndTime = Form.useWatch("custom_end_time", form);
  const watchUseContract = Form.useWatch("use_custom_time_on_contract", form);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    if (initialDate && dayjs(initialDate).isValid()) {
      setWeekStart(dayjs(initialDate).startOf("isoWeek"));
      setSelectedDayStr(dayjs(initialDate).format(DATE_FMT));
    }
  }, [initialDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => weekStart.add(idx, "day"));
  }, [weekStart]);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = weekStart.format("YYYY-MM-DD");
      const endDate = weekStart.add(6, "day").format("YYYY-MM-DD");
      const res = await axios.get(`${API_URL}/bookings/admin/timetable`, {
        params: {
          startDate,
          endDate,
          shooting_type: shootingTypeFilter,
        },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setBookings(res.data?.bookings || []);
      setHolidays(res.data?.holidays || []);
    } catch (err) {
      console.error("Lỗi tải thời khóa biểu:", err);
      message.error(err.response?.data?.message || "Không thể tải dữ liệu thời khóa biểu");
    } finally {
      setLoading(false);
    }
  }, [weekStart, shootingTypeFilter]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // Tra cứu thông tin ngày lễ / ngày nghỉ studio + Âm lịch cho từng cột ngày
  const getDayHolidayAndLunar = useCallback(
    (dayMoment) => {
      const dateStr = dayMoment.format("YYYY-MM-DD");
      const monthDayStr = dayMoment.format("MM-DD");
      const holiday = holidays.find((h) => {
        if (h.is_recurring_yearly) {
          const hStart = (h.start_date || "").slice(5);
          const hEnd = (h.end_date || "").slice(5);
          return monthDayStr >= hStart && monthDayStr <= hEnd;
        }
        return dateStr >= h.start_date && dateStr <= h.end_date;
      });
      const lunar = getLunarInfo(dayMoment);
      return {
        holiday,
        lunar,
        isClosed: Boolean(holiday?.is_closed),
        isNational: holiday?.type === "NATIONAL",
        isStudio: holiday?.type === "STUDIO",
      };
    },
    [holidays]
  );

  // Gom nhóm đơn theo ngày YYYY-MM-DD
  const bookingsByDate = useMemo(() => {
    const map = {};
    weekDays.forEach((d) => {
      map[d.format("YYYY-MM-DD")] = [];
    });
    bookings.forEach((b) => {
      const key = b.shoot_date_str || dayjs(b.start_time).format("YYYY-MM-DD");
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => parseMinutes(a.start_time_str) - parseMinutes(b.start_time_str));
    });
    return map;
  }, [bookings, weekDays]);

  // Mở Modal tùy chỉnh thời gian dự kiến của đơn trên Thời khóa biểu
  const handleOpenScheduleModal = (bookingItem, quickSuggestedEnd = null) => {
    setEditingBooking(bookingItem);
    const startStr = bookingItem.start_time_str || "08:00";
    const endStr = quickSuggestedEnd || bookingItem.end_time_str || "12:00";
    const defaultNote =
      quickSuggestedEnd && !bookingItem.schedule_note
        ? `Cộng thêm thời gian di chuyển ngoại cảnh (${bookingItem.location || "đi tỉnh"})`
        : bookingItem.schedule_note || "";

    form.setFieldsValue({
      shoot_date: dayjs(bookingItem.shoot_date_str || bookingItem.start_time),
      shooting_session: bookingItem.shooting_session || "MORNING",
      custom_start_time: dayjs(startStr, "HH:mm"),
      custom_end_time: dayjs(endStr, "HH:mm"),
      schedule_note: defaultNote,
      use_custom_time_on_contract: Boolean(bookingItem.use_custom_time_on_contract),
    });
    setScheduleModalOpen(true);
  };

  // Khi đổi buổi chụp trong Modal, tự động gợi ý khung giờ mặc định của buổi đó
  const handleSessionSelectChange = (newSession) => {
    const cfg = SESSION_CONFIG[newSession] || SESSION_CONFIG.MORNING;
    form.setFieldsValue({
      shooting_session: newSession,
      custom_start_time: dayjs(cfg.defaultStart, "HH:mm"),
      custom_end_time: dayjs(cfg.defaultEnd, "HH:mm"),
    });
  };

  // Nút cộng nhanh thời gian di chuyển vào giờ kết thúc dự kiến
  const handleApplyTravelBuffer = (extraMinutes) => {
    if (!editingBooking) return;
    const sessionKey = form.getFieldValue("shooting_session") || editingBooking.shooting_session || "MORNING";
    const cfg = SESSION_CONFIG[sessionKey] || SESSION_CONFIG.MORNING;
    const baseEnd = dayjs(cfg.defaultEnd, "HH:mm");
    const newEnd = baseEnd.add(extraMinutes, "minute");

    form.setFieldsValue({
      custom_end_time: newEnd,
      schedule_note:
        extraMinutes > 0
          ? `Bao gồm +${extraMinutes / 60}h di chuyển ngoại cảnh (${editingBooking.location || "ngoại tỉnh"})`
          : "",
    });
  };

  // Kiểm tra xung đột thời gian trực tiếp trong lúc Admin đang chỉnh giờ trong Modal
  const modalLiveOverlaps = useMemo(() => {
    if (!editingBooking || !watchShootDate || !watchStartTime || !watchEndTime) return [];
    const targetDateStr = watchShootDate.format("YYYY-MM-DD");
    const startMin = watchStartTime.hour() * 60 + watchStartTime.minute();
    const endMin = watchEndTime.hour() * 60 + watchEndTime.minute();
    if (endMin <= startMin) return [];

    const dayList = bookingsByDate[targetDateStr] || [];
    return dayList.filter((other) => {
      if (String(other._id) === String(editingBooking._id)) return false;
      if (other.status === "CANCELED") return false;
      const oStart = parseMinutes(other.start_time_str);
      const oEnd = parseMinutes(other.end_time_str);
      return startMin < oEnd && endMin > oStart;
    });
  }, [editingBooking, watchShootDate, watchStartTime, watchEndTime, bookingsByDate]);

  // Lưu thay đổi thời gian lên Backend
  const handleSaveSchedule = async () => {
    try {
      const values = await form.validateFields();
      const startStr = values.custom_start_time.format("HH:mm");
      const endStr = values.custom_end_time.format("HH:mm");

      if (parseMinutes(endStr) <= parseMinutes(startStr)) {
        message.warning("Giờ kết thúc dự kiến phải lớn hơn giờ bắt đầu!");
        return;
      }

      setSavingSchedule(true);
      const payload = {
        shoot_date: values.shoot_date.format("YYYY-MM-DD"),
        shooting_session: values.shooting_session,
        custom_start_time: startStr,
        custom_end_time: endStr,
        schedule_note: values.schedule_note || "",
        use_custom_time_on_contract: Boolean(values.use_custom_time_on_contract),
      };

      const res = await axios.put(
        `${API_URL}/bookings/${editingBooking._id}/schedule`,
        payload,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      message.success("Đã cập nhật thời gian trên Thời khóa biểu!");
      setScheduleModalOpen(false);
      setEditingBooking(null);
      await fetchTimetable();
      if (onScheduleUpdated) {
        onScheduleUpdated(res.data?.booking);
      }
    } catch (err) {
      console.error("Lỗi lưu thời khóa biểu:", err);
      message.error(err.response?.data?.message || "Không thể lưu thay đổi thời khóa biểu");
    } finally {
      setSavingSchedule(false);
    }
  };

  // Thống kê nhanh trong tuần
  const weekStats = useMemo(() => {
    const total = bookings.length;
    const studioCount = bookings.filter((b) => b.shooting_type === "STUDIO").length;
    const outdoorCount = bookings.filter((b) => b.shooting_type === "OUTDOOR").length;
    const requestedCount = bookings.filter((b) => b.status === "REQUESTED").length;
    const conflictCount = bookings.filter((b) => (b.overlapping_bookings || []).length > 0).length;
    return { total, studioCount, outdoorCount, requestedCount, conflictCount };
  }, [bookings]);

  const weekDaysStr = weekDays.map((d) => d.format(DATE_FMT));
  const todayStr = dayjs().format(DATE_FMT);
  const activeDayStr = weekDaysStr.includes(selectedDayStr)
    ? selectedDayStr
    : weekDaysStr.includes(todayStr)
      ? todayStr
      : weekDaysStr[0];

  const handleEdit = (item, suggestedEnd = null) => handleOpenScheduleModal(item, suggestedEnd);
  const handleDetail = (item) => navigate(`/admin/orders/${item._id}`);

  const goToToday = () => {
    setWeekStart(dayjs().startOf("isoWeek"));
    setSelectedDayStr(todayStr);
  };

  // Cuộn tới thẻ đơn đang được chỉnh sửa (nếu có trong tuần đang xem)
  useEffect(() => {
    if (!highlightBookingId || loading) return;
    const el = document.getElementById(`tt-booking-${highlightBookingId}`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightBookingId, loading, bookings, activeDayStr]);

  const filterSelect = (
    <Select
      size={isWidget ? "small" : "middle"}
      value={shootingTypeFilter}
      onChange={setShootingTypeFilter}
      style={isWidget ? { flex: 1, minWidth: 120 } : { width: 165 }}
      options={[
        { value: "ALL", label: "Tất cả hình thức" },
        { value: "STUDIO", label: "🏠 Chỉ tại Studio" },
        { value: "OUTDOOR", label: "🚗 Chỉ Ngoại cảnh" },
      ]}
    />
  );

  // ===== Thanh điều hướng tuần =====
  const renderToolbar = () => {
    if (isWidget) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Button size="small" icon={<LeftOutlined />} onClick={() => setWeekStart((p) => p.subtract(1, "week"))} />
            <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13, color: "#1F1F1F" }}>
              <CalendarOutlined style={{ color: "#BFA16A", marginRight: 6 }} />
              {weekStart.format("DD/MM")} – {weekStart.add(6, "day").format("DD/MM/YYYY")}
            </div>
            <Button size="small" icon={<RightOutlined />} onClick={() => setWeekStart((p) => p.add(1, "week"))} />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Button size="small" onClick={goToToday}>
              Hôm nay
            </Button>
            <DatePicker
              size="small"
              allowClear={false}
              value={dayjs(activeDayStr)}
              format="DD/MM/YYYY"
              style={{ width: 118 }}
              onChange={(date) => {
                if (!date) return;
                setWeekStart(date.startOf("isoWeek"));
                setSelectedDayStr(date.format(DATE_FMT));
              }}
            />
            {filterSelect}
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchTimetable} loading={loading} />
          </div>
        </div>
      );
    }

    return (
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 10, border: "1px solid #e8dfd1", background: "#FAF7F2" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Space wrap size={8}>
            <Button icon={<LeftOutlined />} onClick={() => setWeekStart((p) => p.subtract(1, "week"))}>
              Tuần trước
            </Button>
            <Button
              type={weekStart.isSame(dayjs().startOf("isoWeek"), "day") ? "primary" : "default"}
              style={weekStart.isSame(dayjs().startOf("isoWeek"), "day") ? { background: "#BFA16A", borderColor: "#BFA16A" } : {}}
              onClick={goToToday}
            >
              Tuần hiện tại
            </Button>
            <Button icon={<RightOutlined />} iconPosition="end" onClick={() => setWeekStart((p) => p.add(1, "week"))}>
              Tuần sau
            </Button>
            <DatePicker
              allowClear={false}
              value={weekStart}
              format="DD/MM/YYYY"
              placeholder="Nhảy tới ngày..."
              onChange={(date) => {
                if (date) setWeekStart(date.startOf("isoWeek"));
              }}
              style={{ width: 155 }}
            />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1F1F1F", marginLeft: 4 }}>
              <CalendarOutlined style={{ color: "#BFA16A", marginRight: 6 }} />
              Tuần: {weekStart.format("DD/MM")} – {weekStart.add(6, "day").format("DD/MM/YYYY")}
            </span>
          </Space>

          <Space wrap size={8}>
            <Tag color="gold" style={{ margin: 0, padding: "3px 10px", fontSize: 12 }}>
              Tổng: <strong>{weekStats.total}</strong> ca ({weekStats.studioCount} Studio · {weekStats.outdoorCount} Ngoại cảnh)
            </Tag>
            {weekStats.requestedCount > 0 && (
              <Tag color="orange" style={{ margin: 0, padding: "3px 10px", fontSize: 12 }}>
                Chờ tư vấn: <strong>{weekStats.requestedCount}</strong>
              </Tag>
            )}
            {weekStats.conflictCount > 0 && (
              <Tag color="red" style={{ margin: 0, padding: "3px 10px", fontSize: 12 }}>
                <WarningOutlined /> Trùng giờ: <strong>{weekStats.conflictCount}</strong>
              </Tag>
            )}
            {filterSelect}
            <Button icon={<ReloadOutlined />} onClick={fetchTimetable} loading={loading}>
              Làm mới
            </Button>
          </Space>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10, fontSize: 11.5, color: "#777" }}>
          <span>
            <span style={{ display: "inline-block", width: 14, height: 8, borderRadius: 3, background: "#BFA16A", marginRight: 5 }} />
            Chụp tại Studio
          </span>
          <span>
            <span style={{ display: "inline-block", width: 14, height: 8, borderRadius: 3, background: "#fa8c16", marginRight: 5 }} />
            Ngoại cảnh (gồm giờ đi lại)
          </span>
          <span style={{ color: "#389e0d" }}>● Ca trống</span>
          <span style={{ color: "#d46b08" }}>● Trống một phần</span>
          <span style={{ color: "#cf1322" }}>● Ca kín</span>
          {onSelectSlot && <span style={{ color: "#8c6d2c" }}>💡 Bấm vào ca trống để chọn nhanh cho đơn</span>}
        </div>
      </Card>
    );
  };

  // ===== Một ngày (cột trong lưới tuần hoặc lịch chi tiết trong widget) =====
  const renderDay = (dayMoment, idx) => {
    const dateStr = dayMoment.format(DATE_FMT);
    const isToday = dateStr === todayStr;
    const isSunday = idx === 6;
    const dayBookings = bookingsByDate[dateStr] || [];
    const { holiday, lunar, isClosed, isNational } = getDayHolidayAndLunar(dayMoment);
    const statuses = getSessionStatuses(dayBookings, isClosed);
    const pick = onSelectSlot ? (s) => onSelectSlot({ date: dateStr, session: s.key }) : null;
    const darkHeader = isToday && !isWidget;

    return (
      <div
        key={dateStr}
        style={{
          background: isClosed ? "#fff2f0" : "#ffffff",
          border: isToday ? "2px solid #BFA16A" : isClosed ? "1px solid #ffa39e" : "1px solid #e8e2d9",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          minHeight: isWidget ? 0 : 440,
          boxShadow: isToday ? "0 4px 14px rgba(191, 161, 106, 0.16)" : "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        {/* Header ngày */}
        <div
          style={{
            padding: "10px 12px",
            background: darkHeader ? "linear-gradient(135deg, #2b251d 0%, #1f1f1f 100%)" : "#faf7f2",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderBottom: "1px solid #f0ebe1",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: darkHeader ? "#BFA16A" : isSunday ? "#cf1322" : "#555",
              }}
            >
              {WEEKDAY_LABELS[idx]}
            </span>
            {isToday && (
              <Tag color="#BFA16A" style={{ margin: 0, fontSize: 10, lineHeight: "16px", padding: "0 6px" }}>
                HÔM NAY
              </Tag>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: darkHeader ? "#ffffff" : isSunday ? "#cf1322" : "#1F1F1F" }}>
              {dayMoment.format("DD/MM")}
            </span>
            {lunar && (
              <Tooltip title={`Âm lịch: ${lunar.fullLabel}${lunar.holidayName ? ` (${lunar.holidayName})` : ""}`}>
                <span
                  style={{
                    fontSize: 11,
                    color: lunar.isFirstDayOfMonth || lunar.isFullMoon ? "#BFA16A" : darkHeader ? "#d9d0c3" : "#888",
                    fontWeight: lunar.isFirstDayOfMonth || lunar.isFullMoon ? 700 : 400,
                  }}
                >
                  {lunar.shortLabel} ÂL
                </span>
              </Tooltip>
            )}
          </div>
          {holiday && (
            <div
              style={{
                marginTop: 6,
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                background: isClosed ? "#cf1322" : isNational ? "#fff1f0" : "#f9f0ff",
                color: isClosed ? "#fff" : isNational ? "#cf1322" : "#722ed1",
                border: isClosed ? "none" : `1px solid ${isNational ? "#ffa39e" : "#d3adf7"}`,
              }}
            >
              {isClosed ? "🔒 Nghỉ: " : "🎉 "}
              {holiday.name}
            </div>
          )}
        </div>

        {/* Trạng thái 3 ca + thanh timeline trong ngày */}
        <div style={{ padding: "8px 10px 6px", borderBottom: "1px dashed #f0ebe1" }}>
          {isClosed ? (
            <Tag color="red" style={{ width: "100%", textAlign: "center", margin: 0 }}>
              Studio đóng cửa nghỉ
            </Tag>
          ) : (
            <>
              <SessionPills statuses={statuses} onPick={pick} />
              <div style={{ marginTop: 6 }}>
                <DayTimelineBar dayBookings={dayBookings} height={isWidget ? 14 : 10} showTicks={isWidget} />
              </div>
            </>
          )}
        </div>

        {/* Danh sách đơn */}
        <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {dayBookings.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b5b0a6",
                fontSize: 12,
                padding: "20px 8px",
                textAlign: "center",
                border: "1px dashed #ece6dc",
                borderRadius: 8,
              }}
            >
              {isClosed ? "Studio nghỉ" : "🟢 Trống cả ngày"}
            </div>
          ) : (
            dayBookings.map((item) => (
              <BookingCard
                key={item._id}
                item={item}
                highlightBookingId={highlightBookingId}
                onEdit={handleEdit}
                onDetail={handleDetail}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "6px 8px 8px", borderTop: "1px dashed #f0ebe1" }}>
          {onSelectSlot ? (
            <Button
              block
              size="small"
              disabled={isClosed}
              type="dashed"
              style={{ borderColor: "#BFA16A", color: "#8c6d2f", fontSize: 11.5, fontWeight: 600 }}
              onClick={() => onSelectSlot({ date: dateStr, session: null })}
            >
              ✓ Chọn ngày {dayMoment.format("DD/MM")}
            </Button>
          ) : (
            <Button
              block
              size="small"
              type="dashed"
              disabled={isClosed}
              icon={<PlusOutlined />}
              style={{ fontSize: 11.5, color: "#666" }}
              onClick={() => navigate(`/admin/orders/create?date=${dateStr}`)}
            >
              Thêm đơn {dayMoment.format("DD/MM")}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ===== Dải 7 ngày (chỉ dùng cho widget) =====
  const renderDayStrip = () => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {weekDays.map((d, idx) => {
          const ds = d.format(DATE_FMT);
          const list = bookingsByDate[ds] || [];
          const { isClosed } = getDayHolidayAndLunar(d);
          const sts = getSessionStatuses(list, isClosed);
          const allBusy = sts.every((s) => s.state === "busy" || s.state === "closed");
          const cnt = list.filter((b) => b.status !== "CANCELED").length;
          const isSel = ds === activeDayStr;
          const isToday = ds === todayStr;
          const dot = isClosed ? "#8c8c8c" : cnt === 0 ? "#52c41a" : allBusy ? "#ff4d4f" : "#fa8c16";
          return (
            <div
              key={ds}
              onClick={() => setSelectedDayStr(ds)}
              style={{
                cursor: "pointer",
                borderRadius: 8,
                padding: "5px 0",
                textAlign: "center",
                border: isSel ? "2px solid #BFA16A" : isToday ? "1px solid #BFA16A" : "1px solid #e8e2d9",
                background: isSel ? "#BFA16A" : "#fff",
                color: isSel ? "#fff" : idx === 6 ? "#cf1322" : "#333",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.85 }}>{SHORT_WEEKDAYS[idx]}</div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{d.format("DD")}</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 3, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSel ? "#fff" : dot }} />
                <span style={{ fontSize: 10 }}>{isClosed ? "Nghỉ" : cnt}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 6, fontSize: 10.5, color: "#888" }}>
        <span><span style={{ color: "#52c41a" }}>●</span> Trống</span>
        <span><span style={{ color: "#fa8c16" }}>●</span> Có ca</span>
        <span><span style={{ color: "#ff4d4f" }}>●</span> Kín</span>
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {renderToolbar()}

      <Spin spinning={loading} tip="Đang tải thời khóa biểu...">
        {isWidget ? (
          <>
            {renderDayStrip()}
            {weekDays.map((d, idx) => (d.format(DATE_FMT) === activeDayStr ? renderDay(d, idx) : null))}
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(7, minmax(${columnMinWidth}px, 1fr))`,
              gap: 10,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {weekDays.map((d, idx) => renderDay(d, idx))}
          </div>
        )}
      </Spin>

      {/* Modal Tùy chỉnh Thời gian của đơn hàng trên Thời khóa biểu */}
      <Modal
        open={scheduleModalOpen}
        onCancel={() => {
          setScheduleModalOpen(false);
          setEditingBooking(null);
        }}
        title={
          <Space>
            <ClockCircleOutlined style={{ color: "#BFA16A" }} />
            <span>
              Tùy chỉnh Thời gian trên Thời khóa biểu — Đơn #
              {editingBooking ? String(editingBooking._id).slice(-6).toUpperCase() : ""}
            </span>
          </Space>
        }
        onOk={handleSaveSchedule}
        confirmLoading={savingSchedule}
        okText="Lưu vào Thời khóa biểu"
        cancelText="Hủy"
        okButtonProps={{ style: { background: "#BFA16A", borderColor: "#BFA16A" } }}
        width={620}
        destroyOnClose
      >
        {editingBooking && (
          <div>
            {/* Thông tin tóm tắt đơn */}
            <div
              style={{
                background: "#FAF7F2",
                border: "1px solid #E8DED2",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div>
                <strong>Khách hàng:</strong>{" "}
                {editingBooking.customer_full_name ||
                  editingBooking.customer_id?.full_name ||
                  "Khách hàng"}{" "}
                {editingBooking.customer_phone || editingBooking.customer_id?.phone
                  ? `(${editingBooking.customer_phone || editingBooking.customer_id?.phone})`
                  : ""}
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>Hình thức & Địa điểm:</strong>{" "}
                <Tag color={editingBooking.shooting_type === "OUTDOOR" ? "orange" : "blue"}>
                  {editingBooking.shooting_type === "OUTDOOR" ? "Ngoại cảnh" : "Tại Studio"}
                </Tag>
                <span>{editingBooking.location || "Cao Hiển Studio"}</span>
                {editingBooking.travel_distance_km > 0 && (
                  <Tag color="gold" style={{ marginLeft: 6 }}>
                    Cách Studio ~{editingBooking.travel_distance_km} km
                  </Tag>
                )}
              </div>
            </div>

            {/* Thanh công cụ cộng nhanh thời gian đi lại cho đơn Ngoại cảnh */}
            {editingBooking.shooting_type === "OUTDOOR" && (
              <div
                style={{
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#874d00", marginBottom: 8 }}>
                  <CarOutlined style={{ marginRight: 6 }} />
                  Cộng nhanh thời gian di chuyển ngoại cảnh vào Giờ kết thúc dự kiến:
                  {editingBooking.travel_distance_km > 0 && (
                    <span style={{ fontWeight: 400, marginLeft: 4 }}>
                      (Cự ly {editingBooking.travel_distance_km} km — gợi ý cộng thêm{" "}
                      {Math.round((editingBooking.suggested_travel_buffer_minutes || 120) / 60)} giờ)
                    </span>
                  )}
                </div>
                <Space wrap size={6}>
                  <Button size="small" onClick={() => handleApplyTravelBuffer(60)}>
                    +1 giờ đi lại
                  </Button>
                  <Button size="small" onClick={() => handleApplyTravelBuffer(120)}>
                    +2 giờ đi lại
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    style={{ borderColor: "#d48806", color: "#d48806" }}
                    onClick={() => handleApplyTravelBuffer(180)}
                  >
                    +3 giờ đi lại (TP.HCM / Cần Thơ)
                  </Button>
                  <Button size="small" onClick={() => handleApplyTravelBuffer(240)}>
                    +4 giờ đi lại
                  </Button>
                  <Button size="small" type="dashed" onClick={() => handleApplyTravelBuffer(0)}>
                    Về giờ chuẩn của buổi
                  </Button>
                </Space>
              </div>
            )}

            <Form form={form} layout="vertical">
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Ngày thực hiện"
                    name="shoot_date"
                    rules={[{ required: true, message: "Vui lòng chọn ngày chụp" }]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Buổi chụp (Gói cam kết)"
                    name="shooting_session"
                    rules={[{ required: true, message: "Vui lòng chọn buổi chụp" }]}
                  >
                    <Select
                      onChange={handleSessionSelectChange}
                      options={[
                        { value: "MORNING", label: "Buổi sáng (Mặc định 08:00 - 12:00)" },
                        { value: "AFTERNOON", label: "Buổi chiều (Mặc định 13:00 - 17:00)" },
                        { value: "EVENING", label: "Buổi tối (Mặc định 17:30 - 21:30)" },
                        { value: "FULL_DAY", label: "Cả ngày (Mặc định 08:00 - 17:00)" },
                        { value: "CUSTOM", label: "Khung giờ tùy chỉnh" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Giờ bắt đầu trên Thời khóa biểu"
                    name="custom_start_time"
                    rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}
                  >
                    <TimePicker
                      format="HH:mm"
                      minuteStep={15}
                      style={{ width: "100%" }}
                      needConfirm={false}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Giờ kết thúc dự kiến (gồm đi lại)"
                    name="custom_end_time"
                    rules={[{ required: true, message: "Chọn giờ kết thúc dự kiến" }]}
                  >
                    <TimePicker
                      format="HH:mm"
                      minuteStep={15}
                      style={{ width: "100%" }}
                      needConfirm={false}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Cảnh báo trực tiếp nếu giờ đang chọn đụng đơn khác */}
              {modalLiveOverlaps.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 14 }}
                  message={`Khung giờ này trùng với ${modalLiveOverlaps.length} đơn khác trong ngày:`}
                  description={
                    <ul style={{ margin: "4px 0 0 18px", padding: 0, fontSize: 12 }}>
                      {modalLiveOverlaps.map((o) => (
                        <li key={o._id}>
                          Đơn <strong>#{String(o._id).slice(-6).toUpperCase()}</strong> (
                          {o.customer_full_name || o.customer_id?.full_name}) —{" "}
                          <strong>
                            {o.start_time_str} – {o.end_time_str}
                          </strong>{" "}
                          ({o.shooting_type === "OUTDOOR" ? "Ngoại cảnh" : "Tại Studio"})
                        </li>
                      ))}
                    </ul>
                  }
                />
              )}

              <Form.Item
                label="Ghi chú điều phối trên Thời khóa biểu"
                name="schedule_note"
              >
                <Input placeholder="VD: Cộng thêm 3 tiếng di chuyển Bến Tre ↔ TP.HCM..." />
              </Form.Item>

              <div
                style={{
                  background: "#f9f9f9",
                  border: "1px solid #eaeaea",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    In khung giờ tùy chỉnh này lên Hợp đồng PDF của khách?
                  </span>
                  <Form.Item name="use_custom_time_on_contract" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div style={{ fontSize: 11.5, color: "#666", marginTop: 4, lineHeight: 1.45 }}>
                  {watchUseContract ? (
                    <span style={{ color: "#096dd9" }}>
                      ✓ Hợp đồng PDF sẽ in giờ cụ thể:{" "}
                      <strong>
                        {watchStartTime ? watchStartTime.format("HH:mm") : "08:00"} –{" "}
                        {watchEndTime ? watchEndTime.format("HH:mm") : "12:00"}
                      </strong>
                      .
                    </span>
                  ) : (
                    <span>
                      💡 Đang tắt (Khuyên dùng khi chỉ cộng thêm giờ di chuyển nội bộ): Thời khóa biểu
                      sẽ chặn lịch đến{" "}
                      <strong>{watchEndTime ? watchEndTime.format("HH:mm") : "12:00"}</strong>, nhưng
                      Hợp đồng PDF của khách vẫn giữ nhãn chuẩn của buổi chụp (
                      {SESSION_CONFIG[watchSession]?.label || "Buổi sáng"}).
                    </span>
                  )}
                </div>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

