import React, { useEffect, useState, useCallback } from "react";
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
  DownloadOutlined,
  QrcodeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text, Paragraph } = Typography;

const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";

const statusOptions = [
  { value: "ALL", label: "Tất cả" },
  { value: "REQUESTED", label: "Đã gửi yêu cầu" },
  { value: "CONTRACT_SENT", label: "Đã gửi hợp đồng" },
  { value: "WAITING_PAYMENT", label: "Chờ thanh toán" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELED", label: "Đã hủy" },
];

const statusConfig = {
  REQUESTED: { color: "orange", text: "Yêu cầu mới" },
  CONTRACT_SENT: { color: "purple", text: "Đã gửi HĐ" },
  WAITING_PAYMENT: { color: "gold", text: "Chờ thanh toán" },
  CONFIRMED: { color: "blue", text: "Đã xác nhận" },
  IN_PROGRESS: { color: "geekblue", text: "Đang chụp" },
  COMPLETED: { color: "green", text: "Hoàn thành" },
  CANCELED: { color: "red", text: "Đã hủy" },
  PENDING: { color: "gold", text: "Chờ TT (cũ)" },
  DEPOSITED: { color: "cyan", text: "Đã cọc (cũ)" },
};

// Trang admin quản lý toàn bộ vòng đời đơn: yêu cầu, hợp đồng, thanh toán và hoàn thành.
export default function AdminOrders() {
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

  // Modal gửi hợp đồng
  const [sendContractModalOpen, setSendContractModalOpen] = useState(false);
  const [sendContractTarget, setSendContractTarget] = useState(null);
  const [sendingContract, setSendingContract] = useState(false);
  const [contractResult, setContractResult] = useState(null); // { contract_link, qr_code, pdf_url }

  // Modal chỉnh thông tin đơn
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm] = Form.useForm();
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTotalAmount, setEditTotalAmount] = useState(0);
  // Giá gói chính và addon đã chọn để auto-tính tổng
  const [selectedMainService, setSelectedMainService] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

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
    if (servicesList.length > 0) return;
    setServicesLoading(true);
    try {
      const res = await axios.get(`${API_URL}/services`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.services || res.data?.data || []);
      setServicesList(list);
    } catch (err) {
      message.error("Không thể tải danh sách dịch vụ");
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

  // Mở modal tạo/gửi hợp đồng cho khách.
  const openSendContractModal = (record) => {
    setSendContractTarget(record);
    setContractResult(null);
    setSendContractModalOpen(true);
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

  // Đổ dữ liệu booking vào form để admin chỉnh trước khi gửi hợp đồng.
  const openEditModal = async (record) => {
    await fetchServices();
    setEditTarget(record);
    const total = record.total_amount || 0;
    const depositAmt = record.deposit_amount || Math.round(total * (record.deposit_percent || 30) / 100);

    const mainSvcIds = record.original_service_ids?.length
      ? record.original_service_ids.map(s => s._id || s)
      : (record.service_id ? [record.service_id._id || record.service_id] : []);
    const addonIds = (record.extra_service_ids || []).map(s => s._id || s);

    setSelectedMainService(mainSvcIds);
    setSelectedAddonIds(addonIds);
    setEditTotalAmount(total);

    editForm.setFieldsValue({
      service_ids: mainSvcIds,
      extra_service_ids: addonIds,
      shoot_date: record.start_time ? dayjs(record.start_time) : null,
      shooting_type: record.shooting_type,
      shooting_session: record.shooting_session,
      location: record.location,
      note: record.note || "",
      contract_note: record.contract_note || "",
      total_amount: total,
      deposit_percent: record.deposit_percent || 30,
      deposit_amount: depositAmt,
    });
    setEditModalOpen(true);
  };

  // Tự tính tổng tiền từ giá dịch vụ đã chọn
  // Tự tính tổng tiền từ gói chính và gói đi kèm đang chọn.
  const recalcTotalFromServices = useCallback((mainSvcIds, addonIds) => {
    const mainPrice = servicesList
      .filter(s => (mainSvcIds || []).map(String).includes(String(s._id)))
      .reduce((sum, s) => sum + Number(s.base_price || 0), 0);
    const addonPrice = servicesList
      .filter(s => (addonIds || []).map(String).includes(String(s._id)))
      .reduce((sum, s) => sum + Number(s.base_price || 0), 0);
    return mainPrice + addonPrice;
  }, [servicesList]);

  // Khi đổi gói chính, cập nhật lại tổng tiền và tiền cọc.
  const handleMainServiceChange = (svcIds) => {
    setSelectedMainService(svcIds);
    const total = recalcTotalFromServices(svcIds, selectedAddonIds);
    const pct = editForm.getFieldValue("deposit_percent") || 30;
    setEditTotalAmount(total);
    editForm.setFieldsValue({
      total_amount: total,
      deposit_amount: Math.round((total * pct) / 100),
    });
  };

  // Khi đổi gói đi kèm, cập nhật lại tổng tiền và tiền cọc.
  const handleAddonServicesChange = (ids) => {
    setSelectedAddonIds(ids);
    const total = recalcTotalFromServices(selectedMainService, ids);
    const pct = editForm.getFieldValue("deposit_percent") || 30;
    setEditTotalAmount(total);
    editForm.setFieldsValue({
      total_amount: total,
      deposit_amount: Math.round((total * pct) / 100),
    });
  };

  // Khi admin sửa tổng tiền thủ công, tự tính lại tiền cọc.
  const handleTotalAmountChange = (val) => {
    setEditTotalAmount(val || 0);
    const pct = editForm.getFieldValue("deposit_percent") || 30;
    editForm.setFieldsValue({ deposit_amount: Math.round(((val || 0) * pct) / 100) });
  };

  // Giữ logic tính cọc theo phần trăm nếu sau này mở chỉnh phần trăm.
  const handleDepositPercentChange = (val) => {
    const total = editTotalAmount || editForm.getFieldValue("total_amount") || 0;
    editForm.setFieldsValue({ deposit_amount: Math.round((total * (val || 0)) / 100) });
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

  // Tạo PDF, QR/link hợp đồng và chuyển đơn sang CONTRACT_SENT.
  /**
   * Hàm Admin gửi hợp đồng cho khách hàng.
   * Xử lý: Kiểm tra tính hợp lệ của đơn, gọi API sinh PDF và QR, sau đó gửi mail.
   */
  const handleSendContract = async () => {
    if (!sendContractTarget) return;
    setSendingContract(true);
    try {
      const res = await axios.post(
        `${API_URL}/bookings/${sendContractTarget._id}/send-contract`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setContractResult({
        contract_link: res.data.contract_link,
        qr_code: res.data.qr_code,
        pdf_url: res.data.pdf_url,
      });
      message.success("Đã tạo hợp đồng thành công!");
      fetchBookings();
      if (selectedBooking?._id === sendContractTarget._id) {
        setSelectedBooking(prev => ({ ...prev, status: "CONTRACT_SENT" }));
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Không thể gửi hợp đồng");
    } finally {
      setSendingContract(false);
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
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setSavingEdit(true);
      // Chuyển dayjs sang định dạng YYYY-MM-DD
      const payload = {
        ...values,
        shoot_date: values.shoot_date ? values.shoot_date.format("YYYY-MM-DD") : undefined,
      };
      await axios.put(
        `${API_URL}/bookings/${editTarget._id}/info`,
        payload,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      message.success("Cập nhật thông tin đơn thành công");
      setEditModalOpen(false); setEditTarget(null);
      fetchBookings();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || "Không thể cập nhật thông tin đơn");
    } finally {
      setSavingEdit(false);
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
      render: (customer) => (
        <div>
          <div style={{ fontWeight: 600 }}>{customer?.full_name || "Khách hàng"}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{customer?.phone || customer?.email}</div>
        </div>
      ),
    },
    {
      title: "DỊCH VỤ",
      key: "services",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.service_id?.name || "Dịch vụ"}</div>
          {record.extra_service_ids?.length > 0 && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              + {record.extra_service_ids.map(s => s.name).join(", ")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "LỊCH CHỤP",
      key: "shoot_time",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dayjs(record.start_time).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {dayjs(record.start_time).format("HH:mm")} - {dayjs(record.end_time).format("HH:mm")}
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
        <Space size={4} wrap>
          {["REQUESTED", "CONTRACT_SENT"].includes(record.status) && (
            <Tooltip title={record.status === "CONTRACT_SENT" ? "Gửi lại hợp đồng" : "Gửi hợp đồng"}>
              <Button
                icon={<SendOutlined />}
                size="small"
                type={record.status === "REQUESTED" ? "primary" : "default"}
                style={record.status === "REQUESTED" ? { background: "#722ed1", borderColor: "#722ed1" } : {}}
                onClick={() => openSendContractModal(record)}
              >
                {record.status === "REQUESTED" ? "Gửi HĐ" : "Gửi lại"}
              </Button>
            </Tooltip>
          )}
          {["REQUESTED", "CONTRACT_SENT"].includes(record.status) && (
            <Tooltip title="Chỉnh toàn bộ thông tin đơn">
              <Button icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>Sửa</Button>
            </Tooltip>
          )}
          {record.status === "CONFIRMED" && (
            <Tooltip title="Dời lịch/địa điểm cho đơn đã xác nhận">
              <Button icon={<CalendarOutlined />} size="small" style={{ color: "#d46b08", borderColor: "#d46b08" }} onClick={() => openRescheduleModal(record)}>Dời lịch</Button>
            </Tooltip>
          )}
          {record.status === "CONFIRMED" && (
            <Tooltip title="Đánh dấu đang chụp">
              <Button icon={<PlayCircleOutlined />} size="small" style={{ color: "#2f54eb", borderColor: "#2f54eb" }} onClick={() => openProgressModal(record)}>Bắt đầu</Button>
            </Tooltip>
          )}
          {record.contract_token && (
            <Tooltip title="Xem lại QR/link hợp đồng">
              <Button icon={<QrcodeOutlined />} size="small" style={{ color: "#08979c", borderColor: "#08979c" }} onClick={() => openContractViewModal(record)}>Xem HĐ</Button>
            </Tooltip>
          )}
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)}>Chi tiết</Button>
        </Space>
      ),
    },
  ];

  // Lọc danh sách đơn theo mã/tên khách/ngày chụp trên giao diện.
  const filteredBookings = bookings.filter((b) => {
    const matchId =
      !searchId ||
      b._id.slice(-6).toUpperCase().includes(searchId.toUpperCase().trim()) ||
      b.customer_id?.full_name?.toLowerCase().includes(searchId.toLowerCase().trim());
    const matchDate =
      !dateRange || !dateRange[0] || !dateRange[1] ||
      (dayjs(b.start_time).isSameOrAfter(dateRange[0].startOf("day")) &&
        dayjs(b.start_time).isSameOrBefore(dateRange[1].endOf("day")));
    return matchId && matchDate;
  });

  // Kiểm tra có filter đang bật để hiển thị số lượng kết quả.
  const hasActiveFilter = searchId || (dateRange && dateRange[0]) || statusFilter !== "ALL";

  // Lọc addon services (loại trừ gói chính đã chọn)
  // Loại gói chính khỏi danh sách addon để tránh chọn trùng.
  const addonOptions = servicesList
    .filter(s => !(selectedMainService || []).map(String).includes(String(s._id)))
    .map(s => ({
      value: s._id,
      label: `${s.name} — ${Number(s.base_price || 0).toLocaleString("vi-VN")}đ`,
    }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>Quản Lý Đơn Đặt Lịch</Title>
          <Text type="secondary">Theo dõi yêu cầu đặt lịch, hợp đồng và thanh toán.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchBookings}>Làm mới</Button>
      </div>

      {/* Filter */}
      <Card bordered={false} style={{ marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 8 }} bodyStyle={{ padding: "16px 24px" }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={10}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>
              <FilterOutlined style={{ marginRight: 6 }} />Tìm theo mã đơn / tên khách
            </span>
            <Input
              placeholder="Nhập mã đơn hoặc tên khách hàng..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              allowClear
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Col>
          <Col xs={24} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Lọc theo ngày chụp</span>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              size="large"
              allowClear
            />
          </Col>
          <Col xs={24} md={7}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "#595959" }}>Lọc theo trạng thái</span>
            <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} style={{ width: "100%" }} size="large" />
          </Col>
        </Row>
        {hasActiveFilter && (
          <div style={{ marginTop: 10, color: "#8c8c8c", fontSize: 13 }}>
            Hiển thị <strong>{filteredBookings.length}</strong> / {bookings.length} đơn
          </div>
        )}
      </Card>

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 8, showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total} đơn` }}
        scroll={{ x: 1100 }}
        bordered
      />

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
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>Đóng</Button>,
          ["REQUESTED", "CONTRACT_SENT"].includes(selectedBooking?.status) && (
            <Button key="send-contract" type="primary" icon={<SendOutlined />}
              onClick={() => { setDetailOpen(false); openSendContractModal(selectedBooking); }}
              style={{ background: "#722ed1", borderColor: "#722ed1" }}>
              {selectedBooking?.status === "CONTRACT_SENT" ? "Gửi lại HĐ" : "Gửi hợp đồng"}
            </Button>
          ),
          ["REQUESTED", "CONTRACT_SENT"].includes(selectedBooking?.status) && (
            <Button key="edit" icon={<EditOutlined />}
              onClick={() => { setDetailOpen(false); openEditModal(selectedBooking); }}>
              Chỉnh đơn
            </Button>
          ),
          selectedBooking?.status === "CONFIRMED" && (
            <Button key="reschedule" icon={<CalendarOutlined />}
              onClick={() => { setDetailOpen(false); openRescheduleModal(selectedBooking); }}
              style={{ color: "#d46b08", borderColor: "#d46b08" }}>
              Dời lịch
            </Button>
          ),
          selectedBooking?.contract_token && (
            <Button key="view-contract" icon={<QrcodeOutlined />}
              onClick={() => { setDetailOpen(false); openContractViewModal(selectedBooking); }}
              style={{ color: "#08979c", borderColor: "#08979c" }}>
              Xem HĐ/QR
            </Button>
          ),
          selectedBooking?.status === "CONFIRMED" && (
            <Button key="progress" type="primary" icon={<PlayCircleOutlined />}
              onClick={() => { setDetailOpen(false); openProgressModal(selectedBooking); }}
              style={{ background: "#2f54eb", borderColor: "#2f54eb" }}>
              Bắt đầu chụp
            </Button>
          ),
          selectedBooking?.status === "IN_PROGRESS" && (
            <Button key="complete" type="primary" icon={<CheckSquareOutlined />}
              onClick={() => { setDetailOpen(false); openCompleteModal(selectedBooking); }}>
              Hoàn thành
            </Button>
          ),
          ["REQUESTED", "CONTRACT_SENT", "WAITING_PAYMENT", "CONFIRMED", "PENDING", "DEPOSITED"].includes(selectedBooking?.status) && (
            <Button key="cancel" danger icon={<CloseCircleOutlined />}
              onClick={() => { setDetailOpen(false); openCancelModal(selectedBooking); }}>
              Hủy đơn
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedBooking && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã đơn">#{selectedBooking._id.slice(-6).toUpperCase()}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              <div>
                <strong>{selectedBooking.customer_id?.full_name}</strong>
                <div style={{ fontSize: 12, color: "#666" }}>{selectedBooking.customer_id?.phone}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{selectedBooking.customer_id?.email}</div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Gói chính">
              {selectedBooking.original_service_ids?.length > 0
                ? selectedBooking.original_service_ids.map(s => s.name).join(", ")
                : selectedBooking.service_id?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Gói đi kèm">
              {selectedBooking.extra_service_ids?.length > 0
                ? selectedBooking.extra_service_ids.map(s => s.name).join(", ")
                : "Không có"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedBooking.start_time).format("HH:mm DD/MM/YYYY")} – {dayjs(selectedBooking.end_time).format("HH:mm DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm">{selectedBooking.location}</Descriptions.Item>
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
            {selectedBooking.contract_note && (
              <Descriptions.Item label="Điều khoản HĐ">
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{selectedBooking.contract_note}</div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* ===== MODAL GỬI HỢP ĐỒNG ===== */}
      <Modal
        open={sendContractModalOpen}
        onCancel={() => { if (!sendingContract) { setSendContractModalOpen(false); setSendContractTarget(null); setContractResult(null); } }}
        footer={null}
        centered
        width={560}
        closable={!sendingContract}
        maskClosable={!sendingContract}
      >
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <FileTextOutlined style={{ fontSize: 52, color: "#722ed1", marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>
            {sendContractTarget?.status === "CONTRACT_SENT" ? "Gửi lại hợp đồng?" : "Tạo & Gửi hợp đồng"}
          </div>

          {!contractResult ? (
            <>
              <Paragraph style={{ color: "#595959", fontSize: 14, marginBottom: 16 }}>
                Hệ thống sẽ tạo <strong>file PDF hợp đồng</strong> và <strong>QR code</strong> liên kết đến trang ký kết trực tuyến.
                Trạng thái đơn sẽ chuyển sang <strong>HĐ Đã Gửi</strong>.
              </Paragraph>
              <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
                <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{sendContractTarget?.customer_id?.full_name}</Text></div>
                <div style={{ marginBottom: 4 }}><Text type="secondary">Dịch vụ: </Text><Text strong>{sendContractTarget?.service_id?.name}</Text></div>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary">Tiền cọc: </Text>
                  <Text strong style={{ color: "#BFA16A" }}>{(sendContractTarget?.deposit_amount || 0).toLocaleString("vi-VN")}đ</Text>
                </div>
                <div><Text type="secondary">Tổng: </Text><Text strong>{(sendContractTarget?.total_amount || 0).toLocaleString("vi-VN")}đ</Text></div>
              </div>
              <Space>
                <Button size="large" onClick={() => { setSendContractModalOpen(false); setSendContractTarget(null); }} disabled={sendingContract}>Hủy</Button>
                <Button type="primary" size="large" icon={sendingContract ? <Spin size="small" /> : <SendOutlined />}
                  loading={sendingContract} onClick={handleSendContract}
                  style={{ background: "#722ed1", borderColor: "#722ed1", minWidth: 180 }}>
                  Tạo PDF & Gửi hợp đồng
                </Button>
              </Space>
            </>
          ) : (
            <>
              {/* QR CODE */}
              {contractResult.qr_code && (
                <div style={{ margin: "0 auto 16px", display: "inline-block", padding: 12, border: "2px solid #f0e6d3", borderRadius: 12 }}>
                  <img src={contractResult.qr_code} alt="QR Hợp đồng" style={{ width: 180, height: 180, display: "block" }} />
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 6, textAlign: "center" }}>
                    <QrcodeOutlined style={{ marginRight: 4 }} />Quét QR để xem hợp đồng
                  </div>
                </div>
              )}

              {/* Trạng thái thành công */}
              <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
                <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                <Text strong style={{ color: "#389e0d" }}>Hợp đồng PDF đã được tạo thành công!</Text>
              </div>

              {/* Link hợp đồng */}
              <div style={{ marginBottom: 16, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Link hợp đồng trực tuyến (gửi cho khách qua Zalo/Email):</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input value={contractResult.contract_link} readOnly style={{ borderRadius: 6, fontSize: 12 }} />
                  <Tooltip title="Copy link">
                    <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(contractResult.contract_link); message.success("Đã copy link!"); }} />
                  </Tooltip>
                </div>
              </div>

              {/* Nút tải PDF */}
              {contractResult.pdf_url && (
                <div style={{ marginBottom: 16 }}>
                  <a href={contractResult.pdf_url} target="_blank" rel="noreferrer">
                    <Button type="default" icon={<DownloadOutlined />} style={{ width: "100%", height: 44, fontWeight: 600 }}>
                      Tải xuống file PDF hợp đồng
                    </Button>
                  </a>
                </div>
              )}

              <Alert
                type="info"
                showIcon
                message="Gửi link hoặc QR code cho khách qua Zalo/Email. Khách xem hợp đồng PDF, xác nhận trực tuyến và thanh toán VNPay."
                style={{ marginBottom: 20, textAlign: "left" }}
              />
              <Button type="primary" onClick={() => { setSendContractModalOpen(false); setSendContractTarget(null); setContractResult(null); }}>
                Đóng
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* ===== MODAL CHỈNH THÔNG TIN ĐƠN ===== */}
      <Modal
        title={
          <span>
            Chỉnh thông tin đơn hàng{" "}
            {editTarget && <Text code style={{ fontSize: 13 }}>#{editTarget._id?.slice(-6).toUpperCase()}</Text>}
          </span>
        }
        open={editModalOpen}
        onCancel={() => { if (!savingEdit) { setEditModalOpen(false); setEditTarget(null); } }}
        closable={!savingEdit}
        maskClosable={!savingEdit}
        footer={[
          <Button key="cancel" onClick={() => { setEditModalOpen(false); setEditTarget(null); }} disabled={savingEdit}>Hủy</Button>,
          <Button key="save" type="primary" loading={savingEdit} onClick={handleSaveEdit}>Lưu thay đổi</Button>,
        ]}
        width={720}
      >
        <Alert
          type="info"
          showIcon
          message="Thay đổi dịch vụ sẽ tự động tính lại tổng tiền và tiền cọc. Bạn vẫn có thể điều chỉnh thủ công sau đó."
          style={{ marginBottom: 20 }}
        />

        <Spin spinning={servicesLoading}>
          <Form form={editForm} layout="vertical">

            {/* DỊCH VỤ */}
            <Divider orientation="left" style={{ fontSize: 13, color: "#BFA16A", borderColor: "#f0e6d3" }}>Dịch vụ</Divider>
            <Form.Item label="Gói chụp chính" name="service_ids" rules={[{ required: true, message: "Vui lòng chọn gói chụp chính" }]}>
              <Select
                mode="multiple"
                showSearch
                optionFilterProp="label"
                placeholder="Chọn gói chụp chính"
                onChange={handleMainServiceChange}
                options={servicesList.map(s => ({
                  value: s._id,
                  label: `${s.name} — ${Number(s.base_price || 0).toLocaleString("vi-VN")}đ`,
                }))}
                size="large"
              />
            </Form.Item>
            <Form.Item label="Gói đi kèm (Addon)" name="extra_service_ids">
              <Select
                mode="multiple"
                showSearch
                optionFilterProp="label"
                placeholder="Chọn các gói đi kèm (không bắt buộc)"
                onChange={handleAddonServicesChange}
                options={addonOptions}
                size="large"
              />
            </Form.Item>

            {/* THỜI GIAN */}
            <Divider orientation="left" style={{ fontSize: 13, color: "#BFA16A", borderColor: "#f0e6d3" }}>Thời gian & Địa điểm</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Ngày chụp" name="shoot_date" rules={[{ required: true, message: "Vui lòng chọn ngày chụp" }]}>
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Hình thức" name="shooting_type" rules={[{ required: true, message: "Vui lòng chọn hình thức" }]}>
                  <Select size="large" options={[
                    { value: "STUDIO", label: "Tại Studio" },
                    { value: "OUTDOOR", label: "Ngoại cảnh" }
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Buổi chụp" name="shooting_session" rules={[{ required: true, message: "Vui lòng chọn buổi chụp" }]}>
                  <Select size="large" options={[
                    { value: "MORNING", label: "Sáng (08:00 - 12:00)" },
                    { value: "AFTERNOON", label: "Chiều (13:00 - 17:00)" },
                    { value: "FULL_DAY", label: "Cả ngày (08:00 - 17:00)" }
                  ]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Địa điểm chụp" name="location" rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}>
              <Input placeholder="Địa điểm buổi chụp" size="large" />
            </Form.Item>

            {/* TÀI CHÍNH */}
            <Divider orientation="left" style={{ fontSize: 13, color: "#BFA16A", borderColor: "#f0e6d3" }}>Tài chính</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Tổng tiền (đ)" name="total_amount" rules={[{ required: true }]}>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    step={100000}
                    size="large"
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(v) => v.replace(/,/g, "")}
                    onChange={handleTotalAmountChange}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Cọc (%)" name="deposit_percent">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0} max={100}
                    size="large"
                    disabled
                    formatter={(v) => `${v}%`}
                    parser={(v) => v.replace("%", "")}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Tiền cọc (đ)" name="deposit_amount">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    step={100000}
                    size="large"
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(v) => v.replace(/,/g, "")}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* GHI CHÚ */}
            <Divider orientation="left" style={{ fontSize: 13, color: "#BFA16A", borderColor: "#f0e6d3" }}>Ghi chú</Divider>
            <Form.Item label="Ghi chú đơn hàng" name="note">
              <Input.TextArea rows={2} placeholder="Ghi chú từ khách hoặc studio" />
            </Form.Item>
            <Form.Item label="Điều khoản / Ghi chú hợp đồng" name="contract_note">
              <Input.TextArea
                rows={4}
                placeholder="Nhập điều khoản riêng cho hợp đồng này (sẽ in trong file PDF và hiển thị trên trang hợp đồng)"
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* ===== MODAL HỦY ĐƠN ===== */}
      <Modal open={cancelModalOpen} onCancel={() => { if (!updatingId) { setCancelModalOpen(false); setCancelTarget(null); } }}
        footer={null} centered width={440} closable={!updatingId} maskClosable={!updatingId}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <ExclamationCircleFilled style={{ fontSize: 56, color: "#ff4d4f", marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>Xác nhận hủy đơn?</div>
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{cancelTarget?.customer_id?.full_name}</Text></div>
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
      <Modal open={progressModalOpen} onCancel={() => { if (!updatingId) { setProgressModalOpen(false); setProgressTarget(null); } }}
        footer={null} centered width={440} closable={!updatingId} maskClosable={!updatingId}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <PlayCircleOutlined style={{ fontSize: 56, color: "#2f54eb", marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Bắt đầu buổi chụp?</div>
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{progressTarget?.customer_id?.full_name}</Text></div>
            <div><Text type="secondary">Mã đơn: </Text><Text code>#{progressTarget?._id?.slice(-8).toUpperCase()}</Text></div>
          </div>
          <Space>
            <Button size="large" onClick={() => { setProgressModalOpen(false); setProgressTarget(null); }} disabled={!!updatingId} style={{ minWidth: 120 }}>Hủy</Button>
            <Button type="primary" size="large" icon={<PlayCircleOutlined />} loading={!!updatingId} onClick={handleStartProgress} style={{ minWidth: 160, background: "#2f54eb", borderColor: "#2f54eb" }}>
              Đang thực hiện
            </Button>
          </Space>
        </div>
      </Modal>

      {/* ===== MODAL HOÀN THÀNH ===== */}
      <Modal open={completeModalOpen} onCancel={() => { if (!updatingId) { setCompleteModalOpen(false); setCompleteTarget(null); } }}
        footer={null} centered width={440} closable={!updatingId} maskClosable={!updatingId}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <CheckCircleOutlined style={{ fontSize: 56, color: "#52c41a", marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Xác nhận hoàn thành?</div>
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ marginBottom: 4 }}><Text type="secondary">Khách hàng: </Text><Text strong>{completeTarget?.customer_id?.full_name}</Text></div>
            <div><Text type="secondary">Mã đơn: </Text><Text code>#{completeTarget?._id?.slice(-8).toUpperCase()}</Text></div>
          </div>
          <Space>
            <Button size="large" onClick={() => { setCompleteModalOpen(false); setCompleteTarget(null); }} disabled={!!updatingId} style={{ minWidth: 120 }}>Hủy</Button>
            <Button type="primary" size="large" icon={<CheckSquareOutlined />} loading={!!updatingId} onClick={handleConfirmComplete} style={{ minWidth: 160, background: "#52c41a", borderColor: "#52c41a" }}>
              Xác nhận hoàn thành
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
            <div><Text type="secondary">Khách hàng: </Text><Text strong>{rescheduleTarget.customer_id?.full_name}</Text></div>
            <div><Text type="secondary">Dịch vụ: </Text><Text strong>{rescheduleTarget.service_id?.name}</Text></div>
            <div><Text type="secondary">Hình thức: </Text><Text strong>{rescheduleTarget.shooting_type === "STUDIO" ? "Tại Studio" : "Ngoại cảnh"}</Text></div>
            <div><Text type="secondary">Lịch cũ: </Text>
              <Text strong style={{ color: "#cf1322" }}>
                {rescheduleTarget.start_time ? dayjs(rescheduleTarget.start_time).format("HH:mm DD/MM/YYYY") : "—"}
                {rescheduleTarget.shooting_session === "MORNING" ? " (Sáng)" : rescheduleTarget.shooting_session === "AFTERNOON" ? " (Chiều)" : " (Cả ngày)"}
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

              {/* Nút tải PDF */}
              {contractViewData.pdf_url && (
                <div style={{ marginBottom: 14 }}>
                  <a href={contractViewData.pdf_url} target="_blank" rel="noreferrer">
                    <Button type="default" icon={<DownloadOutlined />} style={{ width: "100%", height: 44, fontWeight: 600 }}>
                      Tải xuống file PDF hợp đồng
                    </Button>
                  </a>
                </div>
              )}

              <Alert
                type="info"
                showIcon
                message="Gửi link hoặc QR code cho khách qua Zalo/Email để khách xem hợp đồng."
                style={{ textAlign: "left" }}
              />
            </div>
          )}
          {!loadingContractView && !contractViewData && (
            <div style={{ textAlign: "center", color: "#888", padding: 20 }}>Đang tải...</div>
          )}
        </Spin>
      </Modal>
    </div>
  );
}
