import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, ArrowLeft } from 'lucide-react';

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

  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 11));
  const [chatState, setChatState] = useState('chat'); // 'chat' | 'human_support'
  const [isEscalated, setIsEscalated] = useState(false);

  const handleBackToAI = () => {
    setChatState('chat');
    setIsOpen(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'bot',
        text: "I'm back! How else can I assist you with Modena products?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping, chatState]);

  const handleSubmit = async (e) => {
    // 1. THIS IS THE LINE THAT STOPS THE PAGE REFRESH!
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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

    try {
      // Connect to FastAPI RAG Chatbot Assistant Backend Endpoint via proxied path
      const response = await fetch('/api/v1/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userText
        })
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const aiResponse = await response.json();
        setIsTyping(false);

        // Check for the escalation status from FastAPI server
        if (aiResponse.status === 'escalate') {
          // Tell React state to swap chat view for human support link/form
          setChatState('human_support');
          setIsEscalated(true);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text: aiResponse.message || 'I need to connect you with a human expert.',
              isEscalation: true,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else {
          // Normal chat behavior
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text: aiResponse.message,
              confidence: aiResponse.confidence,
              products: aiResponse.retrieved_products,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
        return;
      }
    } catch (err) {
      console.warn('RAG FastAPI backend offline or non-JSON response, executing local fallback:', err);
    }

    // Local fallback if FastAPI server is initializing
    setTimeout(() => {
      let replyText = "Thank you for reaching out! A Modena customer care specialist will assist you shortly. You can also explore our catalog for top-rated cookware and kitchen appliances.";
      const lower = userText.toLowerCase();
      if (lower.includes('human') || lower.includes('agent') || lower.includes('support')) {
        setIsEscalated(true);
        replyText = "I need to connect you with a human expert.";
      } else if (lower.includes('price') || lower.includes('cost')) {
        replyText = "We offer competitive prices on all our premium kitchenware! Check out our physical store products section for special sales and discounts.";
      } else if (lower.includes('mixer') || lower.includes('grinder')) {
        replyText = "Our Modena Sindoor 990W Heavy Duty Mixer Grinder is available for ₹2,500. It features a 100% copper motor with dual airflow cooling!";
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
    }, 800);
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

          {/* 4. Content Area: Swap between Chat and Human Support View */}
          {chatState === 'human_support' ? (
            <div className="flex-1 p-4 bg-amber-50/50 flex flex-col justify-between items-center text-center font-['Inter',sans-serif]">
              <div className="my-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#E60000] text-white flex items-center justify-center mx-auto shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 font-['Jost',sans-serif]">
                  Connecting to Modena Support Specialist
                </h4>
                <p className="text-xs text-gray-600 px-2 leading-relaxed">
                  I need to connect you with a human expert for personalized support on this inquiry.
                </p>
                <div className="pt-2 flex flex-col gap-2 w-full max-w-[220px] mx-auto">
                  <a
                    href="mailto:support@modena.in?subject=Escalated%20Customer%20Support%20Ticket"
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#E60000] hover:bg-[#b70100] text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow transition-all block cursor-pointer"
                  >
                    📧 Email Customer Care
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBackToAI();
                    }}
                    className="w-full bg-white hover:bg-gray-100 text-gray-700 font-medium text-xs py-2 px-4 rounded-lg border border-gray-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Assistant
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Message Area */}
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
                            ? msg.isEscalation
                              ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-xs'
                              : 'bg-[#EFEAE6] text-[#2A2724] rounded-bl-xs border border-[#E8E1DC]'
                            : 'bg-[#E60000] text-white rounded-br-xs font-medium'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        {msg.isEscalation && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                              🎧 Connect with Human Specialist:
                            </span>
                            <button
                              onClick={() => setChatState('human_support')}
                              className="bg-[#E60000] hover:bg-[#b70100] text-white text-[11px] font-bold py-1.5 px-3 rounded-lg text-center transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Open Support Portal
                            </button>
                          </div>
                        )}
                        <span
                          className={`block text-[9px] mt-1 text-right font-normal ${
                            isBot ? (msg.isEscalation ? 'text-amber-700' : 'text-[#7C746E]') : 'text-white/80'
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

              {/* Input Area */}
              <form
                onSubmit={handleSubmit}
                className="p-2.5 bg-white border-t border-[#E8E1DC] flex items-center gap-2"
              >
                <input
                  id="chatbot-message-input"
                  name="chatbot_message"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask about kitchenware..."
                  className="flex-1 bg-[#FAF8F6] border border-[#E8E1DC] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#2A2724] placeholder-gray-400 focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="bg-[#E60000] hover:bg-[#CC0000] text-white p-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
