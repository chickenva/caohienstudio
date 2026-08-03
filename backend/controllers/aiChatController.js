/**
 * aiChatController.js
 * Chatbot AI tư vấn khách hàng dùng Google Gemini.
 * Context dịch vụ, thợ chụp và album được lấy thực tế từ DB mỗi lần gọi.
 * Có rate limiting in-memory (20 tin/phút/IP) để tránh lạm dụng API.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Service      = require("../models/Service");
const User         = require("../models/User");
const PublicGallery = require("../models/PublicGallery");

// ==========================================
// RATE LIMITING (IN-MEMORY)
// ==========================================

const rateLimitMap       = new Map();
const RATE_LIMIT_WINDOW  = 60 * 1000; // 1 phút
const RATE_LIMIT_MAX     = 20;         // 20 tin nhắn / phút / IP

/**
 * Kiểm tra IP có vượt giới hạn gửi tin nhắn chưa.
 * @param {string} ip - Địa chỉ IP client
 * @returns {boolean} true nếu được phép, false nếu vượt giới hạn
 */
function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

// Dọn dẹp rate limit map mỗi 5 phút để tránh memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ==========================================
// STUDIO CONTEXT
// ==========================================

/**
 * Lấy dữ liệu thực từ DB để xây dựng context cho AI tư vấn:
 * danh sách dịch vụ và album đang hoạt động.
 * @returns {{ servicesText, galleriesText }}
 */
async function getStudioContext() {
  try {
    const [services, galleries] = await Promise.all([
      Service.find({ is_active: true }).lean(),
      PublicGallery.find({ is_active: true }).lean(),
    ]);

    const servicesText = services.length > 0
      ? services.map((s) =>
          `- ${s.name}: ${s.base_price?.toLocaleString("vi-VN")}đ, thời lượng ${s.duration_hours} giờ${s.description ? ` – ${s.description}` : ""}`
        ).join("\n")
      : "Chưa có thông tin dịch vụ.";

    const galleriesText = galleries.length > 0
      ? galleries.map((g) =>
          `- Album "${g.title}" (Concept: ${g.category}, Địa điểm: ${g.location || "Cao Hiển Studio"})${g.description ? ` - ${g.description}` : ""}`
        ).join("\n")
      : "Chưa có thông tin album.";

    return { servicesText, galleriesText };
  } catch (error) {
    console.error("Lỗi lấy dữ liệu studio context:", error.message);
    return {
      servicesText:      "Không thể tải thông tin dịch vụ lúc này.",
      galleriesText:     "Không thể tải thông tin album lúc này.",
    };
  }
}

// ==========================================
// SYSTEM PROMPT
// ==========================================

/**
 * Ghép system prompt tiếng Việt gồm thông tin studio, FAQ và quy tắc trả lời.
 * @param {{ servicesText, galleriesText }} context
 * @returns {string}
 */
