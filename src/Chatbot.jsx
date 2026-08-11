import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, RefreshCw, ChevronRight, ShoppingBag, Eye, HeartHandshake } from 'lucide-react';
import { useProducts } from './hooks/useProducts';
import { useDisplayTopology } from './hooks/useDisplayTopology';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const DEFAULT_SUGGESTIONS = [
  "👋 Tell me about the 5L Heritage Dutch Oven",
  "⚡ How powerful is the 990W Mixer Grinder?",
  "🍳 Cast Iron Skillet cooking benefits",
  "🚚 How to track my order & delivery?",
  "🔄 What is your Return & Exchange policy?"
];

const Chatbot = ({ currentView = 'home', selectedProduct = null, onSelectProduct, onAddToCart, isCartOpen = false, isCheckoutOpen = false, isFooterInView = false }) => {
  const { products: liveCatalog } = useProducts();
  const { isMobile } = useDisplayTopology();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hey! 👋 I'm Alex, Senior Product Specialist here at Modena. I'm right here to walk you through our premium cookware, answer any questions, or help you track an order. What are you looking to cook or upgrade in your kitchen today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: DEFAULT_SUGGESTIONS
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const catalog = liveCatalog && liveCatalog.length > 0 ? liveCatalog : [];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const getContextSuggestions = () => {
    if (selectedProduct) {
      return [
        `Tell me why ${selectedProduct.name} is worth buying`,
        `What warranty & durability features come with this?`,
        `Is this compatible with Induction / Gas?`,
        `Help me order this item`
      ];
    }
    if (currentView === 'bestseller') {
      return [
        "What are Modena's top-rated bestsellers?",
        "Tell me about the 990W Copper Mixer",
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
    const q = userQuery.toLowerCase().trim();

    // 1. Strict Scope Check: Unrelated topics
    const isOutofScope = (
      q.includes('weather') || q.includes('cricket') || q.includes('movie') ||
      q.includes('president') || q.includes('python code') || q.includes('who is') ||
      q.includes('capital of') || q.includes('bitcoin') || q.includes('football')
    ) && !q.includes('modena') && !q.includes('cookware') && !q.includes('grinder') && !q.includes('skillet') && !q.includes('order');

    if (isOutofScope) {
      return {
        text: "As Modena's sales and cookware specialist, I'm dedicated strictly to our kitchen products, cookware, appliances, order tracking, and store policies! 😊\n\nIs there a specific cookware piece or appliance I can show you today?",
        products: null
      };
    }

    // 2. Sales Rep Persona System Prompt for Gemini using Live Catalog
    const currentProductCtx = selectedProduct
      ? `THE CUSTOMER IS CURRENTLY LOOKING AT THIS PRODUCT IN THE SHOWROOM:\n- Name: ${selectedProduct.name}\n- Price: ${selectedProduct.price || selectedProduct.price_html}\n- Full Specs/Features: ${JSON.stringify(selectedProduct.specs || selectedProduct.desc || selectedProduct.description || '')}\n`
      : `Customer Current View: ${currentView}\n`;

    const systemPrompt = `You are Alex, an energetic, persuasive, friendly Senior Sales Representative for Modena Kitchenware.
SALES REP STYLE INSTRUCTIONS:
- Talk like a top sales rep in a luxury kitchen showroom recommending products to a valued customer.
- Focus on real cooking benefits (e.g., heat retention for biryani, fast grinding for Indian spices, zero hot spots, high-carbon German steel).
- DO NOT output robotic template lists like "It features X". Speak naturally with enthusiasm and authority.
- Ask natural sales closing questions (e.g., "Shall I add one to your cart?", "Would you like me to help you reserve this item?").
- STRICT RULE: Only answer questions about Modena products, cookware, appliances, order tracking, and store policies.

${currentProductCtx}

LIVE MODENA PRODUCT CATALOG (FROM WOOCOMMERCE DATABASE):
${JSON.stringify(catalog)}

Customer Message: "${userQuery}"`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          let matchedProds = [];
          if (selectedProduct) {
            matchedProds = [selectedProduct];
          } else {
            matchedProds = catalog.filter(p =>
              q.includes((p.name || '').toLowerCase()) ||
              q.includes((p.category || '').toLowerCase()) ||
              (p.name || '').toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w))
            );
          }

          return {
            text: aiText,
            products: matchedProds.length > 0 ? matchedProds : catalog.slice(0, 2)
          };
        }
      }
    } catch {
      // Fall through to sales rep fallback engine
    }

    // 3. Expert Sales Representative Fallback Engine using Live Catalog
    let responseText = "";
    let matchedProducts = [];

    if (selectedProduct && (q.includes('this') || q.includes('viewing') || q.includes('specs') || q.includes('warranty') || q.includes('price') || q.includes('induction') || q.includes('more') || q.includes('dutch'))) {
      const p = selectedProduct;
      matchedProducts = [p];
      if (p.id === 33 || (p.name || '').toLowerCase().includes('dutch oven')) {
        responseText = `Oh, the **5L Heavy Heritage Dutch Oven** (₹3,200.00) is an absolute masterpiece! It's crafted from heavy ceramic-enameled cast iron that holds heat remarkably well—making it perfect for slow-cooked curries, biryanis, and even baking artisan sourdough bread.\n\nThe lid even has self-basting condensation spikes underneath to trap all the rich flavor and moisture! Shall I add one to your cart, or can I tell you more about its oven compatibility?`;
      } else if (p.id === 32 || (p.name || '').toLowerCase().includes('saucepan')) {
        responseText = `I love this piece! The **3L Tri-Ply Stainless Steel Saucepan** (₹1,850.00) is built with a 3-layer clad construction featuring a pure aluminum core sandwiched between food-grade steel. That gives you 100% even heat distribution with zero hot spots so milk and sauces never scorch! It works on both Gas and Induction stoves and carries a 10-Year Warranty. Would you like me to help you add it to your cart?`;
      } else if (p.id === 26 || (p.name || '').toLowerCase().includes('mixer')) {
        responseText = `The **Modena Sindoor 990W Mixer Grinder** (₹2,500.00) is a true kitchen powerhouse! Its 100% heavy pure copper motor hits 22,000 RPM to grind hard Indian spices, idli batter, and chutneys in seconds without heating up. It comes with 3 stainless steel jars and a 5-Year Motor Warranty! Shall I add one to your order?`;
      } else if (p.id === 31 || (p.name || '').toLowerCase().includes('skillet')) {
        responseText = `That's one of our all-time bestsellers! The **10" Heavy Cast Iron Skillet** (₹1,450.00) comes pre-seasoned with natural vegetable oil right out of the box. It holds heat like nothing else—ideal for crisping dosas, searing steaks, or baking in the oven up to 260°C. Plus, it carries a Lifetime Warranty! Shall I help you reserve one?`;
      } else if (p.id === 34 || (p.name || '').toLowerCase().includes('knife')) {
        responseText = `You're looking at a true chef's set! The **6-Piece German Steel Knife Set** (₹2,999.00) features high-carbon X50CrMoV15 German steel blades with full-tang rosewood handles. They stay razor-sharp through years of heavy chopping and come with a Lifetime Sharpening Guarantee. Shall I add this set to your cart?`;
      } else {
        responseText = `The **${p.name}** is a phenomenal kitchen investment available for ${p.price || p.price_html}! It's engineered with heavy-duty materials designed for maximum heat efficiency and long-lasting durability. Would you like me to help you add it to your cart, or can I answer any questions about its warranty?`;
      }
    } else if (q.includes('mixer') || q.includes('grind') || q.includes('sindoor') || q.includes('990')) {
      const p = catalog.find(x => x.id === 26) || catalog[0];
      responseText = `The **Modena Sindoor 990W Mixer Grinder** (₹2,500.00) is a true kitchen powerhouse! Its 100% heavy pure copper motor hits 22,000 RPM to grind hard Indian spices, idli batter, and chutneys in seconds without heating up. It comes with 3 stainless steel jars and a 5-Year Motor Warranty! Shall I add one to your order?`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('skillet') || q.includes('iron') || q.includes('cast iron')) {
      const p = catalog.find(x => x.id === 31) || catalog[1];
      responseText = `That's one of our all-time bestsellers! The **10" Heavy Cast Iron Skillet** (₹1,450.00) comes pre-seasoned with natural vegetable oil right out of the box. It holds heat like nothing else—ideal for crisping dosas, searing steaks, or baking in the oven up to 260°C. Plus, it carries a Lifetime Warranty! Shall I help you reserve one?`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('saucepan') || q.includes('tri-ply') || q.includes('steel')) {
      const p = catalog.find(x => x.id === 32) || catalog[2];
      responseText = `I love this piece! The **3L Tri-Ply Stainless Steel Saucepan** (₹1,850.00) is built with a 3-layer clad construction featuring a pure aluminum core sandwiched between food-grade steel. That gives you 100% even heat distribution with zero hot spots so milk and sauces never scorch! It works on both Gas and Induction stoves and carries a 10-Year Warranty. Would you like me to help you add it to your cart?`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('dutch') || q.includes('oven') || q.includes('biryani')) {
      const p = catalog.find(x => x.id === 33) || catalog[3];
      responseText = `Oh, the **5L Heavy Heritage Dutch Oven** (₹3,200.00) is an absolute masterpiece! It's crafted from heavy ceramic-enameled cast iron that holds heat remarkably well—making it perfect for slow-cooked curries, biryanis, and even baking artisan sourdough bread.\n\nThe lid even has self-basting condensation spikes underneath to trap all the rich flavor and moisture! Shall I add one to your cart, or can I tell you more about its oven compatibility?`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('knife') || q.includes('blade') || q.includes('cut')) {
      const p = catalog.find(x => x.id === 34) || catalog[4];
      responseText = `You're looking at a true chef's set! The **6-Piece German Steel Knife Set** (₹2,999.00) features high-carbon X50CrMoV15 German steel blades with full-tang rosewood handles. They stay razor-sharp through years of heavy chopping and come with a Lifetime Sharpening Guarantee. Shall I add this set to your cart?`;
      matchedProducts = p ? [p] : [];
    } else if (q.includes('track') || q.includes('order') || q.includes('delivery')) {
      responseText = "Sure thing! You can track your active package live anytime under **Your Account > Your Orders**. Just click **Track package** next to your order to view BlueDart real-time delivery status!";
    } else if (q.includes('return') || q.includes('replace') || q.includes('refund')) {
      responseText = "No problem at all! We offer a 30-Day Hassle-Free Return & Replacement policy. You can request a free replacement or direct Zoho Pay bank refund under **Your Account > Return / Replace**!";
    } else if (q.includes('best') || q.includes('recommend') || q.includes('top') || q.includes('bestseller') || q.includes('popular') || q.includes('favorite') || q.includes('favourite')) {
      responseText = "If you're looking for the absolute **best products** in our store, our **#1 Bestseller** is the **Modena Sindoor 990W Mixer Grinder** (₹2,500.00)! It features a 100% pure heavy copper motor running at 22,000 RPM, perfect for tough Indian grinding with a 5-Year Motor Warranty.\n\nFor cookware, our **10\" Heavy Cast Iron Skillet** (₹1,450.00) is another top-rated customer favorite that comes pre-seasoned with a Lifetime Warranty!\n\nWhich one matches your cooking style best?";
      matchedProducts = catalog.slice(0, 2);
    } else if (q.includes('contact') || q.includes('support') || q.includes('phone') || q.includes('email')) {
      responseText = "You can reach our Customer Care team directly at:\n- 📞 Phone: +91 9962105345\n- 📧 Email: mohnishniranjhan@gmail.com\nWe're available Mon-Sat, 9 AM - 7 PM IST!";
    } else {
      responseText = "Hey there! How can I help you upgrade your kitchen today? Feel free to ask me about our 990W Mixer Grinders, Cast Iron Cookware, German Steel Knives, Order Tracking, or Return Policies!";
      matchedProducts = catalog.slice(0, 2);
    }

    return { text: responseText, products: matchedProducts };
  };

  const handleSend = async (customText = null) => {
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

    const aiRes = await generateAIResponse(textToSend);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: aiRes.text,
          products: aiRes.products,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 900);
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
      className={`fixed z-50 transition-all duration-500 ease-in-out ${
        isOpen && isMobile
          ? 'inset-0 w-full h-full flex flex-col'
          : isCheckoutOpen
          ? 'hidden'
          : isCartOpen
          ? 'hidden md:flex md:right-[440px] ' + (isFooterInView ? 'bottom-28 md:bottom-32' : 'bottom-6')
          : 'flex right-4 md:right-6 ' + (isFooterInView ? 'bottom-28 md:bottom-32' : 'bottom-4 md:bottom-6')
      }`}
    >
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
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
                onClick={() => setMessages([{
                  id: 'welcome',
                  sender: 'bot',
                  text: "Hey! Conversation reset. How can I help you find what you need for your kitchen?",
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  suggestions: DEFAULT_SUGGESTIONS
                }])}
                title="Reset Conversation"
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
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
                      {msg.products.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl p-2.5 border border-gray-200 shadow-sm flex items-center justify-between gap-2 hover:border-[#E60000] transition-colors">
                          <div className="flex items-center gap-2.5 overflow-hidden cursor-pointer" onClick={() => onSelectProduct && onSelectProduct(p)}>
                            <img src={p.image} alt={p.name} className="w-11 h-11 object-contain bg-gray-50 rounded-xl p-1 border border-gray-100 flex-shrink-0" />
                            <div className="truncate">
                              <h4 className="font-bold text-[11px] text-gray-900 truncate hover:text-[#E60000]">{p.name}</h4>
                              <span className="text-[11px] font-extrabold text-[#E60000] block">{p.price || p.price_html}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => onAddToCart && onAddToCart(p)}
                            className="bg-[#E60000] hover:bg-[#E60000] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 shadow"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
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
                            onClick={() => handleSend(sug.replace(/^[^\s]+\s/, ''))}
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
                onClick={() => handleSend(chip.replace(/^[^\s]+\s/, ''))}
                className="bg-white hover:bg-red-50 text-[#2A2724] hover:text-[#E60000] text-[10px] font-bold py-1 px-2.5 rounded-full border border-gray-200 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Form Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedProduct ? `Ask Alex about ${selectedProduct.name}...` : "Message Alex about cookware, specs, orders..."}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message to Alex"
              className="bg-[#E60000] hover:bg-[#E60000] text-white p-2.5 rounded-2xl transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer hover:scale-105 active:scale-95"
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
