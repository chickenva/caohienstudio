const ExcelJS = require("exceljs");
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const InspectModule = require("docxtemplater/js/inspect-module.js");
const cloudinary = require("../config/cloudinary");
const ContractTemplate = require("../models/ContractTemplate");
const moment = require("moment");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { pathToFileURL } = require("url");

const execFileAsync = promisify(execFile);
const DEFAULT_TEMPLATE_PATH = path.join(__dirname, "..", "templates", "contract-template.xlsx");
const DEFAULT_CONTRACT_TYPE = "hop-dong-chung";
const ITEM_START_ROW = 17;
const ITEM_ROW_COUNT = 5;
const SESSION_LABELS = { MORNING: "Buổi sáng", AFTERNOON: "Buổi chiều", FULL_DAY: "Cả ngày" };
const SUPPORTED_TEMPLATE_KEYS = new Set([
  "booking_code", "customer_name", "customer_email", "customer_phone", "location", "shoot_date",
  "shooting_session", "main_services", "addons", "travel_surcharge", "total_amount", "deposit_amount",
  "remaining_amount", "contract_note", "contract_date", "services_text",
  ...Array.from({ length: ITEM_ROW_COUNT }, (_, index) => [
    `item_${index + 1}_name`, `item_${index + 1}_quantity`, `item_${index + 1}_unit_price`, `item_${index + 1}_amount`,
  ]).flat(),
]);

const makeError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const serviceId = (service) => String(service?._id || service || "");