function buildSystemPrompt(context) {
  return `Bạn là "Trợ lý Cao Hiển" – tư vấn viên AI thân thiện và chuyên nghiệp của Cao Hiển Photography Studio (CAOHIENPHOTOGRAPHY), một studio chụp ảnh cao cấp tại TP. Hồ Chí Minh, Việt Nam.

Người sáng lập: Nhiếp ảnh gia Cao Hiển, chuyên Nhiếp ảnh Cưới & Production (sự kiện, hội nghị, khai trương). Phong cách hướng đến sự tự nhiên, tinh tế và cảm xúc chân thật.

══════════════════════════════════
📋 THÔNG TIN DỊCH VỤ CỦA STUDIO
══════════════════════════════════

🎯 CÁC GÓI CHỤP:
${context.servicesText}

📸 CÁC ALBUM ẢNH (GALLERIES) NỔI BẬT ĐỂ THAM KHẢO:
${context.galleriesText}

══════════════════════════════════
📌 KIẾN THỨC VÀ CÂU HỎI THƯỜNG GẶP (FAQ) & CHÍNH SÁCH
══════════════════════════════════

1. **Chụp/Quay TRUYỀN THỐNG vs PHÓNG SỰ**:
   - **Chụp Truyền Thống**: Ảnh dàn dựng, tạo dáng, tập trung nghi thức, góc chính diện. Mang tính lưu niệm, chỉn chu.
   - **Chụp Phóng Sự**: Bắt khoảnh khắc tự nhiên, không sắp đặt. Chú trọng cảm xúc, góc chụp đa dạng. Mang tính kể chuyện, nghệ thuật.
   - **Quay Truyền Thống**: Ghi hình đầy đủ nghi thức, cố định, ít di chuyển. Phim dài 30-60 phút.
   - **Quay Phóng Sự**: Tập trung cảm xúc thật, góc máy sáng tạo. Phim ngắn (clip) 5-10 phút.
   -> *Khuyên khách hàng kết hợp cả 2 để có bộ ảnh/phim vừa trọn vẹn lưu niệm, vừa giàu cảm xúc nghệ thuật.*

2. **Chụp/Quay 1 buổi full là gì?**: Chọn một nửa ngày (Sáng đến hết trưa HOẶC Chiều đến tối).

3. **Thời gian nhận sản phẩm**:
   - Phim (video dựng hoàn chỉnh): 10 ngày kể từ ngày quay.
   - File ảnh chỉnh sửa: 05 ngày kể từ ngày chụp.
   - In ảnh: 07 ngày kể từ khi chọn xong ảnh.

4. **File ảnh chỉnh sửa là gì?**: Ảnh đã được lọc (bỏ ảnh trùng/lỗi), chỉnh màu/sáng hài hòa theo phong cách tiệm. Không giao ảnh thô.

5. **Tại sao gói chụp không bao gồm in ảnh?**: Để giảm chi phí ban đầu, tránh in thừa/lãng phí. Khách hàng xem ảnh xong có thể tự do chọn kích thước, số lượng ảnh ưng ý để in sau.

6. **Chính sách Đặt cọc & Thanh toán (Hợp đồng)**:
   - Khách hàng cần thanh toán cọc 30% tổng giá trị đơn để giữ lịch chính thức.
   - Khách hàng sẽ thanh toán phần còn lại (70%) sau 3 đến 4 ngày kể từ ngày hoàn tất buổi chụp.

7. **Chính sách Hủy & Dời lịch (Bảo lưu)**:
   - Hủy hợp đồng: Nếu khách hàng đơn phương hủy lịch chụp vì bất kỳ lý do gì, số tiền cọc 30% sẽ KHÔNG được hoàn lại.
   - Dời lịch / Bảo lưu: Studio hỗ trợ dời lịch tối đa 02 lần (có thời hạn bảo lưu) nếu khách hàng có nhu cầu hợp lý.

8. **Địa điểm chụp**:
   - Nội thành TP.HCM: Nhà thờ Đức Bà, Bưu điện TP, Landmark 81, Thảo Cầm Viên, Dinh Độc Lập...
   - Ngoại thành & Tỉnh: Cần Giờ, Củ Chi, Long An, Tây Ninh, Đà Lạt, Vũng Tàu, Phan Thiết...
   - Tại Studio: phòng chụp Cao Hiển Studio.

9. **Chuẩn bị trước buổi chụp**: Ngủ đủ giấc, uống đủ nước, chuẩn bị trang phục ủi phẳng, xác nhận lịch thợ chụp/makeup, mang đồ ăn nhẹ.

10. **Xem ngày tốt/phong tục**: Tư vấn các tháng đẹp chụp cưới, tuổi hợp, ngày cưới lịch âm. Lưu ý: luôn nhấn mạnh đây chỉ là tham khảo theo phong tục dân gian.

══════════════════════════════════
⚙️ QUY TẮC TRẢ LỜI
══════════════════════════════════

- Trả lời bằng **tiếng Việt**, thân thiện, chuyên nghiệp, tối đa 300 từ.
- Dùng bullet points hoặc đánh số cho dễ đọc, kết hợp emoji phù hợp.
- Ưu tiên tư vấn dựa trên thông tin dịch vụ, FAQ, Album và Hợp đồng của studio ở trên. KHÔNG bịa đặt giá hoặc thông tin không có.
- Nếu câu hỏi ngoài phạm vi, lịch sự từ chối và hướng dẫn liên hệ studio.
- Cuối câu trả lời, gợi ý khách hàng đặt lịch hoặc liên hệ: SĐT 0979 7676 02, Email caohienstudio@gmail.com`;
}

