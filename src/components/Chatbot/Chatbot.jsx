import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  User,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ShoppingBag,
  Eye,
  HeartHandshake,
  Volume2,
  VolumeX,
  ExternalLink,
  Check
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useDisplayTopology } from '../../hooks/useDisplayTopology';

const DEFAULT_SUGGESTIONS = [
  "⚡ Tell me about the 990W Mixer Grinder",
  "🍳 Cast Iron Skillet benefits & seasoning",
  "🍲 5L Heritage Dutch Oven features",
  "🚚 How do I track my active order?",
  "🔄 What is your Return & Replacement policy?"
];

const Chatbot = ({
  currentView = 'home',
  selectedProduct = null,
  onSelectProduct,
  onAddToCart,
  isCartOpen = false,
  isCheckoutOpen = false
}) => {
  const { products: liveCatalog } = useProducts();
  const { isMobile } = useDisplayTopology();
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [addedProductIds, setAddedProductIds] = useState([]);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Namaste! 👋 I'm Alex, Senior Culinary & Product Specialist at Modena Kitchenware.\n\nWhether you need advice on our **990W Heavy-Duty Mixer Grinders**, **Tri-Ply Stainless Steel**, **Cast Iron Cookware**, or help tracking an order—I'm right here to help!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: DEFAULT_SUGGESTIONS
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const catalog = Array.isArray(liveCatalog) ? liveCatalog : [];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Voice Text-To-Speech Output Handler
  const speakText = (text) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\*\*/g, '').replace(/[\r\n]+/g, ' ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback ignored
    }
  };

  const getContextSuggestions = () => {
    if (selectedProduct) {
      return [
        `Why is ${selectedProduct.name} worth buying?`,
        `What warranty & specs come with this?`,
        `Is this compatible with Induction / Gas?`,
        `How does it compare to other cookware?`
      ];
    }
    if (currentView === 'bestseller') {
      return [
        "What are Modena's top-rated bestsellers?",
        "Tell me about 990W Mixer Grinders",
        "Cast Iron Skillet features"
      ];
    }
    if (currentView === 'yourAccount') {
      return [
        "How do I track my active package?",
        "How do I start a Return or Refund?",
        "How to edit my delivery address?"
      ];
    }
    return DEFAULT_SUGGESTIONS;
  };

  const generateAIResponse = async (userQuery) => {
    const q = userQuery.toLowerCase();

    // 1. Direct Store Policy & Returns Handling
    if (q.includes('return') || q.includes('refund') || q.includes('exchange')) {
      return {
        text: "Modena offers a hassle-free **7-Day Return & Replacement Guarantee** for any transit damages or manufacturing defects.\n\nTo initiate a return:\n1. Keep original packaging & invoice.\n2. Tap **Return / Replace** in your Account Order History.\n3. We arrange free reverse pickup within 48 hours!\n\nWould you like me to guide you to the returns request form?",
        products: []
      };
    }

    if (q.includes('track') || q.includes('shipping') || q.includes('delivery')) {
      return {
        text: "We ship all orders via BlueDart & Delhivery Express across 28,000+ Indian pincodes with live SMS tracking.\n\n- Metro cities: 2 to 3 business days\n- Rest of India: 4 to 6 business days\n\nYou can track your live shipment directly from your Account Order History!",
        products: []
      };
    }

    // 2. Enterprise RAG AI Assistant Endpoint (/api/v1/chat/assistant)
    try {
      const response = await fetch('/api/v1/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'chat_session_modena_web',
          message: userQuery
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.message || data.answer || data.response;
        if (aiText) {
          let matchedProds = [];
          if (selectedProduct) {
            matchedProds = [selectedProduct];
          } else {
            matchedProds = catalog.filter((p) =>
              q.includes((p.name || '').toLowerCase()) ||
              q.includes((p.category || '').toLowerCase()) ||
              (p.name || '').toLowerCase().split(' ').some((w) => w.length > 3 && q.includes(w))
            );
          }

          return {
            text: aiText,
            products: matchedProds.length > 0 ? matchedProds.slice(0, 2) : catalog.slice(0, 2)
          };
        }
      }
    } catch {
      // Fall through to local Sales Rep intelligence engine
    }

    // 3. Fallback Sales Representative Intelligence Engine
    let responseText = "";
    let matchedProducts = [];

    if (selectedProduct && (q.includes('this') || q.includes('viewing') || q.includes('specs') || q.includes('warranty') || q.includes('price') || q.includes('induction') || q.includes('more') || q.includes('dutch'))) {
      const p = selectedProduct;
      matchedProducts = [p];
      if (p.id === 33 || (p.name || '').toLowerCase().includes('dutch oven')) {
        responseText = `The **5L Heavy Heritage Dutch Oven** (₹3,200.00) is an absolute masterpiece! Crafted from heavy ceramic-enameled cast iron, it retains heat exceptionally well for curries, biryanis, and baking artisan sourdough.\n\nThe self-basting lid traps all rich flavors and moisture! Shall I add one to your cart?`;
      } else if (p.id === 32 || (p.name || '').toLowerCase().includes('saucepan')) {
        responseText = `The **3L Tri-Ply Stainless Steel Saucepan** (₹1,850.00) features a 3-layer clad construction with a pure aluminum core between food-grade steel for 100% even heating without hot spots. Compatible with Gas and Induction!`;
      } else if ((p.name || '').toLowerCase().includes('990w') || (p.name || '').toLowerCase().includes('sindoor')) {
        responseText = `The **Modena 990W Heavy-Duty Mixer Grinder** (₹2,500.00) features a 100% heavy copper motor reaching 22,000 RPM to grind hard Indian spices in seconds! Comes with 3 stainless steel jars and a 5-Year Motor Warranty.`;
      } else if (p.id === 31 || (p.name || '').toLowerCase().includes('skillet')) {
        responseText = `The **10" Heavy Cast Iron Skillet** (₹1,450.00) is pre-seasoned with natural vegetable oil. Holds extreme heat for dosas, searing, or oven baking up to 260°C!`;
      } else {
        responseText = `The **${p.name}** is engineered for maximum heat efficiency and long-lasting durability (${p.price || p.price_html}). Would you like me to help you add it to your order?`;
      }
    } else if (q.includes('990') || q.includes('mixer') || q.includes('grind') || q.includes('sindoor')) {
      const p = catalog.find((x) => (x.name || '').toLowerCase().includes('990') || (x.name || '').toLowerCase().includes('mixer') || (x.name || '').toLowerCase().includes('sindoor')) || catalog[0];
      responseText = `Our **Modena 990W Heavy-Duty Mixer Grinder** (₹2,500.00) is built with a 100% heavy pure copper motor (22,000 RPM), 3 stainless steel jars, thermal overload protection, and a 5-Year Motor Warranty!`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('skillet') || q.includes('iron') || q.includes('cast iron')) {
      const p = catalog.find((x) => x.id === 31 || (x.name || '').toLowerCase().includes('skillet')) || catalog[1];
      responseText = `Our **10" Heavy Cast Iron Skillet** (₹1,450.00) comes pre-seasoned with natural vegetable oil out of the box—ideal for crisp dosas and searing!`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('saucepan') || q.includes('tri-ply') || q.includes('steel')) {
      const p = catalog.find((x) => x.id === 32 || (x.name || '').toLowerCase().includes('saucepan')) || catalog[2];
      responseText = `The **3L Tri-Ply Stainless Steel Saucepan** (₹1,850.00) provides 3-layer even heat distribution with zero scorch spots. Gas and Induction ready!`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('dutch') || q.includes('oven') || q.includes('biryani')) {
      const p = catalog.find((x) => x.id === 33 || (x.name || '').toLowerCase().includes('dutch')) || catalog[3];
      responseText = `The **5L Heavy Heritage Dutch Oven** (₹3,200.00) is crafted from heavy ceramic-enameled cast iron with self-basting lid spikes for rich slow-cooked meals!`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('best') || q.includes('recommend') || q.includes('top') || q.includes('bestseller')) {
      responseText = "Our **#1 Bestseller** is the **Modena 990W Heavy-Duty Mixer Grinder** (₹2,500.00) with a 5-Year Motor Warranty, alongside our **10\" Heavy Cast Iron Skillet** (₹1,450.00)!";
      matchedProducts = catalog.slice(0, 2);
    } else {
      responseText = "Namaste! How can I help upgrade your kitchen today? Ask me about our 990W Mixer Grinders, Cast Iron Skillets, Dutch Ovens, Order Tracking, or Return Policies!";
      matchedProducts = catalog.slice(0, 2);
    }

    return { text: responseText, products: matchedProducts };
  };

  const handleSend = async (customText = null, event = null) => {
    if (event) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    if (isTyping) return;

    const textToSend = (customText || input).trim();
    if (!textToSend) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsTyping(true);

    try {
      const aiRes = await generateAIResponse(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: aiRes?.text || "I'm right here! How else can I assist you with Modena cookware today?",
          products: aiRes?.products || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      speakText(aiRes?.text || "");
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I'm having a brief connection hiccup. Please try asking again in a moment!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCartClick = (p) => {
    if (onAddToCart) {
      onAddToCart(p);
      setAddedProductIds((prev) => [...prev, p.id]);
      setTimeout(() => {
        setAddedProductIds((prev) => prev.filter((id) => id !== p.id));
      }, 2000);
    }
  };

  const activeSuggestions = getContextSuggestions();

  const renderFormattedText = (text, isBot) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className={isBot ? "font-extrabold text-[#E60000]" : "font-extrabold text-white underline"}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-out ${
        isOpen && isMobile
          ? 'inset-0 w-full h-full flex flex-col'
          : isCheckoutOpen
          ? 'hidden'
          : isCartOpen
          ? `hidden md:flex md:right-[440px] ${isOpen ? 'bottom-5 sm:bottom-6' : 'bottom-22 sm:bottom-24'}`
          : `flex right-4 sm:right-6 ${isOpen ? 'bottom-5 sm:bottom-6' : 'bottom-22 sm:bottom-24'}`
      }`}
    >
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          aria-label="Open Chat with Alex"
          className="h-14 w-14 rounded-full bg-[#E60000] hover:bg-[#E60000] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative group cursor-pointer border-2 border-white/20"
        >
          <MessageCircle className="w-7 h-7 text-white fill-white/20 transition-transform duration-200 group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 border-2 border-[#2A2724] text-[9px] font-bold text-black items-center justify-center">1</span>
          </span>
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className={`${isMobile ? 'w-full h-full rounded-none' : 'w-[340px] sm:w-[380px] h-[540px] rounded-3xl'} shadow-2xl bg-white overflow-hidden flex flex-col border border-gray-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 text-[#2A2724]`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2A2724] via-[#2A2724] to-[#2A2724] text-white p-4 flex items-center justify-between shadow-md relative">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9.5 h-9.5 rounded-2xl bg-[#E60000] text-white shadow-lg font-bold text-sm">
                <span>A</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#2A2724]"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white tracking-wide flex items-center gap-1.5 font-inter">
                  Alex from Modena Support
                  <HeartHandshake className="w-4 h-4 text-red-400" />
                </h3>
                <span className="text-[10px] text-gray-300 block font-medium">Senior Sales Representative • Online</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                title={isMuted ? "Unmute Speech Voice" : "Mute Speech Voice"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isMuted ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-amber-400 bg-white/10'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMessages([{
                    id: 'welcome',
                    sender: 'bot',
                    text: "Hey! Conversation reset. How can I help you find what you need for your kitchen?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    suggestions: DEFAULT_SUGGESTIONS
                  }]);
                }}
                title="Reset Conversation"
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                title="Close Chat Window"
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Product Analysis Context Bar */}
          {selectedProduct && (
            <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-center justify-between text-xs text-[#E60000] animate-in fade-in duration-200">
              <div className="flex items-center gap-2 truncate">
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Active Showroom Item: <strong className="font-bold">{selectedProduct.name}</strong></span>
              </div>
              <span className="text-[9px] font-bold uppercase bg-red-100 px-2 py-0.5 rounded-md flex-shrink-0">Synced</span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F6] font-inter text-xs">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                  <div className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'} max-w-[90%]`}>
                    {isBot && (
                      <div className="w-6 h-6 rounded-full bg-[#E60000] text-white flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 mb-1 shadow">
                        A
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed shadow-sm transition-all ${
                        isBot
                          ? 'bg-white text-[#2A2724] rounded-bl-xs border border-gray-200'
                          : 'bg-[#E60000] text-white rounded-br-xs font-medium shadow-red-900/20'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{renderFormattedText(msg.text, isBot)}</p>
                      <span className={`block text-[9px] mt-1 text-right ${isBot ? 'text-gray-400' : 'text-white/80'}`}>
                        {msg.time}
                      </span>
                    </div>

                    {!isBot && (
                      <div className="w-6 h-6 rounded-full bg-[#2A2724] text-white flex items-center justify-center text-[10px] flex-shrink-0 mb-1 shadow">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Embedded Product Recommendation Cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2.5 ml-8 space-y-2 w-full max-w-[85%]">
                      {msg.products.map((p) => {
                        const isAdded = addedProductIds.includes(p.id);
                        return (
                          <div key={p.id} className="bg-white rounded-2xl p-2.5 border border-gray-200 shadow-sm flex items-center justify-between gap-2 hover:border-[#E60000] transition-colors">
                            <div
                              className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (onSelectProduct) onSelectProduct(p);
                              }}
                            >
                              {p.image && p.image.trim() !== '' ? (
                                <img src={p.image} alt={p.name || 'Product'} className="w-11 h-11 object-contain bg-gray-50 rounded-xl p-1 border border-gray-100 flex-shrink-0" />
                              ) : null}
                              <div className="truncate">
                                <h4 className="font-bold text-[11px] text-gray-900 truncate hover:text-[#E60000]">{p.name}</h4>
                                <span className="text-[11px] font-extrabold text-[#E60000] block">{p.price || p.price_html}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCartClick(p);
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shadow ${
                                isAdded ? 'bg-emerald-600 text-white' : 'bg-[#E60000] hover:bg-red-800 text-white'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestions && (
                    <div className="mt-3 ml-8 space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Sales Rep Questions:</span>
                      <div className="flex flex-col gap-1.5">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSend(sug.replace(/^[^\s]+\s/, ''), e);
                            }}
                            className="bg-white hover:bg-red-50 text-gray-800 hover:text-[#E60000] text-[11px] font-medium py-1.5 px-3 rounded-xl border border-gray-200 text-left transition-colors cursor-pointer flex items-center justify-between group shadow-2xs"
                          >
                            <span>{sug}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E60000] transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500 text-xs p-2.5 bg-white w-max rounded-2xl border border-gray-200 shadow-sm animate-pulse ml-8">
                <span className="w-4 h-4 rounded-full bg-[#E60000] text-white text-[9px] font-bold flex items-center justify-center">A</span>
                <span>Alex is typing a response...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Dynamic Context Chips for Active Product/Page */}
          <div className="bg-gray-100 px-3 py-2 border-t border-gray-200 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            {activeSuggestions.slice(0, 3).map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSend(chip.replace(/^[^\s]+\s/, ''), e);
                }}
                className="bg-white hover:bg-red-50 text-[#2A2724] hover:text-[#E60000] text-[10px] font-bold py-1 px-2.5 rounded-full border border-gray-200 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Container */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isTyping && input.trim()) {
                    handleSend(null, e);
                  }
                }
              }}
              placeholder={selectedProduct ? `Ask Alex about ${selectedProduct.name}...` : "Message Alex about cookware, specs, orders..."}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] transition-colors"
            />
            <button
              type="button"
              disabled={!input.trim() || isTyping}
              aria-label="Send message to Alex"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isTyping && input.trim()) {
                  handleSend(null, e);
                }
              }}
              className="bg-[#E60000] hover:bg-[#E60000] text-white p-2.5 rounded-2xl transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer hover:scale-105 active:scale-95"
            >
              {isTyping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