const uniqueServices = (services = []) => {
  const seen = new Set();
  return services.filter((service) => {
    const id = serviceId(service);
    if (!service || !id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const getBookingServices = (booking) => {
  const main = uniqueServices(booking.original_service_ids?.length
    ? booking.original_service_ids
    : [booking.service_id]);
  const mainIds = new Set(main.map(serviceId));
  const addons = uniqueServices(booking.extra_service_ids).filter((service) => !mainIds.has(serviceId(service)));
  return { main, addons };
};

const buildContractData = (booking, overrides = {}) => {
  const { main, addons } = getBookingServices(booking);
  if (!main.length) throw makeError("Đơn chưa có gói dịch vụ để lập hợp đồng.");

  const shootDate = moment(booking.start_time).utcOffset(7);
  if (!shootDate.isValid()) throw makeError("Đơn chưa có ngày chụp hợp lệ.");
  if (booking.travel_surcharge_status === "QUOTE_REQUIRED") {
    throw makeError("Đơn đang cần báo phí di chuyển riêng. Cập nhật phụ thu và tổng đơn trước khi tạo hợp đồng.");
  }

  const customer = booking.customer_id || {};
  const total = Number(booking.total_amount || 0);
  const deposit = Number(booking.deposit_amount || Math.round(total * Number(booking.deposit_percent || 30) / 100));
  const packageItems = [...main, ...addons].map((service) => ({
    name: String(service.name || "Gói dịch vụ"),
    amount: Number(service.base_price || 0),
  }));
  const travel = Math.max(0, Number(booking.travel_surcharge_amount || 0));
  const adjustment = total - packageItems.reduce((sum, item) => sum + item.amount, 0) - travel;
  const fixedItems = [];
  if (travel) fixedItems.push({ name: "Phụ thu di chuyển", amount: travel });
  if (adjustment) fixedItems.push({ name: "Điều chỉnh theo tổng đơn", amount: adjustment });
  const packageCapacity = Math.max(1, ITEM_ROW_COUNT - fixedItems.length);
  let visiblePackages = packageItems;
  if (packageItems.length > packageCapacity) {
    const individualCount = Math.max(0, packageCapacity - 1);
    const remainder = packageItems.slice(individualCount);
    visiblePackages = [
      ...packageItems.slice(0, individualCount),
      {
        name: `Các gói dịch vụ khác (${remainder.length} gói): ${remainder.map((item) => item.name).join(", ")}`,
        amount: remainder.reduce((sum, item) => sum + item.amount, 0),
      },
    ];
  }
  const lineItems = [...visiblePackages, ...fixedItems];

  const data = {
    booking_code: String(booking._id).slice(-8).toUpperCase(),
    customer_name: String(booking.customer_full_name || customer.full_name || "").trim(),
    customer_email: String(booking.customer_email || customer.email || "").trim(),
    customer_phone: String(booking.customer_phone || customer.phone || "").trim(),
    location: String(booking.location || "").trim(),
    shoot_date: shootDate.format("DD/MM/YYYY"),
    shooting_session: SESSION_LABELS[booking.shooting_session] || "Studio sẽ liên hệ để tư vấn và chốt buổi/giờ",
    main_services: main.map((service) => service.name).join(", "),
    addons: addons.map((service) => service.name).join(", ") || "Không có",
    travel_surcharge: travel,
    total_amount: total,
    deposit_amount: deposit,
    remaining_amount: total - deposit,
    contract_note: String(booking.contract_note || ""),
    contract_date: moment().utcOffset(7).format("DD/MM/YYYY"),
  };

  Object.assign(data, overrides);
  if (!String(data.customer_name || "").trim()) throw makeError("Vui lòng bổ sung họ tên khách hàng trước khi tạo hợp đồng.");
  if (!String(data.customer_phone || "").trim()) throw makeError("Vui lòng bổ sung số điện thoại khách hàng trước khi tạo hợp đồng.");
  if (Number(data.deposit_amount) > Number(data.total_amount)) throw makeError("Tiền cọc đang lớn hơn tổng giá trị đơn.");

  for (let index = 0; index < ITEM_ROW_COUNT; index += 1) {
    const item = lineItems[index];
    data[`item_${index + 1}_name`] = item?.name || "";
    data[`item_${index + 1}_quantity`] = item ? 1 : "";
    data[`item_${index + 1}_unit_price`] = item?.amount ?? "";
    data[`item_${index + 1}_amount`] = item?.amount ?? "";
  }
  data.services_text = lineItems.map((item) => `${item.name}: ${item.amount.toLocaleString("vi-VN")}đ`).join("\n");
  return data;
};

const replacePlaceholders = (value, data) => value.replace(/\{\{([a-zA-Z0-9_]+)\}\}|\{([a-zA-Z0-9_]+)\}/g, (match, doubleTag, singleTag) => {
  const key = doubleTag || singleTag;
  return Object.prototype.hasOwnProperty.call(data, key) ? String(data[key] ?? "") : match;
});

const normalizeLabel = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const detectFieldKey = (value) => {
  const label = normalizeLabel(value);
  if (/^(ho va ten|ho ten|ten khach hang|ten khach)$/.test(label)) return "customer_name";
  if (/^(so dien thoai|dien thoai|sdt|so dt)$/.test(label)) return "customer_phone";
  if (/^(email|email khach hang)$/.test(label)) return "customer_email";
  if (/^(dia diem|dia chi|dia diem chup|noi chup)$/.test(label)) return "location";
  if (/^(ngay chup|ngay dam|ngay to chuc|ngay su kien)$/.test(label)) return "shoot_date";
  if (/^(buoi chup|thoi gian chup|gio chup)$/.test(label)) return "shooting_session";
  if (/^(dich vu|dich vu chinh|goi chup|goi dich vu)$/.test(label)) return "main_services";
  if (/^(goi di kem|dich vu them|addon)$/.test(label)) return "addons";
  if (/^(phu thu di chuyen|phi di chuyen)$/.test(label)) return "travel_surcharge";
  if (/^(tong tien|tong cong|tong gia tri)$/.test(label)) return "total_amount";
  if (/^(tien coc|dat coc( truoc)?|coc truoc)$/.test(label)) return "deposit_amount";
  if (/^(con lai|tien con lai|thanh toan con lai|tat toan con lai)$/.test(label)) return "remaining_amount";
  if (/^(ghi chu hop dong|ghi chu|dieu khoan bo sung)$/.test(label)) return "contract_note";
  return null;
};

const nextCellAfterLabel = (worksheet, rowNumber, columnNumber) => {
  let lastColumn = columnNumber;
  for (const mergedRange of worksheet.model.merges || []) {
    const [start, end] = mergedRange.split(":");
    const first = worksheet.getCell(start);
    const last = worksheet.getCell(end);
    if (rowNumber === first.row && columnNumber >= first.col && columnNumber <= last.col) {
      lastColumn = Math.max(lastColumn, last.col);
    }
  }
  return worksheet.getCell(rowNumber, lastColumn + 1);
};

const detectWorksheetFieldMapping = (worksheet) => {
  const fields = {};
  const fieldPriority = {};
  const partyNameCandidates = [];
  let table = null;
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 45) return;
    const headerColumns = {};
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      if (typeof cell.value !== "string") return;
      const rawLabel = cell.value.trim();
      const label = normalizeLabel(rawLabel.replace(/\s*[:：]\s*$/, ""));
      if (["tt", "stt", "so thu tu"].includes(label)) headerColumns.number = columnNumber;
      if (["noi dung", "dich vu", "hang muc", "ten dich vu"].includes(label)) headerColumns.name = columnNumber;
      if (["so luong", "sl"].includes(label)) headerColumns.quantity = columnNumber;
      if (["don gia", "gia don vi"].includes(label)) headerColumns.unitPrice = columnNumber;
      if (["thanh tien", "so tien"].includes(label)) headerColumns.amount = columnNumber;
      const target = nextCellAfterLabel(worksheet, rowNumber, columnNumber);
      const targetText = typeof target.value === "string" ? target.value.trim() : "";
      const targetLooksLikeLabel = /[:：]\s*$/.test(targetText) || Boolean(detectFieldKey(targetText));
      if (["nha trai", "nha gai"].includes(label) && targetText && !targetLooksLikeLabel) {
        partyNameCandidates.push(target.address);
        return;
      }
      const field = detectFieldKey(label);
      if (field) {
        let valueCell = target;
        if (["total_amount", "deposit_amount", "remaining_amount", "travel_surcharge"].includes(field)
          && (valueCell.value === null || valueCell.value === undefined || String(valueCell.value).trim() === "")) {
          for (let column = target.col + 1; column <= target.col + 4; column += 1) {
            const candidate = worksheet.getCell(rowNumber, column);
            const text = typeof candidate.value === "string" ? candidate.value.trim() : "";
            if (candidate.value !== null && candidate.value !== undefined && String(candidate.value).trim() !== ""
              && !/[:：]\s*$/.test(text) && !detectFieldKey(text)) {
              valueCell = candidate;
              break;
            }
          }
        }
        const hasExistingValue = valueCell.value !== null && valueCell.value !== undefined && String(valueCell.value).trim() !== "";
        const priority = hasExistingValue ? 1 : 0;
        if (fieldPriority[field] === undefined || priority > fieldPriority[field]) {
          fields[field] = valueCell.address;
          fieldPriority[field] = priority;
        }
      }
    });
    if (!table && headerColumns.name && headerColumns.amount) {
      table = { startRow: rowNumber + 1, rowCount: ITEM_ROW_COUNT, columns: headerColumns };
    }
  });
  if (!fields.customer_name && partyNameCandidates.length === 1) {
    fields.customer_name = partyNameCandidates[0];
  }
  return { fields, table };
};

