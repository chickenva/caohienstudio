const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    role: { type: String, required: true }, // VD: Photographer, Makeup Artist, Editor
    specialization: { type: String }, // VD: Chụp ngoại cảnh, Chỉnh màu Hàn Quốc...
    phone: { type: String, required: true },
    email: { type: String },
    status: { type: String, default: "Đang làm việc" }, // Đang làm việc, Nghỉ phép, Đã nghỉ việc
    avatar: { type: String, default: "https://i.pravatar.cc/150?img=default" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Staff", staffSchema);
