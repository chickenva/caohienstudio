const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const ContractTemplate = require("../models/ContractTemplate");
const Booking = require("../models/Booking");
const {
  ensureLegacyTemplateType,
  validateTemplateBuffer,
} = require("../services/contractTemplateService");

const DEFAULT_CONTRACT_TYPE = "hop-dong-chung";

const uploadRaw = (buffer, options) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (error, result) => error ? reject(error) : resolve(result));
  stream.end(buffer);
});

const toContractType = (name) => String(name || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "d")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const normalizeDisplayText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const validateUploadFile = async (file) => {
  if (!file) return { error: "Chọn file DOCX hoặc XLSX trước khi tải lên." };
  const extension = file.originalname.split(".").pop().toLowerCase();
  if (!["docx", "xlsx"].includes(extension)) return { error: "Template chỉ hỗ trợ định dạng .docx hoặc .xlsx." };
  if (file.size > 15 * 1024 * 1024) return { error: "Dung lượng template tối đa là 15 MB." };
  if (file.buffer.length < 4 || file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) {
    return { error: "File không phải gói DOCX/XLSX hợp lệ." };
  }
  const validation = await validateTemplateBuffer(file.buffer, extension);
  return { extension, validation };
};

const toPublicTemplate = (template) => ({
  _id: String(template._id),
  contract_type: template.contract_type || DEFAULT_CONTRACT_TYPE,
  display_name: template.display_name || template.original_name,
  original_name: template.original_name,
  file_type: template.file_type,
});

const getTemplateListPayload = async () => {
  await ensureLegacyTemplateType();
  // Archived legacy records remain available to bookings that already reference them,
  // but the management page only lists the one current template for each type.
  const documents = await ContractTemplate.find({ is_active: true }).sort({ display_name: 1 }).lean();
  const templates = documents.map(toPublicTemplate);
  const options = templates.slice();
  if (!options.length) {
    options.push({
      _id: null,
      contract_type: DEFAULT_CONTRACT_TYPE,
      display_name: "Hợp đồng chung",
      original_name: "contract-template.xlsx",
      file_type: "xlsx",
      is_fallback: true,
    });
  }
  return { templates, options };
};

const findContractType = async (templateName) => {
  const contractType = toContractType(templateName);
  const existingByName = await ContractTemplate.findOne({
    $or: [{ display_name: templateName }, { contract_type_name: templateName }],
  }).sort({ updatedAt: -1 }).lean();
  if (existingByName) return existingByName.contract_type;

  const conflictingType = await ContractTemplate.findOne({ contract_type: contractType }).lean();
  if (conflictingType) {
    const error = new Error("Tên mẫu này trùng mã với một mẫu khác. Hãy đổi tên để phân biệt rõ hơn.");
    error.statusCode = 409;
    throw error;
  }
  return contractType;
};

const createTemplateRecord = async ({ file, extension, validation, contractType, contractTypeName, displayName, updatedBy }) => {
  let uploaded = null;
  try {
    uploaded = await uploadRaw(file.buffer, {
      folder: "caohienstudio/templates",
      resource_type: "raw",
      public_id: `contract-template-${contractType}-${new mongoose.Types.ObjectId().toString()}.${extension}`,
    });

    const created = await ContractTemplate.create({
      key: `${contractType}-${Date.now()}-${new mongoose.Types.ObjectId().toString()}`,
      contract_type: contractType,
      contract_type_name: contractTypeName,
      display_name: displayName,
      original_name: file.originalname,
      file_type: extension,
      file_url: uploaded.secure_url,
      public_id: uploaded.public_id,
      template_mode: validation?.mode || "PLACEHOLDER",
      field_mapping: validation?.fieldMapping || {},
      is_active: true,
      updated_by: updatedBy,
    });
    return created;
  } catch (error) {
    if (uploaded?.public_id) {
      cloudinary.uploader.destroy(uploaded.public_id, { resource_type: "raw" }).catch(() => {});
    }
    throw error;
  }
};

const validateTemplateMetadata = (displayName) => {
  if (!displayName || displayName.length > 120) return "Nhập tên mẫu dài tối đa 120 ký tự.";
  if (!toContractType(displayName)) return "Tên mẫu cần có ít nhất một chữ hoặc số.";
  return null;
};

exports.listTemplates = async (_req, res) => {
  try {
    return res.json(await getTemplateListPayload());
  } catch (error) {
    return res.status(500).json({ message: "Không thể tải danh sách template hợp đồng.", error: error.message });
  }
};

