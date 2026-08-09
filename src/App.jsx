import React, { useState, useEffect, useRef, useMemo } from 'react';
import ProductList from './ProductList';
import Chatbot from './Chatbot';
import RazorpayCheckout from './components/Checkout/RazorpayCheckout';
import ReviewForm from './components/Reviews/ReviewForm';
import CompareModal from './components/Compare/CompareModal';
import AuthModal from './components/Auth/AuthModal';
import AmazonAuthModal from './components/Auth/AmazonAuthModal';
import ReturnProofModal from './components/Account/ReturnProofModal';
import logoMonoWhiteRed from '/modena_logo_mono-white_red.png';
import StorePolicies from './components/Legal/StorePolicies';
import { useProducts } from './hooks/useProducts';
import { useDebounce } from './hooks/useDebounce';
import { useDisplayTopology } from './hooks/useDisplayTopology';
import { generateInvoicePDF } from './utils/generateInvoicePDF';

import {
  ShoppingBag,
  Search,
  User,
  X,
  Plus,
  Loader2,
  Download,
  Minus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Upload,
  AlertCircle,
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
  Filter,
  Package,
  Lock,
  MapPin,
  Headphones,
  Truck,
  Heart,
  LogOut,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutDashboard,
  RotateCcw,
  RefreshCw,
  FileText
} from 'lucide-react';

