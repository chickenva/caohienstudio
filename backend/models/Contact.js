const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["UNREAD", "READ", "CONTACTED"],
      default: "UNREAD",
    }, // Để sau này Admin biết đã gọi lại cho khách chưa
  },
  { timestamps: true },
);

module.exports = mongoose.model("Contact", contactSchema);
