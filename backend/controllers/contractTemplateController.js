const cloudinary = require("../config/cloudinary");
const ContractTemplate = require("../models/ContractTemplate");
const { validateTemplateBuffer } = require("../services/contractTemplateService");

const uploadRaw = (buffer, options) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (error, result) => error ? reject(error) : resolve(result));
  stream.end(buffer);
});

exports.getActiveTemplate = async (_req, res) => {
  try {
    const template = await ContractTemplate.findOne({ key: "active" }).lean();
    return res.json({
      template: template ? {
        original_name: template.original_name,
        file_type: template.file_type,
        template_mode: template.template_mode,
        field_mapping: template.field_mapping,
        version: template.version,
        updatedAt: template.updatedAt,
      } : null,
      fallback: template ? null : { original_name: "contract-template.xlsx", file_type: "xlsx" },
    });
  } catch (error) {
    return res.status(500).json({ message: "Không thể tải cấu hình template", error: error.message });
  }
};

exports.uploadTemplate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chọn file DOCX hoặc XLSX trước khi tải lên." });
    const extension = req.file.originalname.split(".").pop().toLowerCase();
    if (!["docx", "xlsx"].includes(extension)) {
      return res.status(400).json({ message: "Template chỉ hỗ trợ định dạng .docx hoặc .xlsx." });
    }
    if (req.file.size > 15 * 1024 * 1024) {
      return res.status(400).json({ message: "Dung lượng template tối đa là 15 MB." });
    }
    if (req.file.buffer.length < 4 || req.file.buffer[0] !== 0x50 || req.file.buffer[1] !== 0x4b) {
      return res.status(400).json({ message: "File không phải gói DOCX/XLSX hợp lệ." });
    }
    const validation = await validateTemplateBuffer(req.file.buffer, extension);

    const current = await ContractTemplate.findOne({ key: "active" });
    const cloudName = `contract-template-v${Date.now()}.${extension}`;
    const uploaded = await uploadRaw(req.file.buffer, {
      folder: "caohienstudio/templates",
      resource_type: "raw",
      public_id: cloudName,
    });
    const template = await ContractTemplate.findOneAndUpdate(
      { key: "active" },
      {
        $set: {
          original_name: req.file.originalname,
          file_type: extension,
          file_url: uploaded.secure_url,
          public_id: uploaded.public_id,
          template_mode: validation?.mode || "PLACEHOLDER",
          field_mapping: validation?.fieldMapping || {},
          updated_by: req.user?.id && req.user.id !== "super-admin" ? req.user.id : null,
          version: current ? current.version + 1 : 1,
        },
        $setOnInsert: { key: "active" },
      },
      { new: true, upsert: true, setDefaultsOnInsert: false },
    );

    if (current?.public_id && current.public_id !== uploaded.public_id) {
      cloudinary.uploader.destroy(current.public_id, { resource_type: "raw" }).catch(() => {});
    }
    return res.status(200).json({
      message: "Đã cập nhật template hợp đồng đang sử dụng.",
      template: {
        original_name: template.original_name,
        file_type: template.file_type,
        template_mode: template.template_mode,
        field_mapping: template.field_mapping,
        version: template.version,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    console.error("Upload contract template error:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Không thể cập nhật template hợp đồng." });
  }
};
