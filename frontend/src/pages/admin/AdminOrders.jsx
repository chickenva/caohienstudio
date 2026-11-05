/**
 * AdminOrders.jsx
 * Quản lý đơn đặt lịch: xem, cập nhật trạng thái, gửi hợp đồng, phân công thợ.
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Table,
  Tag,
  Select,
  Button,
  Space,
  message,
  Modal,
  Descriptions,
  Typography,
  Alert,
  Divider,
  Input,
  DatePicker,
  Row,
  Col,
  Card,
  Form,
  InputNumber,
  Tooltip,
  Spin,
  AutoComplete,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleFilled,
  CheckSquareOutlined,
  SearchOutlined,
  FilterOutlined,
  SendOutlined,
  EditOutlined,
  CopyOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  QrcodeOutlined,
  CalendarOutlined,
  PlusOutlined,
  BankOutlined,
  DollarOutlined,
  UploadOutlined,
  EnvironmentOutlined,
  CarOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getBandForDistance } from "../../utils/shootingLocations";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text, Paragraph } = Typography;

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const getBookingCustomerInfo = (booking) => ({
  full_name: booking?.customer_full_name || booking?.customer_id?.full_name || "Khách hàng",
  email: booking?.customer_email || booking?.customer_id?.email || "",
  phone: booking?.customer_phone || booking?.customer_id?.phone || "",
});

const getServiceId = (service) => String(service?._id || service || "");

const getBookingMainServiceIds = (booking) => new Set([
  ...(booking?.original_service_ids || []),
  booking?.service_id,
].map(getServiceId).filter(Boolean));

// Legacy customer bookings also stored secondary main packages in extra_service_ids.
// Exclude those references wherever the admin UI displays actual addons.
const getBookingAddons = (booking) => {
  const mainServiceIds = getBookingMainServiceIds(booking);
  return (booking?.extra_service_ids || []).filter((service) => {
    if (mainServiceIds.has(getServiceId(service))) return false;
    if (!service || typeof service !== "object" || (!("allow_addon" in service) && !("category" in service))) return true;
    const name = (service.name || "").toLocaleLowerCase("vi");
    return service.allow_addon === true || service.category === "PRINT" ||
      name.includes("gói lẻ lễ tối") || name.includes("gói thêm flycam");
  });
};

// Only offer services configured as add-ons (plus legacy PRINT category items).
// The evening and flycam add-ons remain conditional on compatible main packages.
const getAddonServicesForMain = (services, mainServiceIds = []) => {
  const selectedIds = new Set(mainServiceIds.map(String));
  const selectedMains = services.filter((service) => selectedIds.has(String(service._id)));
  const addons = services.filter((service) =>
    !selectedIds.has(String(service._id)) && (service.allow_addon === true || service.category === "PRINT")
  );

  selectedMains.forEach((service) => {
    const mainName = (service.name || "").toLocaleLowerCase("vi");
    if (mainName.includes("chụp truyền thống") || mainName.includes("combo")) {
      const eveningAddon = services.find((item) => (item.name || "").toLocaleLowerCase("vi").includes("gói lẻ lễ tối"));
      if (eveningAddon && !addons.some((item) => String(item._id) === String(eveningAddon._id))) addons.push(eveningAddon);
    }
    if (mainName.includes("quay") || mainName.includes("combo")) {
      const flycamAddon = services.find((item) => (item.name || "").toLocaleLowerCase("vi").includes("gói thêm flycam"));
      if (flycamAddon && !addons.some((item) => String(item._id) === String(flycamAddon._id))) addons.push(flycamAddon);
    }
  });

  const uniqueAddons = addons.filter((item, index, all) =>
    all.findIndex((candidate) => String(candidate._id) === String(item._id)) === index
  );
  uniqueAddons.sort((a, b) => {
    const aIsSpecial = ["gói lẻ lễ tối", "gói thêm flycam"].some((name) => (a.name || "").toLocaleLowerCase("vi").includes(name));
    const bIsSpecial = ["gói lẻ lễ tối", "gói thêm flycam"].some((name) => (b.name || "").toLocaleLowerCase("vi").includes(name));
    return aIsSpecial === bIsSpecial ? 0 : aIsSpecial ? -1 : 1;
  });
  return uniqueAddons;
};

const statusOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "REQUESTED", label: "Yêu cầu mới" },
  { value: "CONTRACT_SENT", label: "Đã gửi HĐ / Chờ cọc" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "IN_PROGRESS", label: "Đang chụp" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELED", label: "Đã hủy" },
];

const statusConfig = {
  REQUESTED: { color: "orange", text: "Yêu cầu mới" },
  CONTRACT_SENT: { color: "gold", text: "Đã gửi HĐ / Chờ cọc" },
  WAITING_PAYMENT: { color: "gold", text: "Đã gửi HĐ / Chờ cọc" },
  CONFIRMED: { color: "blue", text: "Đã xác nhận" },
  IN_PROGRESS: { color: "geekblue", text: "Đang chụp" },
  COMPLETED: { color: "green", text: "Hoàn thành" },
  CANCELED: { color: "red", text: "Đã hủy" },
  PENDING: { color: "gold", text: "Chờ cọc (cũ)" },
  DEPOSITED: { color: "cyan", text: "Đã cọc (cũ)" },
};

// Trang admin quản lý toàn bộ vòng đời đơn: yêu cầu, hợp đồng, thanh toán và hoàn thành.
export default function AdminOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // Danh sách dịch vụ để hiển thị trong modal chỉnh đơn
  const [servicesList, setServicesList] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [searchId, setSearchId] = useState(() => searchParams.get("customerName") || "");
  const [dateRange, setDateRange] = useState(null);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Modal hủy đơn
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Modal hoàn thành
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);

  // Modal đang chụp
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState(null);

  // Modal dời lịch (đơn CONFIRMED)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleForm] = Form.useForm();
  // Busy slots khi admin chọn ngày trong modal dời lịch
  const [rescheduleBusySlots, setRescheduleBusySlots] = useState([]);
  const [rescheduleBusyLoading, setRescheduleBusyLoading] = useState(false);

  // Modal xem lại QR/link hợp đồng
  const [contractViewModalOpen, setContractViewModalOpen] = useState(false);
  const [contractViewTarget, setContractViewTarget] = useState(null);
  const [contractViewData, setContractViewData] = useState(null);
  const [loadingContractView, setLoadingContractView] = useState(false);

  // Modal Cài đặt QR Thanh toán Studio Mặc định
  const [studioQrModalOpen, setStudioQrModalOpen] = useState(false);
  const [studioQrUrl, setStudioQrUrl] = useState("");
  const [studioQrInputUrl, setStudioQrInputUrl] = useState("");
  const [loadingStudioQr, setLoadingStudioQr] = useState(false);
  const [savingStudioQr, setSavingStudioQr] = useState(false);

  // Modal xác nhận đã nhận cọc (CASH/TRANSFER)
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositTarget, setDepositTarget] = useState(null);
  const [confirmingDeposit, setConfirmingDeposit] = useState(false);
  const [depositBillUrl, setDepositBillUrl] = useState("");
  const [uploadingDepositBill, setUploadingDepositBill] = useState(false);
  const [depositForm] = Form.useForm();

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  // Lấy JWT admin để gọi API quản trị đơn.
  const getToken = () => localStorage.getItem("token");
  /**
   * Hàm gọi API lấy danh sách toàn bộ đơn hàng của hệ thống.
   * Xử lý: Lọc theo filter (trạng thái, ngày), phân trang và gán vào state.
   */
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/bookings/admin/all?status=${statusFilter}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setBookings(res.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách tất cả dịch vụ (chỉ gọi 1 lần)
  // Tải danh sách dịch vụ để modal chỉnh đơn có thể chọn lại gói.
  const fetchServices = useCallback(async () => {
    if (servicesList.length > 0) return servicesList;
    setServicesLoading(true);
    try {
      const res = await axios.get(`${API_URL}/services/admin/all`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const list = Array.isArray(res.data) ? res.data : (res.data?.services || res.data?.data || []);
      setServicesList(list);
      return list;
    } catch (err) {
      message.error("Không thể tải danh sách dịch vụ");
      return [];
    } finally {
      setServicesLoading(false);
    }
  }, [servicesList.length]);

  // Render tag trạng thái đơn theo cấu hình màu/text.
  const renderStatus = (status) => {
    const config = statusConfig[status] || { color: "default", text: status || "KhĂ´ng rĂµ" };
    return <Tag color={config.color}>{config.text.toUpperCase()}</Tag>;
  };
  const handleViewDetail = (record) => { setSelectedBooking(record); setDetailOpen(true); };
  // Mở modal xác nhận hủy đơn.
  const openCancelModal = (record) => { setCancelTarget(record); setCancelModalOpen(true); };
  // Mở modal xác nhận hoàn thành đơn.
  const openCompleteModal = (record) => { setCompleteTarget(record); setCompleteModalOpen(true); };
  // Mở modal chuyển đơn sang trạng thái đang thực hiện.
  const openProgressModal = (record) => { setProgressTarget(record); setProgressModalOpen(true); };

  // Mở modal cài đặt QR Studio
  const openStudioQrModal = async () => {
    setStudioQrModalOpen(true);
    setLoadingStudioQr(true);
    try {
      const res = await axios.get(`${API_URL}/website/payment-qr`);
      const url = res.data.paymentQrUrl || "";
      setStudioQrUrl(url);
      setStudioQrInputUrl(url);
    } catch (err) {
      console.error("Lỗi lấy QR studio:", err);
    } finally {
      setLoadingStudioQr(false);
    }
  };

  // Upload ảnh QR Studio thanh toán mặc định từ file
  const handleUploadStudioQr = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setSavingStudioQr(true);
    try {
      const uploadRes = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const imgUrl = uploadRes.data.url;
      await axios.post(
        `${API_URL}/website/admin/payment-qr`,
        { imageUrl: imgUrl },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setStudioQrUrl(imgUrl);
      setStudioQrInputUrl(imgUrl);
      message.success("Cập nhật QR thanh toán mặc định của Studio thành công!");
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi lưu QR thanh toán Studio");
    } finally {
      setSavingStudioQr(false);
    }
  };

  // Lưu URL ảnh QR Studio trực tiếp từ Input
  const handleSaveStudioQrUrl = async (url) => {
    if (!url) {
      message.error("Vui lòng nhập hoặc dán URL hình ảnh QR!");
      return;
    }
    setSavingStudioQr(true);
    try {
      await axios.post(
        `${API_URL}/website/admin/payment-qr`,
        { imageUrl: url },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setStudioQrUrl(url);
      message.success("Lưu URL QR thanh toán Studio thành công!");
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi lưu QR thanh toán Studio");
    } finally {
      setSavingStudioQr(false);
    }
  };

  // Upload ảnh bill thanh toán cọc từ máy
  const handleUploadDepositBill = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setUploadingDepositBill(true);
    try {
      const res = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      setDepositBillUrl(res.data.url);
      message.success("Tải lên ảnh bill thanh toán thành công!");
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi upload ảnh bill thanh toán");
    } finally {
      setUploadingDepositBill(false);
    }
  };

  // Mở modal xác nhận đã nhận cọc (CASH/TRANSFER).
  const openDepositModal = (record) => {
    setDepositTarget(record);
    setDepositBillUrl(record.deposit_bill_url || "");
    depositForm.setFieldsValue({
      payment_method: "TRANSFER",
      amount: record.deposit_amount || 0,
      payment_note: "",
    });
    setDepositModalOpen(true);
  };

  // Lấy busy slots cho modal dời lịch (loại trừ chính đơn đang dời)
  const fetchRescheduleBusySlots = async (date, booking) => {
    if (!date || !booking) return;
    setRescheduleBusyLoading(true);
    try {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const type = booking.shooting_type || "STUDIO";
      const res = await axios.get(
        `${API_URL}/bookings/studio-busy-slots?date=${dateStr}&type=${type}&excludeBookingId=${booking._id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setRescheduleBusySlots(res.data || []);
    } catch (err) {
      console.error("Lỗi load busy slots:", err);
      setRescheduleBusySlots([]);
    } finally {
      setRescheduleBusyLoading(false);
    }
  };

  // Mở modal dời lịch cho đơn CONFIRMED.
  const openRescheduleModal = (record) => {
    setRescheduleTarget(record);
    setRescheduleBusySlots([]);
    rescheduleForm.setFieldsValue({
      shoot_date: record.start_time ? dayjs(record.start_time) : null,
      shooting_session: record.shooting_session || undefined,
      location: record.location || (record.shooting_type === "STUDIO" ? "Cao Hiển Studio" : ""),
      note: record.note || "",
    });
    setRescheduleModalOpen(true);
    // Fetch busy slots cho ngày hiện tại của đơn
    if (record.start_time) {
      fetchRescheduleBusySlots(record.start_time, record);
    }
  };

  // Mở modal xem lại QR/link hợp đồng.
  const openContractViewModal = async (record) => {
    setContractViewTarget(record);
    setContractViewData(null);
    setContractViewModalOpen(true);
    setLoadingContractView(true);
    try {
      const res = await axios.get(
        `${API_URL}/bookings/${record._id}/contract-info`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setContractViewData(res.data);
    } catch (err) {
      message.error(err.response?.data?.message || "Không thể tải thông tin hợp đồng");
      setContractViewModalOpen(false);
    } finally {
      setLoadingContractView(false);
    }
  };

  // Gọi API đổi trạng thái đơn theo transition backend cho phép.
  const executeUpdateStatus = async (bookingId, newStatus, onSuccess) => {
    setUpdatingId(bookingId);
    try {
      await axios.put(
        `${API_URL}/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      message.success("Cập nhật trạng thái thành công");
      fetchBookings();
      if (selectedBooking?._id === bookingId) setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(err.response?.data?.message || "Không thể cập nhật trạng thái");
    } finally {
      setUpdatingId(null);
    }
  };

  // Xác nhận hủy đơn và đóng modal liên quan.
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    await executeUpdateStatus(cancelTarget._id, "CANCELED", () => {
      setCancelModalOpen(false); setCancelTarget(null);
      if (detailOpen && selectedBooking?._id === cancelTarget._id) setDetailOpen(false);
    });
  };

  // Xác nhận hoàn thành đơn sau khi studio đã xử lý xong.
  const handleConfirmComplete = async () => {
    if (!completeTarget) return;
    await executeUpdateStatus(completeTarget._id, "COMPLETED", () => {
      setCompleteModalOpen(false); setCompleteTarget(null);
    });
  };

  // Chuyển đơn CONFIRMED sang IN_PROGRESS khi bắt đầu buổi chụp.
  const handleStartProgress = async () => {
    if (!progressTarget) return;
    await executeUpdateStatus(progressTarget._id, "IN_PROGRESS", () => {
      setProgressModalOpen(false); setProgressTarget(null);
    });
  };

  // Admin xác nhận đã nhận cọc thủ công (CASH/TRANSFER) → booking chuyển CONFIRMED.
  const handleConfirmDeposit = async () => {
    if (!depositTarget) return;
    try {
      const values = await depositForm.validateFields();
      setConfirmingDeposit(true);
      await axios.post(
        `${API_URL}/bookings/${depositTarget._id}/confirm-deposit`,
        {
          payment_method: values.payment_method,
          amount: values.amount,
          payment_note: values.payment_note || "",
          bill_image_url: depositBillUrl || "",
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      message.success("Xác nhận nhận cọc thành công! Đơn đã chuyển sang CONFIRMED.");
      setDepositModalOpen(false);
      setDepositTarget(null);
      setDepositBillUrl("");
      depositForm.resetFields();
      fetchBookings();
      if (selectedBooking?._id === depositTarget._id) {
        setSelectedBooking(prev => ({ ...prev, status: "CONFIRMED", deposit_bill_url: depositBillUrl }));
        setDetailOpen(false);
      }
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || "Không thể xác nhận nhận cọc");
    } finally {
      setConfirmingDeposit(false);
    }
  };

  // Lưu dời lịch đơn CONFIRMED — gọi API reschedule, reload và thông báo.
  const handleSaveReschedule = async () => {
    try {
      const values = await rescheduleForm.validateFields();
      setRescheduling(true);
      const payload = {
        shoot_date: values.shoot_date ? values.shoot_date.format("YYYY-MM-DD") : undefined,
        shooting_session: values.shooting_session,
        location: values.location,
        note: values.note,
      };
      await axios.put(
        `${API_URL}/bookings/${rescheduleTarget._id}/reschedule`,
        payload,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      message.success("Cập nhật lịch thành công, hợp đồng đã được tạo lại!");
      setRescheduleModalOpen(false);
      setRescheduleTarget(null);
      rescheduleForm.resetFields();
      fetchBookings();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || "Không thể cập nhật lịch");
    } finally {
      setRescheduling(false);
    }
  };

  const columns = [
    {
      title: "MÃ ĐƠN",
      dataIndex: "_id",
      key: "_id",
      width: 100,
      render: (id) => <Text code>#{id.slice(-6).toUpperCase()}</Text>,
    },
    {
      title: "KHÁCH HÀNG",
      dataIndex: "customer_id",
      key: "customer_id",
      render: (customer, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{getBookingCustomerInfo(record).full_name}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{getBookingCustomerInfo(record).phone || getBookingCustomerInfo(record).email}</div>
        </div>
      ),
    },
    {
      title: "DỊCH VỤ",
      key: "services",
      render: (_, record) => {
        const mainServices = record.original_service_ids?.length
          ? record.original_service_ids
          : record.service_id ? [record.service_id] : [];
        const addons = getBookingAddons(record);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>
              {mainServices.map(service => service?.name).filter(Boolean).join(", ") || record.service_id?.name || "Dịch vụ"}
            </div>
            {addons.length > 0 && (
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                + {addons.map(service => service?.name || "Gói đi kèm").join(", ")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "LỊCH CHỤP",
      key: "shoot_time",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dayjs(record.start_time).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {record.shooting_session
              ? `${dayjs(record.start_time).format("HH:mm")} - ${dayjs(record.end_time).format("HH:mm")}`
              : "Studio liên hệ để chốt buổi/giờ"}
          </div>
        </div>
      ),
    },
    {
      title: "TỔNG TIỀN",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount) => <strong>{(amount || 0).toLocaleString("vi-VN")}đ</strong>,
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: renderStatus,
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "right",
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>
          {record.status === "REQUESTED" && (
            <Tooltip title="Chỉnh thông tin đơn & Biên tập hợp đồng">
              <Button icon={<EditOutlined />} size="small" style={{ borderColor: "#BFA16A", color: "#BFA16A" }} onClick={() => navigate(`/admin/orders/${record._id}`)}>Chỉnh sửa</Button>
            </Tooltip>
          )}
          {["CONTRACT_SENT", "WAITING_PAYMENT"].includes(record.status) && (
            <Tooltip title="Xác nhận đã nhận tiền cọc từ khách">
              <Button
                size="small"
                type="primary"
                style={{ background: "#BFA16A", borderColor: "#BFA16A" }}
                onClick={() => openDepositModal(record)}
              >
                Xác nhận đã cọc
              </Button>
            </Tooltip>
          )}
          {record.status === "CONFIRMED" && (
            <Tooltip title="Đánh dấu bắt đầu buổi chụp">
              <Button size="small" type="primary" style={{ background: "#BFA16A", borderColor: "#BFA16A" }} onClick={() => openProgressModal(record)}>Bắt đầu</Button>
            </Tooltip>
          )}
          {record.status === "IN_PROGRESS" && (
            <Tooltip title="Xác nhận hoàn thành đơn hàng">
              <Button size="small" type="primary" style={{ background: "#BFA16A", borderColor: "#BFA16A" }} onClick={() => openCompleteModal(record)}>Hoàn thành</Button>
            </Tooltip>
          )}
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)}>Chi tiết</Button>
        </div>
      ),
    },
  ];

  // Lọc danh sách đơn theo mã/tên khách/ngày chụp/trạng thái trên giao diện.
  const filteredBookings = bookings.filter((b) => {
    const matchId =
      !searchId ||
      b._id.slice(-6).toUpperCase().includes(searchId.toUpperCase().trim()) ||
      (b.customer_id?.full_name || b.customer_full_name || "").toLowerCase().includes(searchId.toLowerCase().trim());
    const matchDate =
      !dateRange || !dateRange[0] || !dateRange[1] ||
      (dayjs(b.start_time).isSameOrAfter(dateRange[0].startOf("day")) &&
        dayjs(b.start_time).isSameOrBefore(dateRange[1].endOf("day")));
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "CONTRACT_SENT" && ["CONTRACT_SENT", "WAITING_PAYMENT"].includes(b.status)) ||
      b.status === statusFilter;
    return matchId && matchDate && matchStatus;
  });

  // Kiểm tra có filter đang bật để hiển thị số lượng kết quả.
  const hasActiveFilter = searchId || (dateRange && dateRange[0]) || statusFilter !== "ALL";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>Quản Lý Đơn Đặt Lịch</Title>
        </div>
        <Space>
          <Button icon={<FileTextOutlined />} onClick={() => navigate("/admin/contract-templates")} style={{ borderColor: "#BFA16A", color: "#8B7045", background: "#fff" }}>
            Template hợp đồng
          </Button>
          <Button icon={<QrcodeOutlined />} onClick={openStudioQrModal} style={{ borderColor: "#000", color: "#000", background: "#fff" }}>
            QR Thanh toán Studio
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchBookings} loading={loading} />
        </Space>
      </div>

      {/* Filter Card */}
      <Card
        bordered={false}
        style={{ marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)", borderRadius: 12, border: "1px solid #efebe4" }}
        bodyStyle={{ padding: "18px 24px" }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={10}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>
              Tìm kiếm đơn đặt lịch
            </span>
            <Input
              placeholder="Nhập mã đơn, tên hoặc số điện thoại..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Lọc theo ngày chụp</span>
            <DatePicker.RangePicker
              style={{ width: "100%", borderRadius: 8 }}
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              size="large"
              allowClear
            />
          </Col>
          <Col xs={24} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Lọc theo trạng thái</span>
            <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} style={{ width: "100%" }} size="large" dropdownStyle={{ borderRadius: 8 }} />
          </Col>
        </Row>
        {hasActiveFilter && (
          <div style={{ marginTop: 12, color: "#8c8c8c", fontSize: 13 }}>
            Đang hiển thị <strong>{filteredBookings.length}</strong> / {bookings.length} đơn hàng
          </div>
        )}
      </Card>

      {/* Table Container */}
      <Card
        bordered={false}
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)", borderRadius: 12, border: "1px solid #efebe4", overflow: "hidden" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredBookings}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total} đơn` }}
          scroll={{ x: 1100 }}
          bordered={false}
          style={{ borderRadius: 12 }}
        />
      </Card>

      {/* ===== MODAL CHI TIẾT ===== */}
      <Modal
        title={
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            Chi tiết đơn
            {selectedBooking && <Text code style={{ marginLeft: 8, fontSize: 13, fontWeight: 400 }}>#{selectedBooking._id.slice(-6).toUpperCase()}</Text>}
          </span>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={(() => {
          if (!selectedBooking) return [<Button key="close" onClick={() => setDetailOpen(false)}>Đóng</Button>];
          const st = selectedBooking.status;

          if (st === "REQUESTED") {
            return [
              <Button key="cancel" danger icon={<CloseCircleOutlined />} onClick={() => { setDetailOpen(false); openCancelModal(selectedBooking); }}>
                Hủy đơn
              </Button>,
              <Button key="edit" icon={<EditOutlined />} style={{ borderColor: "#BFA16A", color: "#BFA16A" }} onClick={() => { setDetailOpen(false); navigate(`/admin/orders/${selectedBooking._id}`); }}>
                Chỉnh sửa
              </Button>,
              <Button key="close" onClick={() => setDetailOpen(false)}>
                Đóng
              </Button>,
            ];
          }

          if (["CONTRACT_SENT", "WAITING_PAYMENT"].includes(st)) {
            return [
              <Button key="cancel" danger icon={<CloseCircleOutlined />} onClick={() => { setDetailOpen(false); openCancelModal(selectedBooking); }}>
                Hủy đơn
              </Button>,
              <Button key="contract" icon={<QrcodeOutlined />} style={{ color: "#08979c", borderColor: "#08979c" }} onClick={() => { setDetailOpen(false); openContractViewModal(selectedBooking); }}>
                Hợp đồng
              </Button>,
              <Button key="edit" icon={<EditOutlined />} style={{ borderColor: "#BFA16A", color: "#BFA16A" }} onClick={() => { setDetailOpen(false); navigate(`/admin/orders/${selectedBooking._id}`); }}>
                Chỉnh sửa
              </Button>,
              <Button key="close" onClick={() => setDetailOpen(false)}>
                Đóng
              </Button>,
            ];
          }

          if (st === "CONFIRMED") {
            return [
              <Button key="cancel" danger icon={<CloseCircleOutlined />} onClick={() => { setDetailOpen(false); openCancelModal(selectedBooking); }}>
                Hủy đơn
              </Button>,
              <Button key="contract" icon={<QrcodeOutlined />} style={{ color: "#08979c", borderColor: "#08979c" }} onClick={() => { setDetailOpen(false); openContractViewModal(selectedBooking); }}>
                Hợp đồng
              </Button>,
              <Button key="edit" icon={<EditOutlined />} style={{ borderColor: "#BFA16A", color: "#BFA16A" }} onClick={() => { setDetailOpen(false); navigate(`/admin/orders/${selectedBooking._id}`); }}>
                Chỉnh sửa
              </Button>,
              <Button key="close" onClick={() => setDetailOpen(false)}>
                Đóng
              </Button>,
            ];
          }

          if (st === "IN_PROGRESS") {
            return [
              <Button key="complete" type="primary" onClick={() => { setDetailOpen(false); openCompleteModal(selectedBooking); }} style={{ background: "#BFA16A", borderColor: "#BFA16A" }}>
                Hoàn thành
              </Button>,
              (selectedBooking.contract_token || selectedBooking.contract_file_url) && (
                <Button key="contract" icon={<QrcodeOutlined />} style={{ color: "#08979c", borderColor: "#08979c" }} onClick={() => { setDetailOpen(false); openContractViewModal(selectedBooking); }}>
                  Hợp đồng
                </Button>
              ),
              <Button key="close" onClick={() => setDetailOpen(false)}>
                Đóng
              </Button>,
            ].filter(Boolean);
          }

          return [
            (selectedBooking.contract_token || selectedBooking.contract_file_url) && (
              <Button key="contract" icon={<QrcodeOutlined />} style={{ color: "#08979c", borderColor: "#08979c" }} onClick={() => { setDetailOpen(false); openContractViewModal(selectedBooking); }}>
                Hợp đồng
              </Button>
            ),
            <Button key="close" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>,
          ].filter(Boolean);
        })()}
        width={800}
        style={{ maxWidth: "95vw" }}
      >
        {selectedBooking && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã đơn">#{selectedBooking._id.slice(-6).toUpperCase()}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              <div>
                <strong>{getBookingCustomerInfo(selectedBooking).full_name}</strong>
                <div style={{ fontSize: 12, color: "#666" }}>{getBookingCustomerInfo(selectedBooking).phone}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{getBookingCustomerInfo(selectedBooking).email}</div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Gói chính">
              {selectedBooking.original_service_ids?.length > 0
                ? selectedBooking.original_service_ids.map(s => s?.name).filter(Boolean).join(", ")
                : selectedBooking.service_id?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Gói đi kèm">
              {getBookingAddons(selectedBooking).length > 0
                ? getBookingAddons(selectedBooking).map(service => service?.name || "Gói đi kèm").join(", ")
                : "Không có"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày / buổi chụp">
              {dayjs(selectedBooking.start_time).format("DD/MM/YYYY")}
              {selectedBooking.shooting_session
                ? ` · ${dayjs(selectedBooking.start_time).format("HH:mm")}–${dayjs(selectedBooking.end_time).format("HH:mm")}`
                : " · Studio sẽ liên hệ để chốt buổi/giờ"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm">{selectedBooking.location}</Descriptions.Item>
            {selectedBooking.shooting_type === "OUTDOOR" && (
              <>
                <Descriptions.Item label="Khoảng cách một chiều">
                  {selectedBooking.travel_distance_km != null ? `${selectedBooking.travel_distance_km} km` : "Studio xác nhận"}
                </Descriptions.Item>
                <Descriptions.Item label="Phụ thu di chuyển">
                  {selectedBooking.travel_surcharge_status === "QUOTE_REQUIRED"
                    ? "Studio xác nhận riêng (chưa gồm trong tổng)"
                    : `${(selectedBooking.travel_surcharge_amount || 0).toLocaleString("vi-VN")}đ`}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Ghi chú">{selectedBooking.note || "Không có"}</Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <strong style={{ fontSize: 15 }}>{selectedBooking.total_amount?.toLocaleString("vi-VN")}đ</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Tiền cọc">
              <strong style={{ fontSize: 15, color: "#BFA16A" }}>
                {(selectedBooking.deposit_amount || 0).toLocaleString("vi-VN")}đ
                <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>({selectedBooking.deposit_percent || 30}%)</span>
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <strong style={{ color: Number(selectedBooking.paid_amount) > 0 ? "#389e0d" : "#000", fontSize: 15 }}>
                {(selectedBooking.paid_amount || 0).toLocaleString("vi-VN")}đ
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <strong style={{ color: Number(selectedBooking.remaining_amount) > 0 ? "#cf1322" : "#000", fontSize: 15 }}>
                {(selectedBooking.remaining_amount || 0).toLocaleString("vi-VN")}đ
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{renderStatus(selectedBooking.status)}</Descriptions.Item>
            {selectedBooking.contract_sent_at && (
              <Descriptions.Item label="Gửi HĐ lúc">
                {dayjs(selectedBooking.contract_sent_at).format("HH:mm DD/MM/YYYY")}
              </Descriptions.Item>
            )}
            {selectedBooking.deposit_bill_url && (
              <Descriptions.Item label="Ảnh bill cọc">
                <a href={selectedBooking.deposit_bill_url} target="_blank" rel="noreferrer">
                  <img
                    src={selectedBooking.deposit_bill_url}
                    alt="Bill thanh toán"
                    style={{ maxHeight: 120, borderRadius: 6, border: "1px solid #eee" }}
                  />
                </a>
              </Descriptions.Item>
            )}
            {selectedBooking.contract_note && (
              <Descriptions.Item label="Điều khoản HĐ">
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{selectedBooking.contract_note}</div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* ===== MODAL HỦY ĐƠN ===== */}
      <Modal open={cancelModalOpen} onCancel={() => { if (!updatingId) { setCancelModalOpen(false); setCancelTarget(null); } }}
        footer={null} centered width={440} closable={!updatingId} maskClosable={!updatingId}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <ExclamationCircleFilled style={{ fontSize: 56, color: "#ff4d4f", marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>Xác nhận hủy đơn?</div>
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{getBookingCustomerInfo(cancelTarget).full_name}</Text></div>
            <div style={{ marginBottom: 4 }}><Text type="secondary">Dịch vụ: </Text><Text strong>{cancelTarget?.service_id?.name}</Text></div>
            <div><Text type="secondary">Mã đơn: </Text><Text code>#{cancelTarget?._id?.slice(-8).toUpperCase()}</Text></div>
          </div>
          <Alert type="warning" showIcon message="Hành động này không thể hoàn tác." style={{ marginBottom: 20, textAlign: "left" }} />
          <Space>
            <Button size="large" onClick={() => { setCancelModalOpen(false); setCancelTarget(null); }} disabled={!!updatingId} style={{ minWidth: 130 }}>Không, giữ đơn</Button>
            <Button danger type="primary" size="large" icon={<CloseCircleOutlined />} loading={!!updatingId} onClick={handleConfirmCancel} style={{ minWidth: 140 }}>Xác nhận hủy</Button>
          </Space>
        </div>
      </Modal>

      {/* ===== MODAL BẮT ĐẦU CHỤP ===== */}
      <Modal open={progressModalOpen} style={{ maxWidth: "95vw" }} onCancel={() => { if (!updatingId) { setProgressModalOpen(false); setProgressTarget(null); } }}
        footer={null} centered width={440} closable={!updatingId} maskClosable={!updatingId}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Bắt đầu buổi chụp?</div>
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{getBookingCustomerInfo(progressTarget).full_name}</Text></div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">Lịch chụp: </Text>
              <Text strong style={{ color: "#BFA16A" }}>
                {progressTarget?.start_time
                  ? `${dayjs(progressTarget.start_time).format("DD/MM/YYYY")}${progressTarget.shooting_session ? ` (${dayjs(progressTarget.start_time).format("HH:mm")} - ${dayjs(progressTarget.end_time).format("HH:mm")})` : " (Chưa chốt buổi/giờ)"}`
                  : "Chưa chọn lịch"}
              </Text>
            </div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">Địa điểm: </Text>
              <Text strong>{progressTarget?.location || (progressTarget?.shooting_type === "STUDIO" ? "Cao Hiển Studio" : "Ngoại cảnh")}</Text>
            </div>
            <div><Text type="secondary">Mã đơn: </Text><Text code>#{progressTarget?._id?.slice(-8).toUpperCase()}</Text></div>
          </div>
          <Space>
            <Button size="large" onClick={() => { setProgressModalOpen(false); setProgressTarget(null); }} disabled={!!updatingId} style={{ minWidth: 120 }}>Hủy</Button>
            <Button type="primary" size="large" loading={!!updatingId} onClick={handleStartProgress} style={{ minWidth: 160, background: "#BFA16A", borderColor: "#BFA16A" }}>
              Bắt đầu
            </Button>
          </Space>
        </div>
      </Modal>

      {/* ===== MODAL HOÀN THÀNH ===== */}
      <Modal open={completeModalOpen} style={{ maxWidth: "95vw" }} onCancel={() => { if (!updatingId) { setCompleteModalOpen(false); setCompleteTarget(null); } }}
        footer={null} centered width={440} closable={!updatingId} maskClosable={!updatingId}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Xác nhận hoàn thành?</div>
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{getBookingCustomerInfo(completeTarget).full_name}</Text></div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">Lịch chụp: </Text>
              <Text strong style={{ color: "#BFA16A" }}>
                {completeTarget?.start_time
                  ? `${dayjs(completeTarget.start_time).format("DD/MM/YYYY")}${completeTarget.shooting_session ? ` (${dayjs(completeTarget.start_time).format("HH:mm")} - ${dayjs(completeTarget.end_time).format("HH:mm")})` : " (Chưa chốt buổi/giờ)"}`
                  : "Chưa chọn lịch"}
              </Text>
            </div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">Địa điểm: </Text>
              <Text strong>{completeTarget?.location || (completeTarget?.shooting_type === "STUDIO" ? "Cao Hiển Studio" : "Ngoại cảnh")}</Text>
            </div>
            <div><Text type="secondary">Mã đơn: </Text><Text code>#{completeTarget?._id?.slice(-8).toUpperCase()}</Text></div>
          </div>
          <Space>
            <Button size="large" onClick={() => { setCompleteModalOpen(false); setCompleteTarget(null); }} disabled={!!updatingId} style={{ minWidth: 120 }}>Hủy</Button>
            <Button type="primary" size="large" loading={!!updatingId} onClick={handleConfirmComplete} style={{ minWidth: 160, background: "#BFA16A", borderColor: "#BFA16A" }}>
              Hoàn thành
            </Button>
          </Space>
        </div>
      </Modal>

      {/* ===== MODAL DỜI LỊCH (CONFIRMED) ===== */}
      <Modal
        title={
          <span>
            <CalendarOutlined style={{ color: "#d46b08", marginRight: 8 }} />
            Dời lịch đơn{" "}
            {rescheduleTarget && <Text code style={{ fontSize: 13 }}>#{rescheduleTarget._id?.slice(-6).toUpperCase()}</Text>}
          </span>
        }
        open={rescheduleModalOpen}
        onCancel={() => { if (!rescheduling) { setRescheduleModalOpen(false); setRescheduleTarget(null); rescheduleForm.resetFields(); } }}
        closable={!rescheduling}
        maskClosable={!rescheduling}
        footer={[
          <Button key="cancel" onClick={() => { setRescheduleModalOpen(false); setRescheduleTarget(null); rescheduleForm.resetFields(); }} disabled={rescheduling}>Hủy</Button>,
          <Button key="save" type="primary" loading={rescheduling} onClick={handleSaveReschedule}
            style={{ background: "#d46b08", borderColor: "#d46b08" }}>Lưu & Tạo lại HĐ</Button>,
        ]}
        width={560}
      >
        <Alert
          type="warning"
          showIcon
          message="Chỉ cập nhật lịch/địa điểm. Dịch vụ, tiền, payment và trạng thái đơn KHÔNG thay đổi. File PDF hợp đồng sẽ được tạo lại."
          style={{ marginBottom: 16 }}
        />

        {rescheduleTarget && (
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
            <div><Text type="secondary">Khách hàng: </Text><Text strong>{getBookingCustomerInfo(rescheduleTarget).full_name}</Text></div>
            <div><Text type="secondary">Dịch vụ: </Text><Text strong>{rescheduleTarget.service_id?.name}</Text></div>
            <div><Text type="secondary">Hình thức: </Text><Text strong>{rescheduleTarget.shooting_type === "STUDIO" ? "Tại Studio" : "Ngoại cảnh"}</Text></div>
            <div><Text type="secondary">Lịch cũ: </Text>
              <Text strong style={{ color: "#cf1322" }}>
                {rescheduleTarget.start_time ? dayjs(rescheduleTarget.start_time).format("DD/MM/YYYY") : "—"}
                {rescheduleTarget.shooting_session === "MORNING" ? " (Sáng)" : rescheduleTarget.shooting_session === "AFTERNOON" ? " (Chiều)" : rescheduleTarget.shooting_session === "FULL_DAY" ? " (Cả ngày)" : " (Chưa chốt buổi/giờ)"}
              </Text>
            </div>
          </div>
        )}

        <Form form={rescheduleForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày chụp mới" name="shoot_date" rules={[{ required: true, message: "Vui lòng chọn ngày chụp" }]}>
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                  onChange={(date) => {
                    rescheduleForm.setFieldValue("shooting_session", undefined);
                    fetchRescheduleBusySlots(date, rescheduleTarget);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Buổi chụp mới" name="shooting_session" rules={[{ required: true, message: "Vui lòng chọn buổi" }]}>
                <Select
                  size="large"
                  loading={rescheduleBusyLoading}
                  options={[
                    { value: "MORNING", label: "Sáng (08:00 - 12:00)", disabled: rescheduleBusySlots.some(b => ["MORNING", "FULL_DAY"].includes(b.shooting_session)) },
                    { value: "AFTERNOON", label: "Chiều (13:00 - 17:00)", disabled: rescheduleBusySlots.some(b => ["AFTERNOON", "FULL_DAY"].includes(b.shooting_session)) },
                    { value: "FULL_DAY", label: "Cả ngày (08:00 - 17:00)", disabled: rescheduleBusySlots.length > 0 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Địa điểm chụp mới" name="location" rules={[{ required: true, message: "Vui lòng nhập địa điểm chụp" }]}>
            <Input placeholder="Nhập địa điểm chụp (Studio hoặc Ngoại cảnh)" size="large" />
          </Form.Item>

          <Form.Item label="Ghi chú / Lý do dời lịch" name="note">
            <Input.TextArea rows={2} placeholder="Ghi lý do dời lịch để khách nắm thông tin" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== MODAL XEM LẠI QR/LINK HĐ ===== */}
      <Modal
        title={
          <span>
            <QrcodeOutlined style={{ color: "#08979c", marginRight: 8 }} />
            Xem hợp đồng{" "}
            {contractViewTarget && <Text code style={{ fontSize: 13 }}>#{contractViewTarget._id?.slice(-6).toUpperCase()}</Text>}
          </span>
        }
        open={contractViewModalOpen}
        onCancel={() => { setContractViewModalOpen(false); setContractViewTarget(null); setContractViewData(null); }}
        footer={[
          <Button key="close" onClick={() => { setContractViewModalOpen(false); setContractViewTarget(null); setContractViewData(null); }}>Đóng</Button>,
        ]}
        centered
        width={520}
      >
        <Spin spinning={loadingContractView}>
          {contractViewData && (
            <div style={{ textAlign: "center" }}>
              {/* Thông tin đơn */}
              <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, textAlign: "left", fontSize: 13 }}>
                <div><Text type="secondary">Khách hàng: </Text><Text strong>{contractViewData.customer_name}</Text></div>
                <div><Text type="secondary">Dịch vụ: </Text><Text strong>{contractViewData.service_name}</Text></div>
                <div><Text type="secondary">Trạng thái: </Text>{renderStatus(contractViewData.status)}</div>
              </div>

              {/* QR Code */}
              {contractViewData.qr_code && (
                <div style={{ margin: "0 auto 16px", display: "inline-block", padding: 12, border: "2px solid #d9f7ff", borderRadius: 12 }}>
                  <img src={contractViewData.qr_code} alt="QR Hợp đồng" style={{ width: 180, height: 180, display: "block" }} />
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 6, textAlign: "center" }}>
                    <QrcodeOutlined style={{ marginRight: 4 }} />Quét QR để xem hợp đồng
                  </div>
                </div>
              )}

              {/* Link hợp đồng */}
              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Link hợp đồng trực tuyến:</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input value={contractViewData.contract_link} readOnly style={{ borderRadius: 6, fontSize: 12 }} />
                  <Tooltip title="Copy link">
                    <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(contractViewData.contract_link); message.success("Đã copy link!"); }} />
                  </Tooltip>
                </div>
              </div>

              {/* Nút Đi đến trang hợp đồng */}
              {(contractViewData.contract_link || contractViewData.pdf_url) && (
                <div style={{ marginBottom: 14 }}>
                  <a href={contractViewData.contract_link || contractViewData.pdf_url} target="_blank" rel="noreferrer">
                    <Button style={{ width: "100%", height: 44, fontWeight: 600, background: "#fff", borderColor: "#BFA16A", color: "#BFA16A" }}>
                      Đi đến trang hợp đồng
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}
          {!loadingContractView && !contractViewData && (
            <div style={{ textAlign: "center", color: "#888", padding: 20 }}>Đang tải...</div>
          )}
        </Spin>
      </Modal>

      {/* ===== MODAL XÁC NHẬN ĐÃ NHẬN CỌC ===== */}
      <Modal
        title={
          <span>
            <BankOutlined style={{ color: "#096dd9", marginRight: 8 }} />
            Xác nhận đã nhận cọc{" "}
            {depositTarget && <Text code style={{ fontSize: 13 }}>#{depositTarget._id?.slice(-6).toUpperCase()}</Text>}
          </span>
        }
        open={depositModalOpen}
        onCancel={() => { if (!confirmingDeposit) { setDepositModalOpen(false); setDepositTarget(null); } }}
        closable={!confirmingDeposit}
        maskClosable={!confirmingDeposit}
        footer={[
          <Button key="cancel" onClick={() => { setDepositModalOpen(false); setDepositTarget(null); }} disabled={confirmingDeposit}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={confirmingDeposit} onClick={handleConfirmDeposit} style={{ background: "#BFA16A", borderColor: "#BFA16A" }}>
            Xác nhận đã nhận tiền
          </Button>,
        ]}
        width={520}
      >
        {depositTarget && (
          <Form form={depositForm} layout="vertical">

            <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{getBookingCustomerInfo(depositTarget).full_name}</Text></div>
              <div style={{ marginBottom: 4 }}><Text type="secondary">SĐT/Email: </Text><Text strong>{getBookingCustomerInfo(depositTarget).phone || getBookingCustomerInfo(depositTarget).email}</Text></div>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary">Tiền cọc quy định ({depositTarget.deposit_percent || 30}%): </Text>
                <Text strong style={{ color: "#BFA16A" }}>{(depositTarget.deposit_amount || 0).toLocaleString("vi-VN")}đ</Text>
              </div>
              <div><Text type="secondary">Tổng hợp đồng: </Text><Text strong>{(depositTarget.total_amount || 0).toLocaleString("vi-VN")}đ</Text></div>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Hình thức thanh toán" name="payment_method" rules={[{ required: true, message: "Chọn hình thức thanh toán" }]}>
                  <Select size="large">
                    <Select.Option value="TRANSFER">Chuyển khoản (QR / STK)</Select.Option>
                    <Select.Option value="CASH">Tiền mặt</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Số tiền đã nhận (VND)" name="amount" rules={[{ required: true, message: "Nhập số tiền đã nhận" }]}>
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(val) => val.replace(/\$\s?|(,*)/g, "")}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Upload Ảnh Bill thanh toán (nếu có)">
              <div style={{ background: "#fafafa", border: "1px dashed #d9d9d9", padding: "12px 14px", borderRadius: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="deposit-bill-file-input"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadDepositBill(e.target.files[0]);
                      }
                    }}
                  />
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingDepositBill}
                    onClick={() => document.getElementById("deposit-bill-file-input")?.click()}
                    style={{ background: "#fff", borderColor: "#d9d9d9", color: "#000" }}
                  >
                    {depositBillUrl ? "Đổi ảnh bill" : "Chọn ảnh bill từ máy"}
                  </Button>
                  {depositBillUrl && (
                    <Button
                      type="text"
                      danger
                      onClick={() => setDepositBillUrl("")}
                    >
                      Xóa ảnh
                    </Button>
                  )}
                </div>
                {depositBillUrl && (
                  <div style={{ marginTop: 10 }}>
                    <a href={depositBillUrl} target="_blank" rel="noreferrer">
                      <img
                        src={depositBillUrl}
                        alt="Bill thanh toán"
                        style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 6, border: "1px solid #d9d9d9" }}
                      />
                    </a>
                  </div>
                )}
              </div>
            </Form.Item>

            <Form.Item label="Ghi chú đối soát" name="payment_note">
              <Input.TextArea rows={2} placeholder="Ví dụ: Khách chuyển tiền cọc qua ứng dụng chuyển khoản lúc 14:30" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* ===== MODAL CÀI ĐẶT QR THANH TOÁN STUDIO MẶC ĐỊNH ===== */}
      <Modal
        title={
          <span>
            <QrcodeOutlined style={{ color: "#BFA16A", marginRight: 8 }} />
            Cài đặt QR Thanh toán Studio Mặc định
          </span>
        }
        open={studioQrModalOpen}
        onCancel={() => setStudioQrModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setStudioQrModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={500}
      >
        <Spin spinning={loadingStudioQr}>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            {studioQrUrl ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Ảnh QR thanh toán hiện tại:</div>
                <div style={{ display: "inline-block", border: "2px solid #BFA16A", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <img
                    src={studioQrUrl}
                    alt="Studio Payment QR"
                    style={{ width: 200, height: 200, display: "block", objectFit: "contain" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      message.error("Lỗi tải ảnh QR. Vui lòng tải lên file mới.");
                    }}
                  />
                </div>
              </div>
            ) : (
              <Alert type="warning" message="Chưa thiết lập ảnh QR thanh toán mặc định" style={{ marginBottom: 20 }} />
            )}

            {/* Upload file từ máy */}
            <div style={{ background: "#fafafa", padding: 14, borderRadius: 8, border: "1px solid #f0f0f0" }}>
              <input
                type="file"
                accept="image/*"
                id="studio-qr-file-input"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadStudioQr(e.target.files[0]);
                  }
                }}
              />
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={savingStudioQr}
                onClick={() => document.getElementById("studio-qr-file-input")?.click()}
                style={{ background: "#BFA16A", borderColor: "#BFA16A" }}
              >
                {studioQrUrl ? "Tải lên file ảnh QR mới" : "Chọn file ảnh QR từ máy"}
              </Button>
            </div>
          </div>
        </Spin>
      </Modal>
    </div>
  );
}

