import React, { useEffect, useRef, useState } from "react";
import { useCart } from "../../hooks/useCart";
import "./Chatbot.css";

const CHAT_URL = "/api/v1/chatbot/chat";
const UPLOAD_URL = "/api/v1/chatbot/upload";
const ORDERS_URL = "/api/v1/chatbot/orders";

const getApiLanguage = (language) => {
  if (language === "te") return "telugu";
  if (language === "en") return "english";
  return "auto";
};

const detectReplyLanguage = (text, selectedLanguage) => {
  if (selectedLanguage === "te") return "te";
  if (selectedLanguage === "en") return "en";

  return /[\u0C00-\u0C7F]/.test(text) ? "te" : "en";
};

// Detect customer order-support questions.
const isOrderQuestion = (text) => {
  const lower = text.toLowerCase();

  const englishPatterns = [
    "my order",
    "my orders",
    "order status",
    "track order",
    "track my",
    "where is my order",
    "where's my order",
    "show my order",
    "show my orders",
    "order details",
    "order history",
    "latest order",
    "recent order",
    "delivery status",
    "cancel my order",
    "cancel order",
    "refund",
    "return my order",
    "return this order",
  ];

  const teluguPatterns = [
    "నా ఆర్డర్",
    "నా ఆర్డర్లు",
    "ఆర్డర్ ఎక్కడ",
    "ఆర్డర్ స్టేటస్",
    "ఆర్డర్ వివరాలు",
    "డెలివరీ ఎప్పుడు",
    "ఆర్డర్ ట్రాక్",
    "ఆర్డర్ రద్దు",
    "క్యాన్సిల్",
    "రిఫండ్",
    "వాపసు",
  ];

  if (
    englishPatterns.some((pattern) =>
      lower.includes(pattern)
    )
  ) {
    return true;
  }

  if (
    teluguPatterns.some((pattern) =>
      text.includes(pattern)
    )
  ) {
    return true;
  }

  const possibleOrderId = text.trim();

  return /^[A-Z2-7]{8,32}$/i.test(possibleOrderId);
};

