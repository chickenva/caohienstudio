const mongoose = require("mongoose");

const contractTemplateSchema = new mongoose.Schema({
  // key remains unique for compatibility with the previous single-template record.
  key: { type: String, default: () => new mongoose.Types.ObjectId().toString(), unique: true, index: true },
  contract_type: { type: String, required: true, trim: true, lowercase: true, index: true },
  contract_type_name: { type: String, required: true, trim: true },
  display_name: { type: String, required: true, trim: true },
  original_name: { type: String, required: true, trim: true },
  file_type: { type: String, enum: ["docx", "xlsx"], required: true },
  template_mode: { type: String, enum: ["PLACEHOLDER", "AUTO_LABEL"], default: "PLACEHOLDER" },
  field_mapping: { type: mongoose.Schema.Types.Mixed, default: {} },
  file_url: { type: String, required: true },
  public_id: { type: String, required: true },
  is_active: { type: Boolean, default: true, index: true },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

contractTemplateSchema.index(
  { contract_type: 1 },
  { unique: true, partialFilterExpression: { is_active: true } },
);

module.exports = mongoose.model("ContractTemplate", contractTemplateSchema);
