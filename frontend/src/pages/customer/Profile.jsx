/**
 * Profile.jsx
 * Trang hồ sơ cá nhân khách hàng: xem/sửa thông tin.
 */
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Modal, message } from "antd";
import {
  SaveOutlined,
  SafetyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

// Trang khách hàng xem và cập nhật thông tin cá nhân có xác thực OTP.
const Profile = () => {
  const [formInfo] = Form.useForm();
  const [formPass] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [originalData, setOriginalData] = useState({});

  const [isInfoChanged, setIsInfoChanged] = useState(false);
  const [isPassFilled, setIsPassFilled] = useState(false);

  const nameRegex =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
  const phoneRegex = /^0[0-9]{9,10}$/;
  const passRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = {
        fullName: res.data.full_name,
        phone: res.data.phone,
        email: res.data.email,
      };

      formInfo.setFieldsValue(userData);
      setOriginalData(userData);
    } catch (err) {
      message.error("Không thể tải thông tin tài khoản");
    }
  };

  const handleRequestOtp = (values, type) => {
    if (type === "INFO") {
      const dataToSend = {};
      if (values.fullName) dataToSend.full_name = values.fullName;
      if (values.phone) dataToSend.phone = values.phone;
      if (values.email) dataToSend.email = values.email;

      const isEmailChanged =
        values.email && values.email !== originalData.email;

      if (!isEmailChanged) {
        handleDirectInfoUpdate(dataToSend);
        return;
      }

      setPendingData({ type, ...dataToSend });
      requestOtpAndVerify(values.email);
      return;
    }

    setPendingData({ type, ...values });
    requestOtpAndVerify();
  };

  const handleDirectInfoUpdate = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/auth/update-profile`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...res.data.user,
          name: res.data.user.full_name,
        }),
      );

      setOriginalData({
        fullName: res.data.user.full_name,
        phone: res.data.user.phone,
        email: res.data.user.email,
      });
      message.success("Cập nhật thông tin thành công!");
      setIsInfoChanged(false);
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const requestOtpAndVerify = (targetEmail = null) => {
    setIsOtpModalVisible(true);
    message.loading({ content: "Đang gửi mã OTP...", key: "sending_otp" });

    const token = localStorage.getItem("token");
    axios
      .post(
        `${API_URL}/auth/send-update-otp`,
        targetEmail ? { email: targetEmail } : {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then(() => {
        message.success({
          content: "Đã gửi mã OTP thành công!",
          key: "sending_otp",
          duration: 2,
        });
      })
      .catch(() => {
        message.error({ content: "Gửi mã OTP thất bại!", key: "sending_otp" });
        setIsOtpModalVisible(false);
      });
  };

  const handleVerifyAndSave = async (otpValue) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const emailCurrent = originalData.email;

      await axios.post(
        `${API_URL}/auth/verify-update-otp`,
        { email: pendingData.email || emailCurrent, otp: otpValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (pendingData.type === "INFO") {
        const res = await axios.put(
          `${API_URL}/auth/update-profile`,
          pendingData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...res.data.user,
            name: res.data.user.full_name,
          }),
        );
        setOriginalData({
          fullName: res.data.user.full_name,
          phone: res.data.user.phone,
          email: res.data.user.email,
        });
        message.success("Cập nhật thông tin thành công!");
        setIsInfoChanged(false);
      } else {
        await axios.put(
          `${API_URL}/auth/reset-password-profile`,
          { email: emailCurrent, newPassword: pendingData.newPassword },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        message.success("Đổi mật khẩu thành công!");
        formPass.resetFields();
        setIsPassFilled(false);
      }
      setIsOtpModalVisible(false);
    } catch (err) {
      message.error("Mã OTP không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "80px auto 40px", padding: "0 40px" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span style={{ color: "#BFA16A", letterSpacing: "3px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>
          MY ACCOUNT
        </span>
        <h1
          className="font-serif-luxury"
          style={{
            color: "#1F1F1F",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 300,
            lineHeight: 1.2,
            margin: "0 0 16px 0",
            letterSpacing: "-0.5px",
          }}
        >
          Quản lý{" "}
          <span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>Tài Khoản</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "0 auto 20px" }}>
          <div style={{ width: 40, height: 1, background: "#BFA16A" }} />
          <div style={{ width: 6, height: 6, background: "#BFA16A", transform: "rotate(45deg)" }} />
          <div style={{ width: 40, height: 1, background: "#BFA16A" }} />
        </div>
        <p style={{ color: "#777", fontSize: 14, lineHeight: 1.8, maxWidth: 460, margin: "0 auto", fontWeight: 300 }}>
          Cập nhật thông tin cá nhân và bảo mật tài khoản của bạn.
        </p>
      </div>

      {/* 1. THÔNG TIN CÁ NHÂN */}
      <div
        style={{
          background: "#fff",
          padding: "40px",
          border: "1px solid #eee",
          marginBottom: "30px",
        }}
      >
        <h3
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "20px",
            marginBottom: "25px",
            color: PRIMARY_COLOR,
          }}
        >
          1. Thông tin cá nhân
        </h3>
        <Form
          form={formInfo}
          layout="vertical"
          onFinish={(v) => handleRequestOtp(v, "INFO")}
          onValuesChange={() => setIsInfoChanged(true)}
          requiredMark={false}
        >
          <Form.Item
            label="HỌ VÀ TÊN"
            name="fullName"
            rules={[{ pattern: nameRegex, message: "Tên không hợp lệ!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              style={{ borderRadius: 0, padding: "10px" }}
            />
          </Form.Item>
          <Form.Item
            label="SỐ ĐIỆN THOẠI"
            name="phone"
            rules={[{ pattern: phoneRegex, message: "SĐT không hợp lệ!" }]}
          >
            <Input
              prefix={<PhoneOutlined />}
              style={{ borderRadius: 0, padding: "10px" }}
            />
          </Form.Item>
          <Form.Item
            label="EMAIL"
            name="email"
            rules={[{ type: "email", message: "Email không hợp lệ!" }]}
          >
            <Input
              prefix={<MailOutlined />}
              style={{ borderRadius: 0, padding: "10px" }}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!isInfoChanged}
            style={{
              background: isInfoChanged ? PRIMARY_COLOR : "#d9d9d9",
              border: "none",
              borderRadius: 0,
              height: "45px",
              padding: "0 30px",
            }}
          >
            LƯU THÔNG TIN <SaveOutlined />
          </Button>
        </Form>
      </div>

      {/* 2. ĐỔI MẬT KHẨU */}
      <div
        style={{
          background: "#fff",
          padding: "40px",
          border: "1px solid #eee",
        }}
      >
        <h3
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "20px",
            marginBottom: "25px",
            color: PRIMARY_COLOR,
          }}
        >
          2. Bảo mật
        </h3>
        <Form
          form={formPass}
          layout="vertical"
          onFinish={(v) => handleRequestOtp(v, "PASSWORD")}
          onValuesChange={(changed, all) =>
            setIsPassFilled(!!all.newPassword && !!all.confirmPassword)
          }
          requiredMark={false}
        >
          <Form.Item
            label="MẬT KHẨU MỚI"
            name="newPassword"
            extra={
              <span style={{ fontSize: "10px", color: "#999" }}>
                8-16 ký tự, có chữ hoa, thường, số, ký tự đặc biệt.
              </span>
            }
            rules={[
              { required: true, message: "Nhập mật khẩu mới!" },
              { pattern: passRegex, message: "Mật khẩu chưa đủ mạnh!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              style={{ borderRadius: 0, padding: "10px" }}
            />
          </Form.Item>
          <Form.Item
            label="XÁC NHẬN MẬT KHẨU"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Xác nhận lại mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue("newPassword") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password style={{ borderRadius: 0, padding: "10px" }} />
          </Form.Item>
          <Button
            htmlType="submit"
            disabled={!isPassFilled}
            style={{
              borderColor: isPassFilled ? PRIMARY_COLOR : "#d9d9d9",
              color: isPassFilled ? PRIMARY_COLOR : "#d9d9d9",
              borderRadius: 0,
              height: "45px",
              padding: "0 30px",
            }}
          >
            XÁC NHẬN ĐỔI MẬT KHẨU <SafetyOutlined />
          </Button>
        </Form>
      </div>

      {/* MODAL OTP */}
      <Modal
        title={
          <span style={{ fontFamily: FONT_SERIF }}>Xác thực thay đổi</span>
        }
        open={isOtpModalVisible}
        footer={null}
        centered
        onCancel={() => setIsOtpModalVisible(false)}
        maskClosable={false}
        destroyOnClose
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <p style={{ marginBottom: 20 }}>Nhập mã OTP vừa được gửi vào email của bạn để xác nhận.<br /><span style={{ fontSize: "12px", color: "#888", fontStyle: "italic" }}>* Vui lòng kiểm tra hộp thư Rác (Spam) nếu không nhận được email.</span></p>
          <Form onFinish={handleVerifyAndSave}>
            <Form.Item
              name="otp"
              rules={[{ required: true, message: "Bắt buộc nhập OTP" }]}
            >
              <Input
                placeholder="****"
                maxLength={4}
                style={{
                  textAlign: "center",
                  fontSize: "24px",
                  letterSpacing: "10px",
                  borderRadius: 0,
                  height: "50px",
                }}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: PRIMARY_COLOR,
                border: "none",
                height: "45px",
                borderRadius: 0,
              }}
            >
              XÁC NHẬN
            </Button>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