// Detect shopping-cart questions.
const isCartQuestion = (text) => {
  const lower = text.toLowerCase();

  const englishPatterns = [
    "my cart",
    "show cart",
    "view cart",
    "open cart",
    "cart items",
    "items in cart",
    "cart total",
    "cart value",
    "what is in my cart",
    "what's in my cart",
    "what did i add",
    "what have i added",
    "products i added",
    "my shopping bag",
    "show my bag",
    "my bag",
    "cart",
    "shopping bag",
  ];

  const teluguPatterns = [
    "నా కార్ట్",
    "కార్ట్ చూపించు",
    "నా కార్ట్ లో",
    "కార్ట్ లో ఏమున్నాయి",
    "నేను ఏమి యాడ్ చేశాను",
    "నా బ్యాగ్",
    "నా కార్ట్ మొత్తం",
  ];

  return (
    englishPatterns.some((pattern) =>
      lower.includes(pattern)
    ) ||
    teluguPatterns.some((pattern) =>
      text.includes(pattern)
    )
  );
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

export default function Chatbot() {
  const {
    cartItems = [],
    totalItems = 0,
    totalPrice = 0,
    cartLoading = false,
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [language, setLanguage] = useState("auto");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [notice, setNotice] = useState("");

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! 👋 Welcome to TechLite! How can I help you today?",
      language: "en",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // =================================================
  // VOICE OUTPUT
  // =================================================

  const speakText = (text, selectedLanguage = language) => {
    if (!("speechSynthesis" in window)) {
      setNotice("Speech playback is not supported in this browser.");
      return;
    }

    const speechLanguage = detectReplyLanguage(
      text,
      selectedLanguage
    );

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang =
      speechLanguage === "te" ? "te-IN" : "en-IN";

    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();

    const preferredVoice = voices.find((voice) =>
      speechLanguage === "te"
        ? voice.lang.toLowerCase().startsWith("te")
        : voice.lang.toLowerCase() === "en-in"
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const addAssistantMessage = (
    text,
    replyLanguage,
    cartSnapshot = null
  ) => {
    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        text,
        language: replyLanguage,
        cartSnapshot,
      },
    ]);

    if (voiceEnabled) {
      speakText(text, replyLanguage);
    }
  };

  // =================================================
  // LIVE CART RESPONSE
  // =================================================

  const getCartResponse = () => {
    if (cartLoading) {
      return {
        text:
          language === "te"
            ? "మీ కార్ట్ వివరాలను లోడ్ చేస్తున్నాను. దయచేసి వేచి ఉండండి."
            : "Your cart is still loading. Please wait a moment.",
        cartSnapshot: null,
      };
    }

    if (!cartItems.length) {
      return {
        text:
          language === "te"
            ? "మీ కార్ట్ ఖాళీగా ఉంది. 🛒 TechLite లో మీకు నచ్చిన ఉత్పత్తులను జోడించండి!"
            : "Your shopping cart is currently empty. 🛒 Browse TechLite products and add your favourites!",
        cartSnapshot: null,
      };
    }

    const itemDetails = cartItems.map((item) => ({
      id: item.id,
      name: item.name || "Product",
      image: item.image || item.image_url || "",
      price: Number(item.priceNum ?? item.price ?? 0),
      quantity: Number(item.quantity || 0),
    }));

    const lines = itemDetails.map(
      (item, index) => {
        const lineTotal = item.price * item.quantity;

        return `${index + 1}. ${item.name}\n   Price: ${formatPrice(item.price)}\n   Quantity: ${item.quantity}\n   Subtotal: ${formatPrice(lineTotal)}`;
      }
    );

    const reply =
      language === "te"
        ? `మీ TechLite కార్ట్ వివరాలు 🛒\n\n${lines.join("\n\n")}\n\nమొత్తం ఉత్పత్తుల సంఖ్య: ${totalItems}\nకార్ట్ సబ్‌టోటల్: ${formatPrice(totalPrice)}\n\nమరిన్ని వివరాలు కావాలంటే అడగండి!`
        : `Here is what you added to your TechLite cart! 🛒\n\n${lines.join("\n\n")}\n\nTotal items: ${totalItems}\nCart subtotal: ${formatPrice(totalPrice)}\n\nWould you like to know anything else about your cart?`;

    return {
      text: reply,
      cartSnapshot: itemDetails,
    };
  };

  // =================================================
  // SEND MESSAGE
  // =================================================

  const sendChat = async (text, file = null) => {
    if ((!text.trim() && !file) || loading) return;

    setNotice("");

    const userDisplayText = file
      ? `${file.name}${text.trim() ? `\n${text.trim()}` : ""}`
      : text;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: userDisplayText,
        fileName: file?.name || null,
      },
    ]);

    setMessage("");
    setSelectedFile(null);
    setLoading(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      // 1. IMAGE OR PDF UPLOAD
      if (file) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("message", text);
        formData.append(
          "language",
          getApiLanguage(language)
        );

        const response = await fetch(UPLOAD_URL, {
          method: "POST",
          body: formData,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Unable to process your uploaded file."
          );
        }

        const reply =
          data.reply || "I couldn't generate a response.";

        addAssistantMessage(
          reply,
          detectReplyLanguage(reply, language)
        );

      }

      // 2. LIVE CART QUESTIONS
      else if (isCartQuestion(text)) {
        const result = getCartResponse();

        addAssistantMessage(
          result.text,
          detectReplyLanguage(result.text, language),
          result.cartSnapshot
        );
      }

      // 3. CUSTOMER ORDER SUPPORT
      else if (isOrderQuestion(text)) {
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error(
            language === "te"
              ? "మీ ఆర్డర్ వివరాలు చూడటానికి ముందుగా TechLite ఖాతాలో Login చేయండి."
              : "Please log in to your TechLite account to view your private order details."
          );
        }

        const response = await fetch(ORDERS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text,
            language: getApiLanguage(language),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Unable to process your order request."
          );
        }

        const reply =
          data.reply || "I couldn't generate a response.";

        addAssistantMessage(
          reply,
          detectReplyLanguage(reply, language)
        );

      }

      // 4. NORMAL PRODUCT SEARCH OR CHAT
      else {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            language: getApiLanguage(language),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Unable to process your request."
          );
        }

        const reply =
          data.reply || "I couldn't generate a response.";

        addAssistantMessage(
          reply,
          detectReplyLanguage(reply, language)
        );
      }

    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Error: ${error.message}`,
          language: "en",
        },
      ]);

    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // TEXT SUBMISSION
  // =================================================

  const sendMessage = async (event) => {
    event.preventDefault();

    await sendChat(
      message.trim(),
      selectedFile
    );
  };

  // =================================================
  // FILE UPLOAD
  // =================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extensionAllowed =
      /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name);

    if (!extensionAllowed) {
      setNotice(
        "Please select a JPG, PNG, WEBP or PDF file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setNotice("File size must not exceed 10 MB.");

      event.target.value = "";
      return;
    }

    setNotice("");
    setSelectedFile(file);
  };

  // =================================================
  // MICROPHONE
  // =================================================

  const toggleMicrophone = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setNotice(
        "Speech recognition is unavailable. Please check browser support."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (loading) return;

    setNotice("");

    const recognition = new SpeechRecognition();

    recognition.lang =
      language === "te" ? "te-IN" : "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript.trim();

      if (transcript) {
        setMessage(transcript);
        sendChat(transcript, selectedFile);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        setNotice(
          `Microphone error: ${event.error}. Check microphone permissions and language support.`
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);

      setNotice(
        "Unable to start the microphone. Please try again."
      );
    }
  };

  // =================================================
  // SPEAKER
  // =================================================

  const toggleSpeaker = () => {
    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  };

  // =================================================
  // USER INTERFACE
  // =================================================

  return (
    <div className="chatbot-container">

      {isOpen && (
        <div className="chatbot-window">

          {/* HEADER */}
          <div className="chatbot-header">

            <div className="chatbot-title">
              <h3>TechLite AI Assistant</h3>
              <span>● Online Support</span>
            </div>

            <div className="chatbot-header-actions">

              <button
                type="button"
                onClick={toggleSpeaker}
                title={voiceEnabled ? "Turn voice off" : "Turn voice on"}
                aria-label="Toggle voice output"
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }}
                aria-label="Close chatbot"
              >
                ×
              </button>

            </div>
          </div>

          {/* LANGUAGE */}
          <div className="chatbot-language">

            <label htmlFor="chat-language">
              Chat language
            </label>

            <select
              id="chat-language"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                recognitionRef.current?.abort();
                setIsListening(false);
              }}
            >
              <option value="auto">Auto detect</option>
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>

          </div>

          {/* MESSAGES */}
          <div
            className="chatbot-messages"
            role="log"
            aria-live="polite"
          >

            {messages.map((item, index) => (
              <div
                key={index}
                className={`chat-message ${item.role}`}
              >

                <div>{item.text}</div>

                {/* LIVE CART PRODUCT CARDS */}
                {item.cartSnapshot?.length > 0 && (
                  <div className="chatbot-cart-products">

                    {item.cartSnapshot.map((product) => (
                      <div
                        className="chatbot-cart-product"
                        key={product.id}
                      >

                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="chatbot-cart-image"
                          />
                        )}

                        <div className="chatbot-cart-product-info">
                          <strong>{product.name}</strong>

                          <span>
                            Price: {formatPrice(product.price)}
                          </span>

                          <span>
                            Quantity: {product.quantity}
                          </span>

                          <strong>
                            Subtotal:{" "}
                            {formatPrice(
                              product.price * product.quantity
                            )}
                          </strong>
                        </div>

                      </div>
                    ))}

                  </div>
                )}

                {item.role === "assistant" && (
                  <button
                    type="button"
                    className="chatbot-speak-message"
                    onClick={() =>
                      speakText(item.text, item.language)
                    }
                    title="Speak this answer"
                    aria-label="Speak this answer"
                  >
                    🔊
                  </button>
                )}

              </div>
            ))}

            {loading && (
              <div className="chat-message assistant">
                Analysing your request...
              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

          {/* FILE PREVIEW */}
          {selectedFile && (
            <div className="chatbot-selected-file">

              <span>
                📎 {selectedFile.name}
              </span>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                aria-label="Remove selected file"
              >
                ×
              </button>

            </div>
          )}

          {notice && (
            <div className="chatbot-notice" role="alert">
              {notice}
            </div>
          )}

          {/* MESSAGE INPUT */}
          <form
            className="chatbot-input"
            onSubmit={sendMessage}
          >

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              hidden
            />

            <button
              type="button"
              className="chatbot-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Upload photo or PDF"
              aria-label="Upload photo or PDF"
            >
              📎
            </button>

            <button
              type="button"
              className={`chatbot-microphone ${
                isListening ? "listening" : ""
              }`}
              onClick={toggleMicrophone}
              disabled={loading}
              title={
                isListening
                  ? "Stop speaking"
                  : "Speak in selected language"
              }
              aria-label="Use microphone"
            >
              {isListening ? "⏹" : "🎤"}
            </button>

            <input
              type="text"
              placeholder="Ask in English or తెలుగు..."
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              disabled={loading}
            />

            <button
              type="submit"
              disabled={
                loading ||
                (!message.trim() && !selectedFile)
              }
            >
              ➤
            </button>

          </form>

          <div className="chatbot-footer">
            Products · Cart · Orders · Support · Photos · PDFs
          </div>

        </div>
      )}

      {/* FLOATING BUTTON */}
      <button
        className="chatbot-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI chatbot"
      >
        {isOpen ? "×" : "💬"}
      </button>

    </div>
  );
}