const applyDetectedTemplateMapping = (worksheet, data, mapping = {}) => {
  Object.entries(mapping.fields || {}).forEach(([field, address]) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) worksheet.getCell(address).value = data[field];
  });
  if (!mapping.table) return;

  const { startRow, rowCount, columns } = mapping.table;
  for (let index = 0; index < rowCount; index += 1) {
    const row = worksheet.getRow(startRow + index);
    const item = data[`item_${index + 1}_name`] ? {
      name: data[`item_${index + 1}_name`],
      quantity: data[`item_${index + 1}_quantity`],
      unitPrice: data[`item_${index + 1}_unit_price`],
      amount: data[`item_${index + 1}_amount`],
    } : null;
    if (columns.number) row.getCell(columns.number).value = item ? index + 1 : null;
    if (columns.name) row.getCell(columns.name).value = item?.name || null;
    if (columns.quantity) row.getCell(columns.quantity).value = item?.quantity ?? null;
    if (columns.unitPrice) row.getCell(columns.unitPrice).value = item?.unitPrice ?? null;
    if (columns.amount) row.getCell(columns.amount).value = item?.amount ?? null;
  }
};

const fillLegacyWorkbook = (worksheet, data) => {
  worksheet.getCell("B11").value = data.customer_name;
  worksheet.getCell("B12").value = data.location || "Chưa cập nhật";
  worksheet.getCell("B13").value = data.customer_phone;
  worksheet.getCell("B14").value = data.shooting_session === "Studio sẽ liên hệ để tư vấn và chốt buổi/giờ"
    ? data.shoot_date
    : `${data.shoot_date} · ${data.shooting_session}`;
  if (data.contract_note) {
    if (!worksheet.model.merges.includes("A15:E15")) worksheet.mergeCells("A15:E15");
    worksheet.getCell("A15").value = `Ghi chú riêng: ${data.contract_note}`;
    worksheet.getCell("A15").alignment = { ...worksheet.getCell("A15").alignment, wrapText: true, vertical: "middle" };
  }

  for (let rowNumber = ITEM_START_ROW; rowNumber < ITEM_START_ROW + ITEM_ROW_COUNT; rowNumber += 1) {
    for (let col = 1; col <= 5; col += 1) worksheet.getRow(rowNumber).getCell(col).value = null;
  }
  for (let index = 1; index <= ITEM_ROW_COUNT; index += 1) {
    const name = data[`item_${index}_name`];
    if (!name) continue;
    const row = worksheet.getRow(ITEM_START_ROW + index - 1);
    row.getCell(1).value = index;
    row.getCell(2).value = name;
    row.getCell(3).value = 1;
    row.getCell(4).value = Number(data[`item_${index}_unit_price`]);
    row.getCell(5).value = Number(data[`item_${index}_amount`]);
    row.getCell(2).alignment = { ...row.getCell(2).alignment, wrapText: true, vertical: "middle" };
  }
  worksheet.getCell("E24").value = { formula: "SUM(E17:E21)", result: Number(data.total_amount) };
  worksheet.getCell("C26").value = Number(data.deposit_amount);
  worksheet.getCell("C27").value = { formula: "E24-C26", result: Number(data.remaining_amount) };
  worksheet.getCell("E55").value = moment(data.contract_date, "DD/MM/YYYY").toDate();
  worksheet.getCell("E55").numFmt = "dd/mm/yyyy";
  worksheet.pageSetup.printArea = "A1:E60";
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;
};

