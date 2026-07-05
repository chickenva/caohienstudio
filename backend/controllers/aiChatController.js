const { GoogleGenerativeAI } = require("@google/generative-ai");
const Service = require("../models/Service");
const User = require("../models/User");

// ==========================================
// Rate limiting (in-memory, simple)
// ==========================================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 phút
const RATE_LIMIT_MAX = 20; // 20 messages / phút / IP

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Dọn dẹp rate limit map mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ==========================================
// Lấy dữ liệu studio từ database
// ==========================================
async function getStudioContext() {
  try {
    const [services, photographers] = await Promise.all([
      Service.find({ is_active: true }).lean(),
      User.find({ role: "PHOTOGRAPHER", is_active: true }).lean(),
    ]);

    // Format dịch vụ
    const servicesText = services.length > 0
      ? services.map((s) =>
        `- ${s.name}: ${s.base_price?.toLocaleString("vi-VN")}đ, thời lượng ${s.duration_hours} giờ${s.description ? ` – ${s.description}` : ""}`
      ).join("\n")
      : "Chưa có thông tin dịch vụ.";

    // Format thợ chụp
    const photographersText = photographers.length > 0
      ? photographers.map((p) => {
        const portfolio = p.portfolio || {};
        return `- ${p.full_name}${portfolio.years_of_experience ? ` (${portfolio.years_of_experience} năm kinh nghiệm)` : ""}${portfolio.specialties?.length ? `, chuyên: ${portfolio.specialties.join(", ")}` : ""}${portfolio.bio ? ` – ${portfolio.bio}` : ""}`;
      }).join("\n")
      : "Chưa có thông tin thợ chụp.";

    return { servicesText, photographersText };
  } catch (error) {
    console.error("Lỗi lấy dữ liệu studio context:", error.message);
    return {
      servicesText: "Không thể tải thông tin dịch vụ lúc này.",
      photographersText: "Không thể tải thông tin thợ chụp lúc này.",
    };
  }
}

// ==========================================
// System prompt tiếng Việt
// ==========================================
function buildSystemPrompt(context) {
  return `Bạn là "Trợ lý Cao Hiển" – tư vấn viên AI thân thiện và chuyên nghiệp của Cao Hiển Photography Studio (CAOHIENPHOTOGRAPHY), một studio chụp ảnh cao cấp tại TP. Hồ Chí Minh, Việt Nam.

══════════════════════════════════
📋 THÔNG TIN DỊCH VỤ CỦA STUDIO
══════════════════════════════════

🎯 CÁC GÓI CHỤP:
${context.servicesText}

👨‍💼 ĐỘI NGŨ THỢ CHỤP:
${context.photographersText}

══════════════════════════════════
📌 NHIỆM VỤ CỦA BẠN
══════════════════════════════════

1. **Tư vấn dịch vụ**: Giới thiệu các gói chụp ảnh, giá cả, thời lượng. So sánh các gói để khách hàng chọn phù hợp ngân sách và nhu cầu.

2. **Gợi ý thợ chụp**: Dựa trên phong cách chụp, sở trường và kinh nghiệm để giới thiệu thợ chụp phù hợp.

3. **Concept & trang phục**:
   - Gợi ý concept chụp: pre-wedding, ảnh cưới, gia đình, kỷ yếu, chân dung nghệ thuật, couple, newborn, thời trang...
   - Tư vấn trang phục theo concept: màu sắc, kiểu dáng, phụ kiện
   - Gợi ý phong cách trang điểm phù hợp

4. **Địa điểm chụp**: Gợi ý các địa điểm chụp đẹp tại TP.HCM và các tỉnh lân cận:
   - Nội thành: Nhà thờ Đức Bà, Bưu điện TP, phố Nguyễn Huệ, Landmark 81, Thảo Cầm Viên, Dinh Độc Lập...
   - Ngoại thành: Cần Giờ, Củ Chi, Long An, Tây Ninh...
   - Studio trong nhà: phòng chụp của Cao Hiển Studio
   - Đà Lạt, Phan Thiết, Vũng Tàu cho chuyến chụp xa

5. **Chuẩn bị trước buổi chụp** – Checklist gợi ý:
   - Ngủ đủ giấc, uống đủ nước 2-3 ngày trước
   - Chuẩn bị trang phục đã ủi phẳng, phụ kiện
   - Trang điểm / thỏa thuận makeup artist
   - Lên danh sách pose, mood board tham khảo
   - Xác nhận lịch với thợ chụp
   - Mang theo đồ ăn nhẹ, nước uống

6. **Tư vấn ngày tốt / phong tục Việt Nam** (tham khảo, không mang tính mê tín):
   - Xem ngày tốt chụp ảnh cưới, ngày cưới theo lịch âm
   - Các tháng đẹp để chụp cưới (tránh tháng 7 âm lịch, tháng Ngâu)
   - Tuổi xung hợp: tam hợp, tứ hành xung, nhị hợp theo 12 con giáp
   - Lưu ý: Nhấn mạnh đây chỉ là tham khảo theo phong tục dân gian, quan trọng nhất là hạnh phúc của đôi uyên ương

══════════════════════════════════
⚙️ QUY TẮC TRẢ LỜI
══════════════════════════════════

- Trả lời bằng **tiếng Việt**, thân thiện, chuyên nghiệp
- Câu trả lời ngắn gọn, súc tích (tối đa 300 từ), có cấu trúc rõ ràng
- Sử dụng emoji phù hợp để tạo cảm giác thân thiện (nhưng không lạm dụng)
- Khi liệt kê, dùng bullet points hoặc đánh số
- Ưu tiên thông tin từ dữ liệu studio ở trên trước, sau đó mới bổ sung kiến thức chung
- Nếu câu hỏi ngoài phạm vi (không liên quan đến studio/nhiếp ảnh/cưới hỏi), lịch sự từ chối và hướng dẫn khách hàng liên hệ trực tiếp
- Khi tư vấn phong tục, luôn nhấn mạnh "đây chỉ là tham khảo theo phong tục dân gian"
- Cuối câu trả lời tư vấn dịch vụ, gợi ý khách hàng đặt lịch hoặc liên hệ để được hỗ trợ thêm
- Liên hệ studio: SĐT 0979 7676 02, Email caohienstudio@gmail.com`;
}