exports.uploadTemplate = async (req, res) => {
  try {
    const fileValidation = await validateUploadFile(req.file);
    if (fileValidation.error) return res.status(400).json({ message: fileValidation.error });

    const displayName = normalizeDisplayText(req.body.display_name);
    const metadataError = validateTemplateMetadata(displayName);
    if (metadataError) return res.status(400).json({ message: metadataError });

    await ensureLegacyTemplateType();
    const contractType = await findContractType(displayName);
    const existingTemplate = await ContractTemplate.findOne({ contract_type: contractType, is_active: true }).lean();
    if (existingTemplate) {
      return res.status(409).json({ message: "Tên mẫu này đã được sử dụng. Hãy sửa mẫu hiện có để thay file." });
    }

    await createTemplateRecord({
      file: req.file,
      extension: fileValidation.extension,
      validation: fileValidation.validation,
      contractType,
      contractTypeName: displayName,
      displayName,
      updatedBy: req.user?.id && req.user.id !== "super-admin" ? req.user.id : null,
    });

    return res.status(200).json({
      message: `Đã thêm mẫu hợp đồng “${displayName}”.`,
      ...(await getTemplateListPayload()),
    });
  } catch (error) {
    console.error("Upload contract template error:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Không thể lưu template hợp đồng." });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Mã template không hợp lệ." });
    }
    await ensureLegacyTemplateType();
    const template = await ContractTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Không tìm thấy template hợp đồng." });

    const displayName = normalizeDisplayText(req.body.display_name ?? template.display_name ?? template.original_name);
    const metadataError = validateTemplateMetadata(displayName);
    if (metadataError) return res.status(400).json({ message: metadataError });

    const fileValidation = req.file ? await validateUploadFile(req.file) : null;
    if (fileValidation?.error) return res.status(400).json({ message: fileValidation.error });
    const otherType = await ContractTemplate.findOne({
      $or: [
        { display_name: displayName },
        { contract_type_name: displayName },
        { contract_type: toContractType(displayName) },
      ],
      contract_type: { $ne: template.contract_type },
    }).lean();
    if (otherType) {
      return res.status(409).json({ message: "Tên mẫu này đang được dùng cho một mẫu khác." });
    }

    if (!template.is_active) {
      return res.status(409).json({ message: "Mẫu này đã được lưu trữ và không còn chỉnh sửa trong danh sách hiện tại." });
    }

    let uploaded = null;
    const previousPublicId = template.public_id;
    try {
      if (req.file) {
        uploaded = await uploadRaw(req.file.buffer, {
          folder: "caohienstudio/templates",
          resource_type: "raw",
          public_id: `contract-template-${template.contract_type}-${new mongoose.Types.ObjectId().toString()}.${fileValidation.extension}`,
        });
        template.original_name = req.file.originalname;
        template.file_type = fileValidation.extension;
        template.file_url = uploaded.secure_url;
        template.public_id = uploaded.public_id;
        template.template_mode = fileValidation.validation?.mode || "PLACEHOLDER";
        template.field_mapping = fileValidation.validation?.fieldMapping || {};
      }
      template.display_name = displayName;
      template.contract_type_name = displayName;
      template.updated_by = req.user?.id && req.user.id !== "super-admin" ? req.user.id : null;
      await template.save();
    } catch (error) {
      if (uploaded?.public_id) cloudinary.uploader.destroy(uploaded.public_id, { resource_type: "raw" }).catch(() => {});
      throw error;
    }

    if (req.file && previousPublicId && previousPublicId !== uploaded?.public_id) {
      cloudinary.uploader.destroy(previousPublicId, { resource_type: "raw" }).catch(() => {});
    }

    return res.json({
      message: req.file ? "Đã cập nhật thông tin và file mẫu hợp đồng." : "Đã cập nhật thông tin mẫu hợp đồng.",
      ...(await getTemplateListPayload()),
    });
  } catch (error) {
    console.error("Update contract template error:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Không thể cập nhật template hợp đồng." });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Mã mẫu hợp đồng không hợp lệ." });
    }
    await ensureLegacyTemplateType();
    const template = await ContractTemplate.findById(req.params.id);
    if (!template || !template.is_active) return res.status(404).json({ message: "Không tìm thấy mẫu hợp đồng." });

    const relatedTemplates = await ContractTemplate.find({ contract_type: template.contract_type }).select("_id public_id").lean();
    const relatedIds = relatedTemplates.map((item) => item._id);
    const bookingConditions = [
      { contract_template_id: { $in: relatedIds } },
      { contract_type: template.contract_type },
    ];
    if (template.contract_type === DEFAULT_CONTRACT_TYPE) {
      bookingConditions.push({ contract_type: { $in: [null, ""] } });
    }
    const isInUse = await Booking.exists({ $or: bookingConditions });
    if (isInUse) {
      return res.status(409).json({
        message: "Không thể xóa mẫu này vì đang được đơn hàng sử dụng. Hãy đổi mẫu trên các đơn liên quan trước khi xóa.",
      });
    }

    await ContractTemplate.deleteMany({ contract_type: template.contract_type });
    await Promise.all(relatedTemplates.map((item) => item.public_id
      ? cloudinary.uploader.destroy(item.public_id, { resource_type: "raw" }).catch(() => null)
      : Promise.resolve(null)));
    return res.json({ message: `Đã xóa mẫu hợp đồng “${template.display_name || template.original_name}”.`, ...(await getTemplateListPayload()) });
  } catch (error) {
    console.error("Delete contract template error:", error);
    return res.status(500).json({ message: "Không thể xóa mẫu hợp đồng.", error: error.message });
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Mã mẫu hợp đồng không hợp lệ." });
    }
    const template = await ContractTemplate.findById(req.params.id).lean();
    if (!template) return res.status(404).json({ message: "Không tìm thấy file mẫu hợp đồng." });
    const fileUrl = new URL(template.file_url);
    if (fileUrl.hostname !== "res.cloudinary.com") {
      return res.status(503).json({ message: "Địa chỉ file mẫu không hợp lệ." });
    }
    const fileResponse = await fetch(fileUrl, { signal: AbortSignal.timeout(30000) });
    if (!fileResponse.ok) return res.status(503).json({ message: "Không tải được file mẫu hợp đồng." });
    const contentType = template.file_type === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    res.type(contentType);
    res.attachment(template.original_name);
    return res.send(Buffer.from(await fileResponse.arrayBuffer()));
  } catch (error) {
    console.error("Download contract template error:", error);
    return res.status(500).json({ message: "Không thể tải file mẫu hợp đồng." });
  }
};