// ==========================================
// CHAT ENDPOINT
// ==========================================

/**
 * [POST] /api/ai-chat
 * Nhận tin nhắn từ client, thử gọi Gemini theo thứ tự model ưu tiên,
 * và trả về câu trả lời bằng tiếng Việt.
 *
 * Body: { message: string, history: Array<{ role, content }> }
 */
exports.chat = async (req, res) => {
  try {
    // Kiểm tra rate limit theo IP
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        message: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút rồi thử lại.",
      });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung câu hỏi." });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        message: "Câu hỏi quá dài. Vui lòng giới hạn dưới 1000 ký tự.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Chức năng AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Lấy dữ liệu studio để ghép vào system prompt
    const studioContext = await getStudioContext();
    const systemPrompt  = buildSystemPrompt(studioContext);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Thử các model theo thứ tự ưu tiên; model mới nhất/stable nhất trước
    const modelNames = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash"];
    let lastError    = null;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model:             modelName,
          systemInstruction: systemPrompt,
        });

        // Chuyển đổi lịch sử chat sang định dạng Gemini
        // Chỉ giữ 10 cặp (20 message) gần nhất để tiết kiệm token
        const chatHistory = [];
        if (Array.isArray(history)) {
          const recentHistory = history.slice(-20);
          for (const msg of recentHistory) {
            if (msg.role === "user" && msg.content) {
              chatHistory.push({ role: "user",  parts: [{ text: msg.content }] });
            } else if (msg.role === "assistant" && msg.content) {
              chatHistory.push({ role: "model", parts: [{ text: msg.content }] });
            }
          }
        }

        const chat   = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message.trim());
        const reply  = result.response.text();

        return res.status(200).json({ reply, timestamp: new Date().toISOString() });
      } catch (modelError) {
        console.error(`❌ Model ${modelName} failed:`, modelError.message);
        lastError = modelError;

        // Lỗi API key → không cần thử model khác
        if (
          modelError.message?.includes("API_KEY_INVALID") ||
          modelError.message?.includes("API key not valid") ||
          modelError.status === 400
        ) {
          break;
        }
      }
    }

    // Tất cả model đều thất bại → xử lý lỗi cụ thể
    const errorMsg = lastError?.message || "Unknown error";
    console.error("❌ AI Chat Error (all models failed):", errorMsg);

    if (errorMsg.includes("API_KEY") || errorMsg.includes("API key not valid") || errorMsg.includes("invalid")) {
      return res.status(500).json({
        message: "API key không hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env.",
      });
    }

    if (errorMsg.includes("SAFETY")) {
      return res.status(400).json({
        message: "Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng thử câu hỏi khác liên quan đến dịch vụ studio.",
      });
    }

    if (errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({
        message: "Hệ thống AI đang quá tải. Vui lòng thử lại sau vài phút.",
      });
    }

    res.status(500).json({
      message: `Xin lỗi, đã có lỗi xảy ra: ${errorMsg.substring(0, 100)}. Vui lòng thử lại hoặc liên hệ studio qua hotline 0979 7676 02.`,
    });
  } catch (error) {
    console.error("❌ AI Chat Critical Error:", error.message);
    res.status(500).json({
      message: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ studio qua hotline 0979 7676 02.",
    });
  }
};