// ==========================================
// POST /api/ai-chat
// ==========================================
exports.chat = async (req, res) => {
  try {
    // Rate limit check
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        message: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút rồi thử lại.",
      });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        message: "Vui lòng nhập nội dung câu hỏi.",
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        message: "Câu hỏi quá dài. Vui lòng giới hạn dưới 1000 ký tự.",
      });
    }

    // Kiểm tra API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Chức năng AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Lấy context từ database
    const studioContext = await getStudioContext();
    const systemPrompt = buildSystemPrompt(studioContext);

    // Khởi tạo Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Thử các model theo thứ tự ưu tiên
    const modelNames = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash"];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });

        // Build conversation history cho Gemini
        const chatHistory = [];
        if (Array.isArray(history)) {
          // Chỉ giữ 10 cặp tin nhắn gần nhất để tiết kiệm token
          const recentHistory = history.slice(-20);
          for (const msg of recentHistory) {
            if (msg.role === "user" && msg.content) {
              chatHistory.push({
                role: "user",
                parts: [{ text: msg.content }],
              });
            } else if (msg.role === "assistant" && msg.content) {
              chatHistory.push({
                role: "model",
                parts: [{ text: msg.content }],
              });
            }
          }
        }

        // Tạo chat session và gửi tin nhắn
        const chat = model.startChat({
          history: chatHistory,
        });

        const result = await chat.sendMessage(message.trim());
        const reply = result.response.text();

        return res.status(200).json({
          reply,
          timestamp: new Date().toISOString(),
        });
      } catch (modelError) {
        console.error(`❌ Model ${modelName} failed:`, modelError.message);
        lastError = modelError;

        // Nếu lỗi API key → không cần thử model khác
        if (
          modelError.message?.includes("API_KEY_INVALID") ||
          modelError.message?.includes("API key not valid") ||
          modelError.status === 400
        ) {
          break;
        }
        // Tiếp tục thử model khác
        continue;
      }
    }

    // Nếu tất cả model đều fail
    const errorMsg = lastError?.message || "Unknown error";
    console.error("❌ AI Chat Error (all models failed):", errorMsg);
    console.error("❌ Full error:", JSON.stringify(lastError, Object.getOwnPropertyNames(lastError), 2));

    // Xử lý lỗi cụ thể từ Gemini
    if (errorMsg.includes("API_KEY") || errorMsg.includes("API key not valid") || errorMsg.includes("invalid")) {
      return res.status(500).json({
        message: "API key không hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env. API key Gemini thường bắt đầu bằng 'AIza...'",
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
    console.error("❌ Stack:", error.stack);
    res.status(500).json({
      message: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ studio qua hotline 0979 7676 02.",
    });
  }
};
