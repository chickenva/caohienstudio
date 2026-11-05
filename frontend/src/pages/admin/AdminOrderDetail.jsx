/**
 * AdminOrderDetail.jsx
 * Trang hợp nhất Quản lý chi tiết đơn đặt lịch & Biên tập hợp đồng:
 * - Đầu trang: Form chỉnh sửa thông tin đơn (khách hàng, dịch vụ, lịch chụp, địa điểm, tài chính, ghi chú)
 * - Cuối trang: Trình xem trước hợp đồng PDF trực tiếp, cho phép cập nhật tức thì và tạo hợp đồng kèm mã QR.
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  AutoComplete,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Divider,
  Alert,
  Spin,
  message,
  Tooltip,
  Modal,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  FileDoneOutlined,
  CopyOutlined,
  QrcodeOutlined,
  FilePdfOutlined,
  CarOutlined,
  LoadingOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import { getBandForDistance } from "../../utils/shootingLocations";
import "./AdminOrderDetail.css";

const { Title, Text, Paragraph } = Typography;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const getToken = () => localStorage.getItem("token");

const SESSION_LABELS = {
  MORNING: "Buổi sáng (08:00 - 12:00)",
  AFTERNOON: "Buổi chiều (13:00 - 17:00)",
  FULL_DAY: "Cả ngày (08:00 - 17:00)",
};

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

const getServiceId = (service) => String(service?._id || service || "");

const getBookingMainServiceIds = (b) =>
  new Set([
    ...(b?.original_service_ids || []),
    b?.service_id,
  ].map(getServiceId).filter(Boolean));

const getBookingAddons = (b) => {
  const mainIds = getBookingMainServiceIds(b);
  return (b?.extra_service_ids || []).filter((s) => {
    if (mainIds.has(getServiceId(s))) return false;
    if (!s || typeof s !== "object" || (!("allow_addon" in s) && !("category" in s))) return true;
    const name = (s.name || "").toLocaleLowerCase("vi");
    return s.allow_addon === true || s.category === "PRINT" ||
      name.includes("gói lẻ lễ tối") || name.includes("gói thêm flycam");
  });
};

const getAddonServicesForMain = (services, mainServiceIds = []) => {
  const selectedIds = new Set(mainServiceIds.map(String));
  const selectedMains = services.filter((s) => selectedIds.has(String(s._id)));
  const addons = services.filter(
    (s) => !selectedIds.has(String(s._id)) && (s.allow_addon === true || s.category === "PRINT")
  );

  selectedMains.forEach((s) => {
    const mainName = (s.name || "").toLocaleLowerCase("vi");
    if (mainName.includes("chụp truyền thống") || mainName.includes("combo")) {
      const evening = services.find((item) => (item.name || "").toLocaleLowerCase("vi").includes("gói lẻ lễ tối"));
      if (evening && !addons.some((item) => String(item._id) === String(evening._id))) addons.push(evening);
    }
    if (mainName.includes("quay") || mainName.includes("combo")) {
      const flycam = services.find((item) => (item.name || "").toLocaleLowerCase("vi").includes("gói thêm flycam"));
      if (flycam && !addons.some((item) => String(item._id) === String(flycam._id))) addons.push(flycam);
    }
  });

  const uniqueAddons = addons.filter(
    (item, index, all) => all.findIndex((cand) => String(cand._id) === String(item._id)) === index
  );
  uniqueAddons.sort((a, b) => {
    const aSp = ["gói lẻ lễ tối", "gói thêm flycam"].some((n) => (a.name || "").toLocaleLowerCase("vi").includes(n));
    const bSp = ["gói lẻ lễ tối", "gói thêm flycam"].some((n) => (b.name || "").toLocaleLowerCase("vi").includes(n));
    return aSp === bSp ? 0 : aSp ? -1 : 1;
  });
  return uniqueAddons;
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const previewSectionRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servicesList, setServicesList] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Form watchers & state
  const editShootingType = Form.useWatch("shooting_type", form);
  const editDepositPercent = Form.useWatch("deposit_percent", form) || 30;
  const [selectedMainService, setSelectedMainService] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [editTotalAmount, setEditTotalAmount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Địa điểm & cự ly OSRM
  const [editLocationOptions, setEditLocationOptions] = useState([]);
  const [editLocationSearching, setEditLocationSearching] = useState(false);
  const [editLocationCalculating, setEditLocationCalculating] = useState(false);
  const [editTravelDistanceKm, setEditTravelDistanceKm] = useState(null);
  const [editTravelPricingSource, setEditTravelPricingSource] = useState("");
  const editSearchTimeout = useRef(null);

  // PDF Preview & Contract Creation state
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [contractResult, setContractResult] = useState(null);
  const [contractSuccessModalOpen, setContractSuccessModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Cảnh báo người dùng khi đóng tab/reload trình duyệt nếu có thay đổi chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Tải dữ liệu ban đầu (danh mục dịch vụ & thông tin đơn hàng)
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      setLoading(true);
      setServicesLoading(true);
      try {
        const [servicesRes, bookingRes] = await Promise.all([
          axios.get(`${API_URL}/services/admin/all`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          axios.get(`${API_URL}/bookings/admin/${id}/contract-editor`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);

        if (cancelled) return;

        const catalog = Array.isArray(servicesRes.data)
          ? servicesRes.data
          : servicesRes.data?.services || servicesRes.data?.data || [];
        setServicesList(catalog);

        const data = bookingRes.data;
        setBooking(data);

        const total = data.total_amount || 0;
        const depositPct = data.deposit_percent || 30;
        const depositAmt = data.deposit_amount || Math.round((total * depositPct) / 100);

        const mainSvcIds = data.original_service_ids?.length
          ? data.original_service_ids.map(getServiceId).filter(Boolean)
          : data.service_id
          ? [getServiceId(data.service_id)]
          : [];

        const allowedAddonIds = new Set(
          getAddonServicesForMain(catalog, mainSvcIds).map((s) => String(s._id))
        );
        const catalogServiceIds = new Set(catalog.map((s) => String(s._id)));
        const addonIds = getBookingAddons(data)
          .map(getServiceId)
          .filter((svcId) => svcId && (allowedAddonIds.has(svcId) || !catalogServiceIds.has(svcId)));

        setSelectedMainService(mainSvcIds);
        setSelectedAddonIds(addonIds);
        setEditTotalAmount(total);
        setEditTravelDistanceKm(data.travel_distance_km ?? null);
        setEditTravelPricingSource(data.travel_pricing_source || "");

        form.setFieldsValue({
          customer_full_name: data.customer_full_name || data.customer_id?.full_name || "",
          customer_phone: data.customer_phone || data.customer_id?.phone || "",
          customer_email: data.customer_email || data.customer_id?.email || "",
          service_ids: mainSvcIds,
          extra_service_ids: addonIds,
          shoot_date: data.start_time ? dayjs(data.start_time) : null,
          shooting_type: data.shooting_type || "STUDIO",
          shooting_session: data.shooting_session || "MORNING",
          location: data.location || (data.shooting_type === "STUDIO" ? "Cao Hiển Studio" : ""),
          travel_surcharge_amount: data.travel_surcharge_amount || 0,
          deposit_percent: depositPct,
          total_amount: total,
          deposit_amount: depositAmt,
          note: data.note || "",
          contract_note: data.contract_note || "",
        });

        setIsDirty(false);

        if (data.contract_file_url) {
          setPreviewUrl(data.contract_file_url);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Lỗi tải chi tiết đơn:", err);
        message.error(err.response?.data?.message || "Không thể tải dữ liệu đơn đặt lịch.");
        navigate("/admin/orders", { replace: true });
      } finally {
        if (!cancelled) {
          setLoading(false);
          setServicesLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [id, form, navigate]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Helper tính tiền dịch vụ
  const calculateServiceSubtotal = useCallback(
    (mainSvcIds, addonIds) => {
      const mainPrice = servicesList
        .filter((s) => (mainSvcIds || []).map(String).includes(String(s._id)))
        .reduce((sum, s) => sum + Number(s.base_price || 0), 0);
      const addonPrice = servicesList
        .filter((s) => (addonIds || []).map(String).includes(String(s._id)))
        .reduce((sum, s) => sum + Number(s.base_price || 0), 0);
      return mainPrice + addonPrice;
    },
    [servicesList]
  );

  const recalcTotalFromServices = useCallback(
    (mainSvcIds, addonIds) => {
      return (
        calculateServiceSubtotal(mainSvcIds, addonIds) +
        Number(form.getFieldValue("travel_surcharge_amount") || 0)
      );
    },
    [calculateServiceSubtotal, form]
  );

  const handleMainServiceChange = (svcIds) => {
    setIsDirty(true);
    setSelectedMainService(svcIds);
    const allowedAddonIds = new Set(
      getAddonServicesForMain(servicesList, svcIds).map((s) => String(s._id))
    );
    const retainedAddonIds = selectedAddonIds.filter((aid) => allowedAddonIds.has(String(aid)));
    setSelectedAddonIds(retainedAddonIds);
    form.setFieldsValue({ extra_service_ids: retainedAddonIds });

    const total = recalcTotalFromServices(svcIds, retainedAddonIds);
    const pct = form.getFieldValue("deposit_percent") || 30;
    setEditTotalAmount(total);
    form.setFieldsValue({
      total_amount: total,
      deposit_amount: Math.round((total * pct) / 100),
    });
  };

  const handleAddonServicesChange = (ids) => {
    setIsDirty(true);
    setSelectedAddonIds(ids);
    const total = recalcTotalFromServices(selectedMainService, ids);
    const pct = form.getFieldValue("deposit_percent") || 30;
    setEditTotalAmount(total);
    form.setFieldsValue({
      total_amount: total,
      deposit_amount: Math.round((total * pct) / 100),
    });
  };

  const handleTotalAmountChange = (val) => {
    setIsDirty(true);
    setEditTotalAmount(val || 0);
    const pct = form.getFieldValue("deposit_percent") || 30;
    form.setFieldsValue({ deposit_amount: Math.round(((val || 0) * pct) / 100) });
  };

  const handleTravelSurchargeChange = (val) => {
    setIsDirty(true);
    const amount = Math.max(0, Number(val || 0));
    const total = calculateServiceSubtotal(selectedMainService, selectedAddonIds) + amount;
    const pct = form.getFieldValue("deposit_percent") || 30;
    setEditTotalAmount(total);
    form.setFieldsValue({
      travel_surcharge_amount: amount,
      total_amount: total,
      deposit_amount: Math.round((total * pct) / 100),
    });
  };

  const handleShootingTypeChange = (type) => {
    setIsDirty(true);
    if (type === "STUDIO") {
      form.setFieldsValue({
        location: "Cao Hiển Studio",
        travel_surcharge_amount: 0,
      });
      setEditTravelDistanceKm(0);
      setEditTravelPricingSource("NOT_APPLICABLE");
      handleTravelSurchargeChange(0);
    } else {
      if (form.getFieldValue("location") === "Cao Hiển Studio") {
        form.setFieldsValue({ location: "" });
      }
      setEditTravelDistanceKm(null);
      setEditTravelPricingSource("");
    }
  };

  // Tìm địa chỉ qua Photon API
  const handleAdminAddressSearch = (searchText) => {
    if (!searchText || searchText.trim().length < 2) {
      setEditLocationOptions([]);
      return;
    }
    if (editSearchTimeout.current) clearTimeout(editSearchTimeout.current);

    editSearchTimeout.current = setTimeout(async () => {
      setEditLocationSearching(true);
      try {
        const query = encodeURIComponent(searchText.trim());
        const url = `https://photon.komoot.io/api/?q=${query}&limit=15&lang=default&bbox=102.14,8.56,109.46,23.39`;
        const res = await axios.get(url);
        if (res.data?.features) {
          const suggestions = res.data.features
            .filter((f) => f.properties?.countrycode === "VN")
            .map((f, idx) => {
              const p = f.properties;
              const parts = [p.name, p.street, p.district, p.city || p.state, p.country].filter(Boolean);
              const uniqueParts = [];
              parts.forEach((item) => {
                if (!uniqueParts.some((u) => u.toLowerCase().trim() === item.toLowerCase().trim())) {
                  uniqueParts.push(item);
                }
              });
              const label = uniqueParts.join(", ");
              return {
                value: label,
                label: label,
                key: `${label}-${idx}`,
                coordinates: Array.isArray(f.geometry?.coordinates)
                  ? { lon: Number(f.geometry.coordinates[0]), lat: Number(f.geometry.coordinates[1]) }
                  : null,
              };
            })
            .filter((item) => Boolean(item.coordinates));
          setEditLocationOptions(suggestions);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm địa chỉ Photon:", err);
      } finally {
        setEditLocationSearching(false);
      }
    }, 350);
  };

  // Tính cự ly OSRM
  const calculateAdminTravel = async (coords, customText) => {
    const locText = customText || form.getFieldValue("location");
    if (!coords && (!locText || !locText.trim())) {
      message.warning("Vui lòng nhập địa điểm chụp ngoại cảnh trước khi tính.");
      return;
    }

    setEditLocationCalculating(true);
    try {
      let targetCoords = coords;
      if (!targetCoords && locText) {
        const query = encodeURIComponent(locText.trim());
        const url = `https://photon.komoot.io/api/?q=${query}&limit=3&lang=default&bbox=102.14,8.56,109.46,23.39`;
        const photonRes = await axios.get(url);
        const first = photonRes.data?.features?.find((f) => f.geometry?.coordinates);
        if (first) {
          targetCoords = {
            lon: Number(first.geometry.coordinates[0]),
            lat: Number(first.geometry.coordinates[1]),
          };
        }
      }

      if (!targetCoords) {
        message.warning("Không tìm thấy tọa độ đường bộ cho địa điểm này. Bạn có thể tự điền số tiền phụ thu.");
        return;
      }

      const res = await axios.post(`${API_URL}/bookings/travel-estimate`, {
        destination_coordinates: targetCoords,
      });

      const estimate = res.data;
      if (estimate) {
        setEditTravelDistanceKm(estimate.distanceKm);
        setEditTravelPricingSource(estimate.source || "OSRM_ROUTE");

        const newAmount = Number(estimate.surchargeAmount || 0);
        form.setFieldsValue({ travel_surcharge_amount: newAmount });

        const total = calculateServiceSubtotal(selectedMainService, selectedAddonIds) + newAmount;
        const pct = form.getFieldValue("deposit_percent") || 30;
        setEditTotalAmount(total);
        form.setFieldsValue({
          total_amount: total,
          deposit_amount: Math.round((total * pct) / 100),
        });

        setIsDirty(true);
        message.success(`Đã tính cự ly: ${estimate.distanceKm} km · Phụ thu tự động: ${estimate.surchargeText}`);
      }
    } catch (err) {
      console.error("Lỗi tính phụ thu OSRM:", err);
      message.error("Không thể kết nối dịch vụ tính tuyến. Bạn có thể tự điều chỉnh phụ thu thủ công.");
    } finally {
      setEditLocationCalculating(false);
    }
  };

  // 3. Hàm lưu thông tin đơn hàng
  const saveBookingInfo = async (silent = false) => {
    const values = await form.validateFields();
    setSavingInfo(true);
    try {
      const surchargeAmount = Number(values.travel_surcharge_amount || 0);
      const surchargeStatus =
        values.shooting_type === "STUDIO" || surchargeAmount === 0 ? "NOT_APPLICABLE" : "ESTIMATED";

      const payload = {
        ...values,
        customer_full_name: values.customer_full_name?.trim(),
        customer_phone: values.customer_phone?.trim(),
        customer_email: values.customer_email?.trim(),
        travel_surcharge_amount: surchargeAmount,
        travel_surcharge_status: surchargeStatus,
        shoot_date: values.shoot_date ? values.shoot_date.format("YYYY-MM-DD") : undefined,
        travel_distance_km: editTravelDistanceKm,
        travel_pricing_source: editTravelPricingSource,
      };

      const res = await axios.put(`${API_URL}/bookings/${id}/info`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setBooking(res.data?.booking || res.data);
      setIsDirty(false);
      if (!silent) {
        message.success("Cập nhật thông tin thành công!");
      }
      return true;
    } catch (err) {
      if (err?.errorFields) {
        message.error("Vui lòng kiểm tra lại các trường thông tin bắt buộc!");
        return false;
      }
      message.error(err.response?.data?.message || "Không thể cập nhật thông tin đơn hàng.");
      return false;
    } finally {
      setSavingInfo(false);
    }
  };

  // 4. Xem trước hợp đồng PDF trực tiếp
  const handlePreviewPdf = async () => {
    // Lưu thông tin trước để backend có dữ liệu cập nhật
    const saved = await saveBookingInfo(true);
    if (!saved) return;

    setPreviewing(true);
    try {
      const values = form.getFieldsValue();
      const overrides = {
        customer_name: values.customer_full_name?.trim(),
        customer_phone: values.customer_phone?.trim(),
        customer_email: values.customer_email?.trim(),
        shoot_date: values.shoot_date ? values.shoot_date.format("DD/MM/YYYY") : "",
        shooting_session: SESSION_LABELS[values.shooting_session] || values.shooting_session,
        location: values.location?.trim(),
        contract_note: values.contract_note || "",
      };

      const res = await axios.post(`${API_URL}/bookings/${id}/preview-contract-pdf`, overrides, {
        headers: { Authorization: `Bearer ${getToken()}` },
        responseType: "blob",
      });

      const nextUrl = URL.createObjectURL(res.data);
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return nextUrl;
      });

      message.success("Đã cập nhật bản xem trước hợp đồng!");

      // Tự cuộn nhẹ đến khu vực preview nếu người dùng bấm từ trên
      if (previewSectionRef.current) {
        previewSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      console.error("Lỗi xem trước PDF:", err);
      let errMsg = "Không thể tạo bản xem trước hợp đồng.";
      if (err.response?.data instanceof Blob) {
        try {
          const txt = await err.response.data.text();
          const parsed = JSON.parse(txt);
          if (parsed.message) errMsg = parsed.message;
        } catch {
          // fallback
        }
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      message.error(errMsg);
    } finally {
      setPreviewing(false);
    }
  };

  // 5. Tạo hợp đồng chính thức + link/QR
  const handleCreateContract = async () => {
    const saved = await saveBookingInfo(true);
    if (!saved) return;

    setCreatingContract(true);
    try {
      const genRes = await axios.post(
        `${API_URL}/bookings/${id}/generate-contract-pdf`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      const sendRes = await axios.post(
        `${API_URL}/bookings/${id}/send-contract`,
        {
          contract_file_url: genRes.data.pdf_url,
          contract_original_name: genRes.data.contract_original_name,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setContractResult(sendRes.data);
      setBooking((prev) => ({
        ...prev,
        status: "CONTRACT_SENT",
        contract_file_url: sendRes.data.pdf_url,
      }));
      setContractSuccessModalOpen(true);
      message.success("Tạo hợp đồng và mã QR thành công!");
    } catch (err) {
      console.error("Lỗi tạo hợp đồng:", err);
      message.error(err.response?.data?.message || "Không thể tạo hợp đồng.");
    } finally {
      setCreatingContract(false);
    }
  };

  const addonOptions = getAddonServicesForMain(servicesList, selectedMainService || []).map((s) => ({
    value: s._id,
    label: `${s.name}${s.is_active === false ? " (Đã ẩn)" : ""} — ${Number(s.base_price || 0).toLocaleString("vi-VN")}đ`,
  }));

  const orderCode = String(id).slice(-6).toUpperCase();
  const currentStatus = booking?.status || "REQUESTED";

  // Xử lý khi admin bấm nút quay lại hoặc rời trang
  const handleBack = () => {
    if (isDirty) {
      setLeaveModalOpen(true);
    } else {
      navigate("/admin/orders");
    }
  };

  const handleConfirmLeave = () => {
    setIsDirty(false);
    setLeaveModalOpen(false);
    navigate("/admin/orders");
  };

  return (
    <div className="admin-order-detail-page">
      <Spin spinning={loading}>
        {/* Top bar điều hướng */}
        <div className="order-detail-header" style={{ marginBottom: 16 }}>
          <Tooltip title="Quay lại danh sách đơn">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              size="large"
              className="back-btn"
            />
          </Tooltip>
        </div>

        {/* Khối Form thông tin đơn hàng */}
        <Card
          bordered={false}
          className="order-form-card"
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Chi tiết đơn đặt lịch</span>
                <Text code className="order-code-badge">#{orderCode}</Text>
                {booking && (
                  <Tag color={statusConfig[currentStatus]?.color || "default"} style={{ margin: 0, fontWeight: 600 }}>
                    {statusConfig[currentStatus]?.text || currentStatus}
                  </Tag>
                )}
              </div>
            </div>
          }
        >
          <Spin spinning={servicesLoading}>
            <Form form={form} layout="vertical" onValuesChange={() => setIsDirty(true)}>
              {/* THÔNG TIN KHÁCH HÀNG */}
              <Divider orientation="left" className="form-divider">
                1. Thông tin khách hàng
              </Divider>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Họ và tên"
                    name="customer_full_name"
                    rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: "#BFA16A" }} />}
                      placeholder="Nguyễn Văn A"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Số điện thoại"
                    name="customer_phone"
                    rules={[
                      { required: true, message: "Vui lòng nhập số điện thoại" },
                      { pattern: /^[0-9+() -]{8,15}$/, message: "Số điện thoại không hợp lệ" },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined style={{ color: "#BFA16A" }} />}
                      placeholder="0912 345 678"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Email"
                    name="customer_email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email" },
                      { type: "email", message: "Email không đúng định dạng" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: "#BFA16A" }} />}
                      placeholder="khachhang@gmail.com"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* DỊCH VỤ */}
              <Divider orientation="left" className="form-divider">
                2. Dịch vụ & Gói chụp
              </Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Gói chụp chính"
                    name="service_ids"
                    rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 gói chụp chính" }]}
                  >
                    <Select
                      mode="multiple"
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn gói chụp chính..."
                      onChange={handleMainServiceChange}
                      options={servicesList
                        .filter((service) => {
                          const name = (service.name || "").toLocaleLowerCase("vi");
                          const alreadySelected = (selectedMainService || [])
                            .map(String)
                            .includes(String(service._id));
                          const isMainCandidate =
                            service.category !== "PRINT" &&
                            service.allow_addon !== true &&
                            !name.includes("gói lẻ lễ tối") &&
                            !name.includes("gói thêm flycam");
                          return alreadySelected || isMainCandidate;
                        })
                        .map((s) => ({
                          value: s._id,
                          label: `${s.name} — ${Number(s.base_price || 0).toLocaleString("vi-VN")}đ`,
                        }))}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Gói đi kèm (Add-on)" name="extra_service_ids">
                    <Select
                      mode="multiple"
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn các gói đi kèm (tùy chọn)..."
                      onChange={handleAddonServicesChange}
                      options={addonOptions}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* THỜI GIAN & ĐỊA ĐIỂM */}
              <Divider orientation="left" className="form-divider">
                3. Thời gian & Địa điểm chụp
              </Divider>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Ngày chụp"
                    name="shoot_date"
                    rules={[{ required: true, message: "Vui lòng chọn ngày chụp" }]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Hình thức chụp"
                    name="shooting_type"
                    rules={[{ required: true, message: "Chọn hình thức chụp" }]}
                  >
                    <Select
                      size="large"
                      onChange={handleShootingTypeChange}
                      options={[
                        { value: "STUDIO", label: "Tại Studio" },
                        { value: "OUTDOOR", label: "Ngoại cảnh" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Buổi chụp"
                    name="shooting_session"
                    rules={[{ required: true, message: "Chọn buổi chụp" }]}
                  >
                    <Select
                      size="large"
                      options={[
                        { value: "MORNING", label: "Sáng (08:00 - 12:00)" },
                        { value: "AFTERNOON", label: "Chiều (13:00 - 17:00)" },
                        { value: "FULL_DAY", label: "Cả ngày (08:00 - 17:00)" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={
                  <div className="location-label-wrapper">
                    <span>Địa điểm chụp</span>
                    {editShootingType === "OUTDOOR" && (
                      <Button
                        type="link"
                        size="small"
                        icon={<CarOutlined />}
                        loading={editLocationCalculating}
                        onClick={() => calculateAdminTravel(null, form.getFieldValue("location"))}
                        className="calc-travel-btn"
                      >
                        {editLocationCalculating ? "Đang tính..." : "Tính km & phụ thu tự động"}
                      </Button>
                    )}
                  </div>
                }
                name="location"
                rules={[{ required: true, message: "Vui lòng nhập địa điểm chụp" }]}
              >
                {editShootingType === "OUTDOOR" ? (
                  <AutoComplete
                    options={editLocationOptions}
                    onSearch={handleAdminAddressSearch}
                    onSelect={(value, option) => {
                      form.setFieldsValue({ location: value });
                      if (option?.coordinates) {
                        calculateAdminTravel(option.coordinates, value);
                      }
                    }}
                    placeholder="Nhập địa chỉ hoặc chọn từ gợi ý (VD: Bến Ninh Kiều, Cần Thơ)..."
                  >
                    <Input
                      size="large"
                      prefix={<EnvironmentOutlined style={{ color: "#BFA16A" }} />}
                      suffix={editLocationSearching ? <LoadingOutlined style={{ color: "#BFA16A" }} /> : null}
                    />
                  </AutoComplete>
                ) : (
                  <Input
                    disabled
                    placeholder="Cao Hiển Studio"
                    size="large"
                    prefix={<EnvironmentOutlined style={{ color: "#BFA16A" }} />}
                  />
                )}
              </Form.Item>

              {editShootingType === "OUTDOOR" && editTravelDistanceKm !== null && (
                <div className="travel-distance-badge">
                  <span>
                    🚗 Cự ly đường bộ: <strong>{editTravelDistanceKm} km</strong> một chiều (từ Trung tâm TP. Bến Tre)
                  </span>
                  <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>
                    {getBandForDistance(editTravelDistanceKm)?.tierName || "Theo cự ly"}
                  </Tag>
                </div>
              )}

              {/* TÀI CHÍNH */}
              <Divider orientation="left" className="form-divider">
                4. Tài chính & Thanh toán cọc
              </Divider>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={
                      <Space>
                        <span>Phụ thu di chuyển</span>
                        <Tooltip title="Tự động tính theo cự ly bộ hành OSRM. Bạn có thể điều chỉnh lại nếu cần.">
                          <InfoCircleOutlined style={{ color: "#BFA16A", fontSize: 13 }} />
                        </Tooltip>
                      </Space>
                    }
                    name="travel_surcharge_amount"
                    extra={
                      editShootingType === "OUTDOOR" && editTravelDistanceKm !== null ? (
                        <span style={{ fontSize: 11, color: "#888" }}>
                          💡 Đã tính cho {editTravelDistanceKm} km.
                        </span>
                      ) : editShootingType === "STUDIO" ? (
                        <span style={{ fontSize: 11, color: "#888" }}>
                          🏠 Chụp Studio: Miễn phụ thu di chuyển (0đ)
                        </span>
                      ) : null
                    }
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      step={50000}
                      size="large"
                      addonAfter="đ"
                      disabled={editShootingType === "STUDIO"}
                      formatter={(v) => (v != null && v !== "" ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                      parser={(v) => (v ? v.replace(/\D/g, "") : "")}
                      onChange={handleTravelSurchargeChange}
                    />
                  </Form.Item>
                </Col>

                <Form.Item name="deposit_percent" hidden>
                  <InputNumber />
                </Form.Item>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Tổng tiền đơn hàng"
                    name="total_amount"
                    rules={[{ required: true, message: "Vui lòng nhập tổng tiền" }]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      step={100000}
                      size="large"
                      addonAfter="đ"
                      formatter={(v) => (v != null && v !== "" ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                      parser={(v) => (v ? v.replace(/\D/g, "") : "")}
                      onChange={handleTotalAmountChange}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label={`Tiền cọc quy định (${editDepositPercent}%)`} name="deposit_amount">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      step={50000}
                      size="large"
                      addonAfter="đ"
                      formatter={(v) => (v != null && v !== "" ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                      parser={(v) => (v ? v.replace(/\D/g, "") : "")}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* GHI CHÚ */}
              <Divider orientation="left" className="form-divider">
                5. Ghi chú & Điều khoản
              </Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Ghi chú đơn hàng (nội bộ / yêu cầu khách)" name="note">
                    <Input.TextArea rows={3} placeholder="Ghi chú nội bộ, dặn dò thợ chụp..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Ghi chú / Điều khoản bổ sung hiển thị trên Hợp đồng" name="contract_note">
                    <Input.TextArea
                      rows={3}
                      placeholder="Các điều khoản cam kết đặc biệt in vào hợp đồng (nếu có)..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Hàng nút hành động của form */}
              <div className="form-actions-bar">
                <Button
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={() => saveBookingInfo(false)}
                  loading={savingInfo}
                  disabled={!isDirty || savingInfo}
                  className="save-info-btn"
                >
                  Lưu thay đổi
                </Button>
                <Button
                  size="large"
                  type="primary"
                  icon={<FileDoneOutlined />}
                  onClick={handleCreateContract}
                  loading={creatingContract}
                  className="preview-btn"
                >
                  Tạo đơn
                </Button>
              </div>
            </Form>
          </Spin>
        </Card>

        {/* Khối Xem trước hợp đồng PDF bên dưới */}
        <div ref={previewSectionRef} className="preview-container">
          <Card
            bordered={false}
            className="preview-card"
            title={
              <div className="preview-header-bar">
                <div className="preview-header-left">
                  <FilePdfOutlined style={{ color: "#BFA16A", fontSize: 20 }} />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Xem trước Hợp đồng (Live PDF)</span>
                </div>
                <Space wrap>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreviewPdf}
                    loading={previewing}
                    style={{ borderColor: "#BFA16A", color: "#8B7045" }}
                  >
                    Cập nhật xem trước
                  </Button>
                </Space>
              </div>
            }
          >
            <div className="pdf-viewer-frame">
              {previewing ? (
                <div className="pdf-placeholder">
                  <Spin size="large" tip="Đang biên tập và sinh file PDF xem trước..." />
                </div>
              ) : previewUrl ? (
                <iframe
                  title="PDF Preview Hợp đồng"
                  src={previewUrl}
                  className="pdf-iframe"
                />
              ) : (
                <div className="pdf-placeholder">
                  <FileDoneOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
                  <p style={{ fontSize: 15, color: "#595959", fontWeight: 500 }}>
                    Chưa có bản xem trước hợp đồng
                  </p>
                  <p style={{ fontSize: 13, color: "#8c8c8c", maxWidth: 450, margin: "0 auto 16px" }}>
                    Bấm nút <strong>"Cập nhật xem trước"</strong> ở trên để hệ thống tự động điền các thông tin vào template và xuất PDF xem trước trực tiếp tại đây.
                  </p>
                  <Button
                    type="primary"
                    onClick={handlePreviewPdf}
                    style={{ background: "#BFA16A", borderColor: "#BFA16A" }}
                  >
                    Xem trước hợp đồng
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Modal Thông báo Tạo Hợp đồng thành công */}
        <Modal
          open={contractSuccessModalOpen}
          onCancel={() => setContractSuccessModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setContractSuccessModalOpen(false)}>
              Ở lại trang này
            </Button>,
            <Button
              key="back"
              type="primary"
              onClick={() => navigate("/admin/orders")}
              style={{ background: "#BFA16A", borderColor: "#BFA16A" }}
            >
              Về danh sách đơn
            </Button>,
          ]}
          centered
          width={540}
        >
          <div style={{ textAlign: "center", padding: "16px 8px 8px" }}>
            <CheckCircleOutlined style={{ fontSize: 52, color: "#52c41a", marginBottom: 12 }} />
            <Title level={4} style={{ marginBottom: 6 }}>
              Hợp đồng đã được tạo thành công!
            </Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
              Đơn đặt lịch đã chuyển sang trạng thái <strong>Đã gửi hợp đồng (Chờ cọc)</strong>.
            </Text>

            {contractResult?.qr_code && (
              <div className="contract-result-qr-box">
                <img
                  src={contractResult.qr_code}
                  alt="QR Hợp đồng"
                  style={{ width: 180, height: 180, display: "block" }}
                />
                <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 8 }}>
                  Quét QR để xem và tra cứu hợp đồng trực tuyến
                </div>
              </div>
            )}

            <Descriptions bordered column={1} size="small" style={{ textAlign: "left", marginBottom: 16 }}>
              <Descriptions.Item label="Mã đơn">#{orderCode}</Descriptions.Item>
              <Descriptions.Item label="Link hợp đồng">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Input value={contractResult?.contract_link} readOnly size="small" />
                  <Tooltip title="Sao chép link">
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(contractResult?.contract_link || "");
                        message.success("Đã sao chép link hợp đồng!");
                      }}
                    />
                  </Tooltip>
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Space>
              {contractResult?.pdf_url && (
                <a href={contractResult.pdf_url} target="_blank" rel="noreferrer">
                  <Button icon={<FileDoneOutlined />}>Tải / Xem file PDF</Button>
                </a>
              )}
              {contractResult?.contract_link && (
                <a href={contractResult.contract_link} target="_blank" rel="noreferrer">
                  <Button style={{ borderColor: "#BFA16A", color: "#8B7045" }}>
                    Mở trang hợp đồng
                  </Button>
                </a>
              )}
            </Space>
          </div>
        </Modal>

        {/* Modal Xác nhận rời trang khi có thay đổi chưa lưu */}
        <Modal
          open={leaveModalOpen}
          onCancel={() => setLeaveModalOpen(false)}
          title={
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              <ExclamationCircleFilled style={{ color: "#faad14", marginRight: 8, fontSize: 18 }} />
              Có thay đổi chưa được lưu
            </span>
          }
          footer={[
            <Button key="stay" onClick={() => setLeaveModalOpen(false)}>
              Ở lại chỉnh sửa
            </Button>,
            <Button key="leave" danger type="primary" onClick={handleConfirmLeave}>
              Rời khỏi trang
            </Button>,
          ]}
          centered
          width={440}
        >
          <p style={{ margin: "16px 0 8px", color: "#595959", fontSize: 14 }}>
            Bạn vừa chỉnh sửa thông tin đơn hàng nhưng chưa bấm <strong>"Lưu thay đổi"</strong>. Nếu rời khỏi trang bây giờ, mọi thay đổi sẽ bị mất.
          </p>
        </Modal>
      </Spin>
    </div>
  );
}