const renderXlsx = async (buffer, data, tempDir, templateIsLegacy = false, fieldMapping = {}) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw makeError("Template XLSX không có worksheet.");

  let hasPlaceholders = false;
  worksheet.eachRow({ includeEmpty: true }, (row) => row.eachCell({ includeEmpty: true }, (cell) => {
    if (typeof cell.value === "string") {
      const exactPlaceholder = cell.value.match(/^\{\{([a-zA-Z0-9_]+)\}\}$|^\{([a-zA-Z0-9_]+)\}$/);
      if (exactPlaceholder) {
        const key = exactPlaceholder[1] || exactPlaceholder[2];
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          cell.value = data[key];
          hasPlaceholders = true;
          return;
        }
      }
      const replaced = replacePlaceholders(cell.value, data);
      if (replaced !== cell.value) hasPlaceholders = true;
      cell.value = replaced;
    }
  }));

  if (templateIsLegacy) fillLegacyWorkbook(worksheet, data);
  else if (!hasPlaceholders) {
    if (!fieldMapping.fields?.customer_name) {
      throw makeError("Không nhận diện được ô họ tên khách hàng trong XLSX. Đặt nhãn “Họ và tên:” hoặc placeholder {customer_name}.");
    }
    applyDetectedTemplateMapping(worksheet, data, fieldMapping);
  }
  const outputPath = path.join(tempDir, "contract.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
};

const renderDocx = async (buffer, data, tempDir) => {
  try {
    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    const docxData = { ...data };
    const moneyKeys = ["travel_surcharge", "total_amount", "deposit_amount", "remaining_amount"];
    for (let index = 1; index <= ITEM_ROW_COUNT; index += 1) {
      moneyKeys.push(`item_${index}_unit_price`, `item_${index}_amount`);
    }
    for (const key of moneyKeys) {
      if (docxData[key] !== "" && docxData[key] !== null && Number.isFinite(Number(docxData[key]))) {
        docxData[key] = `${Number(docxData[key]).toLocaleString("vi-VN")}đ`;
      }
    }
    doc.render(docxData);
    const outputPath = path.join(tempDir, "contract.docx");
    await fsp.writeFile(outputPath, doc.toBuffer());
    return outputPath;
  } catch (error) {
    throw makeError(`Không thể điền dữ liệu vào template DOCX: ${error.message}`);
  }
};

