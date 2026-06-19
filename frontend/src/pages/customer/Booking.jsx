import React, { useState, useEffect } from "react";
import {
  Form,
  Row,
  Col,
  Select,
  Input,
  Button,
  message,
  Modal,
  Result,
  AutoComplete,
  Switch,
  TimePicker,
} from "antd";
import {
  EnvironmentOutlined,
  DashboardOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  CloudOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = "http://localhost:5000/api";

const Booking = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);

  const appointmentDate = Form.useWatch("appointmentDate", form);
  const photographerId = Form.useWatch("photographerId", form);
  const serviceId = Form.useWatch("serviceId", form);

  // States cho Lịch thông minh và Thời tiết
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState({});
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState(null);
  const [rangeEndDate, setRangeEndDate] = useState(null);
  const [busyBookings, setBusyBookings] = useState([]);
  const [customTime, setCustomTime] = useState(null);

  // Reset selected date states when mode changes
  useEffect(() => {
    setSelectedDate(null);
    setRangeStartDate(null);
    setRangeEndDate(null);
    setSelectedTimeSlot(null);
    setCustomTime(null);
    form.setFieldsValue({ appointmentDate: null });
  }, [isRangeMode, form]);


  // States & logic cho gợi ý tìm kiếm địa chỉ
  const [addressOptions, setAddressOptions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

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
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchText)}&limit=15&lang=default&bbox=102.14,8.56,109.46,23.39`;
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

  const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  // Lấy danh sách lịch bận của thợ chụp
  useEffect(() => {
    if (!photographerId) {
      setBusyBookings([]);
      return;
    }

    const fetchBusySlots = async () => {
      try {
        let params = { photographer_id: photographerId };
        if (isRangeMode) {
          if (rangeStartDate && rangeEndDate) {
            params.start_date = rangeStartDate.format("YYYY-MM-DD");
            params.end_date = rangeEndDate.format("YYYY-MM-DD");
          } else if (rangeStartDate) {
            params.date = rangeStartDate.format("YYYY-MM-DD");
          } else {
            return;
          }
        } else {
          if (selectedDate) {
            params.date = selectedDate.format("YYYY-MM-DD");
          } else {
            return;
          }
        }

        const res = await axios.get(`${API_URL}/bookings/photographer-busy-slots`, { params });
        setBusyBookings(res.data || []);
      } catch (err) {
        console.error("Lỗi lấy lịch bận thợ chụp:", err);
      }
    };

    fetchBusySlots();
  }, [photographerId, selectedDate, rangeStartDate, rangeEndDate, isRangeMode]);

  // Kiểm tra khung giờ bận
  const isSlotBusy = (slot) => {
    if (!photographerId) return false;

    const targetDate = isRangeMode ? rangeStartDate : selectedDate;
    if (!targetDate) return false;

    const [hour, minute] = slot.split(":");
    const slotStart = targetDate.hour(parseInt(hour)).minute(parseInt(minute)).second(0);

    let slotEnd;
    if (isRangeMode) {
      if (rangeEndDate) {
        slotEnd = rangeEndDate.hour(17).minute(0).second(0);
      } else {
        const selectedService = services.find(s => s._id === form.getFieldValue("serviceId"));
        const duration = selectedService?.duration_hours || 4;
        slotEnd = slotStart.add(duration, "hours");
      }
    } else {
      const selectedService = services.find(s => s._id === form.getFieldValue("serviceId"));
      const duration = selectedService?.duration_hours || 4;
      slotEnd = slotStart.add(duration, "hours");
    }

    return busyBookings.some((booking) => {
      const bStart = dayjs(booking.start_time);
      const bEnd = dayjs(booking.end_time);
      return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
    });
  };

  // Disable hours for TimePicker (Studio works 9h-17h, last slot starts at 16h)
  const disabledHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      if (i < 9 || i > 16) {
        hours.push(i);
      }
    }
    return hours;
  };

  // Xử lý tự chọn giờ khác
  const handleCustomTimeChange = (time) => {
    if (!time) {
      setCustomTime(null);
      setSelectedTimeSlot(null);
      return;
    }

    const targetDate = isRangeMode ? rangeStartDate : selectedDate;
    if (!targetDate) {
      message.warning("Vui lòng chọn ngày trên lịch trước");
      setCustomTime(null);
      return;
    }

    const hour = time.hour();
    const minute = time.minute();
    const slotStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    // Combine date and time
    const slotStart = targetDate.hour(hour).minute(minute).second(0);

    // Check conflict
    let slotEnd;
    if (isRangeMode) {
      if (rangeEndDate) {
        slotEnd = rangeEndDate.hour(17).minute(0).second(0);
      } else {
        const selectedService = services.find(s => s._id === form.getFieldValue("serviceId"));
        const duration = selectedService?.duration_hours || 4;
        slotEnd = slotStart.add(duration, "hours");
      }
    } else {
      const selectedService = services.find(s => s._id === form.getFieldValue("serviceId"));
      const duration = selectedService?.duration_hours || 4;
      slotEnd = slotStart.add(duration, "hours");
    }

    // Check overlap with busyBookings
    const isConflict = busyBookings.some((booking) => {
      const bStart = dayjs(booking.start_time);
      const bEnd = dayjs(booking.end_time);
      return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
    });

    if (isConflict) {
      message.error(`Thợ chụp đã bận trong khung giờ ${slotStr} này! Vui lòng chọn giờ khác.`);
      setCustomTime(null);
      setSelectedTimeSlot(null);
      form.setFieldsValue({ appointmentDate: null });
      return;
    }

    // Chấp nhận giờ chọn tự do
    setCustomTime(time);
    setSelectedTimeSlot(slotStr);
    form.setFieldsValue({ appointmentDate: slotStart });
  };

  // Helper dịch mã thời tiết WMO
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
        setServices(
          Array.isArray(res.data) ? res.data : res.data.services || [],
        );
      } catch (err) {
        message.error("Không thể tải danh sách dịch vụ");
      }
    };

    const fetchPhotographers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/photographers`);
        setPhotographers(
          Array.isArray(res.data) ? res.data : res.data.photographers || [],
        );
      } catch (err) {
        message.error("Không thể tải danh sách thợ chụp");
      }
    };

    fetchServices();
    fetchPhotographers();

    if (location.state) {
      const initialValues = {};

      if (location.state.service_id) {
        initialValues.serviceId = location.state.service_id;
      }

      if (location.state.photographer_id) {
        initialValues.photographerId = location.state.photographer_id;
      }

      if (location.state.location) {
        initialValues.location = location.state.location;
      }

      form.setFieldsValue(initialValues);
    }

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [location, form]);

  const getDepositInfo = () => {
    if (!appointmentDate) {
      return {
        percent: "30%",
        label: "Đặt sớm",
        color: "#389e0d",
        value: 30,
      };
    }

    const diffDays = dayjs(appointmentDate)
      .startOf("day")
      .diff(dayjs().startOf("day"), "day");

    if (diffDays < 3) {
      return {
        percent: "100%",
        label: "Đặt gấp",
        color: "#cf1322",
        value: 100,
      };
    }

    if (diffDays <= 6) {
      return {
        percent: "50%",
        label: "Đặt cận ngày",
        color: "#d48806",
        value: 50,
      };
    }

    return {
      percent: "30%",
      label: "Đặt sớm",
      color: "#389e0d",
      value: 30,
    };
  };

  const depositInfo = getDepositInfo();

  const handlePendingBookingError = (data) => {
    Modal.warning({
      title: "Bạn đang có một đơn chờ thanh toán",
      content:
        data?.message ||
        "Vui lòng thanh toán hoặc hủy đơn cũ trước khi tạo đơn mới.",
      okText: "Đi đến đơn hàng",
      cancelText: "Đóng",
      onOk: () => {
        if (data?.booking_id) {
          navigate(`/customer/my-bookings/${data.booking_id}`);
        } else {
          navigate("/customer/my-bookings");
        }
      },
    });
  };

  // Submit: đồng bộ chính xác với backend createVnpayPayment
  // Backend expects: service_id, photographer_ids (array), start_time, location, note, deposit_percent
  const onFinish = async (values) => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.warning("Vui lòng đăng nhập để đặt lịch");
        navigate("/login");
        return;
      }

      let startTime = null;
      let endTime = null;

      if (isRangeMode) {
        if (!rangeStartDate || !rangeEndDate) {
          message.warning("Vui lòng chọn ngày bắt đầu và ngày kết thúc trên lịch");
          setLoading(false);
          return;
        }
        if (!selectedTimeSlot) {
          message.warning("Vui lòng chọn giờ bắt đầu");
          setLoading(false);
          return;
        }
        const [hour, minute] = selectedTimeSlot.split(":");
        startTime = rangeStartDate.hour(parseInt(hour)).minute(parseInt(minute)).second(0);
        endTime = rangeEndDate.hour(17).minute(0).second(0);
      } else {
        if (!selectedDate) {
          message.warning("Vui lòng chọn ngày chụp");
          setLoading(false);
          return;
        }
        if (!selectedTimeSlot) {
          message.warning("Vui lòng chọn giờ chụp");
          setLoading(false);
          return;
        }
        const [hour, minute] = selectedTimeSlot.split(":");
        startTime = selectedDate.hour(parseInt(hour)).minute(parseInt(minute)).second(0);
      }

      const submitData = {
        service_id: values.serviceId,
        photographer_ids: [values.photographerId],
        start_time: startTime.toDate().toISOString(),
        location: values.location,
        note: values.note,
        deposit_percent: depositInfo.value,
      };

      if (isRangeMode) {
        submitData.end_time = endTime.toDate().toISOString();
      }

      const res = await axios.post(`${API_URL}/bookings/create-vnpay`, submitData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        message.error("Không tìm thấy link thanh toán");
      }
    } catch (err) {
      console.error("Booking error:", err);

      const data = err.response?.data;

      if (data?.code === "HAS_PENDING_BOOKING") {
        handlePendingBookingError(data);
        return;
      }

      if (err.response?.status === 409) {
        message.error(data?.message || "Thợ chụp đã có lịch trong khung giờ này");
        return;
      }

      message.error(data?.message || "Lỗi khởi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Light glow spotlight effects — same as homepage */}
          <div className="glow-spotlight-light" style={{ top: "5%", left: "3%" }}></div>
          <div className="glow-spotlight-light" style={{ bottom: "10%", right: "5%" }}></div>
          <div className="glow-spotlight-light" style={{ top: "40%", right: "15%" }}></div>

          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>

            {/* ===== HERO HEADER — synced with homepage style ===== */}
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
                Chọn gói dịch vụ, nhiếp ảnh gia yêu thích và thời gian phù hợp. Hệ thống dự báo thời tiết thông minh giúp bạn lên kế hoạch hoàn hảo.
              </p>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish} className="booking-form-luxury">

              {/* ===== FORM SELECTS — 4 cột ngang ===== */}
              <div className="glass-panel" style={{ padding: "28px 24px", marginBottom: 28 }}>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Gói dịch vụ"
                      name="serviceId"
                      rules={[{ required: true, message: "Vui lòng chọn gói dịch vụ" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder="Chọn gói dịch vụ..."
                        size="large"
                        popupClassName="booking-select-dropdown"
                      >
                        {services.map((service) => (
                          <Select.Option key={service._id} value={service._id}>
                            {service.name} — {Number(service.base_price || 0).toLocaleString("vi-VN")}đ
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Thợ chụp"
                      name="photographerId"
                      rules={[{ required: true, message: "Vui lòng chọn thợ chụp" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder="Chọn thợ chụp..."
                        size="large"
                        popupClassName="booking-select-dropdown"
                      >
                        {photographers.map((photographer) => (
                          <Select.Option key={photographer._id} value={photographer._id}>
                            {photographer.full_name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Khu vực chụp (thời tiết)"
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
                      >
                        {FORECAST_LOCATIONS.map((city) => (
                          <Select.Option key={city.name} value={city.name}>
                            {city.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label="Địa điểm chụp chi tiết"
                      name="location"
                      rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
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
                          placeholder="Ví dụ: Studio Cao Hiển"
                        />
                      </AutoComplete>
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* ===== CALENDAR + WEATHER + TIME SLOTS — Full width ===== */}
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
                    }}
                    style={{ background: isRangeMode ? "#BFA16A" : "#ccc" }}
                  />
                </div>

                <Row gutter={[24, 24]}>
                  {/* Calendar Grid */}
                  <Col xs={24} lg={15} style={{ display: "flex", flexDirection: "column" }}>
                    <div className="glass-panel" style={{ padding: 24, flex: 1, borderRadius: 8, display: "flex", flexDirection: "column" }}>
                      {/* Calendar Header */}
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

                      {/* Weekdays Row */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: 600, marginBottom: 10 }}>
                        {WEEKDAYS.map(d => (
                          <div key={d} style={{ color: d === "CN" ? "#cf1322" : "#555", fontSize: 12, paddingBottom: 8, borderBottom: "1px solid #f0ebe3" }}>{d}</div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      {weatherLoading ? (
                        <div style={{ height: 380, display: "flex", justifyContent: "center", alignItems: "center", color: "#BFA16A", fontSize: 14 }}>
                          <span className="booking-loading-spinner" style={{ marginRight: 8 }}>⏳</span>
                          Đang tải dữ liệu thời tiết...
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                          {getCalendarCells().map((cell, idx) => {
                            const dateStr = cell.date.format("YYYY-MM-DD");
                            const isToday = cell.date.isSame(dayjs(), 'day');
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
                                        setSelectedTimeSlot(null);
                                        form.setFieldsValue({ appointmentDate: null });
                                      } else {
                                        if (cell.date.isBefore(rangeStartDate, 'day')) {
                                          setRangeStartDate(cell.date);
                                          setRangeEndDate(null);
                                        } else if (cell.date.isSame(rangeStartDate, 'day')) {
                                          setRangeStartDate(null);
                                          setRangeEndDate(null);
                                        } else {
                                          setRangeEndDate(cell.date);
                                          if (selectedTimeSlot) {
                                            const [hour, minute] = selectedTimeSlot.split(":");
                                            const updatedDateTime = rangeStartDate
                                              .hour(parseInt(hour))
                                              .minute(parseInt(minute))
                                              .second(0);
                                            form.setFieldsValue({ appointmentDate: updatedDateTime });
                                          } else {
                                            form.setFieldsValue({ appointmentDate: rangeStartDate });
                                          }
                                        }
                                      }
                                    } else {
                                      setSelectedDate(cell.date);
                                      setSelectedTimeSlot(null);
                                      if (selectedTimeSlot) {
                                        const [hour, minute] = selectedTimeSlot.split(":");
                                        const updatedDateTime = cell.date
                                          .hour(parseInt(hour))
                                          .minute(parseInt(minute))
                                          .second(0);
                                        form.setFieldsValue({ appointmentDate: updatedDateTime });
                                      } else {
                                        form.setFieldsValue({ appointmentDate: cell.date });
                                      }
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

                      {/* Weather Legend */}
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

                  {/* Weather + Time Slots Panel */}
                  <Col xs={24} lg={9} style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
                      {activeDate ? (
                        <>
                          {/* Range incomplete alert */}
                          {isRangeMode && !rangeEndDate && (
                            <div style={{ marginBottom: 14, fontSize: 13, color: "#cf1322", fontWeight: "500", textAlign: "center", background: "rgba(207, 19, 34, 0.05)", padding: "10px 12px", border: "1px dashed rgba(207, 19, 34, 0.2)", borderRadius: 6 }}>
                              ⚠️ Vui lòng chọn ngày kết thúc trên lịch
                            </div>
                          )}

                          {/* Weather Info */}
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
                                        Vui lòng quay lại kiểm tra sau ngày <strong>{activeDate.subtract(14, 'day').format('DD/MM/YYYY')}</strong>.
                                      </span>
                                    ) : (
                                      <span>
                                        📝 <strong>Lưu ý:</strong> Dự báo thời tiết thực tế có độ chính xác cao nhất trong vòng 3-7 ngày trước ngày chụp. Bạn nên kiểm tra lại thường xuyên trước ngày đi chụp để cập nhật thay đổi.
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

                          {/* Time Slots */}
                          <div className="glass-panel" style={{ padding: 24, borderRadius: 8 }}>
                            <h4 className="font-serif-luxury" style={{ margin: "0 0 14px 0", fontSize: 16, color: "#2F2F2F", display: "flex", alignItems: "center", gap: 8 }}>
                              <CalendarOutlined style={{ color: "#BFA16A" }} />
                              {isRangeMode ? "Chọn giờ bắt đầu chụp" : "Chọn giờ chụp"}
                            </h4>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))", gap: 10 }}>
                              {TIME_SLOTS.map((slot) => {
                                const isSlotSelected = selectedTimeSlot === slot && !customTime;
                                const isBusy = isSlotBusy(slot);
                                return (
                                  <button
                                    type="button"
                                    key={slot}
                                    className={`time-slot-btn${isSlotSelected ? " time-slot-active" : ""}${isBusy ? " time-slot-busy" : ""}`}
                                    disabled={isBusy}
                                    onClick={() => {
                                      setSelectedTimeSlot(slot);
                                      setCustomTime(null);
                                      const [hour, minute] = slot.split(":");
                                      const targetDate = isRangeMode ? rangeStartDate : selectedDate;
                                      if (targetDate) {
                                        const updatedDateTime = targetDate
                                          .hour(parseInt(hour))
                                          .minute(parseInt(minute))
                                          .second(0);
                                        form.setFieldsValue({ appointmentDate: updatedDateTime });
                                      }
                                    }}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Tự chọn giờ khác */}
                            <div style={{ borderTop: "1px dashed #E8DED2", paddingTop: 16, marginTop: 16 }}>
                              <div style={{ fontSize: 13, color: "#555", marginBottom: 8, fontWeight: 500 }}>
                                Hoặc chọn khung giờ khác:
                              </div>
                              <TimePicker
                                format="HH:mm"
                                placeholder="Chọn giờ tự do..."
                                minuteStep={15}
                                disabledHours={disabledHours}
                                hideDisabledOptions
                                disabled={isRangeMode ? (!rangeStartDate || !rangeEndDate) : !selectedDate}
                                value={customTime}
                                onChange={handleCustomTimeChange}
                                style={{ width: "100%", height: 40, borderRadius: 8, borderColor: "#E8DED2" }}
                                popupClassName="booking-select-dropdown"
                              />
                            </div>

                            {selectedTimeSlot && (
                              <div style={{ marginTop: 14, fontSize: 13, color: "#BFA16A", fontWeight: "bold", textAlign: "center", background: "rgba(191, 161, 106, 0.06)", padding: "10px 12px", border: "1px dashed rgba(191, 161, 106, 0.25)" }}>
                                {isRangeMode ? (
                                  <span>
                                    ✓ Đã chọn: {rangeStartDate?.format("DD/MM/YYYY")} ({selectedTimeSlot}) đến {rangeEndDate ? rangeEndDate.format("DD/MM/YYYY") : "..."}
                                  </span>
                                ) : (
                                  <span>
                                    ✓ Đã chọn: {selectedDate?.format("DD/MM/YYYY")} lúc {selectedTimeSlot}
                                  </span>
                                )}
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

                {/* Hidden field */}
                <Form.Item
                  name="appointmentDate"
                  rules={[{ required: true, message: "Vui lòng chọn cả ngày và giờ chụp trên lịch" }]}
                  style={{ display: "none" }}
                >
                  <Input type="hidden" />
                </Form.Item>
              </div>

              {/* ===== NOTES + DEPOSIT + SUBMIT ===== */}
              <div style={{ marginTop: 30 }}>
                <div style={{ color: "#555", fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
                  Ghi chú
                </div>
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={14} style={{ display: "flex", flexDirection: "column" }}>
                    <Form.Item name="note" className="note-form-item" style={{ marginBottom: 0, flex: 1 }}>
                      <Input.TextArea
                        rows={4}
                        size="large"
                        placeholder="Bạn có yêu cầu đặc biệt gì cho buổi chụp không?"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={10} style={{ display: "flex", flexDirection: "column" }}>
                    <div className="glass-panel" style={{ padding: 24, borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
                      {appointmentDate ? (
                        <>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
                            Mức thanh toán áp dụng:{" "}
                            <strong style={{ color: "#BFA16A" }}>{depositInfo.percent}</strong>
                            <span style={{ marginLeft: 8, fontSize: 14, color: "#555" }}>
                              ({depositInfo.label})
                            </span>
                          </p>
                          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#cf1322", lineHeight: 1.5 }}>
                            Sau khi tạo đơn, bạn cần hoàn tất thanh toán trong 15 phút. Quá thời gian này, đơn sẽ tự chuyển sang trạng thái đã hủy.
                          </p>
                        </>
                      ) : (
                        <div style={{ textAlign: "center", color: "#888", fontSize: 14, fontStyle: "italic" }}>
                          Vui lòng chọn ngày chụp trên lịch để xem mức thanh toán áp dụng.
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>

                <div style={{ marginTop: 32 }}>
                  <button
                    type="submit"
                    className="btn-premium-gold"
                    disabled={loading}
                    style={{ width: "100%", justifyContent: "center", height: 54, fontSize: 15, letterSpacing: 3, borderRadius: 8 }}
                  >
                    {loading ? "ĐANG XỬ LÝ..." : "TIẾN HÀNH THANH TOÁN"}
                  </button>
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
            .booking-form-luxury .ant-select-selection-item {
              color: #2F2F2F !important;
              font-weight: 500 !important;
            }
            .booking-form-luxury .ant-select-arrow {
              color: #BFA16A !important;
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
            .booking-select-dropdown .ant-select-item-option-selected {
              background-color: rgba(191, 161, 106, 0.08) !important;
              color: #BFA16A !important;
              font-weight: 600 !important;
            }
            .booking-select-dropdown .ant-select-item-option-active {
              background-color: rgba(191, 161, 106, 0.04) !important;
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
            .cal-cell-range {
              border-color: #BFA16A !important;
              background: rgba(191, 161, 106, 0.03) !important;
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
              font-size: 14px;
              font-weight: 400;
              background: #fff;
              border: 1px solid #E8DED2;
              color: #2F2F2F;
              cursor: pointer;
              font-family: 'Outfit', sans-serif;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
          `}</style>
        </div>
      )}
    </>
  );
};

export default Booking;