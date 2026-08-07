import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi there! How can I help you with our kitchen appliances or cookware today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulated Bot Response logic tailored for Modena Kitchen Appliances & Cookware
    setTimeout(() => {
      let replyText = "Thank you for reaching out! A Modena customer care specialist will assist you shortly. You can also explore our catalog for top-rated cookware and kitchen appliances.";

      const lower = userText.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('discount')) {
        replyText = "We offer competitive prices on all our premium kitchenware! Check out our physical store products section for special sales and discounts.";
      } else if (lower.includes('mixer') || lower.includes('grinder') || lower.includes('appliance') || lower.includes('cookware')) {
        replyText = "Our heavy-duty mixers, grinders, and cast-iron cookware are top bestsellers! Would you like recommendations for a specific model?";
      } else if (lower.includes('shipping') || lower.includes('delivery')) {
        replyText = "We offer fast nationwide shipping! Standard orders ship within 1-2 business days with express tracking.";
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        replyText = "Hello! Looking for a specific kitchen appliance or cookware item today?";
      } else if (lower.includes('warranty') || lower.includes('guarantee')) {
        replyText = "All Modena appliances come with a 1-year manufacturer warranty and free technical support!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 2. Closed State: Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Modena Support Chat"
          className="h-14 w-14 rounded-full bg-[#E60000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative group focus:outline-none focus:ring-4 focus:ring-[#E60000]/40"
        >
          <MessageCircle className="w-7 h-7 text-white fill-white/20 transition-transform duration-200 group-hover:rotate-12" />
          {/* Notification Dot */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* 3. Opened State: Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 rounded-lg shadow-2xl bg-[#FAF8F6] overflow-hidden flex flex-col border border-[#E8E1DC] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* 4. Header */}
          <div className="bg-[#2A2724] text-white p-3.5 flex items-center justify-between font-['Jost',sans-serif] shadow-md select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#E60000] text-white shadow">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#2A2724]"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight text-white tracking-wide flex items-center gap-1.5">
                  Modena Support
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <p className="text-[11px] text-gray-300 font-normal">Typically replies instantly</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
              className="text-gray-300 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4. Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-['Inter',sans-serif] bg-[#FAF8F6]">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-6 h-6 rounded-full bg-[#2A2724] text-white flex items-center justify-center text-[10px] flex-shrink-0 mb-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                      isBot
                        ? 'bg-[#EFEAE6] text-[#2A2724] rounded-bl-xs border border-[#E8E1DC]'
                        : 'bg-[#E60000] text-white rounded-br-xs font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right font-normal ${
                        isBot ? 'text-[#7C746E]' : 'text-white/80'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>

                  {!isBot && (
                    <div className="w-6 h-6 rounded-full bg-[#E60000] text-white flex items-center justify-center text-[10px] flex-shrink-0 mb-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-[#7C746E] text-xs p-2 bg-[#EFEAE6] w-max rounded-full border border-[#E8E1DC] animate-pulse">
                <Bot className="w-3.5 h-3.5 text-[#2A2724]" />
                <span>Modena Support is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 4. Input Area */}
          <form
            onSubmit={handleSend}
            className="p-2.5 bg-white border-t border-[#E8E1DC] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about kitchenware..."
              className="flex-1 bg-[#FAF8F6] border border-[#E8E1DC] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#2A2724] placeholder-gray-400 focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="bg-[#E60000] hover:bg-[#CC0000] text-white p-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