function App() {
  const { isMobile, isExtraSmall } = useDisplayTopology();

  // Persisted Shopping Cart State (saved across browser refreshes)
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('modena_user_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('modena_user_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Scroll detector for flush sticky navbar without gap & reduced shadow
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation View State with Full Refresh & URL Hash Persistence
  const [currentView, setCurrentView] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash;
      const savedView = localStorage.getItem('modena_current_view');
      return savedView || 'home';
    } catch {
      return 'home';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('modena_current_view', currentView);
      if (currentView === 'home') {
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        window.location.hash = currentView;
      }
    } catch (e) {
      console.error('Failed to persist currentView:', e);
    }
  }, [currentView]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) {
        setCurrentView(hash);
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
  // Modals state for Big Checkout & Login popups ('checkout' | 'login' | 'account' | 'reviews' | 'careGuide' | 'warranty' | null)
  const [activeModal, setActiveModal] = useState(null);

  // Product Quick View Popup Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeProductImage, setActiveProductImage] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);

  // Helper to extract clean First Name everywhere in the UI
  const getFirstName = (name) => {
    if (!name || typeof name !== 'string') return 'Guest';
    const trimmed = name.trim();
    if (!trimmed) return 'Guest';
    const first = trimmed.split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  };

  // Auth State (Login & Registration with OTP Verification)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginStep, setLoginStep] = useState(1); // 1: Email, 2: Password/Register, 3: OTP Verification
  const [loginEmail, setLoginEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState(() => localStorage.getItem('user_display_name') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || '');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('user_phone') || '');

  // Login & Security inline editing states
  const [editingField, setEditingField] = useState(null); // 'name' | 'email' | 'phone' | 'password' | null
  const [fieldEditValue, setFieldEditValue] = useState('');

  // Addresses State (Persisted in localStorage without static demo data)
  const [userAddresses, setUserAddresses] = useState(() => {
    const saved = localStorage.getItem('modena_saved_addresses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sync userAddresses to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('modena_saved_addresses', JSON.stringify(userAddresses));
  }, [userAddresses]);

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    id: null,
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postcode: '',
    phone: ''
  });

  // Security Settings State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({ current: '', new: '', confirm: '' });
  const [isTwoStepEnabled, setIsTwoStepEnabled] = useState(false);
  
  // Orders Search State
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');

  // Contact Us Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSuccessMsg, setContactSuccessMsg] = useState(false);

  // Orders Tab State ('orders' | 'buyAgain' | 'returns')
  const [ordersTab, setOrdersTab] = useState('orders');
  const [returnRequestedIds, setReturnRequestedIds] = useState([]);

  // Return & Replacement Workflow Modal State
  const [activeReturnModalItem, setActiveReturnModalItem] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [resolutionType, setResolutionType] = useState('replace'); // 'replace' | 'refund'
  const [refundMethod, setRefundMethod] = useState('razorpay'); // 'razorpay' | 'bank' | 'upi'
  const [bankDetails, setBankDetails] = useState({ name: '', accNum: '', ifsc: '', upiId: '' });
  const [returnRequestsMap, setReturnRequestsMap] = useState({});

  // Return Proof Upload State for Return/Replacement Modal
  const [returnProofFile, setReturnProofFile] = useState(null);
  const [returnProofPreview, setReturnProofPreview] = useState(null);
  const [returnProofFileType, setReturnProofFileType] = useState('image');
  const [returnProofError, setReturnProofError] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Live WooCommerce API Products Integration via useProducts hook
  const { products: apiProducts, loading: isProductsLoading, error: productsError } = useProducts();

  const bestsellers = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    return apiProducts.slice(0, 4).map((p, idx) => ({
      ...p,
      badge: idx === 0 ? '#1 BESTSELLER' : idx === 1 ? 'CHEF FAVORITE' : idx === 2 ? 'TOP RATED' : 'HERITAGE'
    }));
  }, [apiProducts]);

  const flashDeals = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    return apiProducts.slice(0, 4).map((p, idx) => ({
      ...p,
      dealPrice: p.price_html || p.price,
      originalPrice: p.originalPrice || `₹${(p.numericPrice * 1.35).toFixed(0)}`,
      save: idx === 0 ? 'SAVE ₹1,000 (28% OFF)' : idx === 1 ? 'SAVE ₹1,300 (29% OFF)' : 'SAVE 30% OFF',
      stock: 'Only few left at deal price!'
    }));
  }, [apiProducts]);

  // Track Package & Leave Feedback Modal States
  const [activeTrackOrder, setActiveTrackOrder] = useState(null);
  const [activeFeedbackOrder, setActiveFeedbackOrder] = useState(null);
  const [sellerFeedbackForm, setSellerFeedbackForm] = useState({ rating: 5, comment: '', submitted: false });

  // Coupon System State
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Return Proof Modal State
  const [isReturnProofModalOpen, setIsReturnProofModalOpen] = useState(false);
  const [proofOrderId, setProofOrderId] = useState('');

  // Product Comparison Modal State
  const [compareItems, setCompareItems] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Fullscreen Product Image Zoom Modal State
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);

  const toggleCompare = (product) => {
    setCompareItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 3) {
          alert('You can compare up to 3 products at a time.');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'MODENA10' || code === 'CHEF10') {
      setAppliedDiscount({ code, percent: 10, label: '10% OFF Special Chef Discount' });
    } else if (code === 'WELCOME500') {
      setAppliedDiscount({ code, flat: 500, label: '₹500 OFF Welcome Voucher' });
    } else if (code === 'VIP20') {
      setAppliedDiscount({ code, percent: 20, label: '20% OFF VIP Culinary Pass' });
    } else {
      setCouponError('Invalid code. Try MODENA10, CHEF10, or WELCOME500');
    }
  };

  // Dynamic API & Persistent User Orders State
  const [userOrders, setUserOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('modena_user_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  const fetchUserOrders = React.useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const token = localStorage.getItem('modena_jwt_token');
      if (token) {
        const res = await fetch('/api/v1/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setUserOrders(data);
            localStorage.setItem('modena_user_orders', JSON.stringify(data));
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  // Wishlist State
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('modena_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('modena_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isWishlisted = (productId) => wishlist.some((p) => p.id === productId);

  const totalWishlistAmount = React.useMemo(() => {
    return wishlist.reduce((sum, item) => {
      let price = item.price || item.numericPrice || 0;
      if (typeof price === 'string') {
        price = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
      }
      return sum + price;
    }, 0);
  }, [wishlist]);

  const resetAuthForm = () => {
    setLoginStep(1);
    setAuthMode('login');
    setLoginPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_display_name');
    localStorage.removeItem('user_email');
    setUserDisplayName('');
    setUserEmail('');
    setActiveModal(null);
    resetAuthForm();
  };

  // 1. Check if user exists on Email Continue
  const handleEmailContinue = async (e) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/wp-json/modena/v1/check-user-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() })
      });
      const data = await response.json();

      if (data.exists) {
        setAuthMode('login');
        setLoginStep(2);
      } else {
        setAuthMode('register');
        setLoginStep(2);
      }
    } catch {
      setAuthMode('login');
      setLoginStep(2);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Request OTP Code for Registration
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!registerName.trim()) {
      setLoginError('Please enter your full name.');
      return;
    }
    if (!loginEmail.trim()) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword.trim() || loginPassword.length < 6) {
      setLoginError('Please enter a password with at least 6 characters.');
      return;
    }
    if (loginPassword !== confirmPassword) {
      setLoginError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/wp-json/modena/v1/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), name: registerName.trim() })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setDemoOtp(data.demo_otp || '123456');
        setLoginStep(3); // OTP Verification Step
      } else {
        setLoginError(data.message || 'Failed to send OTP code.');
      }
    } catch {
      setDemoOtp('123456');
      setLoginStep(3);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. Verify OTP & Register New Modena Account
  const handleVerifyOtpAndRegister = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode.trim()) return;

    setLoginError('');
    setIsLoggingIn(true);

    const displayName = registerName.trim() || loginEmail.split('@')[0];

    try {
      const response = await fetch('/wp-json/modena/v1/verify-otp-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          name: displayName,
          password: loginPassword,
          otp: otpCode.trim()
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        await handleJwtLoginInternal(loginEmail.trim(), loginPassword, data.display_name || displayName);
      } else {
        // Successful fallback registration
        const chosenName = data.display_name || displayName;
        localStorage.setItem('user_display_name', chosenName);
        localStorage.setItem('user_email', loginEmail.trim());
        setUserDisplayName(chosenName);
        setUserEmail(loginEmail.trim());
        setActiveModal(null);
        resetAuthForm();
      }
    } catch {
      localStorage.setItem('user_display_name', displayName);
      localStorage.setItem('user_email', loginEmail.trim());
      setUserDisplayName(displayName);
      setUserEmail(loginEmail.trim());
      setActiveModal(null);
      resetAuthForm();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleJwtLoginInternal = async (email, password, displayName) => {
    const finalName = displayName || registerName || email.split('@')[0];
    try {
      const response = await fetch('/wp-json/jwt-auth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password: password })
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_display_name', data.user_display_name || finalName);
        localStorage.setItem('user_email', email);
        setUserDisplayName(data.user_display_name || finalName);
        setUserEmail(email);
      } else {
        localStorage.setItem('user_display_name', finalName);
        localStorage.setItem('user_email', email);
        setUserDisplayName(finalName);
        setUserEmail(email);
      }
    } catch {
      localStorage.setItem('user_display_name', finalName);
      localStorage.setItem('user_email', email);
      setUserDisplayName(finalName);
      setUserEmail(email);
    }
    setActiveModal(null);
    resetAuthForm();
  };

  const handleJwtLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    await handleJwtLoginInternal(loginEmail.trim(), loginPassword, '');
    setIsLoggingIn(false);
  };
  
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'card', 'upi', 'bacs'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hero Carousel State & Auto-play (4.5s)
  const [heroIndex, setHeroIndex] = useState(0);
  const heroSlides = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) {
      return [
        {
          id: 'empty_hero',
          badge: 'HERO FEATURED',
          tag: 'HERO PRODUCT',
          title: 'No products in the website',
          subtitle: 'There are currently no products available in the website database.',
          price: '',
          numericPrice: 0,
          rating: 'No products in the website',
          image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp',
          viewKey: 'home'
        }
      ];
    }

    // Filter products for the Hero Showcase section (max 3 curated flagship items)
    const heroCategoryItems = apiProducts.filter((p) => {
      const nameLower = (p.name || '').toLowerCase();
      const catName = (p.category || '').toUpperCase();
      const cats = (p.categories || []).map((c) => (c.name || '').toUpperCase());
      return (
        catName.includes('HERO') ||
        cats.some((c) => c.includes('HERO')) ||
        nameLower.includes('nutri-blend') ||
        nameLower.includes('dosa tawa') ||
        nameLower.includes('750w')
      );
    });

    const itemsToMap = (heroCategoryItems.length > 0 ? heroCategoryItems : apiProducts).slice(0, 3);

    return itemsToMap.map((p) => ({
      id: p.id,
      badge: (p.category || 'HERO FEATURED').toUpperCase(),
      tag: (p.category || 'HERO PRODUCT').toUpperCase(),
      title: p.name,
      subtitle: p.description || p.desc || 'High quality product from store catalog.',
      price: p.price_html || p.price,
      numericPrice: p.numericPrice || 0,
      rating: p.rating || '4.9/5 (500+ Reviews)',
      image: p.image || '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp',
      images: p.images || [p.image],
      viewKey: 'home'
    }));
  }, [apiProducts]);

  const activeHeroSlide = heroSlides[heroIndex] || heroSlides[0];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
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

  // Form State for Big Billing & Address Popup (Auto-filled with logged in user & saved address)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    upiId: ''
  });

  // Automatically populate checkout form with logged-in user details & default saved address
  useEffect(() => {
    if (activeModal === 'checkout') {
      const nameParts = (userDisplayName || localStorage.getItem('user_display_name') || '').trim().split(' ');
      const fName = nameParts[0] || '';
      const lName = nameParts.slice(1).join(' ') || '';
      const emailVal = userEmail || localStorage.getItem('user_email') || '';
      const phoneVal = userPhone || localStorage.getItem('user_phone') || '';

      const defaultAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0] || null;

      setFormData({
        firstName: fName,
        lastName: lName,
        email: emailVal,
        phone: phoneVal || (defaultAddress ? defaultAddress.phone : ''),
        address: defaultAddress ? defaultAddress.line1 : '',
        city: defaultAddress ? defaultAddress.city : '',
        state: defaultAddress ? defaultAddress.state : '',
        postcode: defaultAddress ? defaultAddress.postcode : '',
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
        upiId: ''
      });
    }
  }, [activeModal, userDisplayName, userEmail, userPhone, userAddresses]);

  // Helper function to enforce authentication before proceeding to checkout
  const triggerCheckoutFlow = () => {
    // Strictly check for email or token to ensure they actually logged in, ignoring old demo display names
    const loggedIn = Boolean(
      userEmail || 
      localStorage.getItem('user_email') || 
      localStorage.getItem('modena_jwt_token')
    );
    if (!loggedIn) {
      setActiveModal('login');
    } else {
      setActiveModal('checkout');
    }
  };

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

  const handleAddToCart = (product, quantityToAdd = 1) => {
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
          item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: priceVal,
            price_html: product.price_html || product.price,
            currency_symbol: product.prices?.currency_symbol || '₹',
            image: img,
            quantity: quantityToAdd
          }
        ];
      }
    });
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

  // Shipping Fee per Official Policy #3: Free shipping above ₹2,999. Orders below ₹2,999 attract flat ₹300 fee.
  const shippingFee = subtotal > 0 && subtotal < 2999 ? 300 : 0;

  const discountAmount = appliedDiscount
    ? appliedDiscount.percent
      ? (subtotal * appliedDiscount.percent) / 100
      : appliedDiscount.flat || 0
    : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmittingOrder) return;
    if (!cart || cart.length === 0) return;

    setIsSubmittingOrder(true);
    const orderNumber = 'MOD-' + Math.floor(100000 + Math.random() * 900000);
    const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || userDisplayName || 'Valued Customer';

    // Automatically save checkout address to "Your Addresses" in account if provided
    if (formData.address) {
      setUserAddresses((prev) => {
        const exists = prev.some(
          (a) => a.line1.toLowerCase().trim() === formData.address.toLowerCase().trim() && a.city.toLowerCase().trim() === formData.city.toLowerCase().trim()
        );
        if (!exists) {
          const newAddr = {
            id: Date.now(),
            name: fullName,
            line1: formData.address,
            line2: '',
            city: formData.city || '',
            state: formData.state || '',
            postcode: formData.postcode || '',
            country: 'India',
            phone: formData.phone || userPhone || '',
            isDefault: prev.length === 0
          };
          const updated = [...prev, newAddr];
          localStorage.setItem('modena_saved_addresses', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }

    const customerDetails = {
      firstName: formData.firstName || getFirstName(userDisplayName) || 'Valued Customer',
      lastName: formData.lastName || '',
      name: fullName,
      email: formData.email || userEmail || '',
      phone: formData.phone || userPhone || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      postcode: formData.postcode || ''
    };

    try {
      const response = await fetch('/wp-json/modena/v1/create-wc-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          items: cart,
          customer: customerDetails,
          paymentMethod: paymentMethod || 'cod',
          total: subtotal
        })
      });
      const data = await response.json();
      const realOrderNumber = data.success ? data.order_number : orderNumber;

      const newOrder = {
        id: 'order-' + Date.now(),
        orderNumber: realOrderNumber,
        items: [...cart],
        total: subtotal,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        customer: customerDetails,
        paymentMethod,
        status: 'Processing',
        deliveryStatus: '🚚 Order Placed - Arriving Soon via BlueDart'
      };
      
      setPlacedOrder(newOrder);
      setUserOrders((prev) => {
        const updated = [newOrder, ...prev];
        try {
          localStorage.setItem('modena_user_orders', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setCart([]);
    } catch (error) {
      console.error('Failed to create WooCommerce order:', error);
      // Fallback
      const newOrder = {
        id: 'order-' + Date.now(),
        orderNumber,
        items: [...cart],
        total: subtotal,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        customer: customerDetails,
        paymentMethod,
        status: 'Processing',
        deliveryStatus: '🚚 Order Placed - Arriving Soon via BlueDart'
      };
      setPlacedOrder(newOrder);
      setCart([]);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Searchable products (loaded dynamically from live WooCommerce database)
  const searchableProducts = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    return apiProducts.map((p, idx) => ({
      ...p,
      bestsellerScore: p.id === 26 ? 100 : p.id === 31 ? 95 : p.id === 32 ? 90 : 80 - idx,
      badge: idx === 0 ? '#1 BESTSELLER' : idx === 1 ? 'CHEF FAVORITE' : 'TOP RATED',
      inStock: p.stock_status !== 'outofstock',
      stockLabel: p.stock_status === 'outofstock' ? 'Out of Stock' : 'In Stock'
    }));
  }, [apiProducts]);

  // Debounced search query (300ms delay to prevent excessive recalculations/requests)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const isDebouncing = searchQuery.trim() !== debouncedSearchQuery.trim();
  const searchContainerRef = useRef(null);

  // Close search overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOverlayOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const q = debouncedSearchQuery.toLowerCase().trim();
    const matched = searchableProducts.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))
    );
    return matched.sort((a, b) => b.bestsellerScore - a.bestsellerScore);
  }, [debouncedSearchQuery, searchableProducts]);

  const searchIntentInfo = getSearchIntent(debouncedSearchQuery || searchQuery);

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#2a1613] font-inter antialiased relative selection:bg-[#b70100] selection:text-white">
      {/* MAIN STUCK TOP FLOATING ROUNDED NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full max-w-[1720px] mx-auto px-3 sm:px-6 relative">
        <div className={`bg-[#111111]/95 backdrop-blur-xl text-white border px-6 sm:px-10 h-16 sm:h-18 flex items-center justify-between relative transition-all duration-[600ms] ease-out will-change-[margin,border-radius] transform-gpu ${isScrolled ? 'mt-0 rounded-t-none rounded-b-[36px] border-t-transparent border-x-[#2e2e2e]/80 border-b-[#2e2e2e]/80 shadow-2xl' : 'mt-2.5 sm:mt-4 rounded-t-[36px] rounded-b-[36px] border-[#2e2e2e]/80 shadow-md shadow-black/20'}`}>
          {/* Left: Logo */}
          <div className="flex items-center gap-3.5">
            <button onClick={() => setCurrentView('home')} className="flex items-center group cursor-pointer">
              <img
                src={logoMonoWhiteRed}
                alt="Modena Logo"
                className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-102 -translate-y-0.5"
              />
            </button>
          </div>

          {/* Center: Desktop Navigation Anchors - Centered Vertically & Horizontally */}
          <nav className="hidden lg:flex items-center gap-8 font-label-caps text-xs sm:text-sm tracking-widest absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => setCurrentView('home')}
              className={`py-2 border-b-2 transition-all cursor-pointer font-semibold ${
                currentView === 'home' ? 'text-[#b70100] border-[#b70100] font-bold scale-105' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              HOME
            </button>
            <button
              onClick={() => setCurrentView('bestseller')}
              className={`py-2 border-b-2 transition-all cursor-pointer font-semibold ${
                currentView === 'bestseller' ? 'text-[#b70100] border-[#b70100] font-bold scale-105' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              BESTSELLER
            </button>
            <button
              onClick={() => setCurrentView('deal')}
              className={`py-2 border-b-2 transition-all cursor-pointer font-semibold ${
                currentView === 'deal' ? 'text-[#b70100] border-[#b70100] font-bold scale-105' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              DEAL
            </button>
            <button
              onClick={() => setCurrentView('electronics')}
              className={`py-2 border-b-2 transition-all cursor-pointer font-semibold ${
                currentView === 'electronics' ? 'text-[#b70100] border-[#b70100] font-bold scale-105' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              ELECTRONICS
            </button>
            <button
              onClick={() => setCurrentView('utensils')}
              className={`py-2 border-b-2 transition-all cursor-pointer font-semibold ${
                currentView === 'utensils' ? 'text-[#b70100] border-[#b70100] font-bold scale-105' : 'text-gray-200 hover:text-[#e60000] border-transparent'
              }`}
            >
              UTENSILS
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            <div ref={searchContainerRef} className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#222222] rounded-full px-4 py-2 border border-[#333333] focus-within:border-[#b70100] transition-colors relative">
                <button type="submit" aria-label="Search" className="cursor-pointer">
                  {isDebouncing || isProductsLoading ? (
                    <Loader2 className="w-4.5 h-4.5 text-[#b70100] animate-spin mr-2" />
                  ) : (
                    <Search className="w-4.5 h-4.5 text-gray-400 hover:text-white mr-2" />
                  )}
                </button>
                <input
                  id="header-search-input"
                  name="search"
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onFocus={() => setIsSearchOverlayOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOverlayOpen(true);
                  }}
                  className="bg-transparent text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none w-36 focus:w-56 transition-all"
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
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* LIVE INSTANT SEARCH AUTOCOMPLETE DROPDOWN */}
              {isSearchOverlayOpen && searchQuery.trim() && (
                <div className="absolute right-0 top-14 w-86 sm:w-96 bg-[#111111]/95 backdrop-blur-xl border border-[#333333] rounded-2xl shadow-2xl z-50 p-4 overflow-hidden text-white animate-in fade-in duration-200">
                  {searchIntentInfo && (
                    <div className="flex items-center justify-between border-b border-[#222222] pb-2.5 mb-3 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#ffb4a8] font-label-caps font-semibold truncate">
                        <Sparkles className="w-3.5 h-3.5 text-[#b70100] flex-shrink-0" />
                        <span className="truncate">{searchIntentInfo.intent}</span>
                      </div>
                      <span className="text-[10px] bg-[#b70100] text-white px-2 py-0.5 rounded font-bold flex-shrink-0">BESTSELLERS FIRST</span>
                    </div>
                  )}

                  {isDebouncing || isProductsLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-400">
                      <Loader2 className="w-4 h-4 text-[#b70100] animate-spin" />
                      <span>Searching database...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 space-y-1">
                      <p className="font-semibold text-gray-300">No products in the website</p>
                      <p className="text-[11px] text-gray-500">No products in the website</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-84 overflow-y-auto pr-1 scrollbar-thin">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-[#1a1a1a] hover:bg-[#252525] p-2.5 rounded-xl border border-[#2a2a2a] transition-all group"
                        >
                          <div
                            className="flex items-center gap-3 truncate mr-2 cursor-pointer flex-1"
                            onClick={() => {
                              setSelectedProduct(item);
                              setProductQuantity(1);
                              setIsSearchOverlayOpen(false);
                            }}
                          >
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-contain rounded-lg bg-white p-1 flex-shrink-0 border border-gray-700" />
                            <div className="truncate">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-bold bg-[#b70100] text-white px-1.5 py-0.2 rounded">{item.badge}</span>
                                {item.inStock ? (
                                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">In Stock</span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.2 rounded">Out of Stock</span>
                                )}
                              </div>
                              <h4 className="text-xs text-white font-medium truncate group-hover:text-[#ffb4a8] transition-colors">{item.name}</h4>
                              <span className="text-xs text-[#ffb4a8] font-bold block">{item.price_html || item.price}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddToCart(item);
                              setIsSearchOverlayOpen(false);
                            }}
                            className="bg-[#b70100] hover:bg-[#e60000] active:scale-95 text-white text-[10px] font-label-caps px-3.5 py-2 rounded-xl transition-all flex-shrink-0 cursor-pointer shadow font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>QUICK ADD</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-[#222] flex justify-between items-center text-[10px] text-gray-400">
                    <span>Press Enter for full store search</span>
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

            {/* Wishlist Trigger Button near Searchbar (Hidden on mobile, pushed to mobile menu drawer) */}
            <button
              onClick={() => setIsWishlistModalOpen(true)}
              className="hidden md:flex relative bg-[#222222] hover:bg-[#333333] text-white p-3 rounded-full transition-all duration-200 items-center justify-center border border-[#333333] hover:scale-105 cursor-pointer flex-shrink-0"
              aria-label="Open Wishlist"
              title="View your wishlist"
            >
              <Heart className={`w-5.5 h-5.5 transition-colors ${wishlist.length > 0 ? 'fill-[#b70100] text-[#b70100]' : 'text-gray-300 hover:text-white'}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#b70100] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111111]">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Account Picture / Icon with Interactive Dropdown Menu */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                onClick={() => {
                  if (userDisplayName) {
                    setIsAccountDropdownOpen((prev) => !prev);
                    setCurrentView('yourAccount');
                  } else {
                    setAuthMode('login');
                    setLoginStep(1);
                    setLoginError('');
                    setActiveModal('login');
                  }
                }}
                aria-label="User Account"
                title={userDisplayName ? `Account: ${userDisplayName}` : 'Sign In / Register'}
                className="w-11 h-11 rounded-full bg-[#b70100] hover:bg-[#e60000] text-white flex items-center justify-center font-bold text-base shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[#ff4d4d]/30 flex-shrink-0"
              >
                {userDisplayName ? (
                  getFirstName(userDisplayName).charAt(0).toUpperCase()
                ) : (
                  <User className="w-5.5 h-5.5 text-white" />
                )}
              </button>

              {/* Comprehensive Account Dropdown Menu with all Manage Account Anchors */}
              {userDisplayName && isAccountDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  {/* Header Info */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-[#fff0ee]/50 rounded-t-2xl">
                    <p className="text-[10px] font-extrabold text-[#b70100] uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-[#2a1613] truncate">{userDisplayName}</p>
                    {(userEmail || localStorage.getItem('user_email')) && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{userEmail || localStorage.getItem('user_email')}</p>
                    )}
                  </div>

                  {/* Main Account Navigation Anchors */}
                  <div className="py-1.5 divide-y divide-gray-100/60 max-h-[75vh] overflow-y-auto scrollbar-thin">
                    <div className="py-1">
                      {/* Anchor 1: Manage Account Main Hub */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setCurrentView('yourAccount');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-[#fff0ee] hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#fff0ee] group-hover:bg-[#b70100] text-[#b70100] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-[#2a1613] group-hover:text-[#b70100]">Manage Account Hub</span>
                          <span className="text-[10px] text-gray-400 font-normal block">Dashboard &amp; Settings</span>
                        </div>
                      </button>
                    </div>

                    <div className="py-1">
                      {/* Anchor 2: Your Orders */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setOrdersTab('orders');
                          setCurrentView('yourOrders');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Package className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1">
                          <span className="block font-medium">Your Orders</span>
                          <span className="text-[10px] text-gray-400 font-normal">Track, return, or invoice</span>
                        </div>
                      </button>

                      {/* Anchor 3: Buy Again */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setOrdersTab('buyAgain');
                          setCurrentView('yourOrders');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1">
                          <span className="block font-medium">Buy Again</span>
                          <span className="text-[10px] text-gray-400 font-normal">1-click past purchase reorder</span>
                        </div>
                      </button>

                      {/* Anchor 4: Returns & Exchanges */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setOrdersTab('returns');
                          setCurrentView('yourOrders');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1">
                          <span className="block font-medium">Returns &amp; Replacement</span>
                          <span className="text-[10px] text-gray-400 font-normal">Track return requests &amp; status</span>
                        </div>
                      </button>
                    </div>

                    <div className="py-1">
                      {/* Anchor 5: Login & Security */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setCurrentView('loginSecurity');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Lock className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1">
                          <span className="block font-medium">Login &amp; Security</span>
                          <span className="text-[10px] text-gray-400 font-normal">Edit name, email &amp; mobile</span>
                        </div>
                      </button>

                      {/* Anchor 6: Your Addresses */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setCurrentView('yourAddresses');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <MapPin className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1">
                          <span className="block font-medium">Your Addresses</span>
                          <span className="text-[10px] text-gray-400 font-normal">Manage saved addresses</span>
                        </div>
                      </button>

                      {/* Anchor 7: Wishlist */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setIsWishlistModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Heart className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <span className="block font-medium">Wishlist</span>
                            <span className="text-[10px] text-gray-400 font-normal">Saved items &amp; favorites</span>
                          </div>
                          {wishlist.length > 0 && (
                            <span className="bg-[#b70100] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {wishlist.length}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Anchor 8: Contact Us */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setCurrentView('contactUs');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Headphones className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1">
                          <span className="block font-medium">Contact Us</span>
                          <span className="text-[10px] text-gray-400 font-normal">Support, phone &amp; chat</span>
                        </div>
                      </button>

                      {/* Anchor 9: Store Policies */}
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setCurrentView('storePolicies');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#b70100] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <FileText className="w-4 h-4 text-gray-500 group-hover:text-[#b70100]" />
                        <div className="flex-1">
                          <span className="block font-medium">Store Policies</span>
                          <span className="text-[10px] text-gray-400 font-normal">Terms, Privacy, Returns &amp; Warranty</span>
                        </div>
                      </button>
                    </div>

                    {/* Logout Action */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-[#b70100] hover:bg-[#e60000] text-white p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-[0_4px_12px_rgba(183,1,0,0.3)] hover:scale-105 cursor-pointer flex-shrink-0"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-5.5 h-5.5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#b70100] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111111]">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Mobile Navigation Menu Toggle (Rightmost Item) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden bg-[#222222] hover:bg-[#333333] text-gray-300 hover:text-white p-2.5 rounded-full border border-[#333333] transition-all flex items-center justify-center focus:outline-none cursor-pointer flex-shrink-0 hover:scale-105"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Floating Overlay Drawer (Positioned Absolute so page content doesn't move) */}
        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="lg:hidden absolute top-full left-3 right-3 sm:left-6 sm:right-6 mt-2 z-50 bg-[#141414]/98 backdrop-blur-2xl border border-[#2e2e2e] rounded-3xl p-4 flex flex-col gap-3 font-inter text-xs shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-3 duration-300 ease-out max-h-[85vh] overflow-y-auto scrollbar-thin">
              {/* 1. Mobile Search Input */}
              <form
                onSubmit={(e) => {
                  handleSearchSubmit(e);
                  setMobileMenuOpen(false);
                }}
                className="relative flex items-center bg-[#222222] rounded-2xl px-3.5 py-2.5 border border-[#333333] focus-within:border-[#b70100] transition-all"
              >
                <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOverlayOpen(true);
                  }}
                  onFocus={() => setIsSearchOverlayOpen(true)}
                  className="bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOverlayOpen(false);
                    }}
                    className="text-gray-400 hover:text-white ml-2 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* 2. Simple Main Navigation Anchors */}
              <nav className="flex flex-col gap-1 pt-1 font-label-caps text-xs">
                <button
                  onClick={() => {
                    setCurrentView('home');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left ${
                    currentView === 'home'
                      ? 'bg-[#b70100] text-white shadow-md'
                      : 'text-gray-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>HOME</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('bestseller');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left ${
                    currentView === 'bestseller'
                      ? 'bg-[#b70100] text-white shadow-md'
                      : 'text-gray-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>BESTSELLER</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('deal');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left ${
                    currentView === 'deal'
                      ? 'bg-[#b70100] text-white shadow-md'
                      : 'text-gray-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>DEAL</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('electronics');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left ${
                    currentView === 'electronics'
                      ? 'bg-[#b70100] text-white shadow-md'
                      : 'text-gray-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>ELECTRONICS</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('utensils');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left ${
                    currentView === 'utensils'
                      ? 'bg-[#b70100] text-white shadow-md'
                      : 'text-gray-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>UTENSILS</span>
                </button>

                {/* 3. Wishlist Anchor pushed into menu drawer */}
                <button
                  onClick={() => {
                    setIsWishlistModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left text-gray-200 hover:bg-white/5 hover:text-white border-t border-white/10 mt-1"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-[#b70100] text-[#b70100]' : 'text-gray-400'}`} />
                    <span>MY WISHLIST</span>
                  </span>
                  {wishlist.length > 0 && (
                    <span className="bg-[#b70100] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </>
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
                  <span>MODENA HERITAGE STORE</span>
                </div>

                <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-[#2a1613] tracking-tight leading-[1.1]">
                  Industrial Precision. <br />
                  <span className="text-[#b70100] italic font-serif">Domestic Warmth.</span>
                </h1>

                <p className="font-body-lg text-[#5f3f3a] text-lg max-w-xl leading-relaxed">
                  Experience Modena's heavy-duty 990W mixer grinders and heritage-grade cookware. Engineered for professional home chefs and culinary enthusiasts.
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
                    EXPLORE ELECTRONICS
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
                  <div
                    onClick={() => {
                      if (activeHeroSlide.id !== 'empty_hero') {
                        setSelectedProduct(activeHeroSlide);
                        setProductQuantity(1);
                      }
                    }}
                    className="relative w-full h-[420px] overflow-hidden rounded-lg cursor-pointer group/img"
                  >
                    <img
                      key={activeHeroSlide.id}
                      src={activeHeroSlide.image || '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp'}
                      alt={activeHeroSlide.title}
                      className="w-full h-full object-cover rounded-lg shadow-md group-hover/img:scale-105 transition-all duration-700 animate-in fade-in"
                      onError={(e) => {
                        e.target.src =
                          '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp';
                      }}
                    />

                    {/* Badge Overlay */}
                    <span className="absolute top-4 left-4 bg-[#b70100] text-white text-[10px] font-label-caps px-3 py-1 rounded shadow-lg tracking-wider">
                      {activeHeroSlide.badge}
                    </span>

                    {/* Manual Carousel Navigation Arrows */}
                    <button
                      onClick={(e) => { e.stopPropagation(); prevHeroSlide(); }}
                      aria-label="Previous Slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextHeroSlide(); }}
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
                          onClick={(e) => { e.stopPropagation(); setHeroIndex(idx); }}
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
                      <div
                        onClick={() => {
                          if (activeHeroSlide.id !== 'empty_hero') {
                            setSelectedProduct(activeHeroSlide);
                            setProductQuantity(1);
                          }
                        }}
                        className="cursor-pointer group/title"
                      >
                        <span className="text-[9px] font-label-caps text-[#ffb4a8] tracking-widest block">
                          {activeHeroSlide.tag}
                        </span>
                        <h4 className="font-headline-md text-base sm:text-lg text-white font-medium truncate group-hover/title:text-[#ffb4a8] transition-colors">
                          {activeHeroSlide.title}
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{activeHeroSlide.rating}</span>
                        </div>
                      </div>
                      <span className="font-headline-md text-lg text-white font-bold whitespace-nowrap">
                        {activeHeroSlide.price}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() =>
                          handleAddToCart({
                            id: activeHeroSlide.id,
                            name: activeHeroSlide.title,
                            price: activeHeroSlide.numericPrice,
                            price_html: activeHeroSlide.price,
                            image: activeHeroSlide.image
                          })
                        }
                        className="flex-1 bg-[#b70100] hover:bg-[#e60000] text-white py-2 rounded text-xs font-label-caps tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD TO CART
                      </button>

                      <button
                        onClick={() => {
                          if (activeHeroSlide.id !== 'empty_hero') {
                            setSelectedProduct(activeHeroSlide);
                            setProductQuantity(1);
                          }
                        }}
                        className="bg-[#222222] hover:bg-[#333] text-white px-3.5 py-2 rounded text-xs font-label-caps border border-[#444] cursor-pointer"
                      >
                        VIEW PRODUCT
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
              {isProductsLoading ? (
                <div className="flex gap-4 overflow-hidden py-4 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="min-w-[280px] sm:min-w-[320px] h-[360px] bg-gray-100 animate-pulse rounded-xl border border-gray-200" />
                  ))}
                </div>
              ) : bestsellers.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm font-semibold w-full">No products in the website</div>
              ) : (
                bestsellers.map((item) => (
                <div
                  key={item.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-xl border border-[#e8e1dc] p-4 flex flex-col justify-between snap-start shadow-sm hover:shadow-md transition-shadow group flex-shrink-0 relative"
                >
                  <div className="relative mb-3">
                    <span className="absolute top-2 left-2 z-10 bg-[#b70100] text-white text-[9px] font-label-caps px-2 py-0.5 rounded shadow">
                      {item.badge}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(item);
                      }}
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 flex items-center justify-center shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title={isWishlisted(item.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isWishlisted(item.id) ? 'fill-[#b70100] text-[#b70100]' : 'text-gray-400 hover:text-[#b70100]'}`} />
                    </button>
                    <div
                      onClick={() => { setSelectedProduct(item); setProductQuantity(1); }}
                      className="w-full h-52 bg-[#fff0ee] rounded-lg overflow-hidden flex items-center justify-center p-3 cursor-pointer"
                    >
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
                    <h3
                      onClick={() => { setSelectedProduct(item); setProductQuantity(1); }}
                      className="font-headline-md text-base text-[#2a1613] font-medium truncate mb-1 cursor-pointer hover:text-[#b70100] transition-colors"
                    >
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
              )))}
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
              {isProductsLoading ? (
                <div className="flex gap-4 overflow-hidden py-4 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="min-w-[290px] sm:min-w-[320px] h-[360px] bg-red-50/50 animate-pulse rounded-xl border border-red-100" />
                  ))}
                </div>
              ) : flashDeals.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm font-semibold w-full">No products in the website</div>
              ) : (
                flashDeals.map((item) => (
                <div
                  key={item.id}
                  className="min-w-[290px] sm:min-w-[320px] max-w-[320px] bg-white rounded-xl border border-red-200 p-4 flex flex-col justify-between snap-start shadow-sm hover:shadow-md transition-shadow relative flex-shrink-0"
                >
                  <span className="absolute top-3 left-3 z-10 bg-[#b70100] text-white text-[9px] font-bold px-2.5 py-1 rounded shadow">
                    {item.save}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item);
                    }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-red-200 flex items-center justify-center shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={isWishlisted(item.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isWishlisted(item.id) ? 'fill-[#b70100] text-[#b70100]' : 'text-gray-400 hover:text-[#b70100]'}`} />
                  </button>
                  <div
                    onClick={() => { setSelectedProduct(item); setProductQuantity(1); }}
                    className="w-full h-48 bg-[#fff0ee] rounded-lg overflow-hidden flex items-center justify-center p-3 mb-3 cursor-pointer"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-auto max-h-[170px] object-contain hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div>
                    <h3
                      onClick={() => { setSelectedProduct(item); setProductQuantity(1); }}
                      className="font-headline-md text-base text-[#2a1613] font-medium truncate mb-1 cursor-pointer hover:text-[#b70100] transition-colors"
                    >
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
              )))}
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
              {isProductsLoading ? (
                <div className="flex gap-4 overflow-hidden py-4 w-full">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="min-w-[280px] sm:min-w-[320px] h-[280px] bg-[#fff0ee]/50 animate-pulse rounded-xl border border-[#e8e1dc]" />
                  ))}
                </div>
              ) : apiProducts.length === 0 ? (
                <div className="py-8 text-center text-[#5c5957] text-sm font-semibold w-full bg-white rounded-xl border border-[#e8e1dc]">
                  No products available in the database
                </div>
              ) : (
                apiProducts.map((item) => (
                  <div
                    key={item.id}
                    className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-xl border border-[#e8e1dc] p-4 flex flex-col justify-between snap-start shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
                  >
                    <div
                      onClick={() => { setSelectedProduct(item); setProductQuantity(1); }}
                      className="w-full h-48 bg-[#fff0ee] rounded-lg overflow-hidden flex items-center justify-center p-3 mb-3 cursor-pointer"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-auto max-h-[170px] object-contain hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-label-caps text-[#b70100] tracking-wider block uppercase">
                        {item.category || 'ELECTRONICS'}
                      </span>
                      <h3
                        onClick={() => { setSelectedProduct(item); setProductQuantity(1); }}
                        className="font-headline-md text-base text-[#2a1613] font-medium truncate mb-1 cursor-pointer hover:text-[#b70100] transition-colors"
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#5c5957] mb-3 line-clamp-1">{item.description || item.desc || 'High Quality Product'}</p>
                    </div>
                    <div className="pt-3 border-t border-[#f0e6e4] flex items-center justify-between">
                      <span className="font-headline-md text-base text-[#2a1613] font-bold">
                        {item.price_html || item.price}
                      </span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-label-caps px-3.5 py-2 rounded transition-colors cursor-pointer"
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* DYNAMIC PRODUCT LIST */}
          <ProductList onAddToCart={handleAddToCart} onSelectProduct={(p) => { setSelectedProduct(p); setProductQuantity(1); }} searchQuery={searchQuery} wishlist={wishlist} onToggleWishlist={toggleWishlist} />

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

          <ProductList onAddToCart={handleAddToCart} onSelectProduct={(p) => { setSelectedProduct(p); setProductQuantity(1); }} searchQuery="" selectedCategoryName="bestseller" wishlist={wishlist} onToggleWishlist={toggleWishlist} />
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

          <ProductList onAddToCart={handleAddToCart} onSelectProduct={(p) => { setSelectedProduct(p); setProductQuantity(1); }} searchQuery="" selectedCategoryName="deal" wishlist={wishlist} onToggleWishlist={toggleWishlist} />
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

          <div className="bg-white rounded-xl border border-[#e8e1dc] p-8 shadow-sm mb-12">
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
          </div>

          <ProductList onAddToCart={handleAddToCart} onSelectProduct={(p) => { setSelectedProduct(p); setProductQuantity(1); }} searchQuery="" selectedCategoryName="electronics" wishlist={wishlist} onToggleWishlist={toggleWishlist} />
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

          <ProductList onAddToCart={handleAddToCart} onSelectProduct={(p) => { setSelectedProduct(p); setProductQuantity(1); }} searchQuery="" selectedCategoryName="utensils" wishlist={wishlist} onToggleWishlist={toggleWishlist} />
        </div>
      )}

      {/* 10. ABOUT US PAGE VIEW */}
      {currentView === 'about' && (
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-[#111111] via-[#2a1613] to-[#1a0a08] text-white p-8 md:p-16 rounded-3xl mb-16 shadow-2xl border border-[#3a221f] relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
              <img src="/modena_logo_mono-white_red.png" alt="Modena Heritage" className="w-full h-full object-contain" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#b70100] text-white text-xs font-label-caps px-4 py-1.5 rounded-full mb-6 tracking-widest shadow-md">
                <Flame className="w-3.5 h-3.5" />
                <span>OUR HERITAGE & CRAFTSMANSHIP</span>
              </div>
              <h1 className="font-display-lg text-4xl md:text-6xl text-white mb-6 leading-tight">
                Crafting Culinary Excellence <span className="text-[#ffb4a8] italic font-serif">Since 1998</span>
              </h1>
              <p className="font-body-lg text-[#cac6c2] text-base md:text-lg mb-8 leading-relaxed">
                At Modena, we engineer heavy-duty commercial kitchen appliances and heirloom-quality cast iron cookware built to endure generations of Indian culinary mastery.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setCurrentView('bestseller')}
                  className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-label-caps px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-red-950/50 flex items-center gap-2 cursor-pointer"
                >
                  <span>EXPLORE BESTSELLERS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentView('utensils')}
                  className="bg-[#222222] hover:bg-[#333333] text-white text-xs font-label-caps px-6 py-3.5 rounded-xl border border-[#444] transition-colors cursor-pointer"
                >
                  VIEW COOKWARE
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-[#2a1613]/30 border border-[#f0e6e4] p-6 rounded-2xl text-center">
              <div className="font-display-lg text-3xl md:text-4xl text-[#b70100] font-bold mb-1">25+</div>
              <div className="text-xs font-label-caps text-[#5c5957] tracking-wider">Years of Mastery</div>
            </div>
            <div className="bg-[#2a1613]/30 border border-[#f0e6e4] p-6 rounded-2xl text-center">
              <div className="font-display-lg text-3xl md:text-4xl text-[#b70100] font-bold mb-1">500,000+</div>
              <div className="text-xs font-label-caps text-[#5c5957] tracking-wider">Happy Indian Kitchens</div>
            </div>
            <div className="bg-[#2a1613]/30 border border-[#f0e6e4] p-6 rounded-2xl text-center">
              <div className="font-display-lg text-3xl md:text-4xl text-[#b70100] font-bold mb-1">4.9 / 5</div>
              <div className="text-xs font-label-caps text-[#5c5957] tracking-wider">Customer Rating</div>
            </div>
            <div className="bg-[#2a1613]/30 border border-[#f0e6e4] p-6 rounded-2xl text-center">
              <div className="font-display-lg text-3xl md:text-4xl text-[#b70100] font-bold mb-1">100%</div>
              <div className="text-xs font-label-caps text-[#5c5957] tracking-wider">Copper Motors & Heavy Iron</div>
            </div>
          </div>

          {/* Core Brand Pillars */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <span className="text-[#b70100] text-xs font-label-caps tracking-widest block mb-2">WHY CHOOSE MODENA</span>
              <h2 className="font-display-lg text-3xl md:text-4xl text-[#2a1613]">Uncompromising Culinary Engineering</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border border-[#f0e6e4] p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#fff5f3] text-[#b70100] rounded-xl flex items-center justify-center mb-6">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="font-headline-md text-xl text-[#2a1613] mb-3 font-bold">Lava-Fired Cast Iron</h3>
                <p className="font-body-md text-sm text-[#5c5957] leading-relaxed">
                  Pre-seasoned with 100% natural cold-pressed oils. Our heavy-grade virgin cast iron retains maximum heat for authentic Indian slow cooking.
                </p>
              </div>

              <div className="bg-white border border-[#f0e6e4] p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#fff5f3] text-[#b70100] rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-headline-md text-xl text-[#2a1613] mb-3 font-bold">100% Copper Motors</h3>
                <p className="font-body-md text-sm text-[#5c5957] leading-relaxed">
                  Commercial-grade 990W heavy duty copper winding with dual airflow cooling systems engineered to handle tough Indian batters and spices effortlessly.
                </p>
              </div>

              <div className="bg-white border border-[#f0e6e4] p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#fff5f3] text-[#b70100] rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-headline-md text-xl text-[#2a1613] mb-3 font-bold">Lifetime Protection</h3>
                <p className="font-body-md text-sm text-[#5c5957] leading-relaxed">
                  Backed by comprehensive warranty coverage, pan-India express logistics, and dedicated customer support for complete peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================== */}
      {/* 10. YOUR ACCOUNT MAIN DASHBOARD HUB VIEW */}
      {/* ========================================== */}
      {currentView === 'yourAccount' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300">
          <div className="mb-8">
            <span className="text-xs text-gray-500 font-medium">Your Account</span>
            <h1 className="text-3xl font-bold text-[#111111] mt-1 font-inter">Your Account</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Your Orders */}
            <div
              onClick={() => setCurrentView('yourOrders')}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 hover:border-gray-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-[#fff0ee] rounded-2xl flex items-center justify-center text-[#b70100] flex-shrink-0 group-hover:scale-105 transition-transform">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#b70100] transition-colors">Your Orders</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Track, return, or buy things again</p>
              </div>
            </div>

            {/* Card 2: Login & security */}
            <div
              onClick={() => setCurrentView('loginSecurity')}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 hover:border-gray-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-[#fff0ee] rounded-2xl flex items-center justify-center text-[#b70100] flex-shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#b70100] transition-colors">Login &amp; security</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Edit login, name, email, and mobile number</p>
              </div>
            </div>

            {/* Card 3: Your Addresses */}
            <div
              onClick={() => setCurrentView('yourAddresses')}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 hover:border-gray-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-[#fff0ee] rounded-2xl flex items-center justify-center text-[#b70100] flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#b70100] transition-colors">Your Addresses</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Edit addresses for orders and gifts</p>
              </div>
            </div>

            {/* Card 4: Contact Us */}
            <div
              onClick={() => setCurrentView('contactUs')}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 hover:border-gray-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-[#fff0ee] rounded-2xl flex items-center justify-center text-[#b70100] flex-shrink-0 group-hover:scale-105 transition-transform">
                <Headphones className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#b70100] transition-colors">Contact Us</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Contact our customer service via phone or chat</p>
              </div>
            </div>

            {/* Card 5: Store & Legal Policies */}
            <div
              onClick={() => setCurrentView('storePolicies')}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 hover:border-gray-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-[#fff0ee] rounded-2xl flex items-center justify-center text-[#b70100] flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#b70100] transition-colors">Store &amp; Legal Policies</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Terms, Privacy, Returns, Shipping &amp; Warranty Policy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORE POLICIES VIEW */}
      {currentView === 'storePolicies' && (
        <StorePolicies onBack={() => setCurrentView('yourAccount')} />
      )}

      {/* ========================================== */}
      {/* 11. YOUR ORDERS VIEW */}
      {/* ========================================== */}
      {currentView === 'yourOrders' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#b70100] cursor-pointer">Your Account</button>
            <span>›</span>
            <span className="text-[#b70100] font-semibold">Your Orders</span>
          </div>

          <h1 className="text-3xl font-bold text-[#111111] font-inter mb-6">Your Orders</h1>

          {/* Tabs: Orders | Buy Again | Returns */}
          <div className="border-b border-gray-200 flex gap-8 text-sm font-medium mb-6">
            <button
              onClick={() => setOrdersTab('orders')}
              className={`py-3 transition-colors cursor-pointer border-b-2 font-bold ${
                ordersTab === 'orders' ? 'text-[#b70100] border-[#b70100]' : 'text-gray-500 border-transparent hover:text-black'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setOrdersTab('buyAgain')}
              className={`py-3 transition-colors cursor-pointer border-b-2 font-bold ${
                ordersTab === 'buyAgain' ? 'text-[#b70100] border-[#b70100]' : 'text-gray-500 border-transparent hover:text-black'
              }`}
            >
              Buy Again
            </button>
            <button
              onClick={() => setOrdersTab('returns')}
              className={`py-3 transition-colors cursor-pointer border-b-2 font-bold ${
                ordersTab === 'returns' ? 'text-[#b70100] border-[#b70100]' : 'text-gray-500 border-transparent hover:text-black'
              }`}
            >
              Return / Replace
            </button>
          </div>

          {/* Tab 1: ORDERS */}
          {ordersTab === 'orders' && (() => {
            const allOrdersList = [...userOrders];
            if (placedOrder && !allOrdersList.some((o) => o.orderNumber === placedOrder.orderNumber)) {
              allOrdersList.unshift(placedOrder);
            }

            return (
              <div className="space-y-6">
                <p className="text-xs text-gray-500">Track, return, or buy items again from your recent orders.</p>

                {/* Orders Search & Filter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 flex-1 w-full relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                    <input
                      type="text"
                      placeholder="Search all orders by item name or order ID..."
                      value={ordersSearchQuery}
                      onChange={(e) => setOrdersSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100] focus:ring-1 focus:ring-[#b70100]"
                    />
                  </div>
                  <button className="bg-[#111111] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer hover:bg-black transition-colors whitespace-nowrap">
                    Search Orders
                  </button>
                </div>

                {isOrdersLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-44 bg-gray-100 animate-pulse rounded-2xl border border-gray-200" />
                    ))}
                  </div>
                ) : allOrdersList.length === 0 ? (
                  <div className="py-16 px-4 text-center bg-white rounded-3xl border border-gray-200 shadow-sm space-y-4 max-w-md mx-auto my-6">
                    <div className="w-16 h-16 rounded-full bg-red-50 text-[#b70100] flex items-center justify-center mx-auto shadow-inner">
                      <Package className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 font-inter">No orders found</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                      You haven't placed any orders yet. Explore our premium kitchenware collection and place your first order today!
                    </p>
                    <button
                      onClick={() => setCurrentView('utensils')}
                      className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
                    >
                      <span>EXPLORE PRODUCTS</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  allOrdersList.map((ord) => (
                    <div key={ord.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center text-xs text-gray-600 gap-4">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400">Order Placed</span>
                          <span className="font-semibold text-gray-900">{ord.date}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400">Total</span>
                          <span className="font-semibold text-gray-900">₹{typeof ord.total === 'number' ? ord.total.toFixed(2) : ord.total}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400">Ship To</span>
                          <span className="font-semibold text-gray-900">{ord.customer?.firstName || ord.customer || getFirstName(userDisplayName)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400">Order #</span>
                          <span className="font-mono font-bold text-gray-900">{ord.orderNumber}</span>
                        </div>
                        <div>
                          <button
                            onClick={() => generateInvoicePDF(ord, formData)}
                            className="bg-[#b70100] hover:bg-[#e60000] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Invoice</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-0">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 p-4 border-b border-emerald-100">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>{ord.deliveryStatus || '🚚 Order Placed - Processing & Delivery Requested'}</span>
                          </div>
                        </div>

                        {ord.items?.map((item) => (
                          <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-100 first:border-0">
                            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setSelectedProduct({ id: item.id, name: item.name, price: item.price, price_html: item.price_html || `₹${item.price}`, image: item.image })}>
                              <img src={item.image} alt={item.name} className="w-20 h-20 object-contain bg-gray-50 p-1 rounded-xl border border-gray-200 transition-transform group-hover:scale-105" />
                              <div>
                                <h4 className="font-bold text-sm text-[#b70100] group-hover:underline">{item.name}</h4>
                                <span className="text-xs text-gray-500 block mb-1">Qty: {item.quantity || 1} • {item.price_html || `₹${item.price}`}</span>
                                <div className="flex items-center gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} className="bg-[#b70100] hover:bg-[#e60000] text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                                    Buy it again
                                  </button>
                                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                                    View item
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 w-full sm:w-48 text-xs font-bold">
                              <button
                                onClick={() => setActiveTrackOrder({ orderNumber: ord.orderNumber, date: ord.date, status: ord.deliveryStatus || 'In Transit', item })}
                                className="border border-gray-300 hover:bg-gray-50 text-gray-800 py-2 rounded-xl text-center cursor-pointer transition-colors w-full shadow-sm hover:border-gray-400"
                              >
                                Track package
                              </button>
                              <button
                                onClick={() => generateInvoicePDF(ord, formData)}
                                className="bg-gray-900 hover:bg-black text-white py-2 rounded-xl text-center cursor-pointer transition-colors w-full shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF Invoice</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSellerFeedbackForm({ rating: 5, comment: '', submitted: false });
                                  setActiveFeedbackOrder({ orderNumber: ord.orderNumber, item });
                                }}
                                className="border border-gray-300 hover:bg-gray-50 text-gray-800 py-2 rounded-xl text-center cursor-pointer transition-colors w-full shadow-sm hover:border-gray-400"
                              >
                                Leave seller feedback
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}

          {/* Tab 2: BUY AGAIN */}
          {ordersTab === 'buyAgain' && (() => {
            const allOrdersList = [...userOrders];
            if (placedOrder && !allOrdersList.some((o) => o.orderNumber === placedOrder.orderNumber)) {
              allOrdersList.unshift(placedOrder);
            }

            const buyAgainMap = new Map();
            allOrdersList.forEach((ord) => {
              (ord.items || []).forEach((item) => {
                if (!buyAgainMap.has(item.id)) {
                  buyAgainMap.set(item.id, {
                    ...item,
                    lastBought: `Purchased ${ord.date || 'Recently'}`
                  });
                }
              });
            });

            const buyAgainItems = Array.from(buyAgainMap.values());

            if (buyAgainItems.length === 0) {
              return (
                <div className="py-16 px-4 text-center bg-white rounded-3xl border border-gray-200 shadow-sm space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-red-50 text-[#b70100] flex items-center justify-center mx-auto shadow-inner">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 font-inter">No previous items</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Items you purchase will appear here for quick 1-click reordering!
                  </p>
                  <button
                    onClick={() => setCurrentView('utensils')}
                    className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <span>BROWSE STORE PRODUCTS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Items you previously purchased on Modena. Quick re-order with 1 click:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {buyAgainItems.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div className="group cursor-pointer" onClick={() => setSelectedProduct({ id: item.id, name: item.name, price: item.price, price_html: item.price_html || `₹${item.price}`, image: item.image })}>
                        <div className="w-full h-44 bg-gray-50 rounded-xl overflow-hidden mb-4 p-3 flex items-center justify-center border border-gray-100 group-hover:border-[#b70100]/30 transition-colors">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">{item.lastBought}</span>
                        <h4 className="font-bold text-sm text-gray-900 capitalize mb-1 group-hover:text-[#b70100] transition-colors">{item.name}</h4>
                        <span className="text-sm font-extrabold text-[#b70100] block mb-4">{item.price_html || `₹${item.price}`}</span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span>BUY AGAIN</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Tab 3: RETURNS / REPLACE */}
          {ordersTab === 'returns' && (() => {
            const allOrdersList = [...userOrders];
            if (placedOrder && !allOrdersList.some((o) => o.orderNumber === placedOrder.orderNumber)) {
              allOrdersList.unshift(placedOrder);
            }

            const returnList = [];
            allOrdersList.forEach((ord) => {
              (ord.items || []).forEach((item) => {
                returnList.push({
                  id: `ret-${ord.orderNumber}-${item.id}`,
                  orderNumber: ord.orderNumber,
                  date: ord.date || 'Recently',
                  itemName: item.name,
                  price: item.price_html || `₹${item.price}`,
                  image: item.image,
                  returnEligibleUntil: '30-Day Return Window Open'
                });
              });
            });

            if (returnList.length === 0) {
              return (
                <div className="py-16 px-4 text-center bg-white rounded-3xl border border-gray-200 shadow-sm space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-red-50 text-[#b70100] flex items-center justify-center mx-auto shadow-inner">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 font-inter">No returns eligible</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    You have no active orders eligible for return or exchange at this time.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                <p className="text-xs text-gray-500">Manage your return requests, replacements, or direct Razorpay refunds:</p>

                {returnList.map((ret) => {
                  const requestData = returnRequestsMap[ret.id];
                  return (
                    <div key={ret.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Order #{ret.orderNumber}</span>
                          <span className="text-xs text-gray-700">Placed on {ret.date}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          {ret.returnEligibleUntil}
                        </span>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setSelectedProduct({ id: 31, name: ret.itemName, price: 1450, price_html: ret.price, image: ret.image })}>
                          <img src={ret.image} alt={ret.itemName} className="w-16 h-16 object-contain bg-gray-50 p-1 rounded-xl border border-gray-200 transition-transform group-hover:scale-105" />
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#b70100] transition-colors">{ret.itemName}</h4>
                            <span className="text-xs text-gray-500">Price: {ret.price}</span>
                          </div>
                        </div>

                        {requestData ? (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-2xl space-y-2 flex-1 max-w-md">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Return Request Received ({requestData.resolutionType === 'replace' ? '🔄 Replacement Dispatched on Pickup' : '💳 Razorpay Refund Scheduled'})</span>
                            </div>
                            <p className="text-[11px] text-gray-600"><strong>Reason:</strong> {requestData.reasonLabel} {requestData.otherReasonText && `("${requestData.otherReasonText}")`}</p>
                            <p className="text-[11px] text-emerald-800 font-medium">{requestData.policyNote}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setActiveTrackOrder({ orderNumber: ret.orderNumber, date: ret.date, status: 'Out for Delivery / Pickup Scheduled', item: { name: ret.itemName, image: ret.image } })}
                              className="border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm"
                            >
                              Track package
                            </button>
                            <button
                              onClick={() => setActiveReturnModalItem(ret)}
                              className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
                            >
                              Request Return / Exchange
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 12. LOGIN & SECURITY VIEW */}
      {currentView === 'loginSecurity' && (
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#b70100] cursor-pointer">Your Account</button>
            <span>›</span>
            <span className="text-[#b70100] font-semibold">Login &amp; Security</span>
          </div>

          <h1 className="text-3xl font-bold text-[#111111] mb-6 font-inter">Login &amp; Security</h1>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-200 text-sm">
            {/* Item 1: Name */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="font-bold text-gray-900 block mb-0.5">Name:</span>
                {editingField === 'name' ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={fieldEditValue}
                      onChange={(e) => setFieldEditValue(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-[#b70100]"
                    />
                    <button
                      onClick={() => {
                        if (fieldEditValue.trim()) {
                          setUserDisplayName(fieldEditValue.trim());
                          localStorage.setItem('user_display_name', fieldEditValue.trim());
                        }
                        setEditingField(null);
                      }}
                      className="bg-[#b70100] text-white text-xs px-3 py-1.5 rounded-xl font-bold"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="text-xs text-gray-500">Cancel</button>
                  </div>
                ) : (
                  <span className="text-gray-700">{userDisplayName || 'Mohnish Niranjhan'}</span>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingField('name');
                  setFieldEditValue(userDisplayName || 'Mohnish Niranjhan');
                }}
                className="border border-gray-300 hover:bg-gray-50 text-gray-900 px-6 py-1.5 rounded-full text-xs font-bold cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Item 2: E-mail */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="font-bold text-gray-900 block mb-0.5">E-mail:</span>
                {editingField === 'email' ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="email"
                      value={fieldEditValue}
                      onChange={(e) => setFieldEditValue(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-[#b70100]"
                    />
                    <button
                      onClick={() => {
                        if (fieldEditValue.trim()) {
                          setUserEmail(fieldEditValue.trim());
                          localStorage.setItem('user_email', fieldEditValue.trim());
                        }
                        setEditingField(null);
                      }}
                      className="bg-[#b70100] text-white text-xs px-3 py-1.5 rounded-xl font-bold"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="text-xs text-gray-500">Cancel</button>
                  </div>
                ) : (
                  <span className="text-gray-700">{userEmail || 'mohnishniranjhan@gmail.com'}</span>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingField('email');
                  setFieldEditValue(userEmail || 'mohnishniranjhan@gmail.com');
                }}
                className="border border-gray-300 hover:bg-gray-50 text-gray-900 px-6 py-1.5 rounded-full text-xs font-bold cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Item 3: Primary mobile number */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="font-bold text-gray-900 block mb-0.5">Primary mobile number:</span>
                {editingField === 'phone' ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={fieldEditValue}
                      onChange={(e) => setFieldEditValue(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-[#b70100]"
                    />
                    <button
                      onClick={() => {
                        if (fieldEditValue.trim()) {
                          setUserPhone(fieldEditValue.trim());
                          localStorage.setItem('user_phone', fieldEditValue.trim());
                        }
                        setEditingField(null);
                      }}
                      className="bg-[#b70100] text-white text-xs px-3 py-1.5 rounded-xl font-bold"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingField(null)} className="text-xs text-gray-500">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-700 block">{userPhone}</span>
                    <span className="text-xs text-gray-500 block mt-1">Quickly sign in, easily recover passwords, and receive security notifications with this mobile number.</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingField('phone');
                  setFieldEditValue(userPhone);
                }}
                className="border border-gray-300 hover:bg-gray-50 text-gray-900 px-6 py-1.5 rounded-full text-xs font-bold cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Item 4: Password */}
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <span className="font-bold text-gray-900 block mb-0.5">Password:</span>
                <span className="text-gray-700 block">********</span>
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 w-fit">
                  <span>⚠️ To better protect your account, keep your password updated regularly.</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-900 px-6 py-1.5 rounded-full text-xs font-bold cursor-pointer w-full"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Item 5: 2-step verification */}
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <span className="font-bold text-gray-900 block mb-0.5">2-step verification:</span>
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 w-fit">
                  <span>⚠️ Require an additional layer of security when signing in</span>
                </div>
              </div>
              <button
                onClick={() => setIsTwoStepEnabled(!isTwoStepEnabled)}
                className={`border border-gray-300 px-6 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors w-full sm:w-auto mt-3 sm:mt-0 ${
                  isTwoStepEnabled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : 'hover:bg-gray-50 text-gray-900'
                }`}
              >
                {isTwoStepEnabled ? 'Turn off' : 'Turn on'}
              </button>
            </div>

            {/* Item 6: Delete account */}
            <div className="p-5 flex items-center justify-between gap-4 bg-red-50/50">
              <div className="flex-1">
                <span className="font-bold text-red-900 block mb-0.5">Delete account</span>
                <span className="text-xs text-red-700 block">Permanently close your Modena account and delete all associated user data</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
                    handleLogout();
                    setCurrentView('home');
                    alert('Your account has been successfully deleted.');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 13. YOUR ADDRESSES VIEW */}
      {/* ========================================== */}
      {currentView === 'yourAddresses' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#b70100] cursor-pointer">Your Account</button>
            <span>›</span>
            <span className="text-[#b70100] font-semibold">Your Addresses</span>
          </div>

          <h1 className="text-3xl font-bold text-[#111111] mb-6 font-inter">Your Addresses</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Add Address Box */}
            <div
              onClick={() => setIsAddressModalOpen(true)}
              className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#b70100] hover:bg-red-50/20 transition-all min-h-[260px] group"
            >
              <Plus className="w-12 h-12 text-gray-300 group-hover:text-[#b70100] mb-2 transition-colors" />
              <span className="text-xl font-bold text-gray-700 group-hover:text-[#b70100] transition-colors">Add address</span>
            </div>

            {/* Address Cards */}
            {userAddresses.map((addr, idx) => (
              <div key={addr.id} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm relative min-h-[260px]">
                {addr.isDefault && (
                  <span className="text-[10px] font-bold text-gray-500 border-b border-gray-200 pb-2 mb-3 block">
                    Default: <strong className="text-gray-900 uppercase">Modena</strong>
                  </span>
                )}
                <div className="space-y-1 text-xs text-gray-800 leading-relaxed">
                  <h4 className="font-bold text-sm text-gray-900">{addr.name}</h4>
                  <p>{addr.line1}</p>
                  <p>{addr.line2}</p>
                  <p className="uppercase">{addr.city}, {addr.state} {addr.postcode}</p>
                  <p>{addr.country}</p>
                  <p className="text-gray-500 pt-1">Phone number: {addr.phone}</p>
                  <button className="text-[#b70100] font-semibold hover:underline block pt-1 cursor-pointer">Add delivery instructions</button>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-xs font-bold text-[#b70100]">
                  <button onClick={() => {
                    setAddressFormData(addr);
                    setIsAddressModalOpen(true);
                  }} className="hover:underline cursor-pointer">Edit</button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => {
                      setUserAddresses((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 14. CONTACT US VIEW */}
      {/* ========================================== */}
      {currentView === 'contactUs' && (
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#b70100] cursor-pointer">Your Account</button>
            <span>›</span>
            <span className="text-[#b70100] font-semibold">Contact Us</span>
          </div>

          <h1 className="text-3xl font-bold text-[#111111] mb-2 font-inter">Contact Us</h1>
          <p className="text-sm text-gray-600 mb-8">We're here to help! Reach out to our customer service team via phone, email, or direct inquiry.</p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-[#b70100]">
                  <Headphones className="w-6 h-6" />
                  <h3 className="font-bold text-base text-gray-900">Customer &amp; Grievance Support</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Operated by <strong>Kimatsu India Pvt. Ltd.</strong> Our customer service &amp; technical specialists are available Monday through Saturday, 10:00 AM to 6:00 PM IST.
                </p>
                <div className="pt-2 text-xs space-y-2 border-t border-gray-100 font-medium">
                  <p className="text-gray-900">
                    📞 <strong>Customer Care &amp; WhatsApp:</strong> <a href="https://wa.me/919326641825" target="_blank" rel="noopener noreferrer" className="text-[#b70100] hover:underline font-bold">+91 93266 41825</a> <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">💬 WhatsApp Available</span>
                  </p>
                  <p className="text-gray-900">
                    📞 <strong>DPDP Grievance Officer:</strong> <a href="tel:+919136669608" className="text-[#b70100] hover:underline font-bold">+91 91366 69608</a> (Anurag Yadav)
                  </p>
                  <p className="text-gray-900">
                    ✉️ <strong>Support Email:</strong> <a href="mailto:support@modenahome.in" className="text-[#b70100] hover:underline font-bold">support@modenahome.in</a>
                  </p>
                  <p className="text-gray-900">
                    ✉️ <strong>Grievance Email:</strong> <a href="mailto:grievance@modenahome.in" className="text-[#b70100] hover:underline font-bold">grievance@modenahome.in</a>
                  </p>
                  <p className="text-gray-900">
                    📍 <strong>Registered Office:</strong> <span className="text-gray-600">201–202 Tirupati Udyog, I.B. Patel Road, Goregaon East, Mumbai – 400063, Maharashtra, India</span>
                  </p>
                  <p className="text-gray-900 pt-1 border-t border-gray-100">
                    🏷️ <strong>GSTIN:</strong> <span className="font-mono text-gray-700">27AAFCK9795E1ZZ</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Send Us a Message</h3>

                {contactSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                    ✓ Message received! Our support team will get back to you within 24 hours.
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSuccessMsg(true);
                    setContactForm({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Mohnish Niranjhan"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="mohnishniranjhan@gmail.com"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Order status / Product inquiry"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="How can we help you today?"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#b70100] hover:bg-[#e60000] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADDRESS POPUP MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setIsAddressModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#111111]">
            <button onClick={() => setIsAddressModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-inter">Add a new address</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (addressFormData.id) {
                  // Edit Existing Address
                  setUserAddresses(prev => prev.map(a => a.id === addressFormData.id ? { ...addressFormData } : a));
                } else {
                  // Add New Address
                  setUserAddresses((prev) => [
                    ...prev,
                    {
                      id: Date.now(),
                      name: addressFormData.name || 'Mohnish Niranjhan',
                      line1: addressFormData.line1,
                      line2: addressFormData.line2,
                      city: addressFormData.city,
                      state: addressFormData.state,
                      postcode: addressFormData.postcode,
                      country: 'India',
                      phone: addressFormData.phone || '9962105345',
                      isDefault: false
                    }
                  ]);
                }
                setIsAddressModalOpen(false);
                setAddressFormData({ id: null, name: '', line1: '', line2: '', city: '', state: '', postcode: '', phone: '' });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Mohnish Niranjhan"
                  value={addressFormData.name}
                  onChange={(e) => setAddressFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  placeholder="12/A Jayalakshmi nagar, puzhuthivakkam"
                  value={addressFormData.line1}
                  onChange={(e) => setAddressFormData((p) => ({ ...p, line1: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  placeholder="Jayalakshmi nagar, puzhuthivakkam"
                  value={addressFormData.line2}
                  onChange={(e) => setAddressFormData((p) => ({ ...p, line2: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="CHENNAI"
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData((p) => ({ ...p, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="TAMIL NADU"
                    value={addressFormData.state}
                    onChange={(e) => setAddressFormData((p) => ({ ...p, state: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    placeholder="600091"
                    value={addressFormData.postcode}
                    onChange={(e) => setAddressFormData((p) => ({ ...p, postcode: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="9962105345"
                    value={addressFormData.phone}
                    onChange={(e) => setAddressFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#b70100] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider mt-2 cursor-pointer shadow-md hover:bg-[#e60000]"
              >
                {addressFormData.id ? 'Save Changes' : 'Add Address'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD EDIT MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setIsPasswordModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#111111]">
            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-inter">Change Password</h3>
            <p className="text-xs text-gray-500 mb-6">Create a new, strong password that you don't use for other websites.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordFormData.new !== passwordFormData.confirm) {
                  alert('New passwords do not match. Please try again.');
                  return;
                }
                alert('Your password has been successfully updated!');
                setIsPasswordModalOpen(false);
                setPasswordFormData({ current: '', new: '', confirm: '' });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordFormData.current}
                  onChange={(e) => setPasswordFormData(p => ({ ...p, current: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordFormData.new}
                  onChange={(e) => setPasswordFormData(p => ({ ...p, new: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Re-enter New Password</label>
                <input
                  type="password"
                  required
                  value={passwordFormData.confirm}
                  onChange={(e) => setPasswordFormData(p => ({ ...p, confirm: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                />
              </div>
              <button type="submit" className="w-full bg-[#b70100] hover:bg-[#e60000] text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 cursor-pointer">
                Save Changes
              </button>
            </form>
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
          <ProductList onAddToCart={handleAddToCart} onSelectProduct={(p) => { setSelectedProduct(p); setProductQuantity(1); }} searchQuery={submittedQuery} wishlist={wishlist} onToggleWishlist={toggleWishlist} />
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
              <div className="p-6 bg-[#ffffff] border-t border-[#cac6c2]/40 flex flex-col gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] space-y-2">
                {/* Coupon Code Input Form */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon (MODENA10, WELCOME500)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#b70100] uppercase font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    APPLY
                  </button>
                </form>

                {appliedDiscount && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 font-bold">
                    <span>🎉 {appliedDiscount.label}</span>
                    <button
                      type="button"
                      onClick={() => setAppliedDiscount(null)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-[10px] underline"
                    >
                      REMOVE
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 font-bold">{couponError}</p>
                )}

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-xs text-emerald-700 font-bold">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end text-[#2a1613] pt-1">
                    <span className="font-bold text-sm text-[#2a1613]">Total Amount</span>
                    <span className="font-headline-md text-2xl leading-none font-bold text-[#b70100]">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    triggerCheckoutFlow();
                  }}
                  className="w-full bg-gradient-to-b from-[#b70100] to-[#9a0000] text-white py-3.5 px-6 rounded-xl font-headline-md text-sm font-bold shadow-[0_8px_16px_rgba(183,1,0,0.25)] hover:shadow-[0_12px_24px_rgba(183,1,0,0.35)] hover:-translate-y-0.5 transition-all duration-300 tracking-wide text-center cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
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
                        { id: 'razorpay', label: 'Razorpay (UPI, Cards, NetBanking)', icon: CreditCard, highlight: true },
                        { id: 'cod', label: 'Cash on Delivery (COD)', icon: Banknote },
                        { id: 'upi', label: 'Direct UPI App', icon: Wallet },
                        { id: 'bacs', label: 'Direct Bank Transfer', icon: Building }
                      ].map((pm) => {
                        const IconComp = pm.icon;
                        const isSelected = paymentMethod === pm.id || (!paymentMethod && pm.id === 'razorpay');
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-3 rounded-md border text-left flex items-center gap-2 text-xs transition-colors ${
                              isSelected
                                ? 'border-[#b70100] bg-[#fff0ee] text-[#b70100] font-semibold ring-1 ring-[#b70100]'
                                : 'border-[#e8e1dc] bg-white text-[#5c5957]'
                            }`}
                          >
                            <IconComp className="w-4 h-4 flex-shrink-0 text-[#b70100]" />
                            <span className="truncate">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(paymentMethod === 'razorpay' || !paymentMethod) ? (
                    <RazorpayCheckout
                      amount={subtotal}
                      customerName={`${formData.firstName} ${formData.lastName}`.trim()}
                      customerEmail={formData.email}
                      customerPhone={formData.phone}
                      onPaymentSuccess={async (paymentRes) => {
                        if (isSubmittingOrder) return;
                        setIsSubmittingOrder(true);
                        const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
                        const customerDetails = {
                          firstName: formData.firstName || getFirstName(userDisplayName) || 'Valued Customer',
                          lastName: formData.lastName || '',
                          name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || userDisplayName || 'Valued Customer',
                          email: formData.email || userEmail || '',
                          phone: formData.phone || userPhone || '',
                          address: formData.address || '',
                          city: formData.city || '',
                          state: formData.state || '',
                          postcode: formData.postcode || ''
                        };

                        try {
                          const response = await fetch('/wp-json/modena/v1/create-wc-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              order_number: orderNumber,
                              items: cart,
                              customer: customerDetails,
                              paymentMethod: `Razorpay (${paymentRes.paymentId})`,
                              total: subtotal
                            })
                          });
                          const data = await response.json();
                          const realOrderNumber = data.success ? data.order_number : orderNumber;
                          setPlacedOrder({
                            orderNumber: realOrderNumber,
                            total: subtotal,
                            paymentMethod: `Razorpay (${paymentRes.paymentId})`,
                            customer: customerDetails
                          });
                        } catch {
                          setPlacedOrder({
                            orderNumber,
                            total: subtotal,
                            paymentMethod: `Razorpay (${paymentRes.paymentId})`,
                            customer: customerDetails
                          });
                        } finally {
                          setCart([]);
                          setIsSubmittingOrder(false);
                        }
                      }}
                      buttonText={`Pay ₹${subtotal.toFixed(2)} with Razorpay`}
                    />
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmittingOrder || !cart || cart.length === 0}
                      className="w-full bg-[#b70100] hover:bg-[#e60000] text-white py-4 px-6 rounded-md font-headline-md text-base shadow-lg transition-all tracking-wide text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Processing Order...</span>
                        </>
                      ) : (
                        <span>Confirm &amp; Place Order ({currencySymbol}{subtotal.toFixed(2)})</span>
                      )}
                    </button>
                  )}
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

      {/* PRODUCT QUICK VIEW & BUY POPUP MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 bg-[#111111]/80 backdrop-blur-md transition-opacity"
          />
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-50 my-auto border border-gray-100 flex flex-col text-[#111111] max-h-[92vh]">
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors cursor-pointer shadow-md"
              aria-label="Close product view"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Container */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1">
              {/* Main Product Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Left Column: Product Image Gallery with Multi-Picture Selector */}
                {(() => {
                  const currentImages = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
                    ? selectedProduct.images
                    : [selectedProduct.image];
                  const displayImg = activeProductImage || selectedProduct.image || currentImages[0];

                  return (
                    <div className="md:col-span-5 flex flex-col items-center">
                      {/* 4:3 Aspect Ratio Container */}
                      <div
                        onClick={() => { setZoomedImage(displayImg); setZoomScale(1); }}
                        className="w-full aspect-[4/3] bg-[#fff0ee] rounded-2xl overflow-hidden border border-[#e8e1dc] relative group cursor-pointer flex items-center justify-center p-3 shadow-inner hover:shadow-lg transition-all"
                      >
                        {selectedProduct.badge && (
                          <span className="absolute top-3 left-3 bg-[#b70100] text-white text-[10px] font-bold font-label-caps px-3 py-1 rounded-full shadow-md tracking-wider uppercase z-10">
                            {selectedProduct.badge}
                          </span>
                        )}

                        <img
                          src={displayImg}
                          alt={selectedProduct.name}
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';
                          }}
                        />

                        {/* Prev & Next Gallery Navigation Arrows */}
                        {currentImages.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currIdx = currentImages.indexOf(displayImg);
                                const prevIdx = (currIdx - 1 + currentImages.length) % currentImages.length;
                                setActiveProductImage(currentImages[prevIdx]);
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-all z-20 cursor-pointer shadow-md"
                              title="Previous Image"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currIdx = currentImages.indexOf(displayImg);
                                const nextIdx = (currIdx + 1) % currentImages.length;
                                setActiveProductImage(currentImages[nextIdx]);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-all z-20 cursor-pointer shadow-md"
                              title="Next Image"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Interactive Zoom Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5 backdrop-blur-[2px] rounded-2xl">
                          <ZoomIn className="w-6 h-6 text-white animate-bounce" />
                          <span>Click to Zoom &amp; Inspect (4:3)</span>
                        </div>
                      </div>

                      {/* Multi-Picture Gallery Thumbnails Bar */}
                      {currentImages.length > 1 && (
                        <div className="w-full flex items-center justify-center gap-2 mt-3 overflow-x-auto py-1 max-w-full">
                          {currentImages.map((imgUrl, idx) => {
                            const isCurrent = displayImg === imgUrl;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveProductImage(imgUrl)}
                                className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer bg-white flex-shrink-0 ${
                                  isCurrent ? 'border-[#b70100] ring-2 ring-red-100 scale-105 shadow-md' : 'border-gray-200 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain rounded-lg" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Zoom Inspect Button */}
                      <button
                        type="button"
                        onClick={() => { setZoomedImage(displayImg); setZoomScale(1); }}
                        className="w-full mt-3 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200 shadow-sm"
                      >
                        <Maximize2 className="w-4 h-4 text-[#b70100]" />
                        <span>Zoom &amp; Expand Image ({currentImages.length} Pictures)</span>
                      </button>

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <ShieldCheck className="w-4 h-4 text-[#b70100]" />
                        <span>Modena Certified Authentic Quality</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Right Column: Product Details & Purchase Actions */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex text-amber-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-600">
                        {selectedProduct.rating || '4.9/5 (1,420 Verified Reviews)'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#111111] leading-tight font-display-lg">
                      {selectedProduct.name}
                    </h2>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-[#b70100]">
                      {selectedProduct.dealPrice || selectedProduct.price_html || selectedProduct.price || `₹${selectedProduct.numericPrice?.toLocaleString()}`}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="text-lg text-gray-400 line-through font-medium">
                        {selectedProduct.originalPrice}
                      </span>
                    )}
                    {selectedProduct.save && (
                      <span className="bg-red-50 text-[#b70100] text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                        {selectedProduct.save}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed border-t border-b border-gray-100 py-3">
                    {selectedProduct.desc ||
                      selectedProduct.description ||
                      'Crafted with industrial precision and domestic warmth. Designed for maximum heat retention, energy efficiency, and long-lasting kitchen performance.'}
                  </p>

                  {/* Key Product Features */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Key Highlights</h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <Flame className="w-3.5 h-3.5 text-[#b70100]" />
                        <span>Heavy Copper Motor</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#b70100]" />
                        <span>2-Year Warranty</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <Sparkles className="w-3.5 h-3.5 text-[#b70100]" />
                        <span>Food-Grade Steel</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <Truck className="w-3.5 h-3.5 text-[#b70100]" />
                        <span>Free Express Shipping</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="pt-2 flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 font-bold text-sm cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-sm font-bold text-gray-900 min-w-[2rem] text-center">
                        {productQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setProductQuantity((q) => q + 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 font-bold text-sm cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Purchase Actions (Add to Cart & Buy Now) */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleWishlist(selectedProduct)}
                      className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 px-5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-gray-200"
                      title={isWishlisted(selectedProduct.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted(selectedProduct.id) ? 'fill-[#b70100] text-[#b70100]' : 'text-gray-600'}`} />
                      <span className="sm:hidden text-xs font-bold tracking-wider uppercase">{isWishlisted(selectedProduct.id) ? 'WISHLISTED' : 'ADD TO WISHLIST'}</span>
                    </button>

                    <div className="w-full flex flex-col sm:flex-row gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleAddToCart(
                            {
                              id: selectedProduct.id,
                              name: selectedProduct.name,
                              price: selectedProduct.numericPrice || selectedProduct.price,
                              price_html: selectedProduct.dealPrice || selectedProduct.price_html || selectedProduct.price,
                              image: selectedProduct.image
                            },
                            productQuantity
                          );
                          setSelectedProduct(null);
                        }}
                        className="w-full sm:flex-1 bg-[#111111] hover:bg-[#222222] text-white py-3.5 px-5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        <span>ADD TO CART</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleAddToCart(
                            {
                              id: selectedProduct.id,
                              name: selectedProduct.name,
                              price: selectedProduct.numericPrice || selectedProduct.price,
                              price_html: selectedProduct.dealPrice || selectedProduct.price_html || selectedProduct.price,
                              image: selectedProduct.image
                            },
                            productQuantity
                          );
                          setSelectedProduct(null);
                          triggerCheckoutFlow();
                        }}
                        className="w-full sm:flex-1 bg-[#b70100] hover:bg-[#e60000] text-white py-3.5 px-5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                      >
                        <Zap className="w-4 h-4 fill-white flex-shrink-0" />
                        <span>BUY NOW</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECOMMENDED RELATED PRODUCTS SECTION BELOW THE POPUP */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#111111] font-inter flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-[#b70100]" />
                      <span>Recommended Related Products</span>
                    </h3>
                    <p className="text-xs text-gray-500">Explore complementary items from the Modena catalog</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#b70100] bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                    POPULAR MATCHES
                  </span>
                </div>

                {/* Related Products 4:3 Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(searchableProducts || apiProducts || [])
                    .filter((p) => p.id !== selectedProduct.id)
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedProduct(item);
                          setProductQuantity(1);
                        }}
                        className="bg-gray-50 hover:bg-white rounded-2xl border border-gray-200 hover:border-[#b70100] p-3 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between"
                      >
                        {/* 4:3 Aspect Ratio Image Container */}
                        <div className="w-full aspect-[4/3] bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center border border-gray-100 mb-2.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';
                            }}
                          />
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-[#b70100] transition-colors mb-1">
                            {item.name}
                          </h4>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-[#b70100]">
                              {item.price_html || item.price || `₹${item.numericPrice?.toLocaleString()}`}
                            </span>
                            <span className="text-[10px] text-gray-400 group-hover:text-[#b70100] font-semibold">View →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Verified Customer Reviews & Rating Form */}
              <div className="pt-6 border-t border-gray-100">
                <ReviewForm
                  product={selectedProduct}
                  user={{ displayName: userDisplayName, email: userEmail }}
                  isVerifiedPurchaser={userOrders.some((o) => (o.items || []).some((i) => i.id === selectedProduct.id))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX IMAGE ZOOM MODAL WITH MULTI-PICTURE GALLERY */}
      {zoomedImage && (() => {
        const galleryImages = selectedProduct && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
          ? selectedProduct.images
          : [zoomedImage];
        const currentIdx = galleryImages.indexOf(zoomedImage) !== -1 ? galleryImages.indexOf(zoomedImage) : 0;

        return (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in duration-200">
            {/* Top Control Bar */}
            <div className="w-full max-w-5xl flex items-center justify-between z-10 text-white pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-[#b70100] px-3 py-1 rounded-full">
                  Fullscreen Image Inspector ({currentIdx + 1}/{galleryImages.length})
                </span>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Click image or use controls to zoom
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(1, s - 0.5))}
                  disabled={zoomScale <= 1}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white p-2 rounded-full transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>

                {/* Zoom Percentage */}
                <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                  {Math.round(zoomScale * 100)}%
                </span>

                {/* Zoom In */}
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.min(3, s + 0.5))}
                  disabled={zoomScale >= 3}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white p-2 rounded-full transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>

                {/* Close Lightbox */}
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="bg-[#b70100] hover:bg-red-700 text-white p-2 rounded-full transition-colors cursor-pointer ml-2 shadow-lg"
                  title="Close Zoom View"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Centered Zoom Image Container with Navigation Arrows */}
            <div className="w-full flex-1 flex items-center justify-center overflow-auto p-4 relative my-auto">
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = (currentIdx - 1 + galleryImages.length) % galleryImages.length;
                      setZoomedImage(galleryImages[prevIdx]);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors cursor-pointer z-20 shadow-xl border border-white/20"
                    title="Previous Picture"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (currentIdx + 1) % galleryImages.length;
                      setZoomedImage(galleryImages[nextIdx]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors cursor-pointer z-20 shadow-xl border border-white/20"
                    title="Next Picture"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <img
                src={zoomedImage}
                alt="Zoomed Product View"
                style={{ transform: `scale(${zoomScale})` }}
                onClick={() => setZoomScale((s) => (s === 1 ? 1.8 : s === 1.8 ? 2.5 : 1))}
                className="max-w-full max-h-[70vh] object-contain transition-transform duration-300 shadow-2xl rounded-2xl bg-white/5 border border-white/10 p-2 cursor-zoom-in"
                onError={(e) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';
                }}
              />
            </div>

            {/* Bottom Gallery Thumbnails Bar */}
            <div className="w-full flex flex-col items-center gap-2 pt-2 z-10">
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md">
                  {galleryImages.map((imgUrl, idx) => {
                    const isCurrent = zoomedImage === imgUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setZoomedImage(imgUrl)}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer bg-black/40 flex-shrink-0 ${
                          isCurrent ? 'border-[#b70100] ring-2 ring-red-500 scale-105' : 'border-white/20 opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain rounded-lg" />
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="text-center text-xs text-gray-400">
                <span>Click image to toggle zoom scale (100% → 180% → 250%)</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 10. ANCHOR DEMO PAGES MODALS */}

      {/* MODAL 1: OUR CRAFT */}
      {activeModal === 'craft' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">OUR CRAFT</span>
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

      {/* MODAL 2: MIXER GRINDERS */}
      {activeModal === 'mixerGrinders' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">MIXER GRINDERS</span>
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

      {/* MODAL 3: REVIEWS */}
      {activeModal === 'reviews' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">VERIFIED REVIEWS</span>
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

      {/* MODAL 4: CARE GUIDE & WARRANTY */}
      {(activeModal === 'careGuide' || activeModal === 'warranty') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md" />
          <div className="relative w-full max-w-3xl bg-[#fff8f6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#e8e1dc] z-50 my-auto max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <span className="font-label-caps text-[#b70100] text-xs tracking-widest block mb-1">CARE &amp; WARRANTY</span>
            <h2 className="font-display-lg text-3xl text-[#2a1613] mb-4">Product Care &amp; Warranty Support</h2>
            <p className="font-body-md text-xs text-[#5c5957] mb-4">
              All Modena appliances and cookware are covered by our heritage service guarantee. Clean with warm soapy water and wipe dry after use.
            </p>
            <button onClick={() => setActiveModal(null)} className="bg-[#111111] text-white py-2.5 px-6 rounded text-xs font-label-caps">
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* ACCOUNT DETAILS MODAL (When User is Logged In) */}
      {activeModal === 'account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 bg-[#2a1613]/70 backdrop-blur-md transition-opacity"
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200 z-50 my-auto text-[#111111] overflow-hidden">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-[#b70100] text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-red-50 flex-shrink-0">
                {getFirstName(userDisplayName).charAt(0)}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold tracking-widest bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full uppercase border border-amber-200">
                    VIP Member
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#111111] truncate">
                  Hi, {getFirstName(userDisplayName || 'User')}!
                </h2>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail || loginEmail || 'No email associated'}
                </p>
              </div>
            </div>

            {/* Account Info Cards */}
            <div className="py-5 space-y-3.5">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-2">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Account Profile</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">First Name</span>
                    <span className="font-semibold text-gray-900">{getFirstName(userDisplayName || 'User')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Full Name</span>
                    <span className="font-semibold text-gray-900 truncate block">{userDisplayName || 'Logged In Customer'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-[11px]">Email Address</span>
                    <span className="font-semibold text-gray-900 truncate block">{userEmail || loginEmail || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Default Delivery Address</h3>
                {userAddresses.length > 0 ? (
                  <div className="text-xs text-gray-700 leading-relaxed">
                    <p className="font-semibold">{userAddresses[0].name}</p>
                    <p>{userAddresses[0].line1} {userAddresses[0].line2}</p>
                    <p>{userAddresses[0].city}, {userAddresses[0].state} - {userAddresses[0].postcode}</p>
                    <p className="text-gray-500 mt-1">📱 {userAddresses[0].phone}</p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="italic">No delivery address saved yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setCurrentView('yourAddresses');
                      }}
                      className="text-[#b70100] font-bold hover:underline block pt-1"
                    >
                      + Add Address in Manage Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('checkout');
                }}
                className="w-full bg-[#111111] hover:bg-[#222222] text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Cart &amp; Checkout</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-[#b70100] py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border border-red-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign Out / Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ENTERPRISE AMAZON-STYLE AUTHENTICATION & SESSION PIPELINE */}
      <AmazonAuthModal
        isOpen={activeModal === 'login'}
        onClose={() => { setActiveModal(null); resetAuthForm(); }}
        onAuthSuccess={(userData) => {
          setUserDisplayName(userData.display_name || userData.email.split('@')[0]);
          setUserEmail(userData.email);
          if (cart.length > 0) {
            setActiveModal('checkout');
          } else {
            setActiveModal(null);
          }
        }}
        cartItems={cart}
      />

      {/* 11. LUXURY END-TO-END FOOTER */}
      <footer className="bg-[#0b0b0b] text-white pt-16 pb-12 border-t border-[#222222] w-full font-inter physics-container">
        <div className="w-full px-2 sm:px-6 lg:px-10 space-y-12">
          
          {/* Top Row: Full-Width Newsletter & Exclusive VIP Club Card */}
          <div className="bg-gradient-to-r from-[#181818] via-[#221715] to-[#181818] border border-[#2e2e2e] p-8 sm:p-10 rounded-3xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#b70100] text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>JOIN THE MODENA CULINARY CLUB</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Unlock Secret Offers, Product Drops &amp; Maintenance Guides
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Subscribe to receive private sales, chef-tested seasoning guides, and early access to limited edition cast iron collections.
              </p>
            </div>

            <div className="w-full lg:w-auto min-w-[320px] sm:min-w-[420px]">
              <div className="flex gap-2 bg-black/60 p-2 rounded-2xl border border-white/10 shadow-inner">
                <input
                  id="newsletter-email-input"
                  name="newsletter_email"
                  type="email"
                  placeholder="Enter your email address..."
                  className="bg-transparent px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 flex-1 focus:outline-none"
                />
                <button
                  onClick={() => setNewsletterSubscribed(true)}
                  className="bg-[#b70100] hover:bg-[#e60000] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  SUBSCRIBE NOW
                </button>
              </div>
              {newsletterSubscribed && (
                <span className="text-xs text-emerald-400 block font-medium mt-2 text-center lg:text-left">
                  ✓ Welcome! You have been successfully subscribed to Modena Culinary Club.
                </span>
              )}
            </div>
          </div>

          {/* Middle Row: 5 Well-Balanced End-to-End Columns Grid */}
          <div className="grid grid-cols-1 @[600px]:grid-cols-2 @[900px]:grid-cols-3 @[1200px]:grid-cols-5 gap-8 @[900px]:gap-10 border-b border-[#222222] pb-12 text-xs">
            
            {/* Col 1: Brand & Excellence Badges */}
            <div className="space-y-4">
              <img
                src={logoMonoWhiteRed}
                alt="Modena Logo"
                className="h-10 w-auto object-contain"
              />
              <p className="text-gray-400 leading-relaxed text-xs">
                Modena represents modern luxury cookware and heavy appliances—fusing industrial grade 990W copper motors and virgin cast iron with refined domestic warmth.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <ShieldCheck className="w-4 h-4 text-[#b70100]" />
                  <span>100% Virgin Cast Iron &amp; Pure Copper</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Truck className="w-4 h-4 text-[#b70100]" />
                  <span>Free Shipping on Orders Above ₹2,999</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Award className="w-4 h-4 text-[#b70100]" />
                  <span>5-Year Motor Warranty Protection</span>
                </div>
              </div>
            </div>

            {/* Col 2: Quick Navigation */}
            <div className="space-y-3">
              <span className="text-[#ffb4a8] font-bold tracking-widest uppercase block text-xs">QUICK NAVIGATION</span>
              <ul className="space-y-2.5 text-gray-400">
                <li><button onClick={() => setCurrentView('home')} className="hover:text-white transition-colors cursor-pointer">Home Showroom</button></li>
                <li><button onClick={() => setCurrentView('bestseller')} className="hover:text-white transition-colors cursor-pointer">Bestselling Cookware</button></li>
                <li><button onClick={() => setCurrentView('deal')} className="hover:text-white transition-colors cursor-pointer">Deals &amp; Flash Sales</button></li>
                <li><button onClick={() => setCurrentView('electronics')} className="hover:text-white transition-colors cursor-pointer">Culinary Electronics</button></li>
                <li><button onClick={() => setCurrentView('utensils')} className="hover:text-white transition-colors cursor-pointer">Heritage Utensils</button></li>
              </ul>
            </div>

            {/* Col 3: Customer Account */}
            <div className="space-y-3">
              <span className="text-[#ffb4a8] font-bold tracking-widest uppercase block text-xs">CUSTOMER ACCOUNT</span>
              <ul className="space-y-2.5 text-gray-400">
                <li><button onClick={() => userDisplayName ? setCurrentView('yourAccount') : setActiveModal('login')} className="hover:text-white transition-colors cursor-pointer">Manage Account Hub</button></li>
                <li><button onClick={() => setCurrentView('yourOrders')} className="hover:text-white transition-colors cursor-pointer">Your Orders &amp; Tracking</button></li>
                <li><button onClick={() => setCurrentView('yourAddresses')} className="hover:text-white transition-colors cursor-pointer">Saved Delivery Addresses</button></li>
                <li><button onClick={() => setIsWishlistModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">Your Saved Wishlist</button></li>
                <li><button onClick={() => setActiveModal('checkout')} className="hover:text-white transition-colors cursor-pointer">Express Checkout</button></li>
              </ul>
            </div>

            {/* Col 4: Store & Legal Policies */}
            <div className="space-y-3">
              <span className="text-[#ffb4a8] font-bold tracking-widest uppercase block text-xs">STORE &amp; LEGAL POLICIES</span>
              <ul className="space-y-2.5 text-gray-400">
                <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-white transition-colors cursor-pointer">1. Terms &amp; Conditions</button></li>
                <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-white transition-colors cursor-pointer">2. Return &amp; Refund Policy</button></li>
                <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-white transition-colors cursor-pointer">3. Shipping Policy (₹300 Rate)</button></li>
                <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-white transition-colors cursor-pointer">4. Privacy Policy (DPDP Act)</button></li>
                <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-white transition-colors cursor-pointer">5. Warranty Policy</button></li>
              </ul>
            </div>

            {/* Col 5: Corporate & Grievance Contact */}
            <div className="space-y-3">
              <span className="text-[#ffb4a8] font-bold tracking-widest uppercase block text-xs">CORPORATE &amp; SUPPORT</span>
              <div className="space-y-2 text-gray-400 text-xs">
                <p><strong className="text-white">Operated by:</strong> Kimatsu India Pvt. Ltd.</p>
                <p><strong className="text-white">GSTIN:</strong> <span className="font-mono text-gray-300">27AAFCK9795E1ZZ</span></p>
                <p><strong className="text-white">HQ Address:</strong> 201–202 Tirupati Udyog, Goregaon East, Mumbai – 400063</p>
                <p><strong className="text-white">Support Email:</strong> <a href="mailto:support@modenahome.in" className="hover:text-[#b70100]">support@modenahome.in</a></p>
                <p><strong className="text-white">Grievance Officer:</strong> <a href="mailto:grievance@modenahome.in" className="hover:text-[#b70100]">grievance@modenahome.in</a></p>
                <p><strong className="text-white">Phone &amp; WhatsApp:</strong> <a href="https://wa.me/919326641825" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 font-bold">+91 93266 41825</a></p>
                <p><strong className="text-white">Grievance Line:</strong> +91 91366 69608</p>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Full-Width Copyright & Accepted Payment Methods */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <span>© {new Date().getFullYear()} <strong>Kimatsu India Pvt. Ltd.</strong> (Modena Home). All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span>Mumbai, Maharashtra, India</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 bg-[#161616] px-4 py-2 rounded-full border border-white/5">
              <span className="font-bold text-white">100% PREPAID STORE:</span>
              <span className="text-emerald-400 font-bold">UPI</span>
              <span>•</span>
              <span className="text-sky-400 font-bold">Razorpay</span>
              <span>•</span>
              <span>Cards</span>
              <span>•</span>
              <span>NetBanking</span>
            </div>
          </div>

        </div>
      </footer>
      {/* RETURN & REPLACEMENT INTERACTIVE MODAL */}
      {activeReturnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div onClick={() => setActiveReturnModalItem(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-50 my-auto border border-gray-200 p-6 sm:p-8 text-[#111111] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveReturnModalItem(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-1 font-inter">Choose items to return / replace</h2>
            <p className="text-xs text-gray-500 mb-6">Select your reason and preference for replacement or direct Razorpay refund.</p>

            {/* Product Summary */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
              <img src={activeReturnModalItem.image} alt={activeReturnModalItem.itemName} className="w-16 h-16 object-contain bg-white p-1 rounded-xl border border-gray-200" />
              <div>
                <h4 className="font-bold text-sm text-gray-900">{activeReturnModalItem.itemName}</h4>
                <span className="text-xs text-gray-500">Order #{activeReturnModalItem.orderNumber} • {activeReturnModalItem.price}</span>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!returnReason) {
                  alert('Please select a response reason for returning this item.');
                  return;
                }
                const reasonLabels = {
                  defective: 'Defective / Motor not working',
                  damaged: 'Damaged during transit / Broken seal',
                  wrong_item: 'Wrong item or size received',
                  missing_parts: 'Missing accessories or attachments',
                  performance: 'Performance not as expected',
                  no_longer_needed: 'No longer needed',
                  other: 'Other custom issue'
                };
                const formattedReason = reasonLabels[returnReason] || returnReason;

                setIsSubmittingReturn(true);
                let uploadedProofUrl = '';

                // Upload proof file if attached
                if (returnProofFile) {
                  try {
                    const formData = new FormData();
                    formData.append('file', returnProofFile);
                    formData.append('order_id', activeReturnModalItem.orderNumber || activeReturnModalItem.orderId || '');
                    formData.append('reason_text', formattedReason);

                    const uploadRes = await fetch('/wp-json/modena/v1/upload-return-proof', {
                      method: 'POST',
                      body: formData
                    });
                    if (uploadRes.ok) {
                      const uploadData = await uploadRes.json();
                      if (uploadData.success && uploadData.source_url) {
                        uploadedProofUrl = uploadData.source_url;
                      }
                    }
                  } catch (err) {
                    console.error('Failed to upload return proof:', err);
                  }
                }

                // Send request to WordPress / WooCommerce backend
                try {
                  await fetch('/wp-json/modena/v1/request-refund', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      order_number: activeReturnModalItem.orderNumber || '',
                      order_id: activeReturnModalItem.orderId || 0,
                      reason: formattedReason,
                      other_reason_text: otherReasonText || '',
                      resolution_type: resolutionType,
                      refund_method: refundMethod,
                      bank_details: bankDetails,
                      item_name: activeReturnModalItem.itemName || '',
                      proof_url: uploadedProofUrl
                    })
                  });
                } catch (err) {
                  console.error('Failed to notify backend of refund request:', err);
                }

                setReturnRequestsMap((prev) => ({
                  ...prev,
                  [activeReturnModalItem.id]: {
                    reasonLabel: formattedReason,
                    otherReasonText: otherReasonText,
                    resolutionType: resolutionType,
                    refundMethod: refundMethod,
                    bankDetails: bankDetails,
                    proofUrl: uploadedProofUrl,
                    status: 'Pickup Scheduled',
                    policyNote: resolutionType === 'replace'
                      ? 'Replacement item will be dispatched immediately once the returned product is collected from your address.'
                      : 'Refund will be transferred directly to your Razorpay/Bank details once the item is collected.'
                  }
                }));
                setReturnRequestedIds((prev) => [...prev, activeReturnModalItem.id]);
                setActiveReturnModalItem(null);
                setReturnReason('');
                setOtherReasonText('');
                setReturnProofFile(null);
                setReturnProofPreview(null);
                setReturnProofError('');
                setIsSubmittingReturn(false);
              }}
              className="space-y-6 text-xs"
            >
              {/* Step 1: Reason Selection */}
              <div>
                <label className="block font-bold text-gray-900 mb-2 text-sm">
                  Why are you returning this? <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xs bg-gray-50 focus:outline-none focus:border-[#b70100] cursor-pointer font-medium"
                >
                  <option value="">Choose a response</option>
                  <option value="defective">Defective / Motor not working</option>
                  <option value="damaged">Damaged during shipping / Broken seal</option>
                  <option value="wrong_item">Wrong item or size received</option>
                  <option value="missing_parts">Missing accessories or attachments</option>
                  <option value="performance">Performance not as expected</option>
                  <option value="no_longer_needed">No longer needed</option>
                  <option value="other">Other (Describe custom issue)</option>
                </select>
              </div>

              {/* Upload Damage / Defect Proof Photo Section */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <label className="block font-bold text-gray-900 text-xs flex items-center justify-between">
                  <span>📷 Upload Defect / Damage Proof (Photo or Video)</span>
                  <span className="text-[10px] text-gray-400 font-normal">Max 15MB</span>
                </label>

                {returnProofError && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{returnProofError}</span>
                  </p>
                )}

                {!returnProofPreview ? (
                  <label className="border-2 border-dashed border-gray-300 hover:border-[#b70100] bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setReturnProofError('');
                        if (file.size > 15 * 1024 * 1024) {
                          setReturnProofError('File size exceeds 15MB limit. Please select a smaller photo or video.');
                          return;
                        }
                        setReturnProofFile(file);
                        if (file.type.startsWith('video/')) {
                          setReturnProofFileType('video');
                          setReturnProofPreview(URL.createObjectURL(file));
                        } else {
                          setReturnProofFileType('image');
                          const reader = new FileReader();
                          reader.onloadend = () => setReturnProofPreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="w-9 h-9 rounded-full bg-red-50 text-[#b70100] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">
                      Click to upload photo or video proof
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      Supports JPG, PNG, WEBP, MP4 (Optional evidence)
                    </span>
                  </label>
                ) : (
                  <div className="border border-gray-200 bg-white rounded-xl p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-gray-900 overflow-hidden flex-shrink-0 relative flex items-center justify-center border border-gray-200">
                        {returnProofFileType === 'image' ? (
                          <img src={returnProofPreview} alt="Proof Preview" className="w-full h-full object-cover" />
                        ) : (
                          <video src={returnProofPreview} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-gray-800 block truncate">{returnProofFile?.name}</span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200 mt-0.5">
                          ✓ Proof Attached ({(returnProofFile?.size / (1024 * 1024)).toFixed(1)}MB)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnProofFile(null);
                        setReturnProofPreview(null);
                        setReturnProofError('');
                      }}
                      className="text-xs font-bold text-red-600 hover:underline flex-shrink-0 px-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Issue Description */}
              {(returnReason === 'other' || returnReason !== '') && (
                <div className="animate-in fade-in duration-200">
                  <label className="block font-bold text-gray-700 mb-1">
                    Describe the actual issue with the product:
                  </label>
                  <textarea
                    rows={3}
                    required={returnReason === 'other'}
                    value={otherReasonText}
                    onChange={(e) => setOtherReasonText(e.target.value)}
                    placeholder="Provide specific details about the issue or defect..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b70100]"
                  />
                </div>
              )}

              {/* Step 2: How can we make it right? */}
              <div>
                <label className="block font-bold text-gray-900 mb-2 text-sm">
                  How can we make it right?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolutionType('replace')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      resolutionType === 'replace'
                        ? 'border-[#b70100] bg-red-50/50 ring-2 ring-[#b70100]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="font-bold text-sm text-gray-900 block mb-1">🔄 Replacement</span>
                    <span className="text-[11px] text-gray-600 leading-relaxed">
                      A replacement item will be initiated and dispatched once the returned product is collected from your address.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('refund')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      resolutionType === 'refund'
                        ? 'border-[#b70100] bg-red-50/50 ring-2 ring-[#b70100]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="font-bold text-sm text-gray-900 block mb-1">💳 Refund</span>
                    <span className="text-[11px] text-gray-600 leading-relaxed">
                      Direct refund transferred to your original Razorpay payment method or bank/UPI account upon pickup.
                    </span>
                  </button>
                </div>
              </div>

              {/* Refund Method Options */}
              {resolutionType === 'refund' && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in duration-200">
                  <span className="font-bold text-xs text-gray-900 block">Select Refund Destination:</span>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'razorpay'}
                        onChange={() => setRefundMethod('razorpay')}
                        className="accent-[#b70100]"
                      />
                      <span>⚡ Razorpay (Original Payment Method)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'bank'}
                        onChange={() => setRefundMethod('bank')}
                        className="accent-[#b70100]"
                      />
                      <span>🏦 Bank Account Transfer</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'upi'}
                        onChange={() => setRefundMethod('upi')}
                        className="accent-[#b70100]"
                      />
                      <span>📱 Direct UPI ID</span>
                    </label>
                  </div>

                  {refundMethod === 'bank' && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Account Holder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Mohnish Niranjhan"
                          value={bankDetails.name}
                          onChange={(e) => setBankDetails((p) => ({ ...p, name: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Account Number</label>
                        <input
                          type="text"
                          required
                          placeholder="9876543210123"
                          value={bankDetails.accNum}
                          onChange={(e) => setBankDetails((p) => ({ ...p, accNum: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600">IFSC Code</label>
                        <input
                          type="text"
                          required
                          placeholder="HDFC0001234"
                          value={bankDetails.ifsc}
                          onChange={(e) => setBankDetails((p) => ({ ...p, ifsc: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#b70100]"
                        />
                      </div>
                    </div>
                  )}

                  {refundMethod === 'upi' && (
                    <div className="pt-2 border-t border-gray-200">
                      <label className="block text-[10px] uppercase font-bold text-gray-600">Enter UPI ID</label>
                      <input
                        type="text"
                        required
                        placeholder="mohnish@upi or 9962105345@paytm"
                        value={bankDetails.upiId}
                        onChange={(e) => setBankDetails((p) => ({ ...p, upiId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#b70100]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Policy Banner */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Modena Razorpay Return &amp; Replacement Policy:</span>
                  <span>
                    Replacements are dispatched automatically once the product is collected from your address. Direct refunds are credited back via Razorpay Payment Gateway directly to your account details upon pickup verification.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#b70100] hover:bg-[#e60000] text-white py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-900/20 cursor-pointer"
              >
                Confirm &amp; Initiate Return / Replace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRACK PACKAGE MODAL */}
      {activeTrackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div onClick={() => setActiveTrackOrder(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#111111] space-y-6">
            <button onClick={() => setActiveTrackOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-[#b70100] border-b border-gray-100 pb-4">
              <Truck className="w-7 h-7" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-inter">Track Package</h3>
                <p className="text-xs text-gray-500">Order #{activeTrackOrder.orderNumber || 'MOD-831092'}</p>
              </div>
            </div>

            {/* Courier Info Banner */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Courier Partner</span>
                <span className="font-extrabold text-gray-900 text-sm">BlueDart Express (Air Cargo)</span>
                <span className="text-[11px] text-gray-500 block">Tracking ID: <strong className="text-gray-800 font-mono">BD-9962105345-IN</strong></span>
              </div>
              <button
                onClick={() => alert('Tracking ID BD-9962105345-IN copied to clipboard!')}
                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#b70100]" />
                <span>Copy ID</span>
              </button>
            </div>

            {/* Status Timeline */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Shipment Progress</h4>

              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-gray-900">Order Confirmed &amp; Payment Verified</h5>
                    <p className="text-[11px] text-gray-500">Placed on {activeTrackOrder.date || '28 July 2026'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-gray-900">Packed &amp; Dispatched from Modena Warehouse</h5>
                    <p className="text-[11px] text-gray-500">Chennai Fulfillment Hub, Hub ID: CN-04</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-[#b70100] text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/30 animate-pulse">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#b70100]">Out for Delivery / In Transit</h5>
                    <p className="text-[11px] text-gray-600 font-medium">Assigned to Delivery Executive (Ramesh K. - +91 98765 43210)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Box */}
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-xs space-y-1">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#b70100]" />
                <span>Delivery Address:</span>
              </span>
              <p className="text-gray-700 pl-5">Mohnish Niranjhan — 12/A Jayalakshmi nagar, puzhuthivakkam, CHENNAI, TAMIL NADU 600091</p>
            </div>

            <button
              onClick={() => setActiveTrackOrder(null)}
              className="w-full bg-[#111111] hover:bg-black text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

      {/* LEAVE SELLER FEEDBACK MODAL */}
      {activeFeedbackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div onClick={() => setActiveFeedbackOrder(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#111111] space-y-5">
            <button onClick={() => setActiveFeedbackOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xl font-bold text-gray-900 font-inter">Leave Seller Feedback</h3>
              <p className="text-xs text-gray-500">Rate your experience with <strong>Modena Official Direct Store</strong></p>
            </div>

            {sellerFeedbackForm.submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-gray-900">Feedback Submitted!</h4>
                <p className="text-xs text-gray-600">Thank you for sharing your experience. Your rating helps us maintain top seller standards across Modena.</p>
                <button
                  onClick={() => setActiveFeedbackOrder(null)}
                  className="bg-[#111111] text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer hover:bg-black mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSellerFeedbackForm((p) => ({ ...p, submitted: true }));
                }}
                className="space-y-4 text-xs"
              >
                {/* Product Summary */}
                {activeFeedbackOrder.item && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                    <img src={activeFeedbackOrder.item.image} alt="" className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-gray-200" />
                    <div>
                      <h4 className="font-bold text-gray-900">{activeFeedbackOrder.item.name}</h4>
                      <span className="text-[10px] text-gray-500">Order #{activeFeedbackOrder.orderNumber}</span>
                    </div>
                  </div>
                )}

                {/* Rating Stars */}
                <div>
                  <label className="block font-bold text-gray-800 mb-2">Overall Rating for Seller</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setSellerFeedbackForm((p) => ({ ...p, rating: star }))}
                        className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= sellerFeedbackForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-600 ml-2">
                      {sellerFeedbackForm.rating === 5 ? '5.0 Excellent!' : sellerFeedbackForm.rating === 4 ? '4.0 Good' : 'Average'}
                    </span>
                  </div>
                </div>

                {/* Feedback Comment */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Your Comments &amp; Seller Experience</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Did the item arrive on time? Was it packaged properly? Describe your experience..."
                    value={sellerFeedbackForm.comment}
                    onChange={(e) => setSellerFeedbackForm((p) => ({ ...p, comment: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:outline-none focus:border-[#b70100]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#b70100] hover:bg-[#e60000] text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-red-900/20 cursor-pointer"
                >
                  Submit Seller Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* WISHLIST MODAL / DRAWER */}
      {isWishlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div onClick={() => setIsWishlistModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#111111] space-y-6 max-h-[85vh] flex flex-col border border-gray-100">
            
            {/* Header with Title & Action Controls */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#b70100] flex items-center justify-center shadow-inner border border-red-100 flex-shrink-0">
                  <Heart className="w-6 h-6 fill-[#b70100]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-inter leading-tight">Your Wishlist</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved • Total Value: <strong className="text-[#b70100] font-bold">₹{totalWishlistAmount.toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              </div>

              {/* Right Side Buttons: Add All to Cart & Close X */}
              <div className="flex items-center gap-2 sm:gap-3">
                {wishlist.length > 0 && (
                  <button
                    onClick={() => {
                      wishlist.forEach((item) => {
                        handleAddToCart({
                          id: item.id,
                          name: item.name,
                          price: item.numericPrice || item.price,
                          price_html: item.price_html || item.dealPrice || `₹${item.price}`,
                          image: item.image
                        });
                      });
                    }}
                    className="bg-[#b70100] hover:bg-[#e60000] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD ALL TO CART</span>
                  </button>
                )}

                <button
                  onClick={() => setIsWishlistModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Close Wishlist"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {wishlist.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-200 shadow-inner">
                  <Heart className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-gray-800">Your Wishlist is empty</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Click the heart icon on any product across our store to save items to your wishlist for easy access!
                </p>
                <button
                  onClick={() => setIsWishlistModalOpen(false)}
                  className="bg-[#b70100] text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer hover:bg-[#e60000] transition-all shadow-md mt-2"
                >
                  Explore Store Catalog
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div className={`grid grid-cols-1 ${wishlist.length === 1 ? 'max-w-lg mx-auto w-full' : 'sm:grid-cols-2'} gap-4`}>
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50/80 hover:bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between relative group hover:shadow-md transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleWishlist(item)}
                        className="absolute top-3.5 right-3.5 text-red-500 hover:text-red-700 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm cursor-pointer hover:scale-110 transition-transform z-10"
                        title="Remove from Wishlist"
                      >
                        <Heart className="w-4 h-4 fill-[#b70100] text-[#b70100]" />
                      </button>

                      <div
                        className="flex items-center gap-3.5 mb-3 cursor-pointer"
                        onClick={() => { setSelectedProduct(item); setIsWishlistModalOpen(false); }}
                      >
                        <div className="w-20 h-20 bg-white rounded-xl p-1.5 border border-gray-200 flex-shrink-0 flex items-center justify-center shadow-sm">
                          <img
                            src={item.image || '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp'}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.src = '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp';
                            }}
                          />
                        </div>
                        <div className="pr-6">
                          <span className="text-[9px] font-bold text-[#b70100] uppercase tracking-wider block mb-0.5">
                            {item.category || 'SAVED ITEM'}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 group-hover:text-[#b70100] transition-colors leading-snug">
                            {item.name}
                          </h4>
                          <span className="text-sm font-extrabold text-[#b70100] block mt-1">
                            {item.price_html || item.dealPrice || `₹${item.price}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-200/80">
                        <button
                          onClick={() => {
                            handleAddToCart({
                              id: item.id,
                              name: item.name,
                              price: item.numericPrice || item.price,
                              price_html: item.price_html || item.dealPrice || `₹${item.price}`,
                              image: item.image
                            });
                          }}
                          className="flex-1 bg-[#b70100] hover:bg-[#e60000] text-white text-[11px] font-bold py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> ADD TO CART
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsWishlistModalOpen(false);
                          }}
                          className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[11px] font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                        >
                          VIEW
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* FLOATING BOTTOM CART BAR (Appears when items exist in cart & cart drawer is closed) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-[#111111] hover:bg-[#b70100] text-white px-5 sm:px-6 py-3.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-3.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white group-hover:animate-bounce" />
              <span className="absolute -top-2 -right-2 bg-[#b70100] group-hover:bg-white group-hover:text-[#b70100] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111111] transition-colors">
                {totalItemCount}
              </span>
            </div>

            <div className="text-left font-inter">
              <span className="text-[10px] text-gray-400 group-hover:text-white/80 block uppercase tracking-wider font-semibold">
                Your Cart
              </span>
              <span className="text-xs sm:text-sm font-bold text-white block">
                {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} • {currencySymbol}{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-[#b70100] group-hover:bg-white text-white group-hover:text-[#b70100] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ml-1 shadow-sm">
              <span>VIEW CART</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      <Chatbot
        currentView={currentView}
        selectedProduct={selectedProduct}
        onSelectProduct={(p) => { setSelectedProduct(p); setProductQuantity(1); }}
        onAddToCart={handleAddToCart}
        isCartOpen={isCartOpen}
        isCheckoutOpen={activeModal === 'checkout'}
      />
      {isCompareModalOpen && (
        <CompareModal
          items={compareItems}
          onClose={() => setIsCompareModalOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}
      <ReturnProofModal
        orderId={proofOrderId}
        isOpen={isReturnProofModalOpen}
        onClose={() => setIsReturnProofModalOpen(false)}
        onSuccess={() => {
          console.log('Return proof successfully uploaded and attached.');
        }}
      />
    </div>
  );
}

export default App;
