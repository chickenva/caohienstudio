import React, { useState, useEffect } from "react";
import {
  Form,
  Row,
  Col,
  Select,
  Input,
  Button,
  message,
  Result,
  AutoComplete,
  Checkbox,
  Card,
  Switch
} from "antd";
import {
  EnvironmentOutlined,
  DashboardOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  CloudOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";

// Màn khách hàng chọn dịch vụ, hình thức chụp, ngày và buổi chụp.
const Booking = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();

  const [mainServices, setMainServices] = useState([]);
  const [addonServices, setAddonServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const appointmentDate = Form.useWatch("appointmentDate", form);
  const serviceId = Form.useWatch("serviceId", form);

  // States cho Lịch thông minh và Thời tiết
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [shootingType, setShootingType] = useState(null); // "STUDIO" | "OUTDOOR"
  const [shootingSession, setShootingSession] = useState(null); // "MORNING" | "AFTERNOON" | "FULL_DAY"
  const [weatherForecast, setWeatherForecast] = useState({});
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [busyBookings, setBusyBookings] = useState([]);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState(null);
  const [rangeEndDate, setRangeEndDate] = useState(null);

  // Reset selected date/session khi user chạm lại hình thức chụp
  /**
   * Hàm xử lý khi người dùng đổi Hình thức chụp (STUDIO / OUTDOOR).
   * Xử lý: Reset khu vực, ngày, buổi chụp đã chọn vì lịch của 2 hình thức là độc lập.
   */
  const handleShootingTypeChange = (type) => {
    setShootingType(type);
    setShootingSession(null);
    setSelectedDate(null);
    form.setFieldsValue({ location: type === "STUDIO" ? "Cao Hiển Studio" : undefined });
    if (type === "STUDIO") {
      const vl = FORECAST_LOCATIONS.find(c => c.name === "Vĩnh Long");
      if (vl) setSelectedWeatherCity(vl);
    }
  };


  // States & logic cho gợi ý tìm kiếm địa chỉ
  const [addressOptions, setAddressOptions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Gợi ý địa chỉ ngoại cảnh bằng Photon API theo tỉnh/thành đang chọn.
  const handleAddressSearch = (searchText) => {
    if (!searchText || searchText.trim().length < 3) {
      setAddressOptions([]);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const cityName = selectedWeatherCity?.name ? selectedWeatherCity.name.replace("TP. ", "") : "";
        const query = encodeURIComponent(`${searchText} ${cityName}`.trim());
        const url = `https://photon.komoot.io/api/?q=${query}&limit=20&lang=default&bbox=102.14,8.56,109.46,23.39`;
        const res = await axios.get(url);
        if (res.data && res.data.features) {
          const suggestions = res.data.features
            .filter((f) => f.properties.countrycode === "VN")
            .map((f, idx) => {
              const props = f.properties;
              const name = props.name || "";
              const street = props.street || "";
              const district = props.district || "";
              const city = props.city || props.state || "";
              const country = props.country || "";

              const parts = [name, street, district, city, country].filter(Boolean);
              const uniqueParts = [];
              parts.forEach(p => {
                if (!uniqueParts.some(up => up.toLowerCase().trim() === p.toLowerCase().trim())) {
                  uniqueParts.push(p);
                }
              });

              const label = uniqueParts.join(", ");
              return {
                value: label,
                label: label,
                key: `${label}-${idx}`,
              };
            })
            .filter(item => {
              if (cityName) {
                return item.label.toLowerCase().includes(cityName.toLowerCase());
              }
              return true;
            });
          setAddressOptions(suggestions);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm địa chỉ:", err);
      }
    }, 400);

    setSearchTimeout(timeout);
  };

  const FORECAST_LOCATIONS = [
    { name: "An Giang", lat: 10.5149, lon: 105.1132 },
    { name: "Bà Rịa - Vũng Tàu", lat: 10.3460, lon: 107.0843 },
    { name: "Bắc Giang", lat: 21.3093, lon: 106.6165 },
    { name: "Bắc Kạn", lat: 22.2572, lon: 105.8589 },
    { name: "Bạc Liêu", lat: 9.3477, lon: 105.5097 },
    { name: "Bắc Ninh", lat: 21.1212, lon: 106.0880 },
    { name: "Bến Tre", lat: 10.1094, lon: 106.5526 },
    { name: "Bình Định", lat: 14.1667, lon: 109.0000 },
    { name: "Bình Dương", lat: 11.1667, lon: 106.6667 },
    { name: "Bình Phước", lat: 11.7500, lon: 106.9167 },
    { name: "Bình Thuận", lat: 10.9333, lon: 108.1000 },
    { name: "Cà Mau", lat: 9.0833, lon: 105.0833 },
    { name: "Cần Thơ", lat: 10.1547, lon: 105.5005 },
    { name: "Cao Bằng", lat: 22.6667, lon: 106.0000 },
    { name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
    { name: "Đắk Lắk", lat: 12.6667, lon: 108.0500 },
    { name: "Đắk Nông", lat: 11.9833, lon: 107.7000 },
    { name: "Điện Biên", lat: 21.3833, lon: 103.0167 },
    { name: "Đồng Nai", lat: 11.1167, lon: 107.1833 },
    { name: "Đồng Tháp", lat: 10.6667, lon: 105.6667 },
    { name: "Gia Lai", lat: 13.7500, lon: 108.2500 },
    { name: "Hà Giang", lat: 22.7500, lon: 105.0000 },
    { name: "Hà Nam", lat: 20.5833, lon: 106.0000 },
    { name: "Hà Nội", lat: 21.0285, lon: 105.8048 },
    { name: "Hà Tĩnh", lat: 18.3333, lon: 105.9000 },
    { name: "Hải Dương", lat: 20.9167, lon: 106.3333 },
    { name: "Hải Phòng", lat: 20.8651, lon: 106.6838 },
    { name: "Hậu Giang", lat: 9.7833, lon: 105.4667 },
    { name: "Hòa Bình", lat: 20.3333, lon: 105.2500 },
    { name: "Hưng Yên", lat: 20.8333, lon: 106.0833 },
    { name: "Khánh Hòa", lat: 12.2388, lon: 109.1967 },
    { name: "Kiên Giang", lat: 10.2191, lon: 103.9610 },
    { name: "Kon Tum", lat: 14.7500, lon: 107.9167 },
    { name: "Lai Châu", lat: 22.0000, lon: 103.0000 },
    { name: "Lâm Đồng", lat: 11.9404, lon: 108.4373 },
    { name: "Lạng Sơn", lat: 21.7500, lon: 106.5000 },
    { name: "Lào Cai", lat: 22.3364, lon: 103.8438 },
    { name: "Long An", lat: 10.9050, lon: 106.6994 },
    { name: "Nam Định", lat: 20.2500, lon: 106.2500 },
    { name: "Nghệ An", lat: 19.3333, lon: 104.8333 },
    { name: "Ninh Bình", lat: 20.2500, lon: 105.8333 },
    { name: "Ninh Thuận", lat: 11.7500, lon: 108.8333 },
    { name: "Phú Thọ", lat: 21.3333, lon: 105.1667 },
    { name: "Phú Yên", lat: 13.1667, lon: 109.1667 },
    { name: "Quảng Bình", lat: 17.5000, lon: 106.3333 },
    { name: "Quảng Nam", lat: 15.5833, lon: 107.9167 },
    { name: "Quảng Ngãi", lat: 15.0000, lon: 108.6667 },
    { name: "Quảng Ninh", lat: 21.2500, lon: 107.3333 },
    { name: "Quảng Trị", lat: 16.7500, lon: 107.0000 },
    { name: "Sóc Trăng", lat: 9.6000, lon: 105.9667 },
    { name: "Sơn La", lat: 21.1667, lon: 104.0000 },
    { name: "Tây Ninh", lat: 11.3333, lon: 106.1667 },
    { name: "TP. Hồ Chí Minh", lat: 10.7626, lon: 106.6602 },
    { name: "Thái Bình", lat: 20.5000, lon: 106.3333 },
    { name: "Thái Nguyên", lat: 21.6667, lon: 105.8333 },
    { name: "Thanh Hóa", lat: 20.0000, lon: 105.5000 },
    { name: "Thừa Thiên - Huế", lat: 16.3333, lon: 107.5833 },
    { name: "Tiền Giang", lat: 10.3500, lon: 106.3500 },
    { name: "Trà Vinh", lat: 9.6667, lon: 106.3333 },
    { name: "Tuyên Quang", lat: 21.6667, lon: 105.8333 },
    { name: "Vĩnh Long", lat: 10.2500, lon: 105.9667 },
    { name: "Vĩnh Phúc", lat: 21.3000, lon: 105.6000 },
    { name: "Yên Bái", lat: 21.5000, lon: 104.6667 }
  ];

  const defaultCity = FORECAST_LOCATIONS.find(c => c.name === "TP. Hồ Chí Minh") || FORECAST_LOCATIONS[0];
  const [selectedWeatherCity, setSelectedWeatherCity] = useState(defaultCity);

  const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const MONTH_NAMES = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const SESSION_OPTIONS = [
    { value: "MORNING", label: "Sáng", time: "08:00 - 12:00" },
    { value: "AFTERNOON", label: "Chiều", time: "13:00 - 17:00" },
    { value: "FULL_DAY", label: "Cả ngày", time: "08:00 - 17:00" },
  ];

  const SESSION_CONFLICTS = {
    MORNING: ["MORNING", "FULL_DAY"],
    AFTERNOON: ["AFTERNOON", "FULL_DAY"],
    FULL_DAY: ["MORNING", "AFTERNOON", "FULL_DAY"],
  };

  // Chuyển mã buổi chụp thành nhãn dễ đọc cho khách hàng.
  const getSessionLabel = (session) => {
    const option = SESSION_OPTIONS.find(item => item.value === session);
    return option ? `${option.label} (${option.time})` : "";
  };

  // Kiểm tra buổi đang chọn có trùng với lịch bận trả về từ backend không.
  const isSessionBusy = (session) => {
    const conflictSessions = SESSION_CONFLICTS[session] || [];
    return busyBookings.some((booking) => conflictSessions.includes(booking.shooting_session));
  };

  // Lấy danh sách buổi bận theo hình thức chụp đã chọn.
  useEffect(() => {
    /**
   * Hàm gọi API lấy danh sách các ngày/buổi đã bị khóa lịch.
   * Xử lý: Dùng để disable các khung giờ không khả dụng trên giao diện.
   */
  const fetchBusySlots = async () => {
      try {
        if (!selectedDate || !shootingType || isRangeMode) {
          setBusyBookings([]);
          return;
        }

        const params = {
          date: selectedDate.format("YYYY-MM-DD"),
          type: shootingType,
        };
        const res = await axios.get(`${API_URL}/bookings/studio-busy-slots`, { params });
        setBusyBookings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Lỗi lấy lịch bận:", err);
        setBusyBookings([]);
      }
    };

    fetchBusySlots();
  }, [selectedDate, shootingType, isRangeMode]);
  // Helper dịch mã thời tiết WMO
  // Dịch mã thời tiết WMO thành nội dung tư vấn dễ hiểu.
  const getWeatherDetails = (code) => {
    switch (code) {
      case 0:
        return { label: "Trời quang", icon: "☀️", color: "#fa8c16", advice: "Nắng rực rỡ! Hoàn hảo cho các buổi chụp ngoại cảnh, bình minh hoặc hoàng hôn. Nên đem theo kem chống nắng, ô che nắng và kính mát." };
      case 1:
      case 2:
        return { label: "Ít mây / Nắng nhẹ", icon: "🌤️", color: "#faad14", advice: "Nắng nhẹ xen kẽ mây. Ánh sáng tự nhiên cực đẹp, bóng đổ nhẹ không quá gắt, rất thích hợp chụp chân dung ngoài trời." };
      case 3:
        return { label: "Nhiều mây / Âm u", icon: "☁️", color: "#8c8c8c", advice: "Mây che phủ. Ánh sáng tản đều hoàn hảo cho chụp chân dung ngoại cảnh vì không sợ cháy sáng hay bóng đổ sâu trên khuôn mặt." };
      case 45:
      case 48:
        return { label: "Sương mù", icon: "🌫️", color: "#bfbfbf", advice: "Có sương mù. Thích hợp chụp các concept thơ mộng, ma mị tại Đà Lạt/Sa Pa. Cần mang thiết bị chống ẩm ẩm cho ống kính." };
      case 51:
      case 53:
      case 55:
        return { label: "Mưa phùn nhẹ", icon: "🌧️", color: "#1890ff", advice: "Mưa phùn. Có thể dùng ô trong suốt làm đạo cụ chụp ảnh mưa lãng mạn, hoặc chuyển hướng chụp trong Studio để giữ an toàn." };
      case 61:
      case 63:
      case 65:
        return { label: "Mưa vừa / Mưa to", icon: "🌧️", color: "#096dd9", advice: "Mưa to! Khuyến nghị đặt lịch chụp hoàn toàn trong Studio Cao Hiển để bảo vệ sức khỏe và máy ảnh, hoặc dời lịch chụp ngoại cảnh." };
      case 80:
      case 81:
      case 82:
        return { label: "Mưa rào nhẹ", icon: "🌦️", color: "#36cfc9", advice: "Mưa rào ngắn. Có thể chụp khoảnh khắc sau mưa với mặt đường ướt phản chiếu cực nghệ thuật, chuẩn bị sẵn khăn lau nước." };
      case 95:
      case 96:
      case 99:
        return { label: "Dông sét mạnh", icon: "⛈️", color: "#ff4d4f", advice: "CẢNH BÁO: Dông sét nguy hiểm! Tuyệt đối không đứng ngoài trời. Hãy liên hệ Studio đổi ngày hoặc chọn chụp trong nhà." };
      default:
        return { label: "Thời tiết ổn định", icon: "📅", color: "#d9d9d9", advice: "Không có cảnh báo thời tiết đặc biệt. Chúc bạn có buổi chụp ảnh vui vẻ!" };
    }
  };

  // Fetch dữ liệu thời tiết (song song thực tế 14 ngày & lưu trữ cùng kỳ năm ngoái)
  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const lat = selectedWeatherCity.lat;
        const lon = selectedWeatherCity.lon;

        // 1. Lấy dự báo thời tiết thực tế 14 ngày tới
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&forecast_days=14`;

        // 2. Lấy dữ liệu lưu trữ lịch sử cho cả tháng hiển thị của năm trước
        const lastYearMonth = currentCalendarMonth.subtract(1, "year");
        const startDate = lastYearMonth.startOf("month").format("YYYY-MM-DD");
        const endDate = lastYearMonth.endOf("month").format("YYYY-MM-DD");
        const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto`;

        const [forecastRes, archiveRes] = await Promise.all([
          axios.get(forecastUrl).catch((err) => {
            console.error("Lỗi lấy dự báo thực tế:", err);
            return null;
          }),
          axios.get(archiveUrl).catch((err) => {
            console.error("Lỗi lấy dữ liệu lịch sử:", err);
            return null;
          }),
        ]);

        if (active) {
          const combinedData = {};

          // Phân tích dữ liệu lịch sử trước
          if (archiveRes && archiveRes.data && archiveRes.data.daily) {
            const daily = archiveRes.data.daily;
            daily.time.forEach((dateStr, idx) => {
              const parsedDate = dayjs(dateStr);
              const targetYear = currentCalendarMonth.year();
              const targetDate = parsedDate.year(targetYear).format("YYYY-MM-DD");

              combinedData[targetDate] = {
                code: daily.weather_code[idx],
                tempMax: Math.round(daily.temperature_2m_max[idx] || 0),
                tempMin: Math.round(daily.temperature_2m_min[idx] || 0),
                rainProb: (daily.precipitation_sum[idx] || 0) > 0.5 ? 70 : 10,
                precipitationSum: daily.precipitation_sum[idx] || 0,
                windMax: Math.round(daily.wind_speed_10m_max[idx] || 0),
                humidityMax: daily.relative_humidity_2m_max ? Math.round(daily.relative_humidity_2m_max[idx]) : null,
                isHistorical: true,
                historicalYear: parsedDate.year(),
              };
            });
          }

          // Phân tích dự báo thực tế và ghi đè những ngày bị trùng
          if (forecastRes && forecastRes.data && forecastRes.data.daily) {
            const daily = forecastRes.data.daily;
            daily.time.forEach((dateStr, idx) => {
              combinedData[dateStr] = {
                code: daily.weather_code[idx],
                tempMax: Math.round(daily.temperature_2m_max[idx]),
                tempMin: Math.round(daily.temperature_2m_min[idx]),
                rainProb: daily.precipitation_probability_max[idx],
                windMax: Math.round(daily.wind_speed_10m_max[idx]),
                humidityMax: daily.relative_humidity_2m_max ? Math.round(daily.relative_humidity_2m_max[idx]) : null,
                isHistorical: false,
              };
            });
          }

          setWeatherForecast(combinedData);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu thời tiết:", err);
        message.warning("Không thể tải thông tin thời tiết");
      } finally {
        if (active) setWeatherLoading(false);
      }
    };
    fetchWeather();
    return () => {
      active = false;
    };
  }, [selectedWeatherCity, currentCalendarMonth]);

  // Tạo lưới ngày trong tháng
  // Tạo các ô lịch của tháng hiện tại, gồm cả ngày đệm đầu/cuối tháng.
  const getCalendarCells = () => {
    const startWeekday = currentCalendarMonth.startOf("month").day();
    const totalDays = currentCalendarMonth.daysInMonth();
    const prevMonthDays = currentCalendarMonth.subtract(1, "month").daysInMonth();

    const cells = [];
    // Previous month filler days
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({
        date: currentCalendarMonth.subtract(1, "month").date(prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: currentCalendarMonth.date(i),
        isCurrentMonth: true,
      });
    }
    // Next month filler days to complete rows
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const nextMonthDaysToAdd = totalCells - cells.length;
    for (let i = 1; i <= nextMonthDaysToAdd; i++) {
      cells.push({
        date: currentCalendarMonth.add(1, "month").date(i),
        isCurrentMonth: false,
      });
    }
    return cells;
  };

  const activeDate = isRangeMode ? rangeStartDate : selectedDate;
  const selectedDateStr = activeDate ? activeDate.format("YYYY-MM-DD") : null;
  const selectedWeather = selectedDateStr ? weatherForecast[selectedDateStr] : null;
  const selectedWeatherDetails = selectedWeather ? getWeatherDetails(selectedWeather.code) : null;

  // Guard: kiểm tra role trước (không early return ở đây vì vi phạm rules of hooks)
  // Xác định tài khoản admin để chặn admin dùng form đặt lịch khách hàng.
  const isAdmin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?.role === "ADMIN";
    } catch {
      return false;
    }
  })();


  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API_URL}/services`);
        const allServices = Array.isArray(res.data) ? res.data : res.data.services || [];
        setMainServices(allServices);
        setAddonServices(allServices);
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      }
    };

    fetchServices();

    // Map các giá trị không phụ thuộc vào danh sách dịch vụ (địa điểm, weather city)
    if (location.state) {
      if (location.state.location) {
        form.setFieldsValue({ location: location.state.location });
      }
      if (location.state.weatherCity) {
        const city = FORECAST_LOCATIONS.find(c => c.name === location.state.weatherCity);
        if (city) setSelectedWeatherCity(city);
      }
    }

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [location, form]);

  // Khi danh sách dịch vụ đã load xong → apply serviceIds & addonIds từ location.state
  useEffect(() => {
    if (!location.state || mainServices.length === 0) return;

    const initialValues = {};

    if (location.state.serviceIds && location.state.serviceIds.length > 0) {
      initialValues.serviceId = location.state.serviceIds;
    } else if (location.state.service_id) {
      initialValues.serviceId = Array.isArray(location.state.service_id)
        ? location.state.service_id
        : [location.state.service_id];
    }

    if (location.state.addonIds && location.state.addonIds.length > 0) {
      initialValues.extra_service_ids = location.state.addonIds;
    }

    if (Object.keys(initialValues).length > 0) {
      form.setFieldsValue(initialValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainServices]);

  // Trả thông tin tiền cọc hiển thị ở bước xem lại chi phí.
  const getDepositInfo = () => {
    return {
      percent: "30%",
      label: "Cọc mặc định",
      color: "#BFA16A", // Thay vì xanh lá/đỏ, dùng màu Gold của studio
      value: 30,
    };
  };

  const depositInfo = getDepositInfo();

  // Navigation to confirm page instead of creating VNPAY
  // Đẩy dữ liệu sang trang xác nhận, chưa tạo đơn ở bước này.
  /**
   * Hàm gửi form Đặt lịch.
   * Xử lý: Validate dữ liệu, ghép thông tin thành payload và gọi API tạo booking mới.
   */
  const onFinish = async (values) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.warning("Vui lòng đăng nhập để đặt lịch");
        navigate("/login");
        return;
      }

      if (!shootingType) {
        message.warning("Vui lòng chọn hình thức chụp (Studio hoặc Ngoại cảnh)");
        return;
      }
      if (!selectedDate) {
        message.warning("Vui lòng chọn ngày chụp trên lịch");
        return;
      }
      if (!shootingSession) {
        message.warning("Vui lòng chọn buổi chụp (Sáng / Chiều / Cả ngày)");
        return;
      }

      const selectedMainIds = Array.isArray(values.serviceId) ? values.serviceId : (values.serviceId ? [values.serviceId] : []);
      if (selectedMainIds.length === 0) {
        message.warning("Vui lòng chọn gói dịch vụ");
        return;
      }

      const submitData = {
        service_id: selectedMainIds[0],
        original_service_ids: selectedMainIds,
        extra_service_ids: [...selectedMainIds.slice(1), ...(Array.isArray(values.extra_service_ids) ? values.extra_service_ids : [])],
        shoot_date: selectedDate.format("YYYY-MM-DD"),
        shooting_type: shootingType,
        shooting_session: shootingSession,
        location: shootingType === "STUDIO" ? "Cao Hiển Studio" : values.location,
        note: values.note,
      };

      navigate("/booking/confirm", { state: { bookingData: submitData } });
    } catch (err) {
      console.error("Booking submission error:", err);
    }
  };

  // Calculate services lists
  const allServices = mainServices; // since we stored all services here

  // Lọc danh sách gói chính, loại các gói in ấn/gói đi kèm.
  const getMainServicesToDisplay = () => {
    return allServices.filter(s => {
      if (s.category === "PRINT") return false;
      const nameLow = (s.name || "").toLowerCase();
      if (nameLow.includes("gói lẻ lễ tối") || nameLow.includes("gói thêm flycam")) return false;
      return true;
    });
  };

  // Lọc gói đi kèm theo gói chính đã chọn để tránh khách chọn sai combo.
  const getAddonServicesToDisplay = () => {
    const addons = [];
    const selectedMainIds = Array.isArray(serviceId) ? serviceId : (serviceId ? [serviceId] : []);
    const selectedMains = allServices.filter(s => selectedMainIds.includes(s._id));
    
    // Always include PRINT category
    addons.push(...allServices.filter(s => s.category === "PRINT"));
    
    selectedMains.forEach(selectedMain => {
      if (selectedMain) {
        const mainName = (selectedMain.name || "").toLowerCase();
        
        // Nếu chọn Chụp truyền thống hoặc combo -> Thêm gói lẻ lễ tối...
        if (mainName.includes("chụp truyền thống") || mainName.includes("combo")) {
          const goiLe = allServices.find(s => (s.name || "").toLowerCase().includes("gói lẻ lễ tối"));
          if (goiLe && !addons.some(a => a._id === goiLe._id)) addons.push(goiLe);
        }
        
        // Nếu chọn Quay hoặc combo -> Thêm Flycam
        if (mainName.includes("quay") || mainName.includes("combo")) {
          const flycam = allServices.find(s => (s.name || "").toLowerCase().includes("gói thêm flycam"));
          if (flycam && !addons.some(a => a._id === flycam._id)) addons.push(flycam);
        }
      }
    });
    
    // Xóa trùng lặp (nếu có) và đẩy ưu tiên (gói lẻ, flycam lên đầu)
    const uniqueAddons = addons.filter((item, index, self) =>
      index === self.findIndex((t) => t._id === item._id)
    );
    
    // Sort: Flycam / Gói lẻ lên đầu, sau đó tới PRINT
    uniqueAddons.sort((a, b) => {
      const aIsSpecial = (a.name || "").toLowerCase().includes("gói lẻ lễ tối") || (a.name || "").toLowerCase().includes("gói thêm flycam");
      const bIsSpecial = (b.name || "").toLowerCase().includes("gói lẻ lễ tối") || (b.name || "").toLowerCase().includes("gói thêm flycam");
      if (aIsSpecial && !bIsSpecial) return -1;
      if (!aIsSpecial && bIsSpecial) return 1;
      return 0;
    });
    
    return uniqueAddons;
  };

  const mainServicesList = getMainServicesToDisplay();
  const addonServicesList = getAddonServicesToDisplay();

  const selectedAddonIds = Form.useWatch("extra_service_ids", form) || [];

  // Handle selectedAddonIds when serviceId changes
  useEffect(() => {
    // If user changes Main Service, we should clear addons that are no longer available
    const availableAddonIds = addonServicesList.map(a => a._id);
    const newSelectedAddons = selectedAddonIds.filter(id => availableAddonIds.includes(id));
    if (newSelectedAddons.length !== selectedAddonIds.length) {
      form.setFieldsValue({ extra_service_ids: newSelectedAddons });
    }
  }, [serviceId, allServices]);

  // Tính tổng tiền
  const selectedMainIds = Array.isArray(serviceId) ? serviceId : (serviceId ? [serviceId] : []);
  const selectedMainServices = allServices.filter(s => selectedMainIds.includes(s._id));
  const mainPrice = selectedMainServices.reduce((sum, s) => sum + Number(s.base_price || 0), 0);
  const addonsPrice = selectedAddonIds.reduce((sum, id) => {
    const addon = allServices.find(s => s._id === id);
    return sum + Number(addon?.base_price || 0);
  }, 0);
  const totalPrice = mainPrice + addonsPrice;

  const finalPrice = Math.max(0, totalPrice);

  return (
    <>
      {isAdmin ? (
        <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
          <Result
            status="403"
            title="Không có quyền truy cập"
            subTitle="Tài khoản quản trị không thể đặt lịch qua luồng khách hàng. Vui lòng dùng chức năng Tạo đơn đặt hộ trong trang quản lý."
            extra={
              <Button
                type="primary"
                icon={<DashboardOutlined />}
                onClick={() => navigate("/admin/orders/create")}
                style={{ background: "#2f2f2f", border: "none" }}
              >
                Đi đến Tạo đơn đặt hộ
              </Button>
            }
          />
        </div>
      ) : (
        <div className="home-page-container" style={{ minHeight: "100vh", padding: "80px 0 60px", position: "relative" }}>
          <div className="glow-spotlight-light" style={{ top: "5%", left: "3%" }}></div>
          <div className="glow-spotlight-light" style={{ bottom: "10%", right: "5%" }}></div>
          <div className="glow-spotlight-light" style={{ top: "40%", right: "15%" }}></div>

          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>

            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 18px", background: "rgba(191, 161, 106, 0.08)", border: "1px solid rgba(191, 161, 106, 0.2)", marginBottom: 20 }}>
                <CalendarOutlined style={{ color: "#BFA16A" }} />
                <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#BFA16A", fontWeight: 600 }}>
                  Đặt Lịch Chụp Ảnh
                </span>
              </div>
              <h1 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 300, lineHeight: 1.2, margin: "0 0 16px 0", letterSpacing: "-0.5px" }}>
                Trải Nghiệm{" "}
                <span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>Đẳng Cấp</span>
              </h1>
              <p style={{ color: "#777", fontSize: 14, lineHeight: 1.8, maxWidth: 560, margin: "0 auto", fontWeight: 300 }}>
                Chọn gói dịch vụ, thêm các gói đi kèm và thời gian phù hợp. Hệ thống dự báo thời tiết thông minh giúp bạn lên kế hoạch hoàn hảo.
              </p>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish} className="booking-form-luxury">

              <div className="glass-panel" style={{ padding: "28px 24px", marginBottom: 28 }}>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Gói dịch vụ chính"
                      name="serviceId"
                      rules={[{ required: true, message: "Vui lòng chọn gói dịch vụ" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        mode="multiple"
                        maxTagCount={1}
                        maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                        optionLabelProp="label"
                        placeholder="Chọn gói dịch vụ..."
                        size="large"
                        popupClassName="booking-select-dropdown"
                      >
                        {mainServicesList.map((service) => (
                          <Select.Option key={service._id} value={service._id} label={service.name}>
                            <Checkbox checked={selectedMainIds.includes(service._id)} style={{ marginRight: 8 }} className="gold-checkbox" />
                            {service.name} — {Number(service.base_price || 0).toLocaleString("vi-VN")}đ
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Gói dịch vụ đi kèm"
                      name="extra_service_ids"
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        mode="multiple"
                        maxTagCount={1}
                        maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                        optionLabelProp="label"
                        placeholder="Chọn các gói đi kèm..."
                        size="large"
                        popupClassName="booking-select-dropdown"
                        disabled={!serviceId || serviceId.length === 0}
                      >
                        {addonServicesList.map((service) => (
                          <Select.Option key={service._id} value={service._id} label={service.name}>
                            <Checkbox checked={selectedAddonIds.includes(service._id)} style={{ marginRight: 8 }} className="gold-checkbox" />
                            {service.name} (+{Number(service.base_price || 0).toLocaleString("vi-VN")}đ)
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Hình thức chụp"
                      required
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder="Chọn hình thức chụp..."
                        size="large"
                        popupClassName="booking-select-dropdown"
                        value={shootingType}
                        onChange={handleShootingTypeChange}
                      >
                        <Select.Option value="STUDIO">Tại studio</Select.Option>
                        <Select.Option value="OUTDOOR">Ngoài trời (Ngoại cảnh)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Khu vực chụp"
                      required
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        value={selectedWeatherCity.name}
                        onChange={(val) => {
                          const city = FORECAST_LOCATIONS.find((c) => c.name === val);
                          if (city) setSelectedWeatherCity(city);
                        }}
                        filterOption={(input, option) =>
                          (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        size="large"
                        popupClassName="booking-select-dropdown"
                        disabled={shootingType === "STUDIO"}
                      >
                        {FORECAST_LOCATIONS.map((city) => (
                          <Select.Option key={city.name} value={city.name}>
                            {city.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {shootingType === "OUTDOOR" && (
                    <Col xs={24} sm={12} lg={6}>
                      <Form.Item
                        label="Địa điểm chi tiết"
                        name="location"
                        rules={[{ required: shootingType === "OUTDOOR", message: "Vui lòng nhập địa điểm" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <AutoComplete
                          options={addressOptions}
                          onSearch={handleAddressSearch}
                          popupClassName="booking-select-dropdown"
                        >
                          <Input
                            size="large"
                            prefix={<EnvironmentOutlined style={{ color: "#BFA16A" }} />}
                            placeholder="Ví dụ: Công viên Hòa Bình..."
                          />
                        </AutoComplete>
                      </Form.Item>
                    </Col>
                  )}
                  {shootingType === "STUDIO" && (
                    <Col xs={24} sm={12} lg={6}>
                      <Form.Item label="Địa điểm" style={{ marginBottom: 0 }}>
                        <Input
                          size="large"
                          value="Cao Hiển Studio"
                          disabled
                          prefix={<EnvironmentOutlined style={{ color: "#BFA16A" }} />}
                        />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              </div>

              {/* ===== CALENDAR + WEATHER + TIME SLOTS ===== */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CloudOutlined style={{ color: "#BFA16A", fontSize: 16 }} />
                    <span style={{ fontWeight: 600, fontSize: 11, color: "#2F2F2F", textTransform: "uppercase", letterSpacing: 2 }}>
                      Chọn ngày & khung giờ chụp — Dự báo thời tiết
                    </span>
                  </div>
                  <Switch
                    checkedChildren="Nhiều ngày"
                    unCheckedChildren="1 ngày"
                    checked={isRangeMode}
                    onChange={(checked) => {
                      setIsRangeMode(checked);
                      setSelectedDate(null);
                      setRangeStartDate(null);
                      setRangeEndDate(null);
                      setShootingSession(null);
                      form.setFieldsValue({ appointmentDate: null });
                    }}
                    style={{ background: isRangeMode ? "#BFA16A" : "#ccc" }}
                  />
                </div>

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={15} style={{ display: "flex", flexDirection: "column" }}>
                    <div className="glass-panel" style={{ padding: 24, flex: 1, borderRadius: 8, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "10px 12px", background: "rgba(191, 161, 106, 0.04)", border: "1px solid #E8DED2" }}>
                        <Button
                          icon={<LeftOutlined />}
                          onClick={() => setCurrentCalendarMonth(currentCalendarMonth.subtract(1, 'month'))}
                          disabled={currentCalendarMonth.isBefore(dayjs(), 'month')}
                          type="text"
                          style={{ color: "#2F2F2F" }}
                        />
                        <span className="font-serif-luxury" style={{ fontSize: 18, color: "#2F2F2F", fontWeight: 500 }}>
                          {MONTH_NAMES[currentCalendarMonth.month()]} {currentCalendarMonth.year()}
                        </span>
                        <Button
                          icon={<RightOutlined />}
                          onClick={() => setCurrentCalendarMonth(currentCalendarMonth.add(1, 'month'))}
                          type="text"
                          style={{ color: "#2F2F2F" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: 600, marginBottom: 10 }}>
                        {WEEKDAYS.map(d => (
                          <div key={d} style={{ color: d === "CN" ? "#cf1322" : "#555", fontSize: 12, paddingBottom: 8, borderBottom: "1px solid #f0ebe3" }}>{d}</div>
                        ))}
                      </div>

                      {weatherLoading ? (
                        <div style={{ height: 380, display: "flex", justifyContent: "center", alignItems: "center", color: "#BFA16A", fontSize: 14 }}>
                          <span className="booking-loading-spinner" style={{ marginRight: 8 }}>⏳</span>
                          Đang tải dữ liệu thời tiết...
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                          {getCalendarCells().map((cell, idx) => {
                            const dateStr = cell.date.format("YYYY-MM-DD");
                            const isPast = cell.date.isBefore(dayjs().startOf('day'));
                            let isSelected = false;
                            let isInRange = false;

                            if (isRangeMode) {
                              const isStart = rangeStartDate && cell.date.isSame(rangeStartDate, 'day');
                              const isEnd = rangeEndDate && cell.date.isSame(rangeEndDate, 'day');
                              isSelected = isStart || isEnd;
                              if (rangeStartDate && rangeEndDate) {
                                isInRange = cell.date.isAfter(rangeStartDate, 'day') && cell.date.isBefore(rangeEndDate, 'day');
                              }
                            } else {
                              isSelected = selectedDate && cell.date.isSame(selectedDate, 'day');
                            }

                            const weather = weatherForecast[dateStr];
                            const details = weather ? getWeatherDetails(weather.code) : null;

                            return (
                              <div
                                key={idx}
                                className={`cal-cell${isPast ? " cal-cell-disabled" : ""}${isSelected ? " cal-cell-active" : ""}${isInRange ? " cal-cell-range" : ""}`}
                                onClick={() => {
                                  if (!isPast) {
                                    if (isRangeMode) {
                                      if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
                                        setRangeStartDate(cell.date);
                                        setRangeEndDate(null);
                                        setShootingSession(null);
                                        form.setFieldsValue({ appointmentDate: null });
                                      } else {
                                        if (cell.date.isBefore(rangeStartDate, 'day')) {
                                          setRangeStartDate(cell.date);
                                          setRangeEndDate(null);
                                          setShootingSession(null);
                                          form.setFieldsValue({ appointmentDate: null });
                                        } else if (cell.date.isSame(rangeStartDate, 'day')) {
                                          setRangeStartDate(null);
                                          setRangeEndDate(null);
                                          setShootingSession(null);
                                          form.setFieldsValue({ appointmentDate: null });
                                        } else {
                                          setRangeEndDate(cell.date);
                                          form.setFieldsValue({ appointmentDate: rangeStartDate });
                                        }
                                      }
                                    } else {
                                      setSelectedDate(cell.date);
                                      setShootingSession(null);
                                      form.setFieldsValue({ appointmentDate: cell.date });
                                    }
                                  }
                                }}
                                style={{ opacity: cell.isCurrentMonth ? 1 : 0.3 }}
                              >
                                <span className="cal-cell-day" style={{ color: isPast ? "#ccc" : (cell.date.day() === 0 ? "#cf1322" : "#2F2F2F") }}>
                                  {cell.date.date()}
                                </span>
                                {weather && details && (
                                  <div className="cal-cell-weather">
                                    <span className="cal-cell-icon" title={details.label}>{details.icon}</span>
                                    <span className="cal-cell-temp">{weather.tempMin}°—{weather.tempMax}°</span>
                                    {weather.rainProb > 50 && (
                                      <span className="cal-cell-rain-dot" title={`Mưa ${weather.rainProb}%`} />
                                    )}
                                  </div>
                                )}
                                {!weather && !isPast && cell.isCurrentMonth && (
                                  <div className="cal-cell-weather">
                                    <span style={{ fontSize: 14, color: "#d9d0c3" }}>📅</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 16, paddingTop: 12, borderTop: "1px solid #f0ebe3", fontSize: 11, color: "#888" }}>
                        <span>☀️ Nắng</span>
                        <span>🌤️ Ít mây</span>
                        <span>☁️ Nhiều mây</span>
                        <span>🌧️ Mưa</span>
                        <span>🌦️ Mưa rào</span>
                        <span>⛈️ Dông sét</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1890ff", display: "inline-block" }}></span>
                          Mưa &gt;50%
                        </span>
                      </div>
                    </div>
                  </Col>

                  <Col xs={24} lg={9} style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
                      {activeDate ? (
                        <>
                          {isRangeMode && !rangeEndDate && (
                            <div style={{ marginBottom: 14, fontSize: 13, color: "#cf1322", fontWeight: "500", textAlign: "center", background: "rgba(207, 19, 34, 0.05)", padding: "10px 12px", border: "1px dashed rgba(207, 19, 34, 0.2)", borderRadius: 6 }}>
                              ⚠️ Vui lòng chọn ngày kết thúc trên lịch
                            </div>
                          )}
                          <div className="glass-panel" style={{ padding: 24, flex: 1, borderRadius: 8 }}>
                            <h4 className="font-serif-luxury" style={{ margin: "0 0 16px 0", fontSize: 17, color: "#2F2F2F", borderBottom: "1px dashed #E8DED2", paddingBottom: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <CloudOutlined style={{ color: "#BFA16A" }} />
                              {isRangeMode ? (
                                <span>
                                  Thời tiết ngày bắt đầu: {rangeStartDate?.format("DD/MM/YYYY")}
                                </span>
                              ) : (
                                <span>
                                  Thời tiết ngày {selectedDate?.format("DD/MM/YYYY")}
                                </span>
                              )}
                              {selectedWeather?.isHistorical && (
                                <span style={{ fontSize: 10, color: "#BFA16A", background: "rgba(191,161,106,0.08)", padding: "2px 8px", borderRadius: 4, marginLeft: "auto", fontWeight: 500, letterSpacing: "0.5px" }}>
                                  Dữ liệu lịch sử {selectedWeather.historicalYear}
                                </span>
                              )}
                            </h4>

                            {selectedWeather && selectedWeatherDetails ? (
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: 14, background: "linear-gradient(135deg, rgba(191,161,106,0.04), rgba(191,161,106,0.08))", border: "1px solid rgba(191,161,106,0.12)" }}>
                                  <span style={{ fontSize: 42 }}>{selectedWeatherDetails.icon}</span>
                                  <div>
                                    <div style={{ fontWeight: "bold", fontSize: 16, color: selectedWeatherDetails.color, marginBottom: 2 }}>
                                      {selectedWeatherDetails.label}
                                      {selectedWeather.isHistorical && " (Xu hướng)"}
                                    </div>
                                    <div style={{ fontSize: 14, color: "#555" }}>
                                      🌡️ {selectedWeather.tempMin}°C – {selectedWeather.tempMax}°C
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, color: "#555", marginBottom: 16 }}>
                                  <div style={{ background: "#fdfbf8", padding: "10px 12px", border: "1px solid #f0ebe3" }}>
                                    💧 {selectedWeather.isHistorical ? "Lượng mưa: " : "Khả năng mưa: "}
                                    <strong>{selectedWeather.isHistorical ? `${selectedWeather.precipitationSum} mm` : `${selectedWeather.rainProb}%`}</strong>
                                  </div>
                                  <div style={{ background: "#fdfbf8", padding: "10px 12px", border: "1px solid #f0ebe3" }}>
                                    💨 Gió: <strong>{selectedWeather.windMax} km/h</strong>
                                  </div>
                                  {selectedWeather.humidityMax && (
                                    <div style={{ gridColumn: "span 2", background: "#fdfbf8", padding: "10px 12px", border: "1px solid #f0ebe3" }}>
                                      💦 Độ ẩm: <strong>{selectedWeather.humidityMax}%</strong>
                                    </div>
                                  )}
                                </div>

                                <div style={{ background: "rgba(191, 161, 106, 0.06)", padding: "14px 16px", borderLeft: "4px solid #BFA16A", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                                  <strong style={{ color: "#BFA16A" }}>💡 Lời khuyên{selectedWeather.isHistorical ? " (dựa trên thời tiết cùng kỳ)" : ""}:</strong><br />
                                  {selectedWeatherDetails.advice}

                                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(191, 161, 106, 0.25)", fontSize: 12, color: "#666" }}>
                                    {selectedWeather.isHistorical ? (
                                      <span>
                                        ⚠️ <strong>Lưu ý:</strong> Dữ liệu trên dùng để tham khảo xu hướng thời tiết. Dự báo thời tiết thực tế cho ngày chụp này sẽ chính thức khả dụng và chính xác nhất từ 14 ngày trước ngày chụp.
                                      </span>
                                    ) : (
                                      <span>
                                        📝 <strong>Lưu ý:</strong> Dự báo thời tiết thực tế có độ chính xác cao nhất trong vòng 3-7 ngày trước ngày chụp.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: 14, background: "rgba(0,0,0,0.02)", border: "1px solid #f0ebe3" }}>
                                  <span style={{ fontSize: 42 }}>📅</span>
                                  <div>
                                    <div style={{ fontWeight: "bold", fontSize: 16, color: "#777" }}>Dự báo chưa khả dụng</div>
                                    <div style={{ fontSize: 13, color: "#888" }}>Chỉ hỗ trợ dự báo trong vòng 14 ngày tới.</div>
                                  </div>
                                </div>
                                <div style={{ background: "rgba(191, 161, 106, 0.06)", padding: "14px 16px", borderLeft: "4px solid #BFA16A", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                                  <strong style={{ color: "#BFA16A" }}>💡 Lời khuyên:</strong><br />
                                  Đây là lịch chụp xa. Bạn nên kiểm tra lại dự báo trước ngày chụp 3 ngày.
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="glass-panel" style={{ padding: 24, borderRadius: 8 }}>
                            <h4 className="font-serif-luxury" style={{ margin: "0 0 14px 0", fontSize: 16, color: "#2F2F2F", display: "flex", alignItems: "center", gap: 8 }}>
                              <CalendarOutlined style={{ color: "#BFA16A" }} />
                              Chọn buổi chụp
                            </h4>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                              {SESSION_OPTIONS.map((option) => {
                                const isSelected = shootingSession === option.value;
                                const isBusy = !isRangeMode && isSessionBusy(option.value);
                                return (
                                  <button
                                    type="button"
                                    key={option.value}
                                    className={`time-slot-btn${isSelected ? " time-slot-active" : ""}${isBusy ? " time-slot-busy" : ""}`}
                                    disabled={isBusy || (!isRangeMode && !selectedDate)}
                                    onClick={() => {
                                      setShootingSession(option.value);
                                      form.setFieldsValue({ appointmentDate: isRangeMode ? rangeStartDate : selectedDate });
                                    }}
                                    style={{ minHeight: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}
                                  >
                                    <span>{option.label}</span>
                                    <small style={{ fontSize: 11, opacity: 0.8 }}>{option.time}</small>
                                    {isBusy && <small style={{ fontSize: 11 }}>Đã bận</small>}
                                  </button>
                                );
                              })}
                            </div>

                            {shootingSession && (
                              <div style={{ marginTop: 14, fontSize: 13, color: "#BFA16A", fontWeight: "bold", textAlign: "center", background: "rgba(191, 161, 106, 0.06)", padding: "10px 12px", border: "1px dashed rgba(191, 161, 106, 0.25)" }}>
                                ✓ Đã chọn: {(isRangeMode ? rangeStartDate : selectedDate)?.format("DD/MM/YYYY")} - {getSessionLabel(shootingSession)}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px 32px", textAlign: "center", borderRadius: 8 }}>
                          <span style={{ fontSize: 52, marginBottom: 16, opacity: 0.5 }}>📅</span>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "#555" }}>Chưa chọn ngày chụp</div>
                          <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260, color: "#888" }}>
                            {isRangeMode
                              ? "Bấm chọn ngày bắt đầu và ngày kết thúc trên lịch để xem dự báo thời tiết và chọn giờ chụp."
                              : "Bấm chọn một ngày trên lịch để xem dự báo thời tiết và chọn khung giờ chụp."}
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>

                <Form.Item
                  name="appointmentDate"
                  rules={[{ required: true, message: "Vui lòng chọn cả ngày và giờ chụp trên lịch" }]}
                  style={{ display: "none" }}
                >
                  <Input type="hidden" />
                </Form.Item>
              </div>

              {/* ===== SUMMARY & SUBMIT ===== */}
              <div style={{ marginTop: 30 }}>
                <Row gutter={[24, 24]}>
                  {/* Cột trái: Tóm tắt chi phí */}
                  <Col xs={24} lg={12} style={{ display: "flex", flexDirection: "column" }}>
                    <div className="glass-panel" style={{ padding: 24, borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                      <div>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 600, color: "#2F2F2F", textTransform: "uppercase" }}>Tóm tắt chi phí</h3>
                        
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ color: "#555", display: "block", marginBottom: 6 }}>Dịch vụ chính:</span>
                          {selectedMainServices.length > 0 ? (
                            selectedMainServices.map(service => (
                              <div key={service._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#777", paddingLeft: 12, marginBottom: 4 }}>
                                <span>- {service.name}</span>
                                <span>{Number(service.base_price || 0).toLocaleString("vi-VN")}đ</span>
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: 13, color: "#999", paddingLeft: 12 }}>Chưa chọn</div>
                          )}
                        </div>

                        {selectedAddonIds.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: "#555", marginBottom: 4 }}>Các gói đi kèm:</div>
                            {selectedAddonIds.map(id => {
                              const addon = allServices.find(s => s._id === id);
                              return addon ? (
                                <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#777", paddingLeft: 12, marginBottom: 4 }}>
                                  <span>- {addon.name}</span>
                                  <span>{Number(addon.base_price).toLocaleString("vi-VN")}đ</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                        
                        <div style={{ height: 1, background: "#E8DED2", margin: "16px 0" }}></div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 16, fontWeight: 600 }}>Tổng cộng:</span>
                          <span style={{ fontSize: 20, fontWeight: 700, color: "#BFA16A" }}>{finalPrice.toLocaleString("vi-VN")}đ</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  
                  {/* Cột phải: Mức thanh toán áp dụng */}
                  <Col xs={24} lg={12} style={{ display: "flex", flexDirection: "column" }}>
                    <div className="glass-panel" style={{ padding: 24, borderRadius: 8, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      {appointmentDate ? (
                        <div
                          style={{
                            margin: 0,
                            padding: "16px",
                            background: "#fdfaf6",
                            border: `1px solid ${depositInfo.color}`,
                            borderRadius: "10px",
                          }}
                        >
                          <p style={{ margin: 0, fontSize: "16px" }}>
                            Mức thanh toán áp dụng:{" "}
                            <strong style={{ color: depositInfo.color }}>
                              {depositInfo.percent}
                            </strong>
                            <span style={{ marginLeft: 8, fontSize: "14px", color: "#666" }}>
                              ({depositInfo.label})
                            </span>
                          </p>
            
                          <p
                            style={{
                              margin: "6px 0 0",
                              fontSize: "12px",
                              color: "#888",
                              fontStyle: "italic",
                              lineHeight: "1.5",
                            }}
                          >
                            * Lưu ý: Đặt cọc 30% tổng giá trị đơn để giữ lịch. Theo chính sách của Studio, tiền cọc sẽ không được hoàn lại nếu bạn chủ động hủy. Nếu cần dời lịch, Studio hỗ trợ bảo lưu cọc trong 6 tháng.
                          </p>

                          <p
                            style={{
                              margin: "6px 0 0",
                              fontSize: "13px",
                              color: "#cf1322",
                            }}
                          >
                            * Sau khi tạo đơn, bạn cần hoàn tất thanh toán trong 15 phút. Quá
                            thời gian này, lịch sẽ tự hết hạn và không còn giữ thợ chụp.
                          </p>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", color: "#888", fontSize: 14, fontStyle: "italic", padding: 16 }}>
                          Vui lòng chọn ngày giờ chụp để xem mức thanh toán áp dụng.
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>



                <div style={{ marginTop: 32 }}>
                  {isRangeMode ? (
                    <button
                      type="button"
                      className="btn-premium-gold"
                      style={{ width: "100%", justifyContent: "center", height: 54, fontSize: 15, letterSpacing: 3, borderRadius: 8 }}
                      onClick={() => {
                        const serviceVal = form.getFieldValue("serviceId");
                        const addonVal = form.getFieldValue("extra_service_ids");
                        const locationVal = form.getFieldValue("location");
                        const mainIds = Array.isArray(serviceVal) ? serviceVal : (serviceVal ? [serviceVal] : []);
                        const addonIds = Array.isArray(addonVal) ? addonVal : [];
                        navigate("/contact", {
                          state: {
                            serviceIds: mainIds,
                            addonIds: addonIds,
                            weatherCity: selectedWeatherCity.name,
                            location: locationVal || "",
                            startDate: rangeStartDate ? rangeStartDate.format("YYYY-MM-DD") : "",
                            startTime: shootingSession || "",
                            endDate: rangeEndDate ? rangeEndDate.format("YYYY-MM-DD") : "",
                            isMultiDay: true,
                          }
                        });
                      }}
                    >
                      📞 LIÊN HỆ TƯ VẤN
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn-premium-gold"
                      style={{ width: "100%", justifyContent: "center", height: 54, fontSize: 15, letterSpacing: 3, borderRadius: 8 }}
                    >
                      TIẾP TỤC ĐỂ XÁC NHẬN
                    </button>
                  )}
                </div>
              </div>
            </Form>
          </div>

          {/* ===== SCOPED STYLES ===== */}
          <style>{`
            /* Note Textarea Stretch */
            .booking-form-luxury .note-form-item {
              height: 100%;
              width: 100% !important;
              display: flex;
              flex-direction: column;
            }
            .booking-form-luxury .note-form-item .ant-form-item-control {
              flex: 1;
              width: 100% !important;
              display: flex;
              flex-direction: column;
            }
            .booking-form-luxury .note-form-item .ant-form-item-control-input {
              flex: 1;
              width: 100% !important;
              display: flex;
              flex-direction: column;
            }
            .booking-form-luxury .note-form-item .ant-form-item-control-input-content {
              flex: 1;
              width: 100% !important;
              display: flex;
              flex-direction: column;
            }
            .booking-form-luxury .note-form-item textarea {
              height: 100% !important;
              width: 100% !important;
              flex: 1;
            }

            /* Form Label Styling */
            .booking-form-luxury .ant-form-item-label > label {
              color: #555 !important;
              font-size: 12px !important;
              letter-spacing: 1px !important;
              text-transform: uppercase !important;
              font-weight: 500 !important;
              font-family: 'Outfit', sans-serif !important;
            }

            /* Select Styling — compatible with Ant Design 5 */
            .booking-form-luxury .ant-select-selector {
              background-color: #FAFAFA !important;
              border: 1px solid #E8DED2 !important;
              border-radius: 8px !important;
              font-family: 'Outfit', sans-serif !important;
              transition: all 0.3s ease !important;
            }
            .booking-form-luxury .ant-select-focused .ant-select-selector,
            .booking-form-luxury .ant-select-selector:hover {
              border-color: #BFA16A !important;
              box-shadow: 0 0 0 2px rgba(191, 161, 106, 0.1) !important;
            }
            .booking-form-luxury .ant-select-selection-placeholder {
              color: #aaa !important;
            }
            /* Force single line (no wrap) for selected items container */
            .booking-form-luxury .ant-select-selection-overflow {
              flex-wrap: nowrap !important;
              overflow: hidden !important;
            }
            .booking-form-luxury .ant-select-selection-item {
              background-color: rgba(191, 161, 106, 0.08) !important;
              border: 1px solid rgba(191, 161, 106, 0.2) !important;
              color: #BFA16A !important;
              border-radius: 6px !important;
              font-weight: 500 !important;
              font-size: 13px !important;
              display: flex !important;
              align-items: center !important;
            }
            .booking-form-luxury .ant-select-selection-item-remove {
              color: #BFA16A !important;
            }
            .booking-form-luxury .ant-select-selection-item-remove:hover {
              color: #a88a53 !important;
            }
            .booking-form-luxury .ant-select-arrow {
              color: #BFA16A !important;
            }

            /* Gold Checkbox Override - Global overrides on this page to completely erase blue */
            .ant-checkbox-inner {
              background-color: transparent !important;
              border-color: #E8DED2 !important;
            }
            .ant-checkbox-wrapper:hover .ant-checkbox-inner,
            .ant-checkbox:hover .ant-checkbox-inner {
              border-color: #BFA16A !important;
            }
            .ant-checkbox-checked .ant-checkbox-inner {
              background-color: transparent !important;
              border-color: #BFA16A !important;
            }
            .ant-checkbox-checked .ant-checkbox-inner::after {
              border-color: #BFA16A !important; /* Gold checkmark tick */
            }
            .ant-checkbox-checked::after {
              border-color: #BFA16A !important; /* Wave animation border */
            }
            .ant-checkbox-input:focus + .ant-checkbox-inner {
              border-color: #BFA16A !important;
              box-shadow: 0 0 0 2px rgba(191, 161, 106, 0.1) !important;
            }

            /* Select Dropdown Popup */
            .booking-select-dropdown {
              border-radius: 8px !important;
              border: 1px solid #E8DED2 !important;
              box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
            }
            .booking-select-dropdown .ant-select-item {
              font-family: 'Outfit', sans-serif !important;
              font-size: 13px !important;
              padding: 10px 16px !important;
            }
            /* Avoid wrapping for items in dropdown list */
            .booking-select-dropdown .ant-select-item-option-content {
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              display: flex !important;
              align-items: center !important;
            }
            .booking-select-dropdown .ant-select-item-option-selected {
              background-color: rgba(191, 161, 106, 0.08) !important;
              color: #BFA16A !important;
              font-weight: 600 !important;
            }
            .booking-select-dropdown .ant-select-item-option-selected.ant-select-item-option-active {
              background-color: rgba(191, 161, 106, 0.12) !important;
            }
            .booking-select-dropdown .ant-select-item-option-active {
              background-color: rgba(191, 161, 106, 0.04) !important;
            }

            .cal-cell-active {
              border-color: #BFA16A !important;
              background: rgba(191, 161, 106, 0.06) !important;
              box-shadow: 0 0 0 2px rgba(191, 161, 106, 0.15) !important;
            }
            .cal-cell-range {
              border-color: #BFA16A !important;
              background: rgba(191, 161, 106, 0.03) !important;
            }
            .cal-cell-disabled {
              opacity: 0.4;
              cursor: not-allowed !important;
              background: #fafafa !important;
            }

            /* Input & TextArea */
            .home-page-container .booking-form-luxury .ant-input,
            .home-page-container .booking-form-luxury .ant-input-affix-wrapper {
              background-color: #FAFAFA !important;
              border: 1px solid #E8DED2 !important;
              color: #2F2F2F !important;
              border-radius: 8px !important;
              font-family: 'Outfit', sans-serif !important;
            }
            .home-page-container .booking-form-luxury .ant-input-affix-wrapper > input.ant-input {
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
            }
            .home-page-container .booking-form-luxury .ant-input:focus,
            .home-page-container .booking-form-luxury .ant-input-affix-wrapper-focused,
            .home-page-container .booking-form-luxury .ant-input:hover,
            .home-page-container .booking-form-luxury .ant-input-affix-wrapper:hover {
              border-color: #BFA16A !important;
              box-shadow: 0 0 0 2px rgba(191, 161, 106, 0.1) !important;
            }

            /* Calendar Cells */
            .cal-cell {
              padding: 8px 4px;
              min-height: 82px;
              border: 1px solid #E8DED2;
              cursor: pointer;
              position: relative;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              background: #fff;
              border-radius: 8px;
            }
            .cal-cell:hover:not(.cal-cell-disabled) {
              border-color: #BFA16A;
              background: rgba(191, 161, 106, 0.04);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(191, 161, 106, 0.08);
            }
            .cal-cell-active {
              border-color: #BFA16A !important;
              background: rgba(191, 161, 106, 0.06) !important;
              box-shadow: 0 0 0 2px rgba(191, 161, 106, 0.15) !important;
            }
            .cal-cell-disabled {
              opacity: 0.4;
              cursor: not-allowed !important;
              background: #fafafa !important;
            }
            .cal-cell-day {
              font-size: 14px;
              font-weight: 500;
            }
            .cal-cell-active .cal-cell-day,
            .cal-cell-today .cal-cell-day {
              font-weight: 700;
            }
            .cal-cell-weather {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: 4px;
              gap: 1px;
            }
            .cal-cell-icon {
              font-size: 18px;
              line-height: 1;
            }
            .cal-cell-temp {
              font-size: 9px;
              color: #777;
              font-weight: 500;
            }
            .cal-cell-rain-dot {
              position: absolute;
              top: 4px;
              right: 4px;
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #1890ff;
              box-shadow: 0 0 4px rgba(24,144,255,0.4);
            }

            /* Time Slot Buttons */
            .time-slot-btn {
              height: 44px;
              font-size: 13px;
              font-weight: 400;
              background: #fff;
              border: 1px solid #E8DED2;
              color: #2F2F2F;
              cursor: pointer;
              font-family: 'Outfit', sans-serif;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              padding: 0 10px;
            }
            .time-slot-btn:hover {
              border-color: #BFA16A;
              color: #BFA16A;
              background: rgba(191, 161, 106, 0.04);
              transform: translateY(-1px);
            }
            .time-slot-active {
              background: #BFA16A !important;
              border-color: #BFA16A !important;
              color: #fff !important;
              font-weight: 600 !important;
              box-shadow: 0 4px 12px rgba(191, 161, 106, 0.2);
            }
            .time-slot-busy {
              background: #f5f5f5 !important;
              border-color: #d9d9d9 !important;
              color: #bfbfbf !important;
              cursor: not-allowed !important;
            }
            .time-slot-busy:hover {
              background: #f5f5f5 !important;
              border-color: #d9d9d9 !important;
              color: #bfbfbf !important;
              transform: none !important;
            }

            /* Loading Spinner */
            .booking-loading-spinner {
              display: inline-block;
              animation: booking-spin 1s linear infinite;
            }
            @keyframes booking-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            /* Responsive */
            @media (max-width: 768px) {
              .cal-cell {
                min-height: 68px;
                padding: 6px 2px;
              }
              .cal-cell-icon {
                font-size: 14px;
              }
              .cal-cell-temp {
                font-size: 8px;
              }
            }

            /* Ultimate checked checkbox override to force gold tick on transparent background */
            html body .ant-checkbox-checked .ant-checkbox-inner,
            html body .ant-checkbox-checked.ant-checkbox-inner,
            html body .gold-checkbox .ant-checkbox-inner,
            html body .ant-checkbox-wrapper-checked .ant-checkbox-inner {
              background-color: transparent !important;
              border-color: #BFA16A !important;
            }
            html body .ant-checkbox-checked .ant-checkbox-inner::after,
            html body .gold-checkbox .ant-checkbox-inner::after,
            html body .ant-checkbox-wrapper-checked .ant-checkbox-inner::after {
              border-color: #BFA16A !important;
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default Booking;