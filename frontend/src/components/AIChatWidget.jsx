import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  SendOutlined,
  CloseOutlined,
  RobotOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "./AIChatWidget.css";

// ==========================================
// Render Markdown đơn giản thành HTML an toàn ở mức cơ bản cho bong bóng chat
// ==========================================
// Chuyển một số cú pháp Markdown phổ biến thành HTML.
function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    // Unordered list items
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Line breaks
    .replace(/\n/g, "<br/>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li>(?:<br\/>)?)+)/g, (match) => {
    const cleaned = match.replace(/<br\/>/g, "");
    return `<ul>${cleaned}</ul>`;
  });

  return html;
}

// ==========================================
// Các câu hỏi nhanh giúp khách bắt đầu cuộc trò chuyện
// ==========================================
const QUICK_ACTIONS = [
  { label: "📸 Gói chụp", message: "Studio có những gói chụp ảnh nào? Giá cả thế nào?" },
  { label: "📷 Thuê thiết bị", message: "Tôi muốn tìm hiểu về dịch vụ thuê máy ảnh và thiết bị" },
  { label: "🎨 Concept chụp", message: "Gợi ý concept chụp ảnh cưới đẹp và trang phục phù hợp" },
  { label: "📅 Ngày tốt", message: "Tư vấn ngày tốt để chụp ảnh cưới và tổ chức đám cưới" },
  { label: "📋 Chuẩn bị", message: "Cần chuẩn bị những gì trước buổi chụp ảnh?" },
];

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Xin chào! 👋 Tôi là **Trợ lý Cao Hiển**, luôn sẵn sàng hỗ trợ bạn.\n\nTôi có thể tư vấn cho bạn về:\n- 📸 Các gói chụp ảnh & bảng giá\n- 📷 Thuê máy ảnh, thiết bị\n- 🎨 Gợi ý concept, trang phục, địa điểm\n- 📅 Tư vấn ngày tốt, phong tục cưới hỏi\n- 📋 Checklist chuẩn bị trước buổi chụp\n\nBạn cần tư vấn gì ạ? 😊",
  timestamp: new Date().toISOString(),
};

const API_URL = "http://localhost:5000/api/ai-chat";

// ==========================================
// Component chính của widget chat AI
// ==========================================
// Widget chat nổi dùng API AI backend để tư vấn khách hàng.
const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Giữ trạng thái mở chat trong ref để callback async không bị stale state
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Tự cuộn xuống tin nhắn mới nhất
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus ô nhập khi mở khung chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Nhóm hàm mở/đóng khung chat
  const handleOpen = () => {
    setIsOpen(true);
    setIsClosing(false);
    setShowBadge(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setIsMaximized(false);
    }, 250);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Gửi tin nhắn user lên backend và thêm câu trả lời AI vào hội thoại
  const sendMessage = async (text) => {
    const trimmed = (text || inputValue).trim();
    if (!trimmed || isLoading) return;

    setHasInteracted(true);
    setInputValue("");

    // Add user message
    const userMsg = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history (skip welcome message)
      const history = messages
        .filter((_, idx) => idx > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await axios.post(API_URL, {
        message: trimmed,
        history,
      });

      const assistantMsg = {
        role: "assistant",
        content: response.data.reply,
        timestamp: response.data.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (!isOpenRef.current) {
        setShowBadge(true);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";

      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: errorMsg,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi tin khi nhấn Enter, xuống dòng khi Shift+Enter.
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Gửi nội dung mẫu khi khách bấm câu hỏi nhanh.
  const handleQuickAction = (action) => {
    sendMessage(action.message);
  };

  // Format giờ gửi tin theo ngôn ngữ Việt Nam
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && !isClosing && <div className="ai-chat-overlay" onClick={handleClose} />}

      {/* Chat Window */}
      {isOpen && (
        <div className={`ai-chat-window ${isClosing ? "closing" : ""} ${isMaximized ? "maximized" : ""}`}>
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-avatar">✨</div>
            <div className="ai-chat-header-info">
              <div className="ai-chat-header-title">Trợ lý Cao Hiển</div>
              <div className="ai-chat-header-subtitle">
                <span className="ai-chat-header-dot" />
                <span>Luôn sẵn sàng hỗ trợ</span>
              </div>
            </div>
            <button
              className="ai-chat-header-maximize"
              onClick={() => setIsMaximized(!isMaximized)}
              aria-label={isMaximized ? "Thu nhỏ" : "Phóng to"}
            >
              {isMaximized ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
            <button
              className="ai-chat-header-close"
              onClick={handleClose}
              aria-label="Đóng chat"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages" ref={messagesContainerRef}>
            {/* Welcome block (only if no interaction yet) */}
            {!hasInteracted && (
              <div className="ai-chat-welcome">
                <div className="ai-chat-welcome-icon">✨</div>
                <h3>Xin chào!</h3>
                <p>
                  Tôi là trợ lý AI của Cao Hiển Studio.
                  <br />
                  Hãy hỏi tôi bất cứ điều gì về dịch vụ studio nhé!
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              if (msg.role === "error") {
                return (
                  <div key={idx} className="ai-chat-error">
                    <ExclamationCircleOutlined />
                    <span>{msg.content}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className={`ai-chat-msg ${msg.role}`}>
                  <div className="ai-chat-msg-avatar">
                    {msg.role === "assistant" ? "✨" : <UserOutlined />}
                  </div>
                  <div>
                    <div
                      className="ai-chat-msg-bubble"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(msg.content),
                      }}
                    />
                    <div className="ai-chat-msg-time">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="ai-chat-typing">
                <div className="ai-chat-msg-avatar" style={{ background: "linear-gradient(135deg, #BFA16A, #D4B97A)" }}>
                  ✨
                </div>
                <div className="ai-chat-typing-bubble">
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {!hasInteracted && (
            <div className="ai-chat-quick-actions">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  className="ai-chat-quick-btn"
                  onClick={() => handleQuickAction(action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="ai-chat-input-area">
            <div className="ai-chat-input-wrapper">
              <textarea
                ref={inputRef}
                className="ai-chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              className="ai-chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Gửi tin nhắn"
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="ai-chat-fab"
        onClick={handleToggle}
        aria-label={isOpen ? "Đóng chat" : "Mở chat tư vấn AI"}
        id="ai-chat-fab"
      >
        {isOpen ? (
          <CloseOutlined className="fab-close-icon" />
        ) : (
          <>
            <span className="fab-icon">✨</span>
            {showBadge && <span className="ai-chat-fab-badge" />}
          </>
        )}
      </button>
    </>
  );
};

export default AIChatWidget;
