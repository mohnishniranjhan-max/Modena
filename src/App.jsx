import React, { useState, useEffect, useRef } from 'react';
import ProductList from './ProductList';
import Chatbot from './Chatbot';
import logoMonoWhiteRed from '/modena_logo_mono-white_red.png';
import {
  ShoppingBag,
  Search,
  User,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Flame,
  Award,
  ArrowRight,
  CreditCard,
  Wallet,
  Banknote,
  Building,
  Menu,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  Tag,
  Percent,
  Clock,
  Copy,
  Check,
  Filter
} from 'lucide-react';

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Navigation View State: 'home' | 'bestseller' | 'deal' | 'electronics' | 'utensils' | 'searchResults'
  const [currentView, setCurrentView] = useState('home');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
      setCurrentView('searchResults');
      setIsSearchOverlayOpen(false);
    }
  };
  
  // Modals state for Big Checkout & Login popups
  const [activeModal, setActiveModal] = useState(null);
  
  // Login State
  const [loginStep, setLoginStep] = useState(1); // 1: Email, 2: Password
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'card', 'upi', 'bacs'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hero Carousel State & Auto-play (4.5s)
  const [heroIndex, setHeroIndex] = useState(0);
  const heroSlides = [
    {
      id: 26,
      badge: '#1 BESTSELLER',
      tag: 'STORE FEATURED PRODUCT',
      title: 'Modena Sindoor 990W Mixer Grinder',
      subtitle: 'Heavy duty 100% copper motor with dual air-flow cooling technology.',
      price: '₹2,500.00',
      numericPrice: 2500,
      rating: '4.9/5 (1,420 Reviews)',
      image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp',
      viewKey: 'electronics'
    },
    {
      id: 101,
      badge: 'CHEF CHOICE',
      tag: 'HERITAGE COOKWARE',
      title: '10" Heavy Cast Iron Skillet',
      subtitle: 'Pre-seasoned lava-fired heavy cast iron for lifetime non-stick seasoning.',
      price: '₹1,450.00',
      numericPrice: 1450,
      rating: '4.8/5 (890 Reviews)',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop',
      viewKey: 'utensils'
    },
    {
      id: 102,
      badge: 'TOP RATED',
      tag: '5-PLY STAINLESS STEEL',
      title: '3L Tri-Ply Stainless Steel Saucepan',
      subtitle: 'Triple-layer encapsulated aluminum core providing rapid 360° heat distribution.',
      price: '₹1,850.00',
      numericPrice: 1850,
      rating: '4.9/5 (610 Reviews)',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop',
      viewKey: 'utensils'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const prevHeroSlide = () => {
    setHeroIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextHeroSlide = () => {
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  // Sideways Horizontal Scroll Refs & Handler
  const bestsellerScrollRef = useRef(null);
  const dealScrollRef = useRef(null);
  const electronicsScrollRef = useRef(null);

  const scrollSideways = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const [placedOrder, setPlacedOrder] = useState(null);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Form State for Big Billing & Address Popup
  const [formData, setFormData] = useState({
    firstName: 'Mohnish',
    lastName: 'Niranjhan',
    email: 'mohnish@example.com',
    phone: '+91 98765 43210',
    address: '123 Heritage Culinary Way',
    city: 'Bengaluru',
    state: 'Karnataka',
    postcode: '560001',
    cardNumber: '4532 •••• •••• 8892',
    cardExpiry: '08/29',
    cardCvc: '882',
    upiId: 'mohnish@upi'
  });

  const parsePrice = (product) => {
    if (product.prices?.price) {
      return parseFloat(product.prices.price) / Math.pow(10, product.prices.currency_minor_unit || 2);
    }
    if (typeof product.price === 'number') return product.price;
    if (typeof product.price === 'string') {
      const cleaned = product.price.replace(/[^0-9.]/g, '');
      if (cleaned) return parseFloat(cleaned);
    }
    return 0;
  };

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      const priceVal = parsePrice(product);
      const img =
        product.images?.[0]?.src ||
        product.images?.[0]?.thumbnail ||
        product.image ||
        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';

      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: priceVal,
            price_html: product.price_html,
            currency_symbol: product.prices?.currency_symbol || '₹',
            image: img,
            quantity: 1
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currencySymbol = cart[0]?.currency_symbol || '₹';

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    const orderNumber = 'MOD-' + Math.floor(100000 + Math.random() * 900000);
    setPlacedOrder({
      orderNumber,
      items: [...cart],
      total: subtotal,
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      customer: { ...formData },
      paymentMethod
    });
    setCart([]);
  };

  // Searchable products (loaded dynamically from database)
  const searchableProducts = [];

  // Analyze Customer Search Intent & Sort Bestsellers First
  const getSearchIntent = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    if (q.includes('mix') || q.includes('grind') || q.includes('sindoor') || q.includes('990') || q.includes('motor')) {
      return { intent: 'Analyzing Intent: Heavy Power Appliances (Grinders)', category: 'appliances' };
    }
    if (q.includes('pan') || q.includes('skillet') || q.includes('iron') || q.includes('dutch') || q.includes('cook')) {
      return { intent: 'Analyzing Intent: Heritage Cast Iron & Cookware', category: 'cookware' };
    }
    if (q.includes('knife') || q.includes('blade') || q.includes('steel') || q.includes('cut')) {
      return { intent: 'Analyzing Intent: Precision Cutting Tools', category: 'knives' };
    }
    return { intent: 'Analyzing Intent: Store Catalog (Bestsellers First)', category: 'all' };
  };

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const matched = searchableProducts.filter((p) =>
      p.name.toLowerCase().includes(q) || p.category.includes(q)
    );
    // Sort Bestseller Score descending
    return matched.sort((a, b) => b.bestsellerScore - a.bestsellerScore);
  }, [searchQuery]);

  const searchIntentInfo = getSearchIntent(searchQuery);

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#2a1613] font-inter antialiased relative selection:bg-[#b70100] selection:text-white">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#b70100] text-white text-[11px] font-label-caps tracking-widest text-center py-2 px-4 flex items-center justify-center gap-2">
        <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>COMPLIMENTARY HERITAGE COOKWARE CARE KIT WITH ORDERS OVER ₹2,000</span>
      </div>

      {/* 2. MAIN NAVIGATION HEADER */}
      <header className="bg-[#111111] text-white sticky top-0 z-30 shadow-md border-b border-[#222222]">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <button onClick={() => setCurrentView('home')} className="flex items-center group py-2 cursor-pointer">
              <img
                src={logoMonoWhiteRed}
                alt="Modena Logo"
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </button>
          </div>

          {/* Desktop Navigation Anchors - Switches Page View */}
          <nav className="hidden lg:flex items-center gap-7 font-label-caps text-xs tracking-widest">
            <button
              onClick={() => setCurrentView('home')}
              className={`py-2 border-b-2 transition-colors cursor-pointer ${
                currentView === 'home' ? 'text-[#b70100] border-[#b70100] font-bold' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              HOME
            </button>
            <button
              onClick={() => setCurrentView('bestseller')}
              className={`py-2 border-b-2 transition-colors cursor-pointer ${
                currentView === 'bestseller' ? 'text-[#b70100] border-[#b70100] font-bold' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              BESTSELLER
            </button>
            <button
              onClick={() => setCurrentView('deal')}
              className={`py-2 border-b-2 transition-colors cursor-pointer ${
                currentView === 'deal' ? 'text-[#b70100] border-[#b70100] font-bold' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              DEAL
            </button>
            <button
              onClick={() => setCurrentView('electronics')}
              className={`py-2 border-b-2 transition-colors cursor-pointer ${
                currentView === 'electronics' ? 'text-[#b70100] border-[#b70100] font-bold' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              ELECTRONICS
            </button>
            <button
              onClick={() => setCurrentView('utensils')}
              className={`py-2 border-b-2 transition-colors cursor-pointer ${
                currentView === 'utensils' ? 'text-[#b70100] border-[#b70100] font-bold' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              UTENSILS
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#222222] rounded-full px-3.5 py-1.5 border border-[#333333] focus-within:border-[#b70100] transition-colors">
                <button type="submit" aria-label="Search" className="cursor-pointer">
                  <Search className="w-4 h-4 text-gray-400 hover:text-white mr-2" />
                </button>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onFocus={() => setIsSearchOverlayOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOverlayOpen(true);
                  }}
                  className="bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none w-32 focus:w-48 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOverlayOpen(false);
                    }}
                    className="text-gray-400 hover:text-white ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* LIVE INTENT & BESTSELLER SEARCH OVERLAY */}
              {isSearchOverlayOpen && searchQuery.trim() && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#111111]/95 backdrop-blur-xl border border-[#333333] rounded-xl shadow-2xl z-50 p-4 overflow-hidden text-white">
                  {searchIntentInfo && (
                    <div className="flex items-center justify-between border-b border-[#222222] pb-2.5 mb-3 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#ffb4a8] font-label-caps font-semibold truncate">
                        <Sparkles className="w-3.5 h-3.5 text-[#b70100] flex-shrink-0" />
                        <span className="truncate">{searchIntentInfo.intent}</span>
                      </div>
                      <span className="text-[10px] bg-[#b70100] text-white px-2 py-0.5 rounded font-bold flex-shrink-0">BESTSELLERS FIRST</span>
                    </div>
                  )}

                  {searchResults.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                      No exact match found for "{searchQuery}". Press Enter to view full store search results.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {searchResults.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-[#1a1a1a] hover:bg-[#252525] p-2.5 rounded-lg border border-[#2a2a2a] transition-colors group">
                          <div className="flex items-center gap-3 truncate mr-2">
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded bg-white p-0.5 flex-shrink-0" />
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold bg-[#b70100] text-white px-1.5 py-0.2 rounded">{item.badge}</span>
                              </div>
                              <h4 className="text-xs text-white font-medium truncate mt-0.5">{item.name}</h4>
                              <span className="text-xs text-[#ffb4a8] font-bold">{item.price_html}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddToCart(item);
                              setIsSearchOverlayOpen(false);
                            }}
                            className="bg-[#b70100] hover:bg-[#e60000] text-white text-[10px] font-label-caps px-3 py-1.5 rounded transition-colors flex-shrink-0 cursor-pointer"
                          >
                            + ADD
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-[#222] flex justify-between items-center text-[10px] text-gray-400">
                    <span>Press Enter for full results page</span>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-[#ffb4a8] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>Open Search Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveModal('login')}
              className="text-gray-300 hover:text-white text-xs font-label-caps flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded hover:bg-[#222222] transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">ACCOUNT</span>
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-[#b70100] hover:bg-[#e60000] text-white p-2.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-[0_4px_12px_rgba(183,1,0,0.3)]"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#b70100] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111111]">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1a1a1a] border-t border-[#333] px-6 py-4 flex flex-col gap-3 font-label-caps text-xs">
            <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className={`text-left py-2 border-b border-[#2a2a2a] ${currentView === 'home' ? 'text-[#b70100] font-bold' : 'text-gray-200'}`}>HOME</button>
            <div className="py-2 border-b border-[#2a2a2a]">
              <button onClick={() => { setCurrentView('bestseller'); setMobileMenuOpen(false); }} className={`text-left w-full ${currentView === 'bestseller' ? 'text-[#b70100] font-bold' : 'text-gray-200'}`}>BESTSELLER</button>
              <div className="pl-4 pt-2 flex flex-col gap-1 text-[11px] text-gray-400">
                <span onClick={() => { setCurrentView('bestseller'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Top Rated Appliances</span>
                <span onClick={() => { setCurrentView('bestseller'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Flagship Cookware</span>
              </div>
            </div>
            <div className="py-2 border-b border-[#2a2a2a]">
              <button onClick={() => { setCurrentView('deal'); setMobileMenuOpen(false); }} className={`text-left w-full ${currentView === 'deal' ? 'text-[#b70100] font-bold' : 'text-gray-200'}`}>DEAL</button>
              <div className="pl-4 pt-2 flex flex-col gap-1 text-[11px] text-gray-400">
                <span onClick={() => { setCurrentView('deal'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Flash Sale Mixers</span>
                <span onClick={() => { setCurrentView('deal'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Clearance Offers</span>
              </div>
            </div>
            <div className="py-2 border-b border-[#2a2a2a]">
              <button onClick={() => { setCurrentView('electronics'); setMobileMenuOpen(false); }} className={`text-left w-full ${currentView === 'electronics' ? 'text-[#b70100] font-bold' : 'text-gray-200'}`}>ELECTRONICS</button>
              <div className="pl-4 pt-2 flex flex-col gap-1 text-[11px] text-gray-400">
                <span onClick={() => { setCurrentView('electronics'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Mixer Grinders</span>
                <span onClick={() => { setCurrentView('electronics'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Air Fryers</span>
                <span onClick={() => { setCurrentView('electronics'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Blenders & Choppers</span>
                <span onClick={() => { setCurrentView('electronics'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Induction Cooktops</span>
              </div>
            </div>
            <div className="py-2">
              <button onClick={() => { setCurrentView('utensils'); setMobileMenuOpen(false); }} className={`text-left w-full ${currentView === 'utensils' ? 'text-[#b70100] font-bold' : 'text-gray-200'}`}>UTENSILS</button>
              <div className="pl-4 pt-2 flex flex-col gap-1 text-[11px] text-gray-400">
                <span onClick={() => { setCurrentView('utensils'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Cast Iron Cookware</span>
                <span onClick={() => { setCurrentView('utensils'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Tri-Ply Stainless Steel</span>
                <span onClick={() => { setCurrentView('utensils'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ Dutch Ovens & Stew Pots</span>
                <span onClick={() => { setCurrentView('utensils'); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-white">└ German Knives & Cutlery</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. HOME VIEW */}
      {currentView === 'home' && (
        <>
          {/* DYNAMIC & HAPPENING HERO SECTION */}
          <section className="bg-[#fff8f6] py-16 lg:py-24 border-b border-[#ffe9e6] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffe9e6]/50 rounded-full blur-3xl -z-0 pointer-events-none"></div>

            <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#ffe9e6] text-[#b70100] text-xs font-label-caps px-3.5 py-1.5 rounded-full border border-[#e9bcb5]">
                  <Sparkles className="w-3.5 h-3.5 text-[#b70100]" />
                  <span>LIVE WORDPRESS INTEGRATED STORE</span>
                </div>

                <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-[#2a1613] tracking-tight leading-[1.1]">
                  Industrial Precision. <br />
                  <span className="text-[#b70100] italic font-serif">Domestic Warmth.</span>
                </h1>

                <p className="font-body-lg text-[#5f3f3a] text-lg max-w-xl leading-relaxed">
                  Experience Modena's heavy-duty 990W mixer grinders and heritage-grade cookware. Powered directly by your WooCommerce live store catalog.
                </p>

                <div className="pt-2 flex flex-wrap gap-4 items-center">
                  <a
                    href="#products-section"
                    className="bg-[#b70100] hover:bg-[#e60000] text-white px-8 py-4 rounded font-headline-md text-base tracking-wide flex items-center gap-3 shadow-[0_8px_20px_rgba(183,1,0,0.25)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span>EXPLORE STORE CATALOG</span>
                    <ArrowRight className="w-5 h-5" />
                  </a>

                  <button
                    onClick={() => setCurrentView('electronics')}
                    className="border border-[#2a1613] text-[#2a1613] hover:bg-[#2a1613] hover:text-white px-7 py-4 rounded font-headline-md text-base tracking-wide transition-all duration-300 cursor-pointer"
                  >
                    ELECTRONICS DEMO
                  </button>
                </div>

                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#ffe9e6]">
                  <button
                    onClick={() => setCurrentView('electronics')}
                    className="text-left group hover:bg-[#fff0ee] p-2 rounded transition-colors cursor-pointer"
                  >
                    <span className="font-headline-md text-2xl text-[#2a1613] group-hover:text-[#b70100] block font-bold">
                      990W
                    </span>
                    <span className="font-body-md text-xs text-[#5c5957]">Heavy Copper Motor →</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('utensils')}
                    className="text-left group hover:bg-[#fff0ee] p-2 rounded transition-colors cursor-pointer"
                  >
                    <span className="font-headline-md text-2xl text-[#2a1613] group-hover:text-[#b70100] block font-bold">
                      100%
                    </span>
                    <span className="font-body-md text-xs text-[#5c5957]">Food Grade Steel →</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('bestseller')}
                    className="text-left group hover:bg-[#fff0ee] p-2 rounded transition-colors cursor-pointer"
                  >
                    <span className="font-headline-md text-2xl text-[#2a1613] group-hover:text-[#b70100] block font-bold">
                      #1
                    </span>
                    <span className="font-body-md text-xs text-[#5c5957]">Bestseller Rated →</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="bg-[#e8e1dc] rounded-xl p-4 shadow-xl border border-[#d8d2ce] relative overflow-hidden group">
                  {/* Hero Auto-Sliding Carousel Image */}
                  <div className="relative w-full h-[420px] overflow-hidden rounded-lg">
                    <img
                      key={heroSlides[heroIndex].id}
                      src={heroSlides[heroIndex].image}
                      alt={heroSlides[heroIndex].title}
                      className="w-full h-full object-cover rounded-lg shadow-md group-hover:scale-105 transition-all duration-700 animate-in fade-in"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=1000&auto=format&fit=crop';
                      }}
                    />

                    {/* Badge Overlay */}
                    <span className="absolute top-4 left-4 bg-[#b70100] text-white text-[10px] font-label-caps px-3 py-1 rounded shadow-lg tracking-wider">
                      {heroSlides[heroIndex].badge}
                    </span>

                    {/* Manual Carousel Navigation Arrows */}
                    <button
                      onClick={prevHeroSlide}
                      aria-label="Previous Slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextHeroSlide}
                      aria-label="Next Slide"
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Slide Indicator Dots */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                      {heroSlides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroIndex(idx)}
                          aria-label={`Go to slide ${idx + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === heroIndex ? 'w-5 bg-[#b70100]' : 'w-2 bg-white/60 hover:bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Slide Info & Quick Actions Drawer Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 bg-[#111111]/90 backdrop-blur-md text-white p-4 sm:p-5 rounded-lg border border-[#333] shadow-2xl">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-label-caps text-[#ffb4a8] tracking-widest block">
                          {heroSlides[heroIndex].tag}
                        </span>
                        <h4 className="font-headline-md text-base sm:text-lg text-white font-medium truncate">
                          {heroSlides[heroIndex].title}
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{heroSlides[heroIndex].rating}</span>
                        </div>
                      </div>
                      <span className="font-headline-md text-lg text-white font-bold whitespace-nowrap">
                        {heroSlides[heroIndex].price}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() =>
                          handleAddToCart({
                            id: heroSlides[heroIndex].id,
                            name: heroSlides[heroIndex].title,
                            price: heroSlides[heroIndex].numericPrice,
                            price_html: heroSlides[heroIndex].price,
                            image: heroSlides[heroIndex].image
                          })
                        }
                        className="flex-1 bg-[#b70100] hover:bg-[#e60000] text-white py-2 rounded text-xs font-label-caps tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD TO CART
                      </button>

                      <button
                        onClick={() => setCurrentView(heroSlides[heroIndex].viewKey)}
                        className="bg-[#222222] hover:bg-[#333] text-white px-3.5 py-2 rounded text-xs font-label-caps border border-[#444] cursor-pointer"
                      >
                        SPECS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 1. SIDEWAYS SCROLLING: BESTSELLERS SECTION */}
          <section className="max-w-[1440px] mx-auto px-6 py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="font-label-caps text-[#b70100] tracking-widest block mb-1">
                  SIDEWAYS SCROLLABLE CATALOG
                </span>
                <h2 className="font-display-lg text-2xl md:text-3xl text-[#2a1613]">
                  Bestseller Products
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollSideways(bestsellerScrollRef, 'left')}
                  aria-label="Scroll Bestsellers Left"
                  className="bg-[#ffffff] hover:bg-[#b70100] hover:text-white border border-[#e9bcb5] p-2.5 rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollSideways(bestsellerScrollRef, 'right')}
                  aria-label="Scroll Bestsellers Right"
                  className="bg-[#ffffff] hover:bg-[#b70100] hover:text-white border border-[#e9bcb5] p-2.5 rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={bestsellerScrollRef}
              className="flex gap-5 overflow-x-auto snap-x scrollbar-none pb-4 pt-1"
            >
              {[
                {
                  id: 26,
                  name: 'Modena Sindoor 990W Mixer Grinder',
                  price: '₹2,500.00',
                  numericPrice: 2500,
                  rating: '4.9/5 (1,420 Reviews)',
                  badge: '#1 BESTSELLER',
                  image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp',
                  desc: 'Heavy-duty copper motor with dual cooling vents.'
                },
                {
                  id: 101,
                  name: '10" Heavy Cast Iron Skillet',
                  price: '₹1,450.00',
                  numericPrice: 1450,
                  rating: '4.8/5 (890 Reviews)',
                  badge: 'CHEF FAVORITE',
                  image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop',
                  desc: 'Pre-seasoned lava-fired cast iron skillet.'
                },
                {
                  id: 102,
                  name: '3L Tri-Ply Stainless Steel Saucepan',
                  price: '₹1,850.00',
                  numericPrice: 1850,
                  rating: '4.9/5 (610 Reviews)',
                  badge: 'TOP RATED',
                  image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop',
                  desc: 'Encapsulated 3-layer core for fast heating.'
                },
                {
                  id: 103,
                  name: '5L Heavy Heritage Dutch Oven',
                  price: '₹3,200.00',
                  numericPrice: 3200,
                  rating: '4.9/5 (520 Reviews)',
                  badge: 'HERITAGE',
                  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
                  desc: 'Heavy ceramic enameled cast iron Dutch oven.'
                }
              ].map((item) => (
                <div
                  key={item.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-xl border border-[#e8e1dc] p-4 flex flex-col justify-between snap-start shadow-sm hover:shadow-md transition-shadow group flex-shrink-0"
                >
                  <div className="relative mb-3">
                    <span className="absolute top-2 left-2 z-10 bg-[#b70100] text-white text-[9px] font-label-caps px-2 py-0.5 rounded shadow">
                      {item.badge}
                    </span>
                    <div className="w-full h-52 bg-[#fff0ee] rounded-lg overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-auto max-h-[190px] object-contain group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-amber-500 text-xs gap-1 mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{item.rating}</span>
                    </div>
                    <h3 className="font-headline-md text-base text-[#2a1613] font-medium truncate mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#5c5957] line-clamp-2 mb-4">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#f0e6e4] flex items-center justify-between">
                    <span className="font-headline-md text-base text-[#2a1613] font-bold">
                      {item.price}
                    </span>
                    <button
                      onClick={() =>
                        handleAddToCart({
                          id: item.id,
                          name: item.name,
                          price: item.numericPrice,
                          price_html: item.price,
                          image: item.image
                        })
                      }
                      className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-label-caps px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> ADD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. SIDEWAYS SCROLLING: FLASH DEALS SECTION */}
          <section className="max-w-[1440px] mx-auto px-6 py-8">
            <div className="bg-[#b70100] text-white p-6 md:p-8 rounded-2xl mb-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-400 text-black text-[10px] font-bold font-label-caps px-3 py-1 rounded-full mb-2">
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>SIDEWAYS FLASH DEALS</span>
                </div>
                <h2 className="font-display-lg text-2xl md:text-3xl text-white">Limited-Time Discounts</h2>
                <p className="text-xs text-white/90 max-w-md mt-1">
                  Slide sideways to view flash sale discounts on heavy copper mixers and cookware.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-lg text-center border border-white/20">
                  <span className="text-[10px] font-label-caps text-amber-300 block">EXPIRES IN</span>
                  <span className="text-lg font-mono font-bold">14h : 32m : 08s</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollSideways(dealScrollRef, 'left')}
                    aria-label="Scroll Deals Left"
                    className="bg-white/20 hover:bg-white text-white hover:text-black p-2 rounded-full transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollSideways(dealScrollRef, 'right')}
                    aria-label="Scroll Deals Right"
                    className="bg-white/20 hover:bg-white text-white hover:text-black p-2 rounded-full transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={dealScrollRef}
              className="flex gap-5 overflow-x-auto snap-x scrollbar-none pb-4"
            >
              {[
                {
                  id: 26,
                  name: 'Modena Sindoor 990W Mixer Grinder',
                  dealPrice: '₹2,500.00',
                  originalPrice: '₹3,500.00',
                  numericPrice: 2500,
                  save: 'SAVE ₹1,000 (28% OFF)',
                  stock: 'Only 3 left at deal price!',
                  image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp'
                },
                {
                  id: 103,
                  name: '5L Heavy Heritage Dutch Oven',
                  dealPrice: '₹3,200.00',
                  originalPrice: '₹4,500.00',
                  numericPrice: 3200,
                  save: 'SAVE ₹1,300 (29% OFF)',
                  stock: 'Only 5 left at deal price!',
                  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop'
                },
                {
                  id: 104,
                  name: '6-Piece German Steel Knife Set',
                  dealPrice: '₹2,999.00',
                  originalPrice: '₹4,999.00',
                  numericPrice: 2999,
                  save: 'SAVE ₹2,000 (40% OFF)',
                  stock: 'Only 2 left at deal price!',
                  image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=800&auto=format&fit=crop'
                }
              ].map((item) => (
                <div
                  key={item.id}
                  className="min-w-[290px] sm:min-w-[320px] max-w-[320px] bg-white rounded-xl border border-red-200 p-4 flex flex-col justify-between snap-start shadow-sm hover:shadow-md transition-shadow relative flex-shrink-0"
                >
                  <span className="absolute top-3 left-3 z-10 bg-[#b70100] text-white text-[9px] font-bold px-2.5 py-1 rounded shadow">
                    {item.save}
                  </span>
                  <div className="w-full h-48 bg-[#fff0ee] rounded-lg overflow-hidden flex items-center justify-center p-3 mb-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-auto max-h-[170px] object-contain"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-base text-[#2a1613] font-medium truncate mb-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-red-600 font-medium mb-3">⚠️ {item.stock}</p>
                  </div>
                  <div className="pt-3 border-t border-[#f0e6e4]">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-headline-md text-lg text-[#b70100] font-bold">
                        {item.dealPrice}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {item.originalPrice}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleAddToCart({
                          id: item.id,
                          name: item.name,
                          price: item.numericPrice,
                          price_html: item.dealPrice,
                          image: item.image
                        })
                      }
                      className="w-full bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-label-caps py-2.5 rounded font-bold transition-colors cursor-pointer"
                    >
                      CLAIM DEAL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. SIDEWAYS SCROLLING: ELECTRONICS & APPLIANCES SECTION */}
          <section className="max-w-[1440px] mx-auto px-6 py-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="font-label-caps text-[#b70100] tracking-widest block mb-1">
                  SIDEWAYS APPLIANCE SLIDER
                </span>
                <h2 className="font-display-lg text-2xl md:text-3xl text-[#2a1613]">
                  Heavy Duty Electronics & Mixers
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollSideways(electronicsScrollRef, 'left')}
                  aria-label="Scroll Electronics Left"
                  className="bg-[#ffffff] hover:bg-[#b70100] hover:text-white border border-[#e9bcb5] p-2.5 rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollSideways(electronicsScrollRef, 'right')}
                  aria-label="Scroll Electronics Right"
                  className="bg-[#ffffff] hover:bg-[#b70100] hover:text-white border border-[#e9bcb5] p-2.5 rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={electronicsScrollRef}
              className="flex gap-5 overflow-x-auto snap-x scrollbar-none pb-4"
            >
              {[
                {
                  title: 'Modena Sindoor 990W Mixer',
                  specs: '990W Copper Motor • 3 SS Jars',
                  price: '₹2,500.00',
                  numericPrice: 2500,
                  id: 26,
                  image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp'
                },
                {
                  title: 'Bestseller Series Grinder',
                  specs: 'Dual Air Vents • Razor SS Blades',
                  price: '₹2,500.00',
                  numericPrice: 2500,
                  id: 26,
                  image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=600&auto=format&fit=crop'
                },
                {
                  title: 'Heavy Duty Commercial Motor',
                  specs: 'Continuous High Speed Grinding',
                  price: '₹3,200.00',
                  numericPrice: 3200,
                  id: 103,
                  image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600&auto=format&fit=crop'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-xl border border-[#e8e1dc] p-4 flex flex-col justify-between snap-start shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
                >
                  <div className="w-full h-48 bg-[#fff0ee] rounded-lg overflow-hidden flex items-center justify-center p-3 mb-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-auto max-h-[170px] object-contain"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-label-caps text-[#b70100] tracking-wider block">
                      ELECTRONICS
                    </span>
                    <h3 className="font-headline-md text-base text-[#2a1613] font-medium truncate mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#5c5957] mb-3">{item.specs}</p>
                  </div>
                  <div className="pt-3 border-t border-[#f0e6e4] flex items-center justify-between">
                    <span className="font-headline-md text-base text-[#2a1613] font-bold">
                      {item.price}
                    </span>
                    <button
                      onClick={() =>
                        handleAddToCart({
                          id: item.id,
                          name: item.title,
                          price: item.numericPrice,
                          price_html: item.price,
                          image: item.image
                        })
                      }
                      className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-label-caps px-3.5 py-2 rounded transition-colors cursor-pointer"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* DYNAMIC PRODUCT LIST */}
          <ProductList onAddToCart={handleAddToCart} searchQuery={searchQuery} />

          {/* BRAND HERITAGE & ENGINEERING PILLARS */}
          <section id="heritage-section" className="bg-[#2a1613] text-white py-20">
            <div className="max-w-[1440px] mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
                <div className="lg:col-span-6 space-y-4">
                  <span className="font-label-caps text-[#ffb4a8] tracking-widest block">MODENA PHILOSOPHY</span>
                  <h2 className="font-display-lg text-3xl lg:text-4xl text-white leading-tight">
                    Designed for Lifelong Retentivity and Culinary Precision
                  </h2>
                </div>
                <div className="lg:col-span-6">
                  <p className="font-body-lg text-[#e8e1dc] text-base leading-relaxed">
                    Every piece of Modena cookware and kitchen machinery is engineered for longevity. We marry heavy-duty motors and steel bodies with natural warmth so your kitchen performs at professional standards.
                  </p>
                  <button
                    onClick={() => setCurrentView('utensils')}
                    className="mt-4 bg-[#b70100] hover:bg-[#e60000] text-white px-6 py-2.5 rounded text-xs font-label-caps tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>EXPLORE CULINARY UTENSILS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-[#514c48] pt-12">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-[#b70100] flex items-center justify-center text-white">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline-md text-lg text-white">Heavy Power</h3>
                  <p className="font-body-md text-xs text-[#cac6c2]">
                    990W copper motors built to withstand tough grinding and daily kitchen duties.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-[#b70100] flex items-center justify-center text-white">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline-md text-lg text-white">Non-Toxic Build</h3>
                  <p className="font-body-md text-xs text-[#cac6c2]">
                    100% free from harmful chemicals. Food-grade stainless steel jars and blades.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-[#b70100] flex items-center justify-center text-white">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline-md text-lg text-white">Energy Efficient</h3>
                  <p className="font-body-md text-xs text-[#cac6c2]">
                    Optimized power consumption for effortless grinding with low noise.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-[#b70100] flex items-center justify-center text-white">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline-md text-lg text-white">Lifetime Warranty</h3>
                  <p className="font-body-md text-xs text-[#cac6c2]">
                    Backed by Modena service guarantee across all physical appliances.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CUSTOMER REVIEWS */}
          <section id="reviews-section" className="max-w-[1440px] mx-auto px-6 py-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="font-label-caps text-[#b70100] tracking-widest block mb-2">VERIFIED REVIEWS</span>
                <h2 className="font-display-lg text-3xl md:text-4xl text-[#2a1613]">Loved by Home Chefs & Families</h2>
              </div>
              <button
                onClick={() => setCurrentView('bestseller')}
                className="mt-4 md:mt-0 text-xs font-label-caps text-[#b70100] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>VIEW BESTSELLING REVIEWS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: 'The 990W motor grinds tough chutneys and spices smoothly in seconds without heating up.',
                  author: 'Rajesh Sharma',
                  role: 'Verified Buyer, Bengaluru'
                },
                {
                  quote: 'Modena products strike the ideal balance between raw heavy durability and gorgeous aesthetic warmth.',
                  author: 'Priya Nambiar',
                  role: 'Culinary Enthusiast, Chennai'
                },
                {
                  quote: 'Ordering through the store was seamless. Delivered safely with eco-friendly protective packaging.',
                  author: 'Karan Mehta',
                  role: 'Home Cook, Mumbai'
                }
              ].map((rev, idx) => (
                <div key={idx} className="bg-[#ffffff] border border-[#e9bcb5]/40 rounded-lg p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="font-body-lg text-sm text-[#5f3f3a] italic mb-6">"{rev.quote}"</p>
                  <div>
                    <h4 className="font-headline-md text-base text-[#2a1613] font-medium">{rev.author}</h4>
                    <span className="font-body-md text-xs text-[#946e68]">{rev.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* 4. BESTSELLER DEMO PAGE */}
      {currentView === 'bestseller' && (
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <div className="bg-gradient-to-r from-[#2a1613] to-[#111111] text-white p-8 md:p-12 rounded-2xl mb-12 shadow-xl border border-[#333]">
            <div className="inline-flex items-center gap-2 bg-[#b70100] text-white text-xs font-label-caps px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TOP RATED COLLECTION</span>
            </div>
            <h1 className="font-display-lg text-4xl md:text-5xl text-white mb-3">Modena Bestsellers</h1>
            <p className="font-body-lg text-[#e8e1dc] text-base max-w-2xl">
              Discover the most-loved heritage cookware and heavy-duty appliances chosen by thousands of culinary enthusiasts.
            </p>
          </div>

          <ProductList onAddToCart={handleAddToCart} searchQuery="" />
        </div>
      )}

      {/* 5. DEAL DEMO PAGE */}
      {currentView === 'deal' && (
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <div className="bg-[#b70100] text-white p-8 md:p-12 rounded-2xl mb-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400 text-black text-xs font-bold font-label-caps px-3 py-1 rounded-full mb-3">
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>FLASH SALE ENDS SOON</span>
              </div>
              <h1 className="font-display-lg text-4xl md:text-5xl text-white mb-2">Culinary Deals & Discounts</h1>
              <p className="font-body-lg text-white/90 text-base max-w-xl">
                Limited-time price cuts on heavy mixer grinders and heritage cookware. Save up to 40% today.
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-xl text-center min-w-[240px]">
              <span className="text-xs font-label-caps text-amber-300 block mb-1">OFFER EXPIRES IN</span>
              <div className="text-3xl font-mono font-bold tracking-wider text-white">14h : 32m : 08s</div>
            </div>
          </div>

          <ProductList onAddToCart={handleAddToCart} searchQuery="" />
        </div>
      )}



      {/* 7. ELECTRONICS DEMO PAGE */}
      {currentView === 'electronics' && (
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <div className="bg-[#2a1613] text-white p-8 md:p-12 rounded-2xl mb-12 shadow-xl border border-[#44302d]">
            <div className="inline-flex items-center gap-2 bg-[#b70100] text-white text-xs font-label-caps px-3 py-1 rounded-full mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>HEAVY APPLIANCES ENGINE</span>
            </div>
            <h1 className="font-display-lg text-4xl md:text-5xl text-white mb-2">Culinary Electronics</h1>
            <p className="font-body-lg text-[#e8e1dc] text-base max-w-2xl">
              High-torque 990W copper motors, thermal overload circuit breakers, and precision induction electronics engineered for professional kitchens.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#e8e1dc] p-8 shadow-sm">
            <h2 className="font-headline-md text-2xl text-[#2a1613] mb-6">Electronic Appliance Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-[#fff8f6] rounded-lg border border-[#e9bcb5]/50">
                <h3 className="font-bold text-lg text-[#b70100] mb-2">990W Heavy Motor</h3>
                <p className="text-xs text-[#5c5957]">100% Grade-A Copper winding for continuous high-speed grinding without power drop off.</p>
              </div>
              <div className="p-5 bg-[#fff8f6] rounded-lg border border-[#e9bcb5]/50">
                <h3 className="font-bold text-lg text-[#b70100] mb-2">Dual Cooling Vents</h3>
                <p className="text-xs text-[#5c5957]">Advanced air-flow circulation preventing heat buildup during tough chutney & batter grinding.</p>
              </div>
              <div className="p-5 bg-[#fff8f6] rounded-lg border border-[#e9bcb5]/50">
                <h3 className="font-bold text-lg text-[#b70100] mb-2">3-Speed Pulsing Dial</h3>
                <p className="text-xs text-[#5c5957]">Tactile metallic knob for granular control over dry grinding, wet blending, and whipping.</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-[#f0e6e4] flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="font-bold text-base text-[#2a1613]">Modena Sindoor 990W Mixer Grinder Set</h4>
                <p className="text-xs text-[#5c5957]">Includes 3 Stainless Steel Jars (Chutney, Dry, Liquidizing) + Razor Sharp SS304 Blades</p>
              </div>
              <button
                onClick={() => handleAddToCart({ id: 26, name: 'modena sindoor 990W mixer grinder', price: 2500, price_html: '₹2,500.00', image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp' })}
                className="bg-[#b70100] hover:bg-[#e60000] text-white px-6 py-3 rounded text-xs font-label-caps tracking-wider transition-colors cursor-pointer"
              >
                BUY MIXER GRINDER (₹2,500.00)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. UTENSILS DEMO PAGE */}
      {currentView === 'utensils' && (
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <div className="bg-[#111111] text-white p-8 md:p-12 rounded-2xl mb-12 shadow-xl border border-[#222]">
            <div className="inline-flex items-center gap-2 bg-[#ffb4a8] text-[#111] text-xs font-label-caps px-3 py-1 rounded-full mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>HERITAGE COOKWARE & KNIVES</span>
            </div>
            <h1 className="font-display-lg text-4xl md:text-5xl text-white mb-2">Culinary Utensils & Cookware</h1>
            <p className="font-body-lg text-[#cac6c2] text-base max-w-2xl">
              Forged steel knives, pre-seasoned cast iron skillets, and 5-ply stainless steel cookware crafted for lifetime retentivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: 101,
                name: '10" Heavy Cast Iron Skillet',
                desc: 'Naturally non-stick pre-seasoned organic flaxseed oil finish.',
                price: '₹1,450.00',
                image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop'
              },
              {
                id: 102,
                name: '3L Tri-Ply Stainless Steel Saucepan',
                desc: 'Aluminum core sandwiched between 304 food-grade stainless steel layers.',
                price: '₹1,850.00',
                image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop'
              },
              {
                id: 104,
                name: '8" Precision German Steel Chef Knife',
                desc: 'Ice-hardened stainless steel blade with ergonomic non-slip handle.',
                price: '₹1,200.00',
                image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=800&auto=format&fit=crop'
              }
            ].map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-[#e8e1dc] overflow-hidden shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <img src={item.image} alt={item.name} className="w-full h-52 object-cover rounded-lg mb-4" />
                  <h3 className="font-headline-md text-lg text-[#2a1613] font-medium mb-1">{item.name}</h3>
                  <p className="font-body-md text-xs text-[#5c5957] mb-4">{item.desc}</p>
                </div>
                <div className="pt-4 border-t border-[#f0e6e4] flex items-center justify-between">
                  <span className="font-headline-md text-xl text-[#2a1613] font-bold">{item.price}</span>
                  <button
                    onClick={() => handleAddToCart({ id: item.id, name: item.name, price: parseFloat(item.price.replace(/[^0-9.]/g,'')), price_html: item.price, image: item.image })}
                    className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-label-caps px-4 py-2 rounded transition-colors cursor-pointer"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. SEARCH RESULTS PAGE VIEW */}
      {currentView === 'searchResults' && (
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#111111] via-[#2a1613] to-[#111111] text-white p-8 md:p-12 rounded-2xl mb-12 shadow-xl border border-[#333] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#b70100] text-white text-xs font-label-caps px-3 py-1 rounded-full mb-3">
                <Search className="w-3.5 h-3.5" />
                <span>SEARCH RESULTS PAGE</span>
              </div>
              <h1 className="font-display-lg text-3xl md:text-5xl text-white mb-2">
                Search Results for: <span className="text-[#ffb4a8] italic font-serif">"{submittedQuery}"</span>
              </h1>
              <p className="font-body-lg text-[#cac6c2] text-sm max-w-xl">
                Displaying store products matching your search query. Bestseller products are prioritized first.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSubmittedQuery('');
                  setCurrentView('home');
                }}
                className="bg-[#222222] hover:bg-[#333] text-white text-xs font-label-caps px-5 py-3 rounded-lg border border-[#444] transition-colors cursor-pointer"
              >
                CLEAR SEARCH &amp; RETURN HOME
              </button>
            </div>
          </div>

          {/* Product Catalog Grid (Filtered with Bestsellers First) */}
          <ProductList onAddToCart={handleAddToCart} searchQuery={submittedQuery} />
        </div>
      )}

      {/* 10. MINI CART QUICK DRAWER */}
      {isCartOpen && (
        <>
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-[#2a1613]/60 backdrop-blur-md z-40 transition-opacity duration-300"
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-[#fff8f6] shadow-[0_0_40px_rgba(0,0,0,0.15)] z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
            {/* Drawer Header */}
            <div className="bg-[#111111] text-white flex items-center justify-between px-6 py-5 border-b border-[#222222]">
              <h2 className="font-headline-md text-xl tracking-tight font-medium flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#e60000]" />
                <span>Your Cart ({totalItemCount})</span>
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-[#cac6c2] hover:text-white transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Drawer Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-[#e9bcb5] mb-4 stroke-1" />
                  <h3 className="font-headline-md text-lg text-[#2a1613]">Your cart is empty</h3>
                  <p className="font-body-md text-xs text-[#5f3f3a] mt-1 max-w-xs">
                    Add physical products from the store catalog to populate your cart.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 bg-[#b70100] text-white py-2.5 px-6 rounded text-xs font-label-caps"
                  >
                    BROWSE PRODUCTS
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-[#cac6c2]/50 pb-5 items-start"
                  >
                    <div className="w-20 h-20 bg-[#ffffff] rounded flex-shrink-0 overflow-hidden relative shadow-sm border border-[#e8e1dc] p-1">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="object-contain w-full h-full"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between h-20">
                      <div>
                        <h3 className="font-headline-md text-sm text-[#2a1613] font-medium tracking-tight leading-snug truncate">
                          {item.name}
                        </h3>
                        <div
                          className="font-body-md text-xs text-[#5c5957] mt-0.5"
                          dangerouslySetInnerHTML={{
                            __html: item.price_html || `${currencySymbol}${item.price.toFixed(2)}`
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center bg-[#ffffff] border border-[#cac6c2] rounded overflow-hidden shadow-inner">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-[#625e5a] hover:bg-[#fff0ee] hover:text-[#2a1613] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-body-md text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#625e5a] hover:bg-[#fff0ee] hover:text-[#2a1613] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#5c5957] hover:text-[#ba1a1a] text-[10px] font-label-caps tracking-wider transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>REMOVE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-[#ffffff] border-t border-[#cac6c2]/40 flex flex-col gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-end text-[#2a1613]">
                  <span className="font-body-md text-base text-[#625e5a]">Subtotal</span>
                  <span className="font-headline-md text-2xl leading-none font-semibold">
                    {currencySymbol}{subtotal.toFixed(2)}
                  </span>
                </div>

                <p className="font-body-md text-xs text-[#5c5957]">
                  Taxes &amp; shipping calculated in checkout popup.
                </p>

                {/* Opens the BIG INDIVIDUAL POPUP BOX for Billing & Address */}
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setActiveModal('checkout');
                  }}
                  className="w-full bg-gradient-to-b from-[#b70100] to-[#9a0000] text-white py-4 px-6 rounded font-headline-md text-base shadow-[0_8px_16px_rgba(183,1,0,0.25)] hover:shadow-[0_12px_24px_rgba(183,1,0,0.35)] hover:-translate-y-0.5 transition-all duration-300 tracking-wide text-center"
                >
                  Proceed to Billing &amp; Address Popup
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* 9. BIG INDIVIDUAL POPUP MODAL: BILLING & ADDRESS POPUP */}
      {activeModal === 'checkout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur */}
          <div
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Big Individual Popup Dialog Box */}
          <div className="relative w-full max-w-4xl bg-[#fff8f6] rounded-2xl shadow-2xl overflow-hidden border border-[#e8e1dc] z-50 my-auto flex flex-col lg:flex-row max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 z-20 bg-[#111111] text-white p-2 rounded-full hover:bg-black transition-colors"
              aria-label="Close checkout modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Billing & Address Form */}
            <div className="lg:w-7/12 p-6 sm:p-8 overflow-y-auto space-y-6">
              <div>
                <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">
                  SECURE CHECKOUT POPUP
                </span>
                <h2 className="font-display-lg text-2xl sm:text-3xl text-[#2a1613]">
                  Billing Details &amp; Address
                </h2>
                <p className="font-body-md text-xs text-[#5f3f3a] mt-1">
                  Please enter your contact and shipping information to complete your order.
                </p>
              </div>

              {placedOrder ? (
                /* Order Confirmation Screen inside Big Popup */
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <span className="font-label-caps text-[#b70100] text-xs">ORDER CONFIRMED</span>
                  <h3 className="font-display-lg text-2xl text-[#2a1613]">
                    Thank You, {placedOrder.customer.firstName}!
                  </h3>
                  <p className="font-body-md text-xs text-[#5c5957] max-w-md mx-auto">
                    Order <span className="font-semibold text-[#2a1613]">{placedOrder.orderNumber}</span> has been successfully placed. Order confirmation sent to {placedOrder.customer.email}.
                  </p>
                  <div className="bg-[#fff0ee] p-4 rounded-lg border border-[#e9bcb5] text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between border-b border-[#e9bcb5] pb-2">
                      <span className="text-[#5c5957]">Total Paid:</span>
                      <span className="font-semibold text-[#2a1613]">{currencySymbol}{placedOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#e9bcb5] pb-2">
                      <span className="text-[#5c5957]">Payment Method:</span>
                      <span className="uppercase text-[#2a1613] font-semibold">{placedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c5957]">Delivery To:</span>
                      <span className="text-[#2a1613] font-medium">
                        {placedOrder.customer.address}, {placedOrder.customer.city}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPlacedOrder(null);
                      setActiveModal(null);
                    }}
                    className="mt-4 bg-[#111111] text-white py-3 px-8 rounded text-xs font-label-caps tracking-widest hover:bg-black transition-colors"
                  >
                    CLOSE POPUP
                  </button>
                </div>
              ) : (
                /* Billing & Address Inputs Form */
                <form onSubmit={handlePlaceOrder} className="space-y-6">
                  {/* 1. Contact Info */}
                  <div className="space-y-3">
                    <h3 className="font-headline-md text-sm text-[#2a1613] font-bold flex items-center gap-2">
                      <User className="w-4 h-4 text-[#b70100]" />
                      <span>1. Customer &amp; Billing Contact</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleFormChange}
                          required
                          className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleFormChange}
                          required
                          className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          required
                          className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          required
                          className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Shipping Address */}
                  <div className="space-y-3 pt-3 border-t border-[#ffe9e6]">
                    <h3 className="font-headline-md text-sm text-[#2a1613] font-bold flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#b70100]" />
                      <span>2. Shipping Address</span>
                    </h3>
                    <div>
                      <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">Street Address</label>
                      <input
                        type="text"
                        name="address"
                        placeholder="House No., Building Name, Street"
                        value={formData.address}
                        onChange={handleFormChange}
                        required
                        className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleFormChange}
                          required
                          className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleFormChange}
                          required
                          className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-label-caps text-[#5c5957] block mb-1">Pincode</label>
                        <input
                          type="text"
                          name="postcode"
                          value={formData.postcode}
                          onChange={handleFormChange}
                          required
                          className="w-full p-3 text-xs bg-white border border-[#e8e1dc] rounded-md focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Payment Option */}
                  <div className="space-y-3 pt-3 border-t border-[#ffe9e6]">
                    <h3 className="font-headline-md text-sm text-[#2a1613] font-bold flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#b70100]" />
                      <span>3. Select Payment Method</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cod', label: 'Cash on Delivery (COD)', icon: Banknote },
                        { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                        { id: 'upi', label: 'UPI / Google Pay', icon: Wallet },
                        { id: 'bacs', label: 'Direct Bank Transfer', icon: Building }
                      ].map((pm) => {
                        const IconComp = pm.icon;
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-3 rounded-md border text-left flex items-center gap-2 text-xs transition-colors ${
                              isSelected
                                ? 'border-[#b70100] bg-[#fff0ee] text-[#b70100] font-semibold'
                                : 'border-[#e8e1dc] bg-white text-[#5c5957]'
                            }`}
                          >
                            <IconComp className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#b70100] hover:bg-[#e60000] text-white py-4 px-6 rounded-md font-headline-md text-base shadow-lg transition-all tracking-wide text-center"
                  >
                    Confirm &amp; Place Order ({currencySymbol}{subtotal.toFixed(2)})
                  </button>
                </form>
              )}
            </div>

            {/* Right Side: Order Summary Column */}
            <div className="lg:w-5/12 bg-[#111111] text-white p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <h3 className="font-headline-md text-lg text-white border-b border-[#333] pb-4 mb-4 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs font-label-caps text-[#ffb4a8]">{cart.length} Items</span>
                </h3>

                {cart.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No items in cart.</p>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center justify-between text-xs">
                        <div className="flex items-center gap-3 truncate">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain bg-white rounded p-1 flex-shrink-0" />
                          <div className="truncate">
                            <span className="block text-white font-medium truncate">{item.name}</span>
                            <span className="text-gray-400">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-semibold text-white flex-shrink-0">
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-[#333] space-y-3 mt-6">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Shipping</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-headline-md font-bold text-white pt-2 border-t border-[#333]">
                  <span>Total Amount</span>
                  <span className="text-[#ffb4a8]">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. ANCHOR DEMO PAGES MODALS */}

      {/* DEMO MODAL 1: OUR CRAFT */}
      {activeModal === 'craft' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">DEMO PAGE: OUR CRAFT</span>
            <h2 className="font-display-lg text-3xl text-[#2a1613] mb-4">Modena Engineering &amp; Heritage</h2>
            <p className="font-body-lg text-sm text-[#5f3f3a] leading-relaxed mb-6">
              Our products bring together heavy industrial cast iron, 5-ply 18/10 stainless steel, and 990W heavy copper winding motors to deliver lifelong durability with elegant domestic warmth.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#fff0ee] p-4 rounded-lg border border-[#e9bcb5]">
                <Flame className="w-6 h-6 text-[#b70100] mb-2" />
                <h4 className="font-headline-md text-base text-[#2a1613] font-bold">Thermal Mass Engineering</h4>
                <p className="font-body-md text-xs text-[#5c5957] mt-1">Zero hot spots and maximum heat retention for perfect cooking results.</p>
              </div>
              <div className="bg-[#fff0ee] p-4 rounded-lg border border-[#e9bcb5]">
                <ShieldCheck className="w-6 h-6 text-[#b70100] mb-2" />
                <h4 className="font-headline-md text-base text-[#2a1613] font-bold">Food-Grade Steel</h4>
                <p className="font-body-md text-xs text-[#5c5957] mt-1">Non-reactive 304 grade stainless steel jars and razor-sharp blades.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEMO MODAL 2: MIXER GRINDERS */}
      {activeModal === 'mixerGrinders' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">DEMO PAGE: MIXER GRINDERS</span>
            <h2 className="font-display-lg text-3xl text-[#2a1613] mb-4">Modena Sindoor 990W Mixer Grinder Specs</h2>
            <div className="bg-white p-4 rounded-lg border border-[#e8e1dc] space-y-3 text-xs mb-6">
              <div className="flex justify-between border-b border-[#ffe9e6] pb-2">
                <span className="font-semibold text-[#2a1613]">Motor Capacity:</span>
                <span className="text-[#5c5957]">990 Watts (100% Copper Winding)</span>
              </div>
              <div className="flex justify-between border-b border-[#ffe9e6] pb-2">
                <span className="font-semibold text-[#2a1613]">Jars Included:</span>
                <span className="text-[#5c5957]">2 Stainless Steel Jars (Wet &amp; Dry Grinding)</span>
              </div>
              <div className="flex justify-between border-b border-[#ffe9e6] pb-2">
                <span className="font-semibold text-[#2a1613]">Overload Protection:</span>
                <span className="text-[#5c5957]">Automatic Thermal Circuit Breaker</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-[#2a1613]">Warranty:</span>
                <span className="text-[#b70100] font-bold">2 Years Manufacturer Warranty</span>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveModal(null);
                handleAddToCart({
                  id: 26,
                  name: 'modena sindoor 990W mixer grinder',
                  price: 2500,
                  price_html: '₹2,500.00',
                  image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp'
                });
              }}
              className="bg-[#b70100] text-white py-3 px-6 rounded text-xs font-label-caps"
            >
              ADD TO CART NOW (₹2,500.00)
            </button>
          </div>
        </div>
      )}

      {/* DEMO MODAL 3: REVIEWS */}
      {activeModal === 'reviews' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">DEMO PAGE: VERIFIED REVIEWS</span>
            <h2 className="font-display-lg text-3xl text-[#2a1613] mb-4">Customer Ratings &amp; Feedback</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-[#e8e1dc]">
                <div className="flex text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <h4 className="font-headline-md text-sm text-[#2a1613] font-bold">Unbeatable Performance</h4>
                <p className="font-body-md text-xs text-[#5c5957] mt-1">"Grinds idli batter and hard spices smoothly in seconds without overheating."</p>
                <span className="text-[10px] text-[#946e68] block mt-2">— Verified Buyer, Bengaluru</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEMO MODAL 4: CARE GUIDE & WARRANTY */}
      {(activeModal === 'careGuide' || activeModal === 'warranty') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">DEMO PAGE: CARE &amp; WARRANTY</span>
            <h2 className="font-display-lg text-3xl text-[#2a1613] mb-4">Product Care &amp; Warranty Support</h2>
            <p className="font-body-md text-xs text-[#5c5957] mb-4">
              All Modena appliances and cookware are covered by our heritage service guarantee. Clean with warm soapy water and wipe dry after use.
            </p>
            <button onClick={() => setActiveModal(null)} className="bg-[#111111] text-white py-2.5 px-6 rounded text-xs font-label-caps">
              CLOSE DEMO
            </button>
          </div>
        </div>
      )}

      {/* 5. LOGIN MODAL (AMAZON PROTOCOL) */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => { setActiveModal(null); setLoginStep(1); }} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-[400px] bg-white rounded-lg shadow-2xl p-6 sm:p-8 border border-gray-200 z-50 my-auto text-[#111111] overflow-hidden">
            <button onClick={() => { setActiveModal(null); setLoginStep(1); }} className="absolute top-4 right-4 text-gray-400 hover:text-black p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-6">
              <img
                src={logoMonoWhiteRed}
                alt="Modena Logo"
                className="h-8 w-auto object-contain brightness-0 filter invert-[0]" // Make it black/dark for light bg
              />
            </div>
            
            <h2 className="text-2xl font-medium font-inter mb-4">Sign in</h2>
            
            {loginStep === 1 ? (
              <form onSubmit={(e) => { e.preventDefault(); if (loginEmail) setLoginStep(2); }}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">Email or mobile phone number</label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b70100] focus:ring-1 focus:ring-[#b70100] transition-colors"
                  />
                </div>
                <button type="submit" className="w-full bg-[#b70100] hover:bg-[#9a0100] text-white py-2 rounded-md text-sm font-medium transition-colors shadow-sm mb-4">
                  Continue
                </button>
                <p className="text-xs text-gray-600 mb-6">
                  By continuing, you agree to Modena's <a href="#" className="text-blue-600 hover:underline hover:text-orange-600">Conditions of Use</a> and <a href="#" className="text-blue-600 hover:underline hover:text-orange-600">Privacy Notice</a>.
                </p>
                
                <div className="border-t border-gray-300 pt-4 flex flex-col space-y-3">
                  <button type="button" className="text-sm font-medium text-left hover:underline w-fit">Need help?</button>
                  <div className="pt-4 mt-2 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-500 text-center mb-2">New to Modena?</p>
                    <button type="button" className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-[#111111] py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                      Create your Modena account
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); setLoginStep(1); }}>
                <div className="mb-4">
                  <div className="text-sm mb-4 flex items-center">
                    <span className="truncate max-w-[200px]">{loginEmail}</span>
                    <button type="button" onClick={() => setLoginStep(1)} className="text-blue-600 hover:underline hover:text-orange-600 text-xs ml-2">Change</button>
                  </div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-semibold">Password</label>
                    <button type="button" className="text-blue-600 hover:underline hover:text-orange-600 text-xs">Forgot your password?</button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b70100] focus:ring-1 focus:ring-[#b70100] transition-colors"
                  />
                </div>
                <button type="submit" className="w-full bg-[#b70100] hover:bg-[#9a0100] text-white py-2 rounded-md text-sm font-medium transition-colors shadow-sm mb-4">
                  Sign in
                </button>
                <div className="flex items-center mb-6">
                  <input type="checkbox" id="keep-signed-in" className="mr-2" />
                  <label htmlFor="keep-signed-in" className="text-sm">Keep me signed in.</label>
                  <button type="button" className="text-blue-600 hover:underline hover:text-orange-600 text-xs ml-1 flex items-center">
                    Details
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 11. EDITORIAL FOOTER */}
      <footer className="bg-[#111111] text-white pt-16 pb-12 border-t border-[#222222]">
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#222222]">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center">
              <img
                src={logoMonoWhiteRed}
                alt="Modena Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="font-body-md text-xs text-[#cac6c2] leading-relaxed max-w-sm">
              Modena Kitchenware represents modern luxury cookware and appliances—fusing raw industrial materials with domestic warmth.
            </p>
            <div className="pt-2 text-xs text-[#cac6c2] font-label-caps">
              © {new Date().getFullYear()} Modena Kitchenware Ltd. All rights reserved.
            </div>
          </div>

          <div className="md:col-span-2 space-y-3 font-label-caps text-xs">
            <span className="text-[#ffb4a8] tracking-widest block mb-1">NAVIGATION DEMOS</span>
            <button onClick={() => setCurrentView('home')} className="block text-[#cac6c2] hover:text-white transition-colors text-left cursor-pointer">Home Store</button>
            <button onClick={() => setCurrentView('bestseller')} className="block text-[#cac6c2] hover:text-white transition-colors text-left cursor-pointer">Bestsellers Demo</button>
            <button onClick={() => setCurrentView('deal')} className="block text-[#cac6c2] hover:text-white transition-colors text-left cursor-pointer">Deals &amp; Flash Sales</button>
          </div>

          <div className="md:col-span-2 space-y-3 font-label-caps text-xs">
            <span className="text-[#ffb4a8] tracking-widest block mb-1">CATEGORY PAGES</span>
            <button onClick={() => setCurrentView('electronics')} className="block text-[#cac6c2] hover:text-white transition-colors text-left cursor-pointer">Culinary Electronics</button>
            <button onClick={() => setCurrentView('utensils')} className="block text-[#cac6c2] hover:text-white transition-colors text-left cursor-pointer">Heritage Utensils</button>
            <button onClick={() => setActiveModal('checkout')} className="block text-[#cac6c2] hover:text-white transition-colors text-left cursor-pointer">Billing &amp; Address Popup</button>
            <button onClick={() => setActiveModal('login')} className="block text-[#cac6c2] hover:text-white transition-colors text-left cursor-pointer">Amazon Login Flow</button>
          </div>

          <div className="md:col-span-4 space-y-4">
            <span className="font-label-caps text-xs text-[#ffb4a8] tracking-widest block">JOIN THE CULINARY CLUB</span>
            <p className="font-body-md text-xs text-[#cac6c2]">
              Subscribe to receive exclusive store updates, product releases, and maintenance tips.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-[#222222] border border-[#333333] rounded px-3 py-2 text-xs text-white placeholder-gray-500 flex-1 focus:outline-none focus:border-[#b70100]"
              />
              <button
                onClick={() => setNewsletterSubscribed(true)}
                className="bg-[#b70100] hover:bg-[#e60000] text-white px-4 py-2 rounded text-xs font-label-caps tracking-wider transition-colors"
              >
                JOIN
              </button>
            </div>
            {newsletterSubscribed && (
              <span className="text-xs text-emerald-400 block font-medium">✓ Subscribed to Modena Culinary Club!</span>
            )}
          </div>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
}

export default App;
