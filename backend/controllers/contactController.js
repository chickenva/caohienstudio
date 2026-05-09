const Contact = require("../models/Contact");

exports.submitContact = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    // Lưu thẳng vào Database
    await Contact.create({ name, phone, email, message });

    res
      .status(201)
      .json({
        message:
          "Đã gửi lời nhắn thành công. Chúng tôi sẽ liên hệ lại sớm nhất!",
      });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi lời nhắn", error: error.message });
  }
};
