/**
 * AdminTimetable.jsx
 * Trang Thời khóa biểu: xem lịch chụp theo tuần, tư vấn giờ rảnh/bận và chỉnh giờ từng đơn.
 */
import React from "react";
import { Button, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import StudioTimetable from "../../components/admin/StudioTimetable";

const { Title, Text } = Typography;

const AdminTimetable = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Thời khóa biểu
          </Title>
          <Text type="secondary">
            Quản lý lịch chụp theo tuần, xem ca trống để tư vấn khách và chỉnh giờ kết thúc dự kiến của từng đơn.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: "#BFA16A", borderColor: "#BFA16A" }}
          onClick={() => navigate("/admin/orders/create")}
        >
          Tạo đơn đặt hộ
        </Button>
      </div>

      <StudioTimetable variant="page" initialDate={dateParam} />
    </div>
  );
};

export default AdminTimetable;