const ensureLegacyTemplateType = async () => {
  const legacyTemplates = await ContractTemplate.find({
    $or: [
      { contract_type: { $exists: false } },
      { is_active: { $exists: false } },
      { display_name: { $exists: false } },
    ],
  });
  for (const template of legacyTemplates) {
    template.contract_type = template.contract_type || DEFAULT_CONTRACT_TYPE;
    template.contract_type_name = template.contract_type_name || "Hợp đồng chung";
    template.display_name = template.display_name || template.original_name || "Hợp đồng chung";
    if (template.is_active === undefined || template.is_active === null) template.is_active = true;
    await template.save();
  }
};

const resolveContractTemplateSelection = async (requestedType) => {
  await ensureLegacyTemplateType();
  const activeTemplates = await ContractTemplate.find({ is_active: true }).lean();
  const contractType = String(requestedType || "").trim().toLowerCase();

  if (contractType) {
    const template = activeTemplates.find((item) => item.contract_type === contractType);
    if (template) {
      return { contract_type: template.contract_type, contract_template_id: template._id };
    }
    if (contractType === DEFAULT_CONTRACT_TYPE && activeTemplates.length === 0) {
      return { contract_type: DEFAULT_CONTRACT_TYPE, contract_template_id: null };
    }
    throw makeError("Loại hợp đồng đã chọn không có template đang sử dụng. Vui lòng chọn lại.");
  }

  const generalTemplate = activeTemplates.find((item) => item.contract_type === DEFAULT_CONTRACT_TYPE);
  if (generalTemplate) {
    return { contract_type: generalTemplate.contract_type, contract_template_id: generalTemplate._id };
  }
  if (activeTemplates.length === 1) {
    return { contract_type: activeTemplates[0].contract_type, contract_template_id: activeTemplates[0]._id };
  }
  if (activeTemplates.length > 1) {
    throw makeError("Vui lòng chọn loại hợp đồng trước khi lưu hoặc tạo hợp đồng.");
  }
  return { contract_type: DEFAULT_CONTRACT_TYPE, contract_template_id: null };
};

const getTemplateForBooking = async (booking) => {
  await ensureLegacyTemplateType();
  let selected = null;

  const selectedTemplateId = booking.contract_template_id?._id || booking.contract_template_id;
  if (selectedTemplateId) {
    selected = await ContractTemplate.findById(selectedTemplateId).lean();
  }
  if (!selected && booking.contract_type) {
    selected = await ContractTemplate.findOne({
      contract_type: String(booking.contract_type).trim().toLowerCase(),
      is_active: true,
    }).lean();
  }
  if (!selected && !booking.contract_type) {
    const activeTemplates = await ContractTemplate.find({ is_active: true }).lean();
    selected = activeTemplates.find((item) => item.contract_type === DEFAULT_CONTRACT_TYPE)
      || (activeTemplates.length === 1 ? activeTemplates[0] : null);
    if (!selected && activeTemplates.length > 1) {
      throw makeError("Đơn chưa chọn loại hợp đồng. Chọn loại hợp đồng ở mục “Hợp đồng và Ghi chú” rồi thử lại.");
    }
  }

  if (selected?.file_url) {
    const templateUrl = new URL(selected.file_url);
    if (templateUrl.hostname !== "res.cloudinary.com") throw makeError("URL template đang dùng không hợp lệ.", 503);
    const response = await fetch(templateUrl, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw makeError("Không tải được template hợp đồng đang dùng.", 503);
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      type: selected.file_type,
      name: selected.original_name,
      legacy: false,
      fieldMapping: selected.field_mapping || {},
    };
  }

  if (booking.contract_type && booking.contract_type !== DEFAULT_CONTRACT_TYPE) {
    throw makeError("Không tìm thấy template đã chọn cho loại hợp đồng của đơn.");
  }
  if (!fs.existsSync(DEFAULT_TEMPLATE_PATH)) throw makeError("Chưa cấu hình template hợp đồng DOCX hoặc XLSX.", 500);
  return { buffer: await fsp.readFile(DEFAULT_TEMPLATE_PATH), type: "xlsx", name: "contract-template.xlsx", legacy: true };
};

const getLibreOfficeExecutable = () => {
  if (process.env.LIBREOFFICE_PATH) return process.env.LIBREOFFICE_PATH;
  if (process.platform === "win32") {
    const candidates = ["C:\\Program Files\\LibreOffice\\program\\soffice.exe", "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"];
    return candidates.find((candidate) => fs.existsSync(candidate)) || "soffice.exe";
  }
  return "soffice";
};

