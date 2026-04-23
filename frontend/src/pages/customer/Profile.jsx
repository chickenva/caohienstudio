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

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const Profile = () => {
  const [formInfo] = Form.useForm();
  const [formPass] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const [isInfoChanged, setIsInfoChanged] = useState(false);
  const [isPassFilled, setIsPassFilled] = useState(false);

  // Validation Regex đồng bộ 100% với trang Đăng ký
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
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      formInfo.setFieldsValue(res.data);
    } catch (err) {
      message.error("Không thể tải thông tin tài khoản");
    }
  };

  const handleRequestOtp = (values, type) => {
    setPendingData({ type, ...values });

    // Hiện ngay Modal nhập OTP để người dùng sẵn sàng nhập mã
    setIsOtpModalVisible(true);
    message.loading({
      content: "Đang gửi mã OTP đến email của bạn...",
      key: "sending_otp",
    });

    const token = localStorage.getItem("token");
    axios
      .post(
        "http://localhost:5000/api/auth/send-update-otp",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
      const emailCurrent = JSON.parse(localStorage.getItem("user")).email;

      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: emailCurrent,
        otp: otpValue.otp,
      });

      if (pendingData.type === "INFO") {
        const res = await axios.put(
          "http://localhost:5000/api/auth/update-profile",
          pendingData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        localStorage.setItem("user", JSON.stringify(res.data.user));
        message.success("Cập nhật thông tin thành công!");
        setIsInfoChanged(false);
      } else {
        await axios.put(
          "http://localhost:5000/api/auth/reset-password-profile",
          {
            email: emailCurrent,
            newPassword: pendingData.newPassword,
          },
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
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 40px" }}>
      <h1
        style={{
          fontFamily: FONT_SERIF,
          fontSize: "32px",
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        Quản lý tài khoản
      </h1>

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
            rules={[
              { required: true, message: "Nhập họ tên!" },
              {
                pattern: nameRegex,
                message: "Tên không chứa số/ký tự đặc biệt!",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              style={{ borderRadius: 0, padding: "10px" }}
            />
          </Form.Item>

          <Form.Item
            label="SỐ ĐIỆN THOẠI"
            name="phone"
            rules={[
              { required: true, message: "Nhập SĐT!" },
              {
                pattern: phoneRegex,
                message: "SĐT bắt đầu bằng 0 (10-11 số)!",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              style={{ borderRadius: 0, padding: "10px" }}
            />
          </Form.Item>

          <Form.Item
            label="EMAIL"
            name="email"
            rules={[
              { required: true, type: "email", message: "Email không hợp lệ!" },
            ]}
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
          <p>Nhập mã OTP vừa được gửi vào email của bạn để xác nhận.</p>
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
