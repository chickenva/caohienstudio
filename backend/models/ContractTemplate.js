const mongoose = require("mongoose");

const contractTemplateSchema = new mongoose.Schema({
  key: { type: String, default: "active", unique: true, index: true },
  original_name: { type: String, required: true, trim: true },
  file_type: { type: String, enum: ["docx", "xlsx"], required: true },
  template_mode: { type: String, enum: ["PLACEHOLDER", "AUTO_LABEL"], default: "PLACEHOLDER" },
  field_mapping: { type: mongoose.Schema.Types.Mixed, default: {} },
  file_url: { type: String, required: true },
  public_id: { type: String, required: true },
  version: { type: Number, default: 1 },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("ContractTemplate", contractTemplateSchema);