const convertToPdf = async (documentPath, tempDir) => {
  try {
    await execFileAsync(getLibreOfficeExecutable(), [
      `-env:UserInstallation=${pathToFileURL(path.join(tempDir, "lo-profile")).href}`,
      "--headless", "--convert-to", "pdf", "--outdir", tempDir, documentPath,
    ], { windowsHide: true, timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
  } catch (error) {
    if (error.code === "ENOENT") throw makeError("Không tìm thấy LibreOffice. Cài LibreOffice hoặc cấu hình LIBREOFFICE_PATH.", 503);
    if (error.killed || error.code === "ETIMEDOUT") throw makeError("LibreOffice quá thời gian khi xuất PDF.", 503);
    throw makeError(`Không thể xuất template sang PDF: ${error.stderr || error.message}`, 503);
  }
  const pdfPath = documentPath.replace(/\.(xlsx|docx)$/i, ".pdf");
  if (!fs.existsSync(pdfPath)) throw makeError("LibreOffice không tạo được file PDF.", 503);
  return fsp.readFile(pdfPath);
};

const generateBookingContractPdf = async (booking, overrides = {}) => {
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "caohien-contract-"));
  try {
    const template = await getTemplateForBooking(booking);
    const data = buildContractData(booking, overrides);
    const documentPath = template.type === "docx"
      ? await renderDocx(template.buffer, data, tempDir)
      : await renderXlsx(template.buffer, data, tempDir, template.legacy, template.fieldMapping);
    return { buffer: await convertToPdf(documentPath, tempDir), templateName: template.name };
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }
};

const uploadContractPdf = (buffer, bookingCode) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({
    folder: "caohienstudio/contracts",
    resource_type: "raw",
    public_id: `contract_${bookingCode}_${Date.now()}.pdf`,
  }, (error, result) => error ? reject(error) : resolve(result));
  stream.end(buffer);
});

const uploadBookingContractPdf = async (buffer, bookingCode) => uploadContractPdf(buffer, bookingCode);

const validateTemplateBuffer = async (buffer, type) => {
  try {
    if (type === "docx") {
      const zip = new PizZip(buffer);
      if (!zip.file("word/document.xml")) throw new Error("Tệp không có nội dung Word hợp lệ.");
      const inspect = InspectModule();
      new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, modules: [inspect] });
      const tags = Object.keys(inspect.getAllTags());
      if (!tags.length) throw new Error("DOCX cần có ít nhất một placeholder, ví dụ {customer_name}.");
      const unsupported = tags.filter((tag) => !SUPPORTED_TEMPLATE_KEYS.has(tag));
      if (unsupported.length) throw new Error(`Placeholder chưa hỗ trợ: ${unsupported.join(", ")}.`);
      return;
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    if (!workbook.worksheets.length) throw new Error("Tệp không có worksheet.");
    const tags = new Set();
    workbook.worksheets.forEach((worksheet) => worksheet.eachRow((row) => row.eachCell((cell) => {
      if (typeof cell.value !== "string") return;
      for (const match of cell.value.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}|\{([a-zA-Z0-9_]+)\}/g)) {
        tags.add(match[1] || match[2]);
      }
    })));
    if (!tags.size) {
      const mapping = detectWorksheetFieldMapping(workbook.worksheets[0]);
      if (!mapping.fields.customer_name) {
        throw new Error("Không tự nhận diện được trường họ tên. Dùng nhãn “Họ và tên:” hoặc thêm placeholder {customer_name}.");
      }
      return { mode: "AUTO_LABEL", fieldMapping: mapping };
    }
    const unsupported = [...tags].filter((tag) => !SUPPORTED_TEMPLATE_KEYS.has(tag));
    if (unsupported.length) throw new Error(`Placeholder chưa hỗ trợ: ${unsupported.join(", ")}.`);
    return { mode: "PLACEHOLDER", fieldMapping: {} };
  } catch (error) {
    throw makeError(`Template không hợp lệ: ${error.message}`);
  }
};

module.exports = {
  generateBookingContractPdf,
  uploadBookingContractPdf,
  validateTemplateBuffer,
  ensureLegacyTemplateType,
  resolveContractTemplateSelection,
};
