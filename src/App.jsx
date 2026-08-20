import React, { useState, useEffect, useRef, useMemo } from 'react';
import ProductList from './components/Products/ProductList';
import Home from './pages/Home';
import Philosophy from './pages/Philosophy';
import CorporateGifting from './pages/CorporateGifting';
import RecipesList from './pages/RecipesList';
import RecipeDetail from './pages/RecipeDetail';
import { fetchRecipeBySlug } from './hooks/useRecipes';
import Chatbot from './components/Chatbot/Chatbot';
import WhatsAppWidget from './components/Common/WhatsAppWidget';
import CrackerSparksCanvas from './components/Common/CrackerSparksCanvas';
import ReviewForm from './components/Reviews/ReviewForm';
import CompareModal from './components/Compare/CompareModal';
import AmazonAuthModal from './components/Auth/AmazonAuthModal';
import ReturnProofModal from './components/Account/ReturnProofModal';
import AnnouncementBar from './components/Home/AnnouncementBar';
import CartQuantityControl from './components/Common/CartQuantityControl';
import logoMonoWhiteRed from './assets/logos/modena_logo_mono-white_red.png';
import logoBlackRed from './assets/logos/modena_logo_black_red.png';
import banner1 from './assets/hero/banner-1.png';
import banner2 from './assets/hero/banner-2.png';
import banner3 from './assets/hero/banner-3.png';
import banner4 from './assets/hero/banner-4.png';
import StorePolicies from './components/Legal/StorePolicies';
import { useProducts, getProductReviews, saveReviewToDb, fetchProductReviewsFromApi, deleteReviewApi, fetchProductBySlugOrId } from './hooks/useProducts';
import { getStandardProductDetails } from './data/productDetails';
import { useDebounce } from './hooks/useDebounce';
import { useDisplayTopology } from './hooks/useDisplayTopology';
import { generateInvoicePDF } from './utils/generateInvoicePDF';
import { openWhatsAppDirect } from './utils/whatsapp';

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
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';

const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TwitterXIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DealCountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (num) => String(num).padStart(2, '0');

  return (
    <div className="text-3xl font-mono font-bold tracking-wider text-white">
      {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s
    </div>
  );
};

function App() {
  const { isMobile, isExtraSmall } = useDisplayTopology();

  // Live WooCommerce API Products Integration via useProducts hook
  const { products: apiProducts, loading: isProductsLoading, error: productsError } = useProducts();

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

  // Scroll detector for sticky navbar and floating cart pill button ('up' | 'down')
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const lastScrollYRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = Math.max(0, window.scrollY);
          const diff = currentY - lastScrollYRef.current;

          setIsScrolled((prev) => {
            if (!prev && currentY > 20) return true;
            if (prev && currentY < 8) return false;
            return prev;
          });

          // Near page top, always force center expanded view
          if (currentY < 100) {
            setScrollDirection('up');
            accumulatedDeltaRef.current = 0;
          } else {
            // Reset accumulator when reversing scroll direction
            if ((diff > 0 && accumulatedDeltaRef.current < 0) || (diff < 0 && accumulatedDeltaRef.current > 0)) {
              accumulatedDeltaRef.current = 0;
            }
            accumulatedDeltaRef.current += diff;

            // Require 18px continuous movement to change state to eliminate twitching
            if (accumulatedDeltaRef.current > 18) {
              setScrollDirection('down');
            } else if (accumulatedDeltaRef.current < -18) {
              setScrollDirection('up');
            }
          }

          lastScrollYRef.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track previous category/catalog view to allow clean "Back to Catalog"
  const [previousView, setPreviousView] = useState('home');

  // Navigation View State with Full Refresh & URL Hash Persistence
  const [currentView, setCurrentView] = useState(() => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash) return hash;
      const pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').trim();
      if (pathname && (pathname.startsWith('product/') || pathname.startsWith('recipe/'))) {
        return pathname;
      }
      const savedView = localStorage.getItem('modena_current_view');
      return savedView || 'home';
    } catch {
      return 'home';
    }
  });

  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  const apiProductsRef = useRef(apiProducts);
  apiProductsRef.current = apiProducts;

  // URL Hash Synchronizer (prevents infinite hashchange / re-render loops)
  useEffect(() => {
    try {
      localStorage.setItem('modena_current_view', currentView);
      const currentHash = window.location.hash.replace(/^#\/?/, '').trim();
      if (currentView === 'home') {
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else if (currentHash !== currentView) {
        window.location.hash = currentView;
      }
    } catch (e) {
      console.error('Failed to persist currentView:', e);
    }
  }, [currentView]);

  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const targetRoute = !hash || hash === 'home' ? 'home' : hash;

      // Avoid redundant resets and re-render loops if route didn't change
      if (targetRoute === currentViewRef.current && (targetRoute !== 'home' || !window.location.hash)) {
        return;
      }

      // Route genuinely changed from browser history / back-forward
      setActiveModal(null);
      setBuyNowItem(null);
      setPlacedOrder(null);

      if (!hash || hash === 'home') {
        setSelectedProduct(null);
        setCurrentView('home');
      } else if (hash.startsWith('product/') || hash.startsWith('/product/')) {
        const slugOrId = hash.replace(/^\/?product\//, '').replace(/\/$/, '').trim();
        let found = (apiProductsRef.current || []).find(
          (p) => String(p.slug) === String(slugOrId) || String(p.id) === String(slugOrId)
        );
        if (!found) {
          found = await fetchProductBySlugOrId(slugOrId);
        }
        if (found) {
          setSelectedProduct(found);
          setCurrentView(`product/${slugOrId}`);
        } else {
          setSelectedProduct(null);
          setCurrentView('home');
        }
      } else if (hash.startsWith('recipe/') || hash.startsWith('/recipe/')) {
        setSelectedProduct(null);
        const slug = hash.replace(/^\/?recipe\//, '').replace(/\/$/, '').trim();
        const found = await fetchRecipeBySlug(slug);
        if (found) {
          setSelectedRecipe(found);
          setCurrentView('recipeDetail');
        } else {
          setCurrentView('recipes');
        }
      } else if (hash === 'recipes') {
        setSelectedProduct(null);
        setCurrentView('recipes');
      } else {
        setSelectedProduct(null);
        setCurrentView(hash);
      }
    };

    handleHashChange();
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

  // Dedicated Buy Now State & Loading state for isolated checkout flow
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);

  // Recipe Selected State
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setCurrentView('recipeDetail');
    window.location.hash = `recipe/${recipe.slug || recipe.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Product Quick View Popup Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeProductImage, setActiveProductImage] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState('description');

  // Dynamic Product Reviews State for Selected Product Detail Page
  const [activeProductReviews, setActiveProductReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  // Resolve direct product URL once API products load
  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    const rawPath = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').trim();
    const targetRoute = (rawHash.startsWith('product/') || rawHash.startsWith('/product/'))
      ? rawHash
      : (rawPath.startsWith('product/') || rawPath.startsWith('/product/'))
        ? rawPath
        : '';

    if (targetRoute && !selectedProduct && apiProducts?.length > 0) {
      const slugOrId = targetRoute.replace(/^\/?product\//, '').replace(/\/$/, '').trim();
      const found = apiProducts.find(
        (p) => String(p.slug) === String(slugOrId) || String(p.id) === String(slugOrId)
      );
      if (found) {
        setSelectedProduct(found);
        setCurrentView(`product/${slugOrId}`);
      }
    }
  }, [apiProducts, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct?.id) {
      setActiveProductReviews([]);
      return;
    }
    let isMounted = true;
    setIsReviewsLoading(true);

    const loadProductReviews = async () => {
      const reviews = await fetchProductReviewsFromApi(selectedProduct.id);
      if (isMounted) {
        setActiveProductReviews(reviews);
        setIsReviewsLoading(false);
      }
    };

    loadProductReviews();

    const handleReviewsUpdated = () => {
      loadProductReviews();
    };

    window.addEventListener('modena_reviews_updated', handleReviewsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('modena_reviews_updated', handleReviewsUpdated);
    };
  }, [selectedProduct?.id]);

  // Automatic Scroll To Top on Page Navigation
  useEffect(() => {
    if (currentView) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [currentView]);

  const handleSelectProduct = (product) => {
    if (!product) return;
    if (currentView && !currentView.startsWith('product/') && !currentView.startsWith('/product/')) {
      setPreviousView(currentView);
    }
    setSelectedProduct(product);
    setActiveProductImage(null);
    setProductQuantity(1);
    const slugOrId = product.slug || product.id;
    setCurrentView(`product/${slugOrId}`);
    window.location.hash = `product/${slugOrId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromProduct = () => {
    setSelectedProduct(null);
    setActiveModal(null);
    setBuyNowItem(null);
    const target = previousView && !previousView.startsWith('product/') && !previousView.startsWith('/product/')
      ? previousView
      : 'home';
    setCurrentView(target);
    window.location.hash = target === 'home' ? '' : target;
  };

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

  // Extract dynamic categories from WooCommerce products (strictly excluding internal sub-components like accessories)
  const dynamicCategories = useMemo(() => {
    const predefinedOrder = ['mixer-grinder', 'nutrimix', 'cookware'];
    const labelMap = {
      'mixer-grinder': 'MIXER GRINDER',
      'nutrimix': 'NUTRIMIX',
      'cookware': 'COOKWARE'
    };

    return predefinedOrder.map((slug) => ({
      id: slug,
      label: labelMap[slug]
    }));
  }, []);

  const bestsellers = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    return apiProducts.map((p, idx) => ({
      ...p,
      badge: idx === 0 ? '#1 BESTSELLER' : idx === 1 ? 'CHEF FAVORITE' : idx === 2 ? 'TOP RATED' : 'HERITAGE'
    }));
  }, [apiProducts]);

  const flashDeals = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    const dealProducts = apiProducts.filter((p) => {
      const cats = (p.categories || []).map((c) => (c.slug || c.name || '').toLowerCase()).join(' ');
      const name = (p.name || '').toLowerCase();
      return (
        p.on_sale ||
        cats.includes('deal') ||
        name.includes('set') ||
        name.includes('blender') ||
        name.includes('tawa') ||
        name.includes('kadai') ||
        name.includes('grinder')
      );
    });
    const list = dealProducts.length > 0 ? dealProducts : apiProducts;
    return list.map((p, idx) => {
      const origPrice = p.numericPrice ? Math.round(p.numericPrice * 1.35) : 0;
      const savings = origPrice > (p.numericPrice || 0) ? origPrice - p.numericPrice : 500;
      return {
        ...p,
        dealPrice: p.price_html || p.price,
        originalPrice: `₹${origPrice.toLocaleString('en-IN')}`,
        save: `SAVE ₹${savings.toLocaleString('en-IN')} OFF`,
        stock: 'Only few left at deal price!'
      };
    });
  }, [apiProducts]);

  const electronicsProducts = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    return apiProducts.filter((p) => {
      const cats = (p.categories || []).map((c) => (c.slug || c.name || '').toLowerCase()).join(' ');
      const name = (p.name || '').toLowerCase();
      return (
        cats.includes('electronics') ||
        cats.includes('mixer') ||
        cats.includes('blender') ||
        name.includes('mixer') ||
        name.includes('blender') ||
        name.includes('750w') ||
        name.includes('550w') ||
        name.includes('990w') ||
        name.includes('sindoor') ||
        name.includes('sujata') ||
        name.includes('karina') ||
        name.includes('preethi') ||
        name.includes('nutri')
      );
    });
  }, [apiProducts]);

  const utensilsProducts = useMemo(() => {
    if (!apiProducts || apiProducts.length === 0) return [];
    return apiProducts.filter((p) => {
      const cats = (p.categories || []).map((c) => (c.slug || c.name || '').toLowerCase()).join(' ');
      const name = (p.name || '').toLowerCase();
      return (
        cats.includes('utensils') ||
        cats.includes('stainless') ||
        cats.includes('cast iron') ||
        cats.includes('cookware') ||
        name.includes('tawa') ||
        name.includes('kadai') ||
        name.includes('pan') ||
        name.includes('board') ||
        name.includes('cooker') ||
        name.includes('triply') ||
        name.includes('iron')
      );
    });
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

  // Store Policies Active Tab State
  const [activePolicyTab, setActivePolicyTab] = useState('shipping');



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
        setLoginStep(3); // OTP Verification Step
      } else {
        setLoginError(data.message || 'Failed to send OTP code.');
      }
    } catch {
      setLoginError('Failed to send OTP due to network error.');
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

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [wcPaymentGateways, setWcPaymentGateways] = useState([
    { id: 'razorpay', title: 'UPI, Cards, NetBanking', description: 'Pay securely via UPI, Cards, or NetBanking.', is_default: true },
    { id: 'bacs', title: 'Direct bank transfer', description: 'Make your payment directly into our bank account.', is_default: false },
    { id: 'cheque', title: 'Check payments', description: 'Please send a check to Store address.', is_default: false }
  ]);
  const [isFetchingGateways, setIsFetchingGateways] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Fetch enabled WooCommerce payment gateways dynamically
  useEffect(() => {
    let isMounted = true;
    setIsFetchingGateways(true);
    fetch('/wp-json/modena/v1/payment-methods')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.gateways) && data.gateways.length > 0) {
          setWcPaymentGateways(data.gateways);
          setPaymentMethod((prev) => {
            if (prev && data.gateways.some((g) => g.id === prev)) return prev;
            const def = data.gateways.find((g) => g.is_default) || data.gateways[0];
            return def ? def.id : 'razorpay';
          });
        }
      })
      .catch((err) => console.warn('Could not load dynamic WooCommerce payment gateways:', err))
      .finally(() => {
        if (isMounted) setIsFetchingGateways(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getGatewayIcon = (gatewayId) => {
    const id = (gatewayId || '').toLowerCase();
    if (id.includes('razorpay') || id.includes('card') || id.includes('pay')) return CreditCard;
    if (id.includes('upi') || id.includes('wallet')) return Wallet;
    if (id.includes('bacs') || id.includes('bank')) return Building;
    if (id.includes('cod') || id.includes('cash')) return Banknote;
    if (id.includes('cheque') || id.includes('check')) return FileText;
    return CreditCard;
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hero Carousel State & Auto-play (4.5s) with 4 AI Generated Background Images
  const [heroIndex, setHeroIndex] = useState(0);

  const rawHeroSlideConfigs = useMemo(
    () => [
      {
        id: 'hero_slide_1',
        bgImage: banner1,
        introText: 'Introducing Modena',
        titleDisplay: 'SINDOOR 990W',
        tagline: 'High POWER. Peak PERFORMANCE.',
        title: 'Modena Sindoor 990W Heavy Duty Mixer Grinder',
        subtitle: 'Heavy duty 990W mixer grinder set',
        price: '₹6,499.00',
        numericPrice: 6499,
        image: '/wp-content/uploads/2026/08/modena-sindoor-990W-mixer-grinder.webp',
        categoryView: 'electronics'
      },
      {
        id: 'hero_slide_2',
        bgImage: banner2,
        introText: 'Introducing Modena',
        titleDisplay: 'ARGENT CLASSIC',
        tagline: 'Double SAFETY. More CONFIDENCE.',
        title: 'Modena Tri-Ply Stainless Steel Heavy Cookware & Pressure Cookers',
        subtitle: 'Food-grade tri-ply stainless steel cookware with zero chemical coating',
        price: '₹3,299.00',
        numericPrice: 3299,
        image:
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop',
        categoryView: 'utensils'
      },
      {
        id: 'hero_slide_3',
        bgImage: banner3,
        introText: 'Introducing Modena',
        titleDisplay: 'NUTRI BLEND PRO',
        tagline: 'Pure VITALITY. Maximum EXTRACTION.',
        title: 'Modena Nutri-Blend Pro High-Speed Extractor',
        subtitle: 'Commercial grade high-speed nutrient blender',
        price: '₹4,899.00',
        numericPrice: 4899,
        image:
          'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=800&auto=format&fit=crop',
        categoryView: 'electronics'
      },
      {
        id: 'hero_slide_4',
        bgImage: banner4,
        introText: 'Introducing Modena',
        titleDisplay: 'HERITAGE COPPER',
        tagline: 'Artisan CRAFT. Thermal PERFECTION.',
        title: 'Modena Heritage Copper & Brass Gourmet Cookware Set',
        subtitle: 'Hand-hammered traditional copper & brass cookware',
        price: '₹5,799.00',
        numericPrice: 5799,
        image:
          'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
        categoryView: 'utensils'
      }
    ],
    []
  );

  const heroSlides = useMemo(() => {
    return rawHeroSlideConfigs.map((slide, index) => {
      // Find matching live product in apiProducts if available
      const matched = (apiProducts || []).find((p) => {
        const nameLower = (p.name || '').toLowerCase();
        if (index === 0)
          return (
            nameLower.includes('sindoor') ||
            nameLower.includes('990w') ||
            nameLower.includes('mixer')
          );
        if (index === 1)
          return (
            nameLower.includes('kadai') ||
            nameLower.includes('tawa') ||
            nameLower.includes('steel')
          );
        if (index === 2)
          return (
            nameLower.includes('nutri') ||
            nameLower.includes('blend') ||
            nameLower.includes('750w')
          );
        if (index === 3)
          return (
            nameLower.includes('brass') ||
            nameLower.includes('copper') ||
            nameLower.includes('utensil')
          );
        return false;
      });

      const matchedProduct = matched
        ? {
          id: matched.id,
          name: matched.name,
          title: matched.name,
          price: matched.price_html || matched.price,
          numericPrice: matched.numericPrice || slide.numericPrice,
          rating: matched.rating || slide.rating,
          image: matched.image || slide.image,
          images: matched.images || [slide.image],
          description: matched.description || slide.subtitle,
          category: matched.category || slide.badge
        }
        : {
          id: slide.id,
          name: slide.title,
          title: slide.title,
          price: slide.price,
          numericPrice: slide.numericPrice,
          rating: slide.rating,
          image: slide.image,
          images: [slide.image],
          description: slide.subtitle,
          category: slide.badge
        };

      return {
        ...slide,
        product: matchedProduct
      };
    });
  }, [apiProducts, rawHeroSlideConfigs]);

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
  const utensilsScrollRef = useRef(null);

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

  // Direct checkout flow trigger for Cart and Buy Now
  const triggerCheckoutFlow = (isBuyNow = false) => {
    if (!isBuyNow) {
      setBuyNowItem(null);
    }
    setPlacedOrder(null);
    setActiveModal('checkout');
  };

  const parsePrice = (product) => {
    if (!product) return 0;
    if (typeof product.numericPrice === 'number' && product.numericPrice > 0) {
      return product.numericPrice;
    }
    if (product.prices?.price) {
      return parseFloat(product.prices.price) / Math.pow(10, product.prices.currency_minor_unit || 2);
    }
    if (typeof product.price === 'number' && product.price > 0) return product.price;
    if (typeof product.price === 'string') {
      const cleaned = product.price.replace(/[^0-9.]/g, '');
      if (cleaned) {
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val > 0) return val;
      }
    }
    if (product.price_html && typeof product.price_html === 'string') {
      const cleaned = product.price_html.replace(/<[^>]*>?/gm, '').replace(/[^0-9.]/g, '');
      if (cleaned) {
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val > 0) return val;
      }
    }
    return 0;
  };

  // Central Navigation Handler: resets active modals, product detail view, and isolated state
  const handleNavigate = (viewId) => {
    setSelectedProduct(null);
    setActiveModal(null);
    setBuyNowItem(null);
    setPlacedOrder(null);
    setIsCartOpen(false);
    setMobileMenuOpen(false);
    setCurrentView(viewId);
  };

  // TRUE BUY NOW HANDLER: Operates via isolated buyNowItem state without corrupting persistent cart
  const handleBuyNow = (product, quantityToAdd = 1, variation = null) => {
    if (!product) return;
    if (isBuyNowLoading) return; // Double-click protection

    setIsBuyNowLoading(true);

    // 1. Stock validation
    const isOut =
      product.isOutOfStock ||
      product.stock === 'Out of Stock' ||
      product.is_in_stock === false ||
      (product.categories || []).some(
        (c) => (typeof c === 'string' ? c : c.slug || c.name || '').toLowerCase().includes('out of stock')
      );

    if (isOut) {
      alert('Sorry, this product is currently Out of Stock.');
      setIsBuyNowLoading(false);
      return;
    }

    const priceVal = parsePrice(product);
    const img =
      (Array.isArray(product.images) && product.images.length > 0
        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.src || product.images[0]?.thumbnail)
        : null) ||
      product.image ||
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';

    const selectedVar = variation || product.selectedVariation || null;

    const itemToBuy = {
      id: selectedVar ? `${product.id}-${selectedVar.id || selectedVar.name}` : product.id,
      productId: product.id,
      name: selectedVar ? `${product.name} (${selectedVar.name || selectedVar.attributes})` : (product.name || product.title),
      price: selectedVar?.price ? parseFloat(selectedVar.price) : priceVal,
      price_html: selectedVar?.price_html || product.dealPrice || product.price_html || product.price || `₹${priceVal.toFixed(2)}`,
      currency_symbol: product.prices?.currency_symbol || '₹',
      image: selectedVar?.image?.src || img,
      quantity: Math.max(1, quantityToAdd),
      variation: selectedVar
    };

    setPlacedOrder(null);
    setBuyNowItem(itemToBuy);
    setActiveModal('checkout');
    setIsBuyNowLoading(false);
  };

  const lastCartThrottleRef = useRef(0);

  const handleAddToCart = (product, quantityToAdd = 1) => {
    if (!product) return;
    const now = Date.now();
    if (now - lastCartThrottleRef.current < 300) {
      return; // Anti-spam click guard
    }
    lastCartThrottleRef.current = now;

    const isOut =
      product.isOutOfStock ||
      product.stock === 'Out of Stock' ||
      product.is_in_stock === false ||
      (product.categories || []).some(
        (c) => c.slug === 'out-of-stock' || (c.name || '').toLowerCase() === 'out of stock'
      );

    if (isOut) {
      alert('Sorry, this product is currently Out of Stock.');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => String(item.id) === String(product.id) || (product.name && item.name === product.name));
      const priceVal = parsePrice(product);
      const img =
        product.images?.[0]?.src ||
        product.images?.[0]?.thumbnail ||
        product.image ||
        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop';

      if (existing) {
        return prevCart.map((item) =>
          String(item.id) === String(product.id) || (product.name && item.name === product.name)
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
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
    const now = Date.now();
    if (now - lastCartThrottleRef.current < 200) {
      return; // Anti-spam click guard
    }
    lastCartThrottleRef.current = now;

    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (String(item.id) === String(id) || item.name === id) {
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

  // Active items for Checkout Popup (isolated Buy Now vs persistent Cart)
  const activeCheckoutItems = buyNowItem ? [buyNowItem] : cart;
  const activeSubtotal = activeCheckoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeTotalItemCount = activeCheckoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeCurrencySymbol = activeCheckoutItems[0]?.currency_symbol || '₹';

  // Shipping Fee per Official Policy #3: Free shipping above ₹2,999. Orders below ₹2,999 attract flat ₹300 fee.
  const shippingFee = activeSubtotal > 0 && activeSubtotal < 2999 ? 300 : 0;

  const discountAmount = appliedDiscount
    ? appliedDiscount.percent
      ? (activeSubtotal * appliedDiscount.percent) / 100
      : appliedDiscount.flat || 0
    : 0;
  const finalTotal = Math.max(0, activeSubtotal - discountAmount + shippingFee);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmittingOrder) return;
    if (!activeCheckoutItems || activeCheckoutItems.length === 0) return;

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
          items: activeCheckoutItems,
          customer: customerDetails,
          paymentMethod: paymentMethod || 'razorpay'
        })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to place order in WooCommerce.');
      }

      const selectedGatewayObj = wcPaymentGateways.find((g) => g.id === (data.payment_method || paymentMethod));
      const paymentTitle = data.payment_method_title || (selectedGatewayObj ? selectedGatewayObj.title : paymentMethod);

      const newOrder = {
        id: 'order-' + (data.order_id || Date.now()),
        orderId: data.order_id,
        orderNumber: data.order_number || orderNumber,
        items: [...activeCheckoutItems],
        total: typeof data.total === 'number' ? data.total : finalTotal,
        currency: data.currency || 'INR',
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        customer: customerDetails,
        paymentMethod: data.payment_method || paymentMethod,
        paymentMethodTitle: paymentTitle,
        instructions: data.instructions || (selectedGatewayObj ? selectedGatewayObj.description : ''),
        status: data.status || 'processing',
        statusLabel: data.status_label || 'Processing',
        deliveryStatus: '🚚 Order Placed - Processing in WooCommerce'
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
      if (!buyNowItem) {
        setCart([]);
      }
      setBuyNowItem(null);

      // If an online gateway returns a payment link, redirect customer to complete payment
      if (data.redirect_url && typeof data.redirect_url === 'string' && data.redirect_url.startsWith('http') && data.payment_method !== 'bacs' && data.payment_method !== 'cheque') {
        window.location.href = data.redirect_url;
      }
    } catch (error) {
      console.error('Failed to create WooCommerce order:', error);
      setOrderError(error.message || 'Failed to create WooCommerce order. Please try again.');
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
    <div className="min-h-screen bg-[#F3F1ED] text-[#292725] font-inter antialiased relative selection:bg-[#C91F26] selection:text-white">
      {/* TOP ANNOUNCEMENT & UTILITY BAR */}
      <AnnouncementBar
        onOrders={() => {
          setSelectedProduct(null);
          setOrdersTab('orders');
          setCurrentView('yourOrders');
          if (!userDisplayName) {
            setActiveModal('auth');
          }
        }}
        onReturns={() => {
          setSelectedProduct(null);
          setOrdersTab('returns');
          setCurrentView('yourOrders');
          if (!userDisplayName) {
            setActiveModal('auth');
          }
        }}
      />

      {/* MAIN STUCK TOP FLOATING ROUNDED NAVIGATION HEADER */}
      <header className={`sticky top-0 z-40 w-full max-w-[1720px] mx-auto px-3 sm:px-6 relative transition-all duration-300 ease-out ${isScrolled ? 'pb-2.5 sm:pb-4' : ''}`}>
        <div className={`border px-6 sm:px-10 h-16 sm:h-18 flex items-center justify-between relative transition-all duration-300 ease-out border-[#D8D4CD] transform-gpu ${isScrolled ? 'mt-0 rounded-t-none rounded-b-[36px] shadow-sm bg-[#F8F7F4]/95 backdrop-blur-2xl text-[#292725]' : 'mt-2.5 sm:mt-4 rounded-[36px] bg-[#F8F7F4]/90 backdrop-blur-xl shadow-xs text-[#292725]'}`}>
          {/* Left: Logo */}
          <div className="flex items-center gap-3.5">
            <button onClick={() => handleNavigate('home')} className="flex items-center group cursor-pointer flex-shrink-0">
              <img
                src={logoBlackRed}
                alt="Modena Logo"
                className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-102 -translate-y-0.5"
              />
            </button>
          </div>

          {/* Center: Desktop Navigation Anchors - Centered Vertically & Horizontally */}
          <nav className="hidden lg:flex items-center gap-8 font-label-caps text-xs sm:text-sm tracking-widest absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 uppercase">
            {[
              { id: 'home', label: 'HOME' },
              ...dynamicCategories
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`py-2 border-b-2 transition-all cursor-pointer font-semibold uppercase ${(currentView === item.id || ((item.id === 'mixer-grinder' || item.id === 'mixer') && ['mixer', 'mixer-grinder', 'mixer-grinders'].includes(currentView))) && !selectedProduct ? 'text-[#C91F26] border-[#C91F26] font-bold scale-105' : 'text-[#292725] hover:text-[#C91F26] border-transparent'
                  }`}
              >
                {item.label}
              </button>
            ))}

            <div className="relative group py-2">
              <button
                className={`border-b-2 transition-all cursor-pointer font-semibold uppercase flex items-center gap-1 ${['about', 'philosophy', 'contactUs'].includes(currentView) && !selectedProduct ? 'text-[#C91F26] border-[#C91F26] font-bold scale-105' : 'text-[#292725] hover:text-[#C91F26] border-transparent'
                  }`}
              >
                MORE <ChevronDown className="w-3 h-3" />
              </button>
              {/* Invisible padding area (pt-2) creates a continuous hover bridge */}
              <div className="absolute top-[100%] left-[-20px] pt-2 w-56 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                <div className="bg-[#F8F7F4] rounded-xl shadow-xl border border-[#D8D4CD] flex flex-col relative text-[#292725]">
                  <button
                    onClick={() => {
                      handleNavigate('corporate-gifting');
                      window.location.hash = 'corporate-gifting';
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative w-full text-left px-5 py-3.5 bg-gradient-to-r from-amber-100 to-[#F8F7F4] hover:from-amber-200 hover:to-gray-100 transition-all text-[#855B00] uppercase text-xs tracking-wider cursor-pointer font-bold border-b border-amber-200 flex items-center gap-2 rounded-t-xl z-20 overflow-visible"
                  >
                    <CrackerSparksCanvas isMobile={false} />
                    <Sparkles className="w-4 h-4 text-[#855B00] relative z-10" />
                    <span className="relative z-10">CORPORATE GIFTING</span>
                  </button>
                  <button
                    onClick={() => {
                      handleNavigate('philosophy');
                      window.location.hash = 'philosophy';
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-left px-5 py-3 hover:bg-[#EAE7E1] transition-colors text-[#292725] hover:text-[#C91F26] uppercase text-xs tracking-wider cursor-pointer border-b border-[#D8D4CD] font-semibold"
                  >
                    ABOUT US
                  </button>
                  <button
                    onClick={() => handleNavigate('contactUs')}
                    className="w-full text-left px-5 py-3 hover:bg-[#EAE7E1] transition-colors text-[#292725] hover:text-[#C91F26] uppercase text-xs tracking-wider cursor-pointer font-semibold"
                  >
                    CONTACT US
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            <div ref={searchContainerRef} className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#EAE7E1] rounded-full px-4 py-2 border border-[#D8D4CD] focus-within:border-[#C91F26] transition-colors relative">
                <button type="submit" aria-label="Search" className="cursor-pointer">
                  {isDebouncing || isProductsLoading ? (
                    <Loader2 className="w-4.5 h-4.5 text-[#C91F26] animate-spin mr-2" />
                  ) : (
                    <Search className="w-4.5 h-4.5 text-[#716D67] hover:text-[#292725] mr-2" />
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
                  className="bg-transparent text-xs sm:text-sm text-[#252525] placeholder-gray-500 focus:outline-none w-36 focus:w-56 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOverlayOpen(false);
                    }}
                    className="text-gray-500 hover:text-[#252525] ml-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* LIVE INSTANT SEARCH AUTOCOMPLETE DROPDOWN */}
              {isSearchOverlayOpen && searchQuery.trim() && (
                <div className="absolute right-0 top-14 w-86 sm:w-96 bg-[#2A2724]/95 backdrop-blur-xl border border-[#2A2724] rounded-2xl shadow-2xl z-50 p-4 overflow-hidden text-white animate-in fade-in duration-200">
                  {searchIntentInfo && (
                    <div className="flex items-center justify-between border-b border-[#2A2724] pb-2.5 mb-3 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#EFEAE6] font-label-caps font-semibold truncate">
                        <Sparkles className="w-3.5 h-3.5 text-[#E60000] flex-shrink-0" />
                        <span className="truncate">{searchIntentInfo.intent}</span>
                      </div>
                      <span className="text-[10px] bg-[#E60000] text-white px-2 py-0.5 rounded font-bold flex-shrink-0">BESTSELLERS FIRST</span>
                    </div>
                  )}

                  {isDebouncing || isProductsLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-400">
                      <Loader2 className="w-4 h-4 text-[#E60000] animate-spin" />
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
                          className="flex items-center justify-between bg-[#2A2724] hover:bg-[#2A2724] p-2.5 rounded-xl border border-[#2A2724] transition-all group"
                        >
                          <div
                            className="flex items-center gap-3 truncate mr-2 cursor-pointer flex-1"
                            onClick={() => {
                              handleSelectProduct(item);
                              setIsSearchOverlayOpen(false);
                            }}
                          >
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-contain rounded-lg bg-white p-1 flex-shrink-0 border border-gray-700" />
                            <div className="truncate">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-bold bg-[#E60000] text-white px-1.5 py-0.2 rounded">{item.badge}</span>
                                {item.inStock ? (
                                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">In Stock</span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.2 rounded">Out of Stock</span>
                                )}
                              </div>
                              <h4 className="text-xs text-white font-medium truncate group-hover:text-[#EFEAE6] transition-colors">{item.name}</h4>
                              <span className="text-xs text-[#EFEAE6] font-bold block">{item.price_html || item.price}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddToCart(item);
                              setIsSearchOverlayOpen(false);
                            }}
                            className="bg-[#E60000] hover:bg-[#E60000] active:scale-95 text-white text-[10px] font-label-caps px-3.5 py-2 rounded-xl transition-all flex-shrink-0 cursor-pointer shadow font-bold flex items-center gap-1"
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
                      className="text-[#EFEAE6] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>Open Search Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Trigger Button near Searchbar */}
            <button
              onClick={() => setIsWishlistModalOpen(true)}
              className="hidden md:flex relative bg-[#EAE7E1] hover:bg-[#D8D4CD] text-[#292725] p-3 rounded-full transition-all duration-200 items-center justify-center border border-[#D8D4CD] hover:scale-105 cursor-pointer flex-shrink-0"
              aria-label="Open Wishlist"
              title="View your wishlist"
            >
              <Heart className={`w-5.5 h-5.5 transition-colors ${wishlist.length > 0 ? 'fill-[#C91F26] text-[#C91F26]' : 'text-[#716D67] hover:text-[#292725]'}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C91F26] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
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
                className="w-11 h-11 rounded-full bg-[#C91F26] hover:bg-[#A9181E] text-white flex items-center justify-center font-bold text-base shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[#C91F26]/30 flex-shrink-0"
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
                  <div className="px-4 py-3 border-b border-gray-100 bg-[#FAF8F6]/50 rounded-t-2xl">
                    <p className="text-[10px] font-extrabold text-[#E60000] uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-[#2A2724] truncate">{userDisplayName}</p>
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
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-[#FAF8F6] hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#FAF8F6] group-hover:bg-[#E60000] text-[#E60000] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-[#292725] group-hover:text-[#C91F26]">My Account</span>
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Package className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Lock className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <MapPin className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Heart className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <span className="block font-medium">Wishlist</span>
                            <span className="text-[10px] text-gray-400 font-normal">Saved items &amp; favorites</span>
                          </div>
                          {wishlist.length > 0 && (
                            <span className="bg-[#E60000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Headphones className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
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
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E60000] flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <FileText className="w-4 h-4 text-gray-500 group-hover:text-[#E60000]" />
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
              className="relative bg-[#C91F26] hover:bg-[#A9181E] text-white p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-105 cursor-pointer flex-shrink-0"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-5.5 h-5.5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#C91F26] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#D8D4CD]">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Mobile Navigation Menu Toggle (Rightmost Item) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden bg-gray-100 hover:bg-gray-200 text-[#252525] p-2.5 rounded-full border border-gray-200 transition-all flex items-center justify-center focus:outline-none cursor-pointer flex-shrink-0 hover:scale-105"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#252525]" /> : <Menu className="w-5 h-5 text-[#252525]" />}
            </button>
          </div>
        </div>



        {/* Mobile Navigation Floating Overlay Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="lg:hidden absolute top-full left-3 right-3 sm:left-6 sm:right-6 mt-2 z-50 bg-[#F8F7F4] backdrop-blur-2xl border border-[#D8D4CD] rounded-3xl p-4 flex flex-col gap-3 font-inter text-xs shadow-xl animate-in fade-in slide-in-from-top-3 duration-300 ease-out max-h-[85vh] overflow-y-auto scrollbar-thin text-[#292725]">
              {/* 1. Mobile Search Input */}
              <form
                onSubmit={(e) => {
                  handleSearchSubmit(e);
                  setMobileMenuOpen(false);
                }}
                className="relative flex items-center bg-[#EAE7E1] rounded-2xl px-3.5 py-2.5 border border-[#D8D4CD] focus-within:border-[#C91F26] transition-all"
              >
                <Search className="w-4 h-4 text-[#716D67] mr-2.5 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOverlayOpen(true);
                  }}
                  onFocus={() => setIsSearchOverlayOpen(true)}
                  className="bg-transparent text-xs text-[#292725] placeholder-[#716D67] focus:outline-none w-full font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOverlayOpen(false);
                    }}
                    className="text-[#716D67] hover:text-[#292725] ml-2 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* 2. Simple Main Navigation Anchors */}
              <nav className="flex flex-col gap-1 pt-1 font-label-caps text-xs">
                {[
                  { id: 'home', label: 'HOME' },
                  ...dynamicCategories
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left uppercase ${currentView === item.id || ((item.id === 'mixer-grinder' || item.id === 'mixer') && ['mixer', 'mixer-grinder', 'mixer-grinders'].includes(currentView))
                      ? 'bg-[#C91F26] text-white shadow-xs'
                      : 'text-[#292725] hover:bg-[#EAE7E1] hover:text-[#C91F26]'
                      }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}

                <details className="group">
                  <summary className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left uppercase list-none ${['about', 'philosophy', 'contactUs'].includes(currentView)
                    ? 'bg-[#C91F26] text-white shadow-xs'
                    : 'text-[#292725] hover:bg-[#EAE7E1] hover:text-[#C91F26]'
                    }`}>
                    <span>MORE</span>
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="pl-4 pr-2 py-2 space-y-1">
                    <button
                      onClick={() => {
                        handleNavigate('corporate-gifting');
                        window.location.hash = 'corporate-gifting';
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="relative overflow-visible w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left text-[#F9DE8B] bg-gradient-to-r from-[#4A3B18] to-transparent border border-[#D4AF37]/40"
                    >
                      <CrackerSparksCanvas isMobile={true} />
                      <span className="flex items-center gap-2 text-[11px] relative z-10">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        CORPORATE GIFTING
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavigate('philosophy');
                        window.location.hash = 'philosophy';
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left uppercase text-[11px] ${['about', 'philosophy'].includes(currentView)
                        ? 'bg-[#C91F26] text-white shadow-md'
                        : 'text-[#292725] hover:bg-[#EAE7E1] hover:text-[#C91F26]'
                        }`}
                    >
                      <span>ABOUT US</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('contactUs')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left uppercase text-[11px] ${currentView === 'contactUs'
                        ? 'bg-[#E60000] text-white shadow-md'
                        : 'text-gray-200 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span>CONTACT US</span>
                    </button>
                  </div>
                </details>

                {/* 3. Wishlist Anchor pushed into menu drawer */}
                <button
                  onClick={() => {
                    setIsWishlistModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold tracking-widest text-left text-gray-200 hover:bg-white/5 hover:text-white border-t border-white/10 mt-1"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-[#E60000] text-[#E60000]' : 'text-gray-400'}`} />
                    <span>MY WISHLIST</span>
                  </span>
                  {wishlist.length > 0 && (
                    <span className="bg-[#E60000] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* 3. FULL PAGE PRODUCT DETAIL VIEW OR REGULAR STORE VIEWS */}
      {selectedProduct ? (
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 animate-in fade-in duration-300">
          {/* Breadcrumb Navigation & Back to Store Button */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <button
              onClick={handleBackFromProduct}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E60000] hover:text-red-700 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Store Catalog</span>
            </button>
            <span className="text-xs text-gray-500 font-medium truncate max-w-md hidden sm:inline">
              Home / {selectedProduct.category || 'Product'} / {selectedProduct.name}
            </span>
          </div>

          {/* Main Product Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Product Image Gallery with Thumbnails & Zoom */}
            {(() => {
              const currentImages = Array.from(
                new Set(
                  (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
                    ? selectedProduct.images
                    : [selectedProduct.image]
                  ).filter(Boolean)
                )
              );
              const displayImg = (activeProductImage && currentImages.includes(activeProductImage))
                ? activeProductImage
                : (selectedProduct.image && currentImages.includes(selectedProduct.image))
                  ? selectedProduct.image
                  : currentImages[0];

              return (
                <div className="lg:col-span-6 flex flex-col items-center space-y-4">
                  {/* Main 4:3 Image Container */}
                  <div
                    onClick={() => {
                      setZoomedImage(displayImg);
                      setZoomScale(1);
                    }}
                    className="w-full aspect-square bg-[#FAF8F6] rounded-2xl overflow-hidden border border-[#E2DCD7] relative group cursor-pointer flex items-center justify-center p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    {selectedProduct.badge && (
                      <span className="absolute top-4 left-4 bg-[#E60000] text-white text-[10px] font-bold font-label-caps px-3 py-1 rounded-full shadow-md tracking-wider uppercase z-10">
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

                    {/* Navigation Arrows inside Main Image Box */}
                    {currentImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currIdx = currentImages.indexOf(displayImg);
                            const prevIdx =
                              (currIdx - 1 + currentImages.length) % currentImages.length;
                            setActiveProductImage(currentImages[prevIdx]);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2 rounded-full transition-all z-20 cursor-pointer shadow-md"
                          title="Previous Image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>


                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currIdx = currentImages.indexOf(displayImg);
                            const nextIdx = (currIdx + 1) % currentImages.length;
                            setActiveProductImage(currentImages[nextIdx]);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2 rounded-full transition-all z-20 cursor-pointer shadow-md"
                          title="Next Image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Picture Row */}
                  {currentImages.length > 1 && (
                    <div className="w-full flex items-center justify-center gap-3 overflow-x-auto py-1">
                      {currentImages.map((imgUrl, idx) => {
                        const isCurrent = displayImg === imgUrl;
                        return (
                          <button
                            key={`${imgUrl}-${idx}`}
                            type="button"
                            onClick={() => setActiveProductImage(imgUrl)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 cursor-pointer bg-white flex-shrink-0 ${isCurrent
                              ? 'border-[#E60000] ring-2 ring-[#E60000]/30 scale-105 shadow-md'
                              : 'border-[#E2DCD7] opacity-60 hover:opacity-100 hover:border-gray-400'
                              }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Angle ${idx + 1}`}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Zoom Inspect Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setZoomedImage(displayImg);
                      setZoomScale(1);
                    }}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-200 shadow-xs"
                  >
                    <Maximize2 className="w-4 h-4 text-[#E60000]" />
                    <span>Zoom &amp; Expand Image ({currentImages.length} Pictures)</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pt-1">
                    <ShieldCheck className="w-4 h-4 text-[#E60000]" />
                    <span>Modena Certified Authentic Quality</span>
                  </div>
                </div>
              );
            })()}

            {/* Right Column: Product Details & Purchase Actions */}
            <div className="lg:col-span-6 space-y-6">
              {/* Star Rating & Review Information */}
              <div className="flex items-center gap-2">
                {selectedProduct.hasReviews || selectedProduct.rating_count > 0 ? (
                  <>
                    <div className="flex text-amber-400 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.round(Number(selectedProduct.average_rating || 0))
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      {Number(selectedProduct.average_rating || 0).toFixed(1)} ({selectedProduct.rating_count} {selectedProduct.rating_count === 1 ? 'Review' : 'Reviews'})
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex text-gray-300 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-500">0.0 (0 Reviews)</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">No reviews</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight font-display-lg">
                {selectedProduct.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#E60000]">
                  {selectedProduct.dealPrice ||
                    selectedProduct.price_html ||
                    selectedProduct.price ||
                    `₹${selectedProduct.numericPrice?.toLocaleString()}`}
                </span>
                {selectedProduct.originalPrice && (
                  <span className="text-lg text-gray-400 line-through font-medium">
                    {selectedProduct.originalPrice}
                  </span>
                )}
                {selectedProduct.save && (
                  <span className="bg-[#EFEAE6] text-[#E60000] text-xs font-bold px-3 py-1 rounded-full border border-[#E2DCD7]">
                    {selectedProduct.save}
                  </span>
                )}
              </div>

              {/* Summary Description */}
              <p className="text-sm text-gray-600 leading-relaxed border-t border-b border-[#E2DCD7] py-4">
                {selectedProduct.desc ||
                  selectedProduct.description ||
                  'Heavy-Duty Motor (20,000–22,000 RPM). 3 Speed Settings + Pulse. Includes Food-Grade Stainless Steel Jars. Equipped with Overload Protection.'}
              </p>

              {/* KEY HIGHLIGHTS 2x2 Grid */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
                  KEY HIGHLIGHTS
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                    <Flame className="w-4 h-4 text-[#E60000]" />
                    <span className="font-medium text-gray-800">
                      {(() => {
                        const pCats = (selectedProduct.categories || []).map(c => typeof c === 'string' ? c.toLowerCase() : (c.slug || '').toLowerCase());
                        const isCookware = pCats.includes('cookware') || pCats.includes('utensils');
                        if (isCookware) return "Heavy-Gauge Build";
                        return "High Performance";
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                    <ShieldCheck className="w-4 h-4 text-[#E60000]" />
                    <span className="font-medium text-gray-800">
                      {(() => {
                        const pName = (selectedProduct.name || '').toLowerCase();
                        const pCats = (selectedProduct.categories || []).map(c => typeof c === 'string' ? c.toLowerCase() : (c.slug || '').toLowerCase());
                        const isMixer = pCats.includes('mixer-grinder') || pCats.includes('mixer') || pName.includes('mixer');
                        const isBlender = pCats.includes('personal-blender') || pCats.includes('nutri') || pName.includes('nutri');
                        if (isMixer) return "5-Year Motor Warranty";
                        if (isBlender) return "2-Year Motor Warranty";
                        return "Mfg. Defect Warranty";
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                    <Sparkles className="w-4 h-4 text-[#E60000]" />
                    <span className="font-medium text-gray-800 text-[10px] sm:text-xs">
                      {(() => {
                        const pName = (selectedProduct.name || '').toLowerCase();
                        if (pName.includes('non-stick') || pName.includes('nonstick')) return "Food-Grade Coating";
                        if (pName.includes('cast iron')) return "Natural Cast Iron";
                        return "Zero Chemical Coating";
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                    <Truck className="w-4 h-4 text-[#E60000]" />
                    <span className="font-medium text-gray-800 text-[10px] sm:text-xs">Free Shipping {'>'} ₹2,999</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="pt-2 flex items-center gap-4">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  QUANTITY:
                </span>
                <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-gray-600 hover:bg-gray-200 font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-bold text-gray-900 min-w-[2.5rem] text-center">
                    {productQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductQuantity((q) => q + 1)}
                    className="px-3.5 py-2 text-gray-600 hover:bg-gray-200 font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Purchase Actions (Wishlist, Add to Cart & Buy Now) */}
              {(() => {
                const isSelectedOutOfStock =
                  selectedProduct.isOutOfStock ||
                  selectedProduct.stock === 'Out of Stock' ||
                  selectedProduct.is_in_stock === false ||
                  (selectedProduct.categories || []).some(
                    (c) => c.slug === 'out-of-stock' || (c.name || '').toLowerCase() === 'out of stock'
                  );

                if (isSelectedOutOfStock) {
                  return (
                    <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleWishlist(selectedProduct)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-gray-200"
                        title={isWishlisted(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted(selectedProduct.id) ? 'fill-[#E60000] text-[#E60000]' : 'text-gray-600'}`} />
                      </button>

                      <button
                        disabled
                        className="flex-1 bg-gray-200 text-gray-500 py-4 px-6 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase cursor-not-allowed border border-gray-300 flex items-center justify-center gap-2"
                      >
                        <span>OUT OF STOCK</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleWishlist(selectedProduct)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-gray-200"
                      title={
                        isWishlisted(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'
                      }
                    >
                      <Heart
                        className={`w-5 h-5 ${isWishlisted(selectedProduct.id)
                          ? 'fill-[#E60000] text-[#E60000]'
                          : 'text-gray-600'
                          }`}
                      />
                    </button>

                    {(() => {
                      const cartItemForProduct = (cart || []).find(
                        (item) => String(item.id) === String(selectedProduct.id) || (selectedProduct.name && item.name === selectedProduct.name)
                      );
                      const currentCartQty = cartItemForProduct ? cartItemForProduct.quantity : 0;

                      if (currentCartQty > 0) {
                        return (
                          <div className="flex-1 bg-[#2A2724] text-white py-2 px-3 sm:px-4 rounded-xl flex items-center justify-between shadow-md border border-[#3A3734] min-h-[52px] select-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(cartItemForProduct.id, -1);
                              }}
                              className="w-10 h-10 rounded-lg hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                              title="Decrease Quantity"
                              aria-label="Decrease Quantity"
                            >
                              <Minus className="w-5 h-5 text-white stroke-[2.5]" />
                            </button>

                            <div className="flex flex-col items-center select-none px-2">
                              <span className="text-[10px] font-label-caps text-[#E2DCD7] tracking-widest font-semibold">IN CART</span>
                              <span className="text-base font-extrabold text-white leading-none tracking-wider">{currentCartQty}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(cartItemForProduct.id, 1);
                              }}
                              className="w-10 h-10 rounded-lg hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                              title="Increase Quantity"
                              aria-label="Increase Quantity"
                            >
                              <Plus className="w-5 h-5 text-white stroke-[2.5]" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            handleAddToCart(
                              {
                                id: selectedProduct.id,
                                name: selectedProduct.name,
                                price: selectedProduct.numericPrice || selectedProduct.price,
                                price_html:
                                  selectedProduct.dealPrice ||
                                  selectedProduct.price_html ||
                                  selectedProduct.price,
                                image: selectedProduct.image,
                                isOutOfStock: selectedProduct.isOutOfStock,
                                stock: selectedProduct.stock
                              },
                              productQuantity
                            );
                          }}
                          className="flex-1 bg-[#2A2724] hover:bg-[#1E1C1A] text-white py-4 px-6 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>ADD TO CART</span>
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      disabled={isBuyNowLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBuyNow(selectedProduct, productQuantity);
                      }}
                      className="flex-1 bg-[#E60000] hover:bg-[#E60000] text-white py-4 px-6 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBuyNowLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Zap className="w-4 h-4 fill-white" />
                      )}
                      <span>BUY NOW</span>
                    </button>

                  </div>
                );
              })()}
            </div>
          </div>

          {/* STANDARDIZED 5-FIELD PRODUCT DETAILS ACCORDIONS */}
          {(() => {
            const std = getStandardProductDetails(selectedProduct) || {};
            const desc = std.description || selectedProduct.description || selectedProduct.desc || '';
            const incList = std.included_components || (Array.isArray(selectedProduct.included_components) ? selectedProduct.included_components : (selectedProduct.included_components ? [selectedProduct.included_components] : []));
            const uspList = std.usp || (Array.isArray(selectedProduct.usp) ? selectedProduct.usp : (selectedProduct.usp ? [selectedProduct.usp] : []));
            const dimsText = std.dimensions || selectedProduct.dimensions || '';
            const mfrText = std.manufacturer || selectedProduct.manufacturer || '';

            return (
              <div className="pt-8 border-t border-gray-200 max-w-4xl mx-auto space-y-4">
                {/* 1. Description */}
                {desc && (
                  <div className="border-b border-gray-200 pb-4">
                    <button
                      onClick={() =>
                        setOpenAccordion((prev) => (prev === 'description' ? null : 'description'))
                      }
                      className="w-full text-left flex justify-between items-center py-2 cursor-pointer group"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#E60000] transition-colors">
                        Description
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                        {openAccordion === 'description' ? (
                          <ChevronUp className="w-4 h-4 text-gray-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-700" />
                        )}
                      </div>
                    </button>
                    {openAccordion === 'description' && (
                      <div className="pt-3 text-sm text-gray-600 leading-relaxed space-y-3 animate-in fade-in duration-200">
                        <p>{desc}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Included Components */}
                {incList && incList.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <button
                      onClick={() =>
                        setOpenAccordion((prev) =>
                          prev === 'includedComponents' ? null : 'includedComponents'
                        )
                      }
                      className="w-full text-left flex justify-between items-center py-2 cursor-pointer group"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#E60000] transition-colors">
                        Included Components
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-[#2A2724] text-white flex items-center justify-center transition-colors">
                        {openAccordion === 'includedComponents' ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                    {openAccordion === 'includedComponents' && (
                      <div className="pt-3 text-sm text-gray-600 leading-relaxed space-y-2 animate-in fade-in duration-200">
                        <ul className="list-disc pl-5 space-y-1">
                          {incList.map((comp, idx) => (
                            <li key={idx}>{comp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. USP */}
                {uspList && uspList.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <button
                      onClick={() => setOpenAccordion((prev) => (prev === 'usp' ? null : 'usp'))}
                      className="w-full text-left flex justify-between items-center py-2 cursor-pointer group"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#E60000] transition-colors">
                        USP
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                        {openAccordion === 'usp' ? (
                          <ChevronUp className="w-4 h-4 text-gray-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-700" />
                        )}
                      </div>
                    </button>
                    {openAccordion === 'usp' && (
                      <div className="pt-3 text-sm text-gray-600 leading-relaxed space-y-2 animate-in fade-in duration-200">
                        <ul className="list-disc pl-5 space-y-1.5">
                          {uspList.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Dimensions */}
                {dimsText && (
                  <div className="border-b border-gray-200 pb-4">
                    <button
                      onClick={() =>
                        setOpenAccordion((prev) => (prev === 'dimensions' ? null : 'dimensions'))
                      }
                      className="w-full text-left flex justify-between items-center py-2 cursor-pointer group"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#E60000] transition-colors">
                        Dimensions
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                        {openAccordion === 'dimensions' ? (
                          <ChevronUp className="w-4 h-4 text-gray-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-700" />
                        )}
                      </div>
                    </button>
                    {openAccordion === 'dimensions' && (
                      <div className="pt-3 text-sm text-gray-600 leading-relaxed space-y-2 animate-in fade-in duration-200">
                        <p className="bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed font-medium text-gray-800">
                          {dimsText}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Manufacturer */}
                {mfrText && (
                  <div className="border-b border-gray-200 pb-4">
                    <button
                      onClick={() =>
                        setOpenAccordion((prev) => (prev === 'manufacturer' ? null : 'manufacturer'))
                      }
                      className="w-full text-left flex justify-between items-center py-2 cursor-pointer group"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#E60000] transition-colors">
                        Manufacturer
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                        {openAccordion === 'manufacturer' ? (
                          <ChevronUp className="w-4 h-4 text-gray-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-700" />
                        )}
                      </div>
                    </button>
                    {openAccordion === 'manufacturer' && (
                      <div className="pt-3 text-sm text-gray-600 leading-relaxed space-y-1 animate-in fade-in duration-200">
                        <p>
                          <strong>Manufacturer:</strong> {mfrText}
                        </p>
                        <p>
                          <strong>Country of Origin:</strong> India
                        </p>
                        <p>
                          <strong>Customer Support:</strong> support@modenahome.in | +91 93266 41825
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* RECOMMENDED RELATED PRODUCTS GRID */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-inter flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E60000]" />
                  <span>Recommended Related Products</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Explore complementary items from the Modena catalog
                </p>
              </div>
              <span className="text-xs font-bold text-[#E60000] bg-red-50 px-3 py-1 rounded-full border border-red-100">
                POPULAR MATCHES
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {(searchableProducts || apiProducts || [])
                .filter((p) => p.id !== selectedProduct.id)
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectProduct(item)}
                    className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#E60000] transition-all cursor-pointer group shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full aspect-square bg-[#FAF8F6] rounded-xl overflow-hidden mb-3 p-2 border border-[#EFEAE6] flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-[#E60000] transition-colors">
                        {item.name}
                      </h4>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#E60000]">
                        {item.price_html || item.price || `₹${item.numericPrice?.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                        VIEW
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Customer Reviews & Ratings */}
          <div className="pt-8 border-t border-gray-200 space-y-8">
            {(() => {
              const currentReviews = activeProductReviews;
              const reviewCount = currentReviews.length;
              const totalSum = currentReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
              const avgRating = reviewCount > 0 ? parseFloat((totalSum / reviewCount).toFixed(1)) : 0;

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 font-inter flex items-center gap-2">
                        <span>Customer Reviews &amp; Ratings</span>
                        {reviewCount > 0 && (
                          <span className="text-xs font-extrabold bg-[#C91F26] text-white px-2.5 py-0.5 rounded-full">
                            {reviewCount}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        {reviewCount > 0
                          ? `★ ${avgRating.toFixed(1)} average rating across ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'} for this product.`
                          : 'No reviews yet for this product.'}
                      </p>
                    </div>
                  </div>

                  {isReviewsLoading ? (
                    <div className="py-6 text-center text-xs text-gray-400 font-medium animate-pulse">
                      Loading real product reviews...
                    </div>
                  ) : reviewCount > 0 ? (
                    <div className="space-y-4">
                      {currentReviews.map((rev, idx) => (
                        <div
                          key={rev.id || idx}
                          className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.round(Number(rev.rating) || 5)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                      }`}
                                  />
                                ))}
                              </div>
                              <span className="font-extrabold text-xs text-gray-800">
                                {Number(rev.rating || 5).toFixed(1)}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">
                              {rev.formatted_date_created || (rev.date_created ? new Date(rev.date_created).toLocaleDateString('en-IN') : 'Verified Customer')}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                            "{rev.review || rev.comment || rev.text}"
                          </p>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#2A2724]">
                                {rev.reviewer || rev.author || 'Verified Buyer'}
                              </span>
                              {rev.verified && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Verified Purchaser</span>
                                </span>
                              )}
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this review?')) {
                                  await deleteReviewApi(rev.id, selectedProduct.id);
                                  const updated = await fetchProductReviewsFromApi(selectedProduct.id);
                                  setActiveProductReviews(updated);
                                  window.dispatchEvent(new Event('modena_reviews_updated'));
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                              title="Delete review"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center space-y-2">
                      <div className="flex justify-center text-gray-300 gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-gray-300" />
                        ))}
                      </div>
                      <div className="text-xs font-bold text-gray-400">☆☆☆☆☆ 0.0 (0 Reviews)</div>
                      <h4 className="font-extrabold text-base text-[#2A2724]">No reviews yet</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        No reviews yet for this product. Be the first to share your experience below!
                      </p>
                    </div>
                  )}

                  <ReviewForm
                    product={selectedProduct}
                    user={{ displayName: userDisplayName, email: userEmail }}
                    isVerifiedPurchaser={userOrders.some((o) =>
                      (o.items || []).some((i) => i.id === selectedProduct.id)
                    )}
                    onReviewSubmitted={(newReview) => {
                      saveReviewToDb(newReview);
                      window.dispatchEvent(new Event('modena_reviews_updated'));
                    }}
                  />
                </div>
              );
            })()}
          </div>
        </main>
      ) : (
        <>
          {/* 3. HOME VIEW */}
          {currentView === 'home' && (
            <Home
              heroSlides={heroSlides}
              heroIndex={heroIndex}
              activeHeroSlide={activeHeroSlide}
              prevHeroSlide={prevHeroSlide}
              nextHeroSlide={nextHeroSlide}
              bestsellers={bestsellers}
              flashDeals={flashDeals}
              electronicsProducts={electronicsProducts}
              utensilsProducts={utensilsProducts}
              allProducts={apiProducts}
              isProductsLoading={isProductsLoading}
              selectedProduct={selectedProduct}
              setSelectedProduct={handleSelectProduct}
              setProductQuantity={setProductQuantity}
              handleAddToCart={handleAddToCart}
              cart={cart}
              updateQuantity={updateQuantity}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              isWishlisted={isWishlisted}
              bestsellerScrollRef={bestsellerScrollRef}
              dealScrollRef={dealScrollRef}
              electronicsScrollRef={electronicsScrollRef}
              utensilsScrollRef={utensilsScrollRef}
              scrollSideways={scrollSideways}
              setCurrentView={setCurrentView}
              searchQuery={searchQuery}
              onOpenPolicy={(tabId) => {
                setActivePolicyTab(tabId);
                setCurrentView('storePolicies');
              }}
              onSelectRecipe={handleSelectRecipe}
            />
          )}

          {/* 3.5. PRODUCTS & CATEGORY PAGES */}
          {['products', 'bestseller', 'deal', 'electronics', 'utensils', 'mixer', 'grinder', 'mixer-grinder', 'mixer-grinders', 'nutrimix', 'cookware', 'kitchenware'].includes(currentView) && (
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
              <ProductList
                onAddToCart={handleAddToCart}
                onUpdateQuantity={updateQuantity}
                cart={cart}
                onSelectProduct={handleSelectProduct}
                searchQuery=""
                selectedCategoryName={currentView}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
              />
            </div>
          )}

          {/* 3.6. CORPORATE GIFTING PAGE */}
          {(currentView === 'corporate-gifting' || currentView === 'corporateGifting') && (
            <CorporateGifting
              setCurrentView={setCurrentView}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={updateQuantity}
              cart={cart}
            />
          )}

          {/* 3.7. ABOUT US / PHILOSOPHY PAGE */}
          {(currentView === 'philosophy' || currentView === 'about') && (
            <Philosophy setCurrentView={setCurrentView} />
          )}

          {/* 3.8. RECIPES LIST / ARCHIVE PAGE */}
          {currentView === 'recipes' && (
            <RecipesList
              setCurrentView={setCurrentView}
              onSelectRecipe={handleSelectRecipe}
            />
          )}

          {/* 3.9. RECIPE DETAIL PAGE */}
          {currentView === 'recipeDetail' && (
            <RecipeDetail
              recipe={selectedRecipe}
              onBack={() => {
                setCurrentView('recipes');
                window.location.hash = 'recipes';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              setCurrentView={setCurrentView}
              onSelectProduct={handleSelectProduct}
              allProducts={apiProducts}
            />
          )}

          {/* 3.10. STORE & LEGAL POLICIES PAGE */}
          {currentView === 'storePolicies' && (
            <StorePolicies
              activeTab={activePolicyTab}
              setActiveTab={setActivePolicyTab}
              setCurrentView={setCurrentView}
            />
          )}




          {/* ========================================== */}
          {/* 10. YOUR ACCOUNT MAIN DASHBOARD HUB VIEW */}
          {/* ========================================== */}
          {/* ========================================== */}
          {/* 10. YOUR ACCOUNT MAIN DASHBOARD HUB VIEW */}
          {/* ========================================== */}
          {currentView === 'yourAccount' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300 font-inter">
              <div className="mb-8 border-b border-gray-200/80 pb-6">
                <span className="text-xs font-bold text-[#C91F26] uppercase tracking-wider">MODENA ACCOUNT</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292725] tracking-tight mt-1">Your Account</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">Manage your orders, personal security settings, delivery addresses, and store policies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Section 1: Your Orders */}
                <div
                  onClick={() => setCurrentView('yourOrders')}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between hover:border-gray-400 transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 text-[#C91F26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C91F26] group-hover:text-white transition-colors">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#C91F26] transition-colors">Your Orders</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Track, return, or buy things again</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#C91F26] transition-colors flex-shrink-0" />
                </div>

                {/* Section 2: Login & Security */}
                <div
                  onClick={() => setCurrentView('loginSecurity')}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between hover:border-gray-400 transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 text-[#C91F26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C91F26] group-hover:text-white transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#C91F26] transition-colors">Login &amp; Security</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Edit login, name, email, and mobile number</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#C91F26] transition-colors flex-shrink-0" />
                </div>

                {/* Section 3: Your Addresses */}
                <div
                  onClick={() => setCurrentView('yourAddresses')}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between hover:border-gray-400 transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 text-[#C91F26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C91F26] group-hover:text-white transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#C91F26] transition-colors">Your Addresses</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Edit addresses for orders and gifts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#C91F26] transition-colors flex-shrink-0" />
                </div>

                {/* Section 4: Contact Us */}
                <div
                  onClick={() => setCurrentView('contactUs')}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between hover:border-gray-400 transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 text-[#C91F26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C91F26] group-hover:text-white transition-colors">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#C91F26] transition-colors">Contact Us</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Contact customer service via available support methods</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#C91F26] transition-colors flex-shrink-0" />
                </div>

                {/* Section 5: Store & Legal Policies */}
                <div
                  onClick={() => setCurrentView('storePolicies')}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between hover:border-gray-400 transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 text-[#C91F26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C91F26] group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#C91F26] transition-colors">Store &amp; Legal Policies</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Terms, Privacy, Returns, Shipping &amp; Warranty Policy</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#C91F26] transition-colors flex-shrink-0" />
                </div>

                {/* Section 6: MODENA BRAND / Culinary Philosophy */}
                <div
                  onClick={() => setCurrentView('philosophy')}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center justify-between hover:border-gray-400 transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 text-[#C91F26] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C91F26] group-hover:text-white transition-colors">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#C91F26] transition-colors">Culinary Philosophy</h3>
                      <p className="text-xs text-gray-500 mt-0.5">MODENA BRAND — Lifelong Retentivity &amp; Craftsmanship</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#C91F26] transition-colors flex-shrink-0" />
                </div>
              </div>
            </div>
          )}


          {/* STORE POLICIES VIEW */}
          {currentView === 'storePolicies' && (
            <StorePolicies initialTab={activePolicyTab || 'shipping'} onBack={() => setCurrentView('yourAccount')} />
          )}

          {/* ========================================== */}
          {/* 11. YOUR ORDERS VIEW */}
          {/* ========================================== */}
          {currentView === 'yourOrders' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300 font-inter">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#C91F26] cursor-pointer">Your Account</button>
                <span>›</span>
                <span className="text-[#C91F26] font-semibold">Your Orders</span>
              </div>

              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292725] tracking-tight">Your Orders</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Track, return, or buy items again from your recent orders.</p>
              </div>

              {/* Tabs: Orders | Buy Again | Returns */}
              <div className="border-b border-gray-200/80 flex gap-8 text-xs sm:text-sm font-semibold mb-6">
                <button
                  onClick={() => setOrdersTab('orders')}
                  className={`pb-3 transition-colors cursor-pointer border-b-2 font-bold ${ordersTab === 'orders' ? 'text-[#C91F26] border-[#C91F26]' : 'text-gray-500 border-transparent hover:text-gray-900'
                    }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setOrdersTab('buyAgain')}
                  className={`py-3 transition-colors cursor-pointer border-b-2 font-bold ${ordersTab === 'buyAgain' ? 'text-[#E60000] border-[#E60000]' : 'text-gray-500 border-transparent hover:text-black'
                    }`}
                >
                  Buy Again
                </button>
                <button
                  onClick={() => setOrdersTab('returns')}
                  className={`py-3 transition-colors cursor-pointer border-b-2 font-bold ${ordersTab === 'returns' ? 'text-[#E60000] border-[#E60000]' : 'text-gray-500 border-transparent hover:text-black'
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
                          className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000]"
                        />
                      </div>
                      <button className="bg-[#2A2724] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer hover:bg-black transition-colors whitespace-nowrap">
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
                        <div className="w-16 h-16 rounded-full bg-red-50 text-[#E60000] flex items-center justify-center mx-auto shadow-inner">
                          <Package className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 font-inter">No orders found</h3>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                          You haven't placed any orders yet. Explore our premium kitchenware collection and place your first order today!
                        </p>
                        <button
                          onClick={() => setCurrentView('utensils')}
                          className="bg-[#E60000] hover:bg-[#E60000] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
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
                                className="bg-[#E60000] hover:bg-[#E60000] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
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
                              <span className="text-[10px] text-emerald-600 font-normal bg-emerald-100 px-2 py-1 rounded-full">
                                Cancellation allowed within 2 hours or before dispatch
                              </span>
                            </div>

                            {ord.items?.map((item) => (
                              <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-100 first:border-0">
                                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleSelectProduct({ id: item.id, name: item.name, price: item.price, price_html: item.price_html || `₹${item.price}`, image: item.image })}>
                                  <img src={item.image} alt={item.name} className="w-20 h-20 object-contain bg-gray-50 p-1 rounded-xl border border-gray-200 transition-transform group-hover:scale-105" />
                                  <div>
                                    <h4 className="font-bold text-sm text-[#E60000] group-hover:underline">{item.name}</h4>
                                    <span className="text-xs text-gray-500 block mb-1">Qty: {item.quantity || 1} • {item.price_html || `₹${item.price}`}</span>
                                    <div className="flex items-center gap-3">
                                      <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} className="bg-[#E60000] hover:bg-[#E60000] text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer">
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
                      <div className="w-16 h-16 rounded-full bg-red-50 text-[#E60000] flex items-center justify-center mx-auto shadow-inner">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 font-inter">No previous items</h3>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                        Items you purchase will appear here for quick 1-click reordering!
                      </p>
                      <button
                        onClick={() => setCurrentView('utensils')}
                        className="bg-[#E60000] hover:bg-[#E60000] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
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
                          <div className="group cursor-pointer" onClick={() => handleSelectProduct({ id: item.id, name: item.name, price: item.price, price_html: item.price_html || `₹${item.price}`, image: item.image })}>
                            <div className="w-full h-44 bg-gray-50 rounded-xl overflow-hidden mb-4 p-3 flex items-center justify-center border border-gray-100 group-hover:border-[#E60000]/30 transition-colors">
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">{item.lastBought}</span>
                            <h4 className="font-bold text-sm text-gray-900 capitalize mb-1 group-hover:text-[#E60000] transition-colors">{item.name}</h4>
                            <span className="text-sm font-extrabold text-[#E60000] block mb-4">{item.price_html || `₹${item.price}`}</span>
                          </div>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="w-full bg-[#E60000] hover:bg-[#E60000] text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
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
                      returnEligibleUntil: '7-Day Return Window Open'
                    });
                  });
                });

                if (returnList.length === 0) {
                  return (
                    <div className="py-16 px-4 text-center bg-white rounded-3xl border border-gray-200 shadow-sm space-y-4 max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-full bg-red-50 text-[#E60000] flex items-center justify-center mx-auto shadow-inner">
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
                            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleSelectProduct({ id: 31, name: ret.itemName, price: 1450, price_html: ret.price, image: ret.image })}>
                              <img src={ret.image} alt={ret.itemName} className="w-16 h-16 object-contain bg-gray-50 p-1 rounded-xl border border-gray-200 transition-transform group-hover:scale-105" />
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#E60000] transition-colors">{ret.itemName}</h4>
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
                                  className="bg-[#E60000] hover:bg-[#E60000] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300 font-inter">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#C91F26] cursor-pointer">Your Account</button>
                <span>›</span>
                <span className="text-[#C91F26] font-semibold">Login &amp; Security</span>
              </div>

              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292725] tracking-tight">Login &amp; Security</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Edit login, name, email, and mobile number.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 overflow-hidden shadow-xs text-xs sm:text-sm">
                {/* Item 1: Name */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block mb-0.5">Name</span>
                    {editingField === 'name' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={fieldEditValue}
                          onChange={(e) => setFieldEditValue(e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-[#C91F26]"
                        />
                        <button
                          onClick={() => {
                            if (fieldEditValue.trim()) {
                              setUserDisplayName(fieldEditValue.trim());
                              localStorage.setItem('user_display_name', fieldEditValue.trim());
                            }
                            setEditingField(null);
                          }}
                          className="bg-[#C91F26] text-white text-xs px-3.5 py-1.5 rounded-xl font-bold hover:bg-[#A8181E] transition-colors"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingField(null)} className="text-xs text-gray-500 hover:text-gray-900">Cancel</button>
                      </div>
                    ) : (
                      <span className="text-gray-600">{userDisplayName || 'Mohnish Niranjhan'}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingField('name');
                      setFieldEditValue(userDisplayName || 'Mohnish Niranjhan');
                    }}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                </div>

                {/* Item 2: E-mail */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block mb-0.5">E-mail</span>
                    {editingField === 'email' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="email"
                          value={fieldEditValue}
                          onChange={(e) => setFieldEditValue(e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-[#C91F26]"
                        />
                        <button
                          onClick={() => {
                            if (fieldEditValue.trim()) {
                              setUserEmail(fieldEditValue.trim());
                              localStorage.setItem('user_email', fieldEditValue.trim());
                            }
                            setEditingField(null);
                          }}
                          className="bg-[#C91F26] text-white text-xs px-3.5 py-1.5 rounded-xl font-bold hover:bg-[#A8181E] transition-colors"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingField(null)} className="text-xs text-gray-500 hover:text-gray-900">Cancel</button>
                      </div>
                    ) : (
                      <span className="text-gray-600">{userEmail || 'mohnishniranjhan@gmail.com'}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingField('email');
                      setFieldEditValue(userEmail || 'mohnishniranjhan@gmail.com');
                    }}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                </div>

                {/* Item 3: Primary mobile number */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block mb-0.5">Primary Mobile Number</span>
                    {editingField === 'phone' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={fieldEditValue}
                          onChange={(e) => setFieldEditValue(e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-[#C91F26]"
                        />
                        <button
                          onClick={() => {
                            if (fieldEditValue.trim()) {
                              setUserPhone(fieldEditValue.trim());
                              localStorage.setItem('user_phone', fieldEditValue.trim());
                            }
                            setEditingField(null);
                          }}
                          className="bg-[#C91F26] text-white text-xs px-3.5 py-1.5 rounded-xl font-bold hover:bg-[#A8181E] transition-colors"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingField(null)} className="text-xs text-gray-500 hover:text-gray-900">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-600 block">{userPhone}</span>
                        <span className="text-xs text-gray-400 block mt-0.5">Sign in, password recovery, and security notifications.</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingField('phone');
                      setFieldEditValue(userPhone);
                    }}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                </div>

                {/* Item 4: Password */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block mb-0.5">Password</span>
                    <span className="text-gray-600 block">••••••••</span>
                  </div>
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-800 px-5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                </div>

                {/* Item 5: 2-step verification */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block mb-0.5">2-Step Verification</span>
                    <span className="text-xs text-gray-500 block">Add an extra layer of security to your account.</span>
                  </div>
                  <button
                    onClick={() => setIsTwoStepEnabled(!isTwoStepEnabled)}
                    className={`border px-5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isTwoStepEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'border-gray-300 hover:bg-gray-50 text-gray-800'
                      }`}
                  >
                    {isTwoStepEnabled ? 'Enabled' : 'Turn On'}
                  </button>
                </div>

                {/* Item 6: Delete account */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-50/30">
                  <div className="flex-1">
                    <span className="font-bold text-red-900 block mb-0.5">Delete Account</span>
                    <span className="text-xs text-red-600/80 block">Permanently close your Modena account and remove account data.</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
                        handleLogout();
                        setCurrentView('home');
                        alert('Your account has been successfully deleted.');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300 font-inter">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#C91F26] cursor-pointer">Your Account</button>
                <span>›</span>
                <span className="text-[#C91F26] font-semibold">Your Addresses</span>
              </div>

              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292725] tracking-tight">Your Addresses</h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Edit addresses for orders and gifts.</p>
                </div>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="bg-[#C91F26] hover:bg-[#A8181E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD ADDRESS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {/* Address Cards */}
                {userAddresses.map((addr, idx) => (
                  <div key={addr.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between shadow-xs relative min-h-[220px]">
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-[#C91F26] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full w-fit mb-2">
                        DEFAULT ADDRESS
                      </span>
                    )}
                    <div className="space-y-1 text-xs text-gray-700 leading-relaxed">
                      <h4 className="font-bold text-sm text-gray-900">{addr.name}</h4>
                      <p>{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p className="uppercase">{addr.city}, {addr.state} {addr.postcode}</p>
                      <p className="text-gray-500 pt-1">Phone: {addr.phone}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-3 text-xs font-semibold text-[#C91F26]">
                      <button onClick={() => {
                        setAddressFormData(addr);
                        setIsAddressModalOpen(true);
                      }} className="hover:underline cursor-pointer">Edit</button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => {
                          setUserAddresses((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="hover:underline cursor-pointer text-gray-500 hover:text-red-600"
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-300 font-inter">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <button onClick={() => setCurrentView('yourAccount')} className="hover:text-[#C91F26] cursor-pointer">Your Account</button>
                <span>›</span>
                <span className="text-[#C91F26] font-semibold">Contact Us</span>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292725] tracking-tight">Contact Us</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">Contact customer service via the available support methods or send us a message below.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column: Direct Support Channels */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 text-xs text-gray-700">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 mb-1">Customer Support</h3>
                      <p className="text-gray-500 leading-relaxed">Operated by <strong>Kimatsu India Pvt. Ltd.</strong></p>
                      <p className="text-gray-500">Mon–Sat, 10:00 AM – 6:00 PM IST</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 space-y-3 font-medium">
                      <div>
                        <span className="text-gray-400 block text-[10px] font-bold uppercase">Customer Care &amp; WhatsApp</span>
                        <a href="whatsapp://send?phone=919326641825" onClick={(e) => openWhatsAppDirect('919326641825', '', e)} className="text-[#C91F26] hover:underline font-bold text-sm">+91 93266 41825</a>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px] font-bold uppercase">Support Email</span>
                        <a href="mailto:support@modenahome.in" className="text-[#C91F26] hover:underline font-bold">support@modenahome.in</a>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-gray-400 block text-[10px] font-bold uppercase mb-0.5">Registered Office</span>
                        <p className="text-gray-600 leading-relaxed">201–202 Tirupati Udyog, I.B. Patel Road, Goregaon East, Mumbai – 400063</p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-500">
                        <span>GSTIN:</span>
                        <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">27AAFCK9795E1ZZ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Contact Message Form */}
                <div className="md:col-span-7">
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-xs">
                    <h3 className="font-bold text-base text-gray-900 mb-4">Send Us a Message</h3>

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
                        <label className="block font-bold text-gray-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Mohnish Niranjhan"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#C91F26]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="mohnishniranjhan@gmail.com"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#C91F26]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          value={contactForm.subject}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                          placeholder="Order status / Product inquiry"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#C91F26]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Message</label>
                        <textarea
                          rows={4}
                          required
                          value={contactForm.message}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                          placeholder="How can we help you today?"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#C91F26]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#C91F26] hover:bg-[#A8181E] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
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
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#2A2724]">
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
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E60000]"
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
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E60000]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Jayalakshmi nagar, puzhuthivakkam"
                      value={addressFormData.line2}
                      onChange={(e) => setAddressFormData((p) => ({ ...p, line2: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E60000]"
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
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E60000]"
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
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E60000]"
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
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E60000]"
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
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E60000]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#E60000] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider mt-2 cursor-pointer shadow-md hover:bg-[#E60000]"
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
              <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#2A2724]">
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
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E60000]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordFormData.new}
                      onChange={(e) => setPasswordFormData(p => ({ ...p, new: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E60000]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Re-enter New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordFormData.confirm}
                      onChange={(e) => setPasswordFormData(p => ({ ...p, confirm: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E60000]"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#E60000] hover:bg-[#E60000] text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 cursor-pointer">
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* 9. SEARCH RESULTS PAGE VIEW */}
          {currentView === 'searchResults' && (
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
              <ProductList
                onAddToCart={handleAddToCart}
                onUpdateQuantity={updateQuantity}
                cart={cart}
                onSelectProduct={handleSelectProduct}
                searchQuery={submittedQuery}
                selectedCategoryName="searchResults"
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
              />
            </div>
          )}
        </>
      )}

      {/* 10. MINI CART QUICK DRAWER */}
          {isCartOpen && (
            <>
              <div
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-[#2A2724]/60 backdrop-blur-md z-40 transition-opacity duration-300"
                aria-hidden="true"
              />

              <div className="fixed inset-y-0 right-0 w-full sm:max-w-md md:w-[440px] bg-[#FAF8F6] shadow-[0_0_40px_rgba(0,0,0,0.2)] z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
                {/* Drawer Header */}
                <div className="bg-[#2A2724] text-white flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-[#2A2724]">
                  <h2 className="font-headline-md text-lg sm:text-xl tracking-tight font-extrabold flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-[#E60000]" />
                    <span>Your Cart ({totalItemCount})</span>
                  </h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close cart drawer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Cart Drawer Items */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                      <ShoppingBag className="w-16 h-16 text-[#E2DCD7] mb-4 stroke-1" />
                      <h3 className="font-headline-md text-lg font-bold text-[#2A2724]">Your cart is empty</h3>
                      <p className="font-body-md text-xs text-[#514C48] mt-1.5 max-w-xs leading-relaxed">
                        Add premium Modena kitchenware from our collection to populate your cart.
                      </p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="mt-6 bg-[#E60000] hover:bg-[#E60000] text-white py-3 px-6 rounded-xl text-xs font-bold tracking-wider cursor-pointer shadow-md transition-all"
                      >
                        BROWSE PRODUCTS
                      </button>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 sm:gap-4 bg-white border border-[#EFEAE6] rounded-2xl p-3.5 sm:p-4 items-start shadow-xs hover:border-[#E60000]/30 transition-all"
                      >
                        {/* Item Image */}
                        <div className="w-20 h-20 sm:w-22 sm:h-22 bg-[#FAF8F6]/60 rounded-xl flex-shrink-0 overflow-hidden relative border border-[#FAF8F6] p-1.5 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="object-contain w-full h-full rounded"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 min-h-[80px]">
                          <div>
                            <h3 className="font-headline-md text-xs sm:text-sm text-[#2A2724] font-bold tracking-tight leading-snug line-clamp-2 mb-1">
                              {item.name}
                            </h3>
                            <div
                              className="font-body-md text-xs font-extrabold text-[#E60000]"
                              dangerouslySetInnerHTML={{
                                __html: item.price_html || `${currencySymbol}${item.price.toFixed(2)}`
                              }}
                            />
                          </div>

                          {/* Quantity & Trash Control Bar */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                            {/* Quantity Buttons */}
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-[#E60000] transition-colors cursor-pointer active:scale-95"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                              <span className="w-7 text-center font-body-md text-xs font-extrabold text-[#2A2724]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-[#E60000] transition-colors cursor-pointer active:scale-95"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-[#E60000] p-1.5 hover:bg-red-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">REMOVE</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Drawer Footer */}
                {cart.length > 0 && (
                  <div className="p-4 sm:p-6 bg-white border-t border-[#EFEAE6] flex flex-col gap-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    {/* Coupon Code Input Form */}
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon (MODENA10, WELCOME500)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#E60000] focus:bg-white uppercase font-mono font-bold text-[#2A2724] placeholder:normal-case placeholder:font-sans placeholder:text-gray-400"
                      />
                      <button
                        type="submit"
                        className="bg-[#2A2724] hover:bg-black text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
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
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {appliedDiscount && (
                        <div className="flex justify-between text-xs text-emerald-700 font-bold">
                          <span>Discount ({appliedDiscount.code})</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-end text-[#2A2724] pt-1">
                        <span className="font-bold text-sm text-[#2A2724]">Total Amount</span>
                        <span className="font-headline-md text-2xl leading-none font-extrabold text-[#E60000]">
                          ₹{finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        triggerCheckoutFlow();
                      }}
                      className="w-full bg-[#E60000] hover:bg-[#E60000] active:scale-[0.99] text-white py-3.5 px-6 rounded-xl font-extrabold text-sm shadow-lg shadow-red-900/20 transition-all duration-200 tracking-wide text-center cursor-pointer flex items-center justify-center gap-2"
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
                onClick={() => {
                  setBuyNowItem(null);
                  setActiveModal(null);
                }}
                className="fixed inset-0 bg-[#2A2724]/70 backdrop-blur-md transition-opacity duration-300"
                aria-hidden="true"
              />

              {/* Big Individual Popup Dialog Box */}
              <div className="relative w-full max-w-4xl bg-[#FAF8F6] rounded-2xl shadow-2xl overflow-hidden border border-[#EFEAE6] z-50 my-auto flex flex-col lg:flex-row max-h-[90vh]">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setBuyNowItem(null);
                    setActiveModal(null);
                  }}
                  className="absolute top-4 right-4 z-20 bg-[#2A2724] text-white p-2 rounded-full hover:bg-black transition-colors"
                  aria-label="Close checkout modal"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Left Side: Billing & Address Form */}
                <div className="lg:w-7/12 p-6 sm:p-8 overflow-y-auto space-y-6">
                  <div>
                    <h2 className="font-display-lg text-2xl sm:text-3xl text-[#2A2724]">
                      Billing Details &amp; Address
                    </h2>
                    <p className="font-body-md text-xs text-[#514C48] mt-1">
                      Please enter your contact and shipping information to complete your order.
                    </p>
                  </div>

                  {placedOrder ? (
                    /* Order Confirmation Screen inside Big Popup */
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <span className="font-label-caps text-[#E60000] text-xs font-bold tracking-wider">ORDER CONFIRMED</span>
                      <h3 className="font-display-lg text-2xl text-[#2A2724]">
                        Thank You, {placedOrder.customer.firstName}!
                      </h3>
                      <p className="font-body-md text-xs text-[#514C48] max-w-md mx-auto">
                        Order <span className="font-semibold text-[#2A2724]">#{placedOrder.orderNumber}</span> has been successfully placed in WooCommerce. Confirmation sent to <span className="font-medium text-[#2A2724]">{placedOrder.customer.email}</span>.
                      </p>
                      <div className="bg-[#FAF8F6] p-4 rounded-lg border border-[#E2DCD7] text-left text-xs space-y-2.5 max-w-md mx-auto">
                        <div className="flex justify-between border-b border-[#E2DCD7] pb-2">
                          <span className="text-[#514C48]">Order Number:</span>
                          <span className="font-bold text-[#2A2724]">#{placedOrder.orderNumber}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E2DCD7] pb-2">
                          <span className="text-[#514C48]">Order Status:</span>
                          <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[11px]">
                            {placedOrder.statusLabel || placedOrder.status || 'Processing'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[#E2DCD7] pb-2">
                          <span className="text-[#514C48]">Total Amount:</span>
                          <span className="font-bold text-[#2A2724]">{activeCurrencySymbol}{typeof placedOrder.total === 'number' ? placedOrder.total.toFixed(2) : placedOrder.total}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E2DCD7] pb-2">
                          <span className="text-[#514C48]">Payment Method:</span>
                          <span className="uppercase text-[#2A2724] font-semibold">{placedOrder.paymentMethodTitle || placedOrder.paymentMethod}</span>
                        </div>
                        {placedOrder.instructions && (
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px] leading-relaxed">
                            <strong>Instructions:</strong> {placedOrder.instructions}
                          </div>
                        )}
                        <div className="flex justify-between pt-1">
                          <span className="text-[#514C48]">Delivery To:</span>
                          <span className="text-[#2A2724] font-medium text-right max-w-[220px]">
                            {placedOrder.customer.address}, {placedOrder.customer.city}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPlacedOrder(null);
                          setBuyNowItem(null);
                          setActiveModal(null);
                        }}
                        className="mt-4 bg-[#2A2724] text-white py-3 px-8 rounded text-xs font-label-caps tracking-widest hover:bg-black transition-colors cursor-pointer"
                      >
                        CONTINUE SHOPPING
                      </button>
                    </div>
                  ) : (
                    /* Billing & Address Inputs Form */
                    <form onSubmit={handlePlaceOrder} className="space-y-6">
                      {/* 1. Contact Info */}
                      <div className="space-y-3">
                        <h3 className="font-headline-md text-sm text-[#2A2724] font-bold flex items-center gap-2">
                          <User className="w-4 h-4 text-[#E60000]" />
                          <span>1. Customer &amp; Billing Contact</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleFormChange}
                              required
                              className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleFormChange}
                              required
                              className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">Email Address</label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleFormChange}
                              required
                              className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">Phone Number</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleFormChange}
                              required
                              className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Shipping Address */}
                      <div className="space-y-3 pt-3 border-t border-[#FAF8F6]">
                        <h3 className="font-headline-md text-sm text-[#2A2724] font-bold flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#E60000]" />
                          <span>2. Shipping Address</span>
                        </h3>
                        <div>
                          <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">Street Address</label>
                          <input
                            type="text"
                            name="address"
                            placeholder="House No., Building Name, Street"
                            value={formData.address}
                            onChange={handleFormChange}
                            required
                            className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">City</label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleFormChange}
                              required
                              className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">State</label>
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleFormChange}
                              required
                              className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-label-caps text-[#514C48] block mb-1">Pincode</label>
                            <input
                              type="text"
                              name="postcode"
                              value={formData.postcode}
                              onChange={handleFormChange}
                              required
                              className="w-full p-3 text-xs bg-white border border-[#EFEAE6] rounded-md focus:outline-none focus:border-[#E60000]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. WooCommerce Native Payment Gateways */}
                      <div className="space-y-3 pt-3 border-t border-[#FAF8F6]">
                        <h3 className="font-headline-md text-sm text-[#2A2724] font-bold flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#E60000]" />
                            <span>3. Select Payment Method</span>
                          </div>
                          {isFetchingGateways && (
                            <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Loading gateways...
                            </span>
                          )}
                        </h3>

                        {orderError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span>{orderError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {wcPaymentGateways.map((pm) => {
                            const IconComp = getGatewayIcon(pm.id);
                            const isSelected = paymentMethod === pm.id;
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => {
                                  setPaymentMethod(pm.id);
                                  setOrderError('');
                                }}
                                className={`p-3 rounded-md border text-left flex items-start gap-2.5 text-xs transition-all ${
                                  isSelected
                                    ? 'border-[#E60000] bg-[#FAF8F6] text-[#2A2724] font-semibold ring-1 ring-[#E60000] shadow-sm'
                                    : 'border-[#EFEAE6] bg-white text-[#514C48] hover:border-gray-300'
                                }`}
                              >
                                <IconComp className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? 'text-[#E60000]' : 'text-gray-400'}`} />
                                <div className="truncate flex-1">
                                  <span className="block truncate font-medium">{pm.title}</span>
                                  {pm.description && (
                                    <span className="block text-[10px] text-gray-400 line-clamp-1 font-normal mt-0.5">
                                      {pm.description}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Gateway Info Note */}
                        {(() => {
                          const selectedGw = wcPaymentGateways.find((g) => g.id === paymentMethod);
                          if (selectedGw && selectedGw.description) {
                            return (
                              <div className="p-2.5 bg-[#FAF8F6] border border-[#EFEAE6] rounded text-[11px] text-[#514C48] flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span>{selectedGw.description}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingOrder || !activeCheckoutItems || activeCheckoutItems.length === 0}
                        className="w-full bg-[#E60000] hover:bg-[#c91f26] text-white py-4 px-6 rounded-md font-headline-md text-base shadow-lg transition-all tracking-wide text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        {isSubmittingOrder ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                            <span>Processing Order with WooCommerce...</span>
                          </>
                        ) : (
                          <span>
                            Confirm &amp; Place Order ({activeCurrencySymbol}{finalTotal.toFixed(2)})
                          </span>
                        )}
                      </button>
                    </form>

                  )}
                </div>

                {/* Right Side: Order Summary Column */}
                <div className="lg:w-5/12 bg-[#2A2724] text-white p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
                  <div>
                    <h3 className="font-headline-md text-lg text-white border-b border-[#333] pb-4 mb-4 flex items-center justify-between">
                      <span>Order Summary</span>
                      <span className="text-xs font-label-caps text-[#EFEAE6]">
                        {buyNowItem ? '1 Buy Now Item' : `${cart.length} Items`}
                      </span>
                    </h3>

                    {activeCheckoutItems.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No items in checkout.</p>
                    ) : (
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                        {activeCheckoutItems.map((item) => (
                          <div key={item.id} className="flex gap-3 items-center justify-between text-xs">
                            <div className="flex items-center gap-3 truncate">
                              <img src={item.image} alt={item.name} className="w-10 h-10 object-contain bg-white rounded p-1 flex-shrink-0" />
                              <div className="truncate">
                                <span className="block text-white font-medium truncate">{item.name}</span>
                                {item.variation && (
                                  <span className="block text-[10px] text-gray-400 truncate">
                                    Option: {item.variation.name || item.variation.attributes}
                                  </span>
                                )}
                                <span className="text-gray-400">Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <span className="font-semibold text-white flex-shrink-0">
                              {activeCurrencySymbol}{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-[#333] space-y-3 mt-6">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Subtotal</span>
                      <span>{activeCurrencySymbol}{activeSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Shipping</span>
                      <span className="text-emerald-400 font-medium">
                        {shippingFee === 0 ? 'FREE' : `${activeCurrencySymbol}${shippingFee}`}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400">
                        <span>Discount</span>
                        <span>-{activeCurrencySymbol}{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-headline-md font-bold text-white pt-2 border-t border-[#333]">
                      <span>Total Amount</span>
                      <span className="text-[#EFEAE6]">{activeCurrencySymbol}{finalTotal.toFixed(2)}</span>
                    </div>
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
                    <span className="text-xs font-bold uppercase tracking-wider bg-[#E60000] px-3 py-1 rounded-full">
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
                      className="bg-[#E60000] hover:bg-red-700 text-white p-2 rounded-full transition-colors cursor-pointer ml-2 shadow-lg"
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
                            className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer bg-black/40 flex-shrink-0 ${isCurrent ? 'border-[#E60000] ring-2 ring-red-500 scale-105' : 'border-white/20 opacity-50 hover:opacity-100'
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
              <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2A2724]/70 backdrop-blur-md" />
              <div className="relative w-full max-w-3xl bg-[#FAF8F6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#EFEAE6] z-50 my-auto max-h-[85vh] overflow-y-auto">
                <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#2A2724] text-white p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-display-lg text-3xl text-[#2A2724] mb-4">Modena Engineering &amp; Heritage</h2>
                <p className="font-body-lg text-sm text-[#514C48] leading-relaxed mb-6">
                  Our products bring together heavy industrial cast iron, 5-ply 18/10 stainless steel, and high-performance motors to deliver lifelong durability with elegant domestic warmth.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#FAF8F6] p-4 rounded-lg border border-[#E2DCD7]">
                    <Flame className="w-6 h-6 text-[#E60000] mb-2" />
                    <h4 className="font-headline-md text-base text-[#2A2724] font-bold">Thermal Mass Engineering</h4>
                    <p className="font-body-md text-xs text-[#514C48] mt-1">Zero hot spots and maximum heat retention for perfect cooking results.</p>
                  </div>
                  <div className="bg-[#FAF8F6] p-4 rounded-lg border border-[#E2DCD7]">
                    <ShieldCheck className="w-6 h-6 text-[#E60000] mb-2" />
                    <h4 className="font-headline-md text-base text-[#2A2724] font-bold">Food-Grade Steel</h4>
                    <p className="font-body-md text-xs text-[#514C48] mt-1">Zero chemical coating — no plastic or Teflon coating where food particles touch.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: MIXER GRINDERS */}
          {activeModal === 'mixerGrinders' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2A2724]/70 backdrop-blur-md" />
              <div className="relative w-full max-w-3xl bg-[#FAF8F6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#EFEAE6] z-50 my-auto max-h-[85vh] overflow-y-auto">
                <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#2A2724] text-white p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-display-lg text-3xl text-[#2A2724] mb-4">Modena Sindoor 990W Mixer Grinder Specs</h2>
                <div className="bg-white p-4 rounded-lg border border-[#EFEAE6] space-y-3 text-xs mb-6">
                  <div className="flex justify-between border-b border-[#FAF8F6] pb-2">
                    <span className="font-semibold text-[#2A2724]">Motor Capacity:</span>
                    <span className="text-[#514C48]">990 Watts (100% Copper Winding)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAF8F6] pb-2">
                    <span className="font-semibold text-[#2A2724]">Jars Included:</span>
                    <span className="text-[#514C48]">2 Stainless Steel Jars (Wet &amp; Dry Grinding)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAF8F6] pb-2">
                    <span className="font-semibold text-[#2A2724]">Overload Protection:</span>
                    <span className="text-[#514C48]">Automatic Thermal Circuit Breaker</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#2A2724]">Warranty:</span>
                    <span className="text-[#E60000] font-bold">5 Years Motor Warranty</span>
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
                  className="bg-[#E60000] text-white py-3 px-6 rounded text-xs font-label-caps"
                >
                  ADD TO CART NOW (₹2,500.00)
                </button>
              </div>
            </div>
          )}

          {/* MODAL 3: REVIEWS */}
          {activeModal === 'reviews' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2A2724]/70 backdrop-blur-md" />
              <div className="relative w-full max-w-3xl bg-[#FAF8F6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#EFEAE6] z-50 my-auto max-h-[85vh] overflow-y-auto">
                <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#2A2724] text-white p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-display-lg text-3xl text-[#2A2724] mb-4">Customer Ratings &amp; Feedback</h2>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-[#EFEAE6]">
                    <div className="flex text-amber-400 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                    </div>
                    <h4 className="font-headline-md text-sm text-[#2A2724] font-bold">Unbeatable Performance</h4>
                    <p className="font-body-md text-xs text-[#514C48] mt-1">"Grinds idli batter and hard spices smoothly in seconds without overheating."</p>
                    <span className="text-[10px] text-[#8A827C] block mt-2">— Verified Buyer, Bengaluru</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 4: CARE GUIDE & WARRANTY */}
          {(activeModal === 'careGuide' || activeModal === 'warranty') && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <div onClick={() => setActiveModal(null)} className="fixed inset-0 bg-[#2A2724]/70 backdrop-blur-md" />
              <div className="relative w-full max-w-3xl bg-[#FAF8F6] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#EFEAE6] z-50 my-auto max-h-[85vh] overflow-y-auto">
                <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-[#2A2724] text-white p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-display-lg text-3xl text-[#2A2724] mb-4">Product Care &amp; Warranty Support</h2>
                <p className="font-body-md text-xs text-[#514C48] mb-4">
                  All Modena appliances and cookware are covered by our heritage service guarantee. Clean with warm soapy water and wipe dry after use.
                </p>
                <button onClick={() => setActiveModal(null)} className="bg-[#2A2724] text-white py-2.5 px-6 rounded text-xs font-label-caps">
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
                className="fixed inset-0 bg-[#2A2724]/70 backdrop-blur-md transition-opacity"
              />
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200 z-50 my-auto text-[#2A2724] overflow-hidden">
                <button
                  onClick={() => setActiveModal(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Profile Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-[#E60000] text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-red-50 flex-shrink-0">
                    {getFirstName(userDisplayName).charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold tracking-widest bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full uppercase border border-amber-200">
                        VIP Member
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#2A2724] truncate">
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
                          className="text-[#E60000] font-bold hover:underline block pt-1"
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
                    className="w-full bg-[#2A2724] hover:bg-[#2A2724] text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View Cart &amp; Checkout</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full bg-red-50 hover:bg-red-100 text-[#E60000] py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border border-red-200 flex items-center justify-center gap-2 cursor-pointer"
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

          {/* 11. LUXURY LIGHT END-TO-END FOOTER */}
          <footer id="site-footer" className="bg-[#E5E1DA] text-[#292725] pt-16 pb-28 sm:pb-32 border-t border-[#D8D4CD] w-full font-inter physics-container">
            <div className="w-full px-4 sm:px-8 lg:px-12 space-y-12">

              {/* Top Row: Full-Width Newsletter & Exclusive VIP Club Card */}
              <div className="bg-[#F8F7F4] border border-[#D8D4CD] p-8 sm:p-10 rounded-3xl shadow-xs flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="space-y-2 text-center lg:text-left max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-[#C91F26] text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>JOIN OUR CLUB</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#292725] tracking-tight">
                    Get Offers, New Products &amp; Tips
                  </h3>
                  <p className="text-xs sm:text-sm text-[#716D67] leading-relaxed font-medium">
                    Subscribe for special offers, recipes, and helpful product guides.
                  </p>
                </div>

                <div className="w-full lg:w-auto min-w-[320px] sm:min-w-[420px]">
                  <div className="flex gap-2 bg-[#F3F1ED] p-2 rounded-2xl border border-[#D8D4CD] shadow-xs focus-within:border-[#C91F26] transition-colors">
                    <input
                      id="newsletter-email-input"
                      name="newsletter_email"
                      type="email"
                      placeholder="Enter your email address..."
                      className="bg-transparent px-4 py-3 text-xs sm:text-sm text-[#292725] placeholder-[#716D67] flex-1 focus:outline-none font-medium"
                    />
                    <button
                      onClick={() => setNewsletterSubscribed(true)}
                      className="bg-[#C91F26] hover:bg-[#A9181E] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      SUBSCRIBE
                    </button>
                  </div>
                  {newsletterSubscribed && (
                    <span className="text-xs text-emerald-700 block font-bold mt-2 text-center lg:text-left">
                      ✓ Welcome! You have been successfully subscribed to Modena Culinary Club.
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: 5 Well-Balanced End-to-End Columns Grid */}
              <div className="grid grid-cols-1 @[600px]:grid-cols-2 @[900px]:grid-cols-3 @[1200px]:grid-cols-5 gap-8 @[900px]:gap-10 border-b border-gray-200/80 pb-12 text-xs">

                {/* Col 1: Brand & Excellence Badges */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <img
                      src={logoBlackRed}
                      alt="Modena Logo"
                      className="h-10 w-auto object-contain"
                    />
                    <p className="text-gray-600 leading-relaxed text-xs font-medium">
                      Crafted for Everyday Living
                    </p>
                  </div>

                  {/* Social Media Icons Row */}
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href="https://www.facebook.com/share/1JP7Qqovtv/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-full bg-gray-100 hover:bg-[#E60000] text-gray-700 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-110 active:scale-95 cursor-pointer"
                      title="Facebook"
                      aria-label="Facebook"
                    >
                      <FacebookIcon className="w-4 h-4 fill-current" />
                    </a>
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-full bg-gray-100 hover:bg-[#E60000] text-gray-700 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-110 active:scale-95 cursor-pointer"
                      title="Instagram"
                      aria-label="Instagram"
                    >
                      <InstagramIcon className="w-4 h-4 fill-current" />
                    </a>
                    <a
                      href="https://www.youtube.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-full bg-gray-100 hover:bg-[#E60000] text-gray-700 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-110 active:scale-95 cursor-pointer"
                      title="YouTube"
                      aria-label="YouTube"
                    >
                      <YoutubeIcon className="w-4 h-4 fill-current" />
                    </a>
                    <a
                      href="https://x.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-full bg-gray-100 hover:bg-[#E60000] text-gray-700 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-110 active:scale-95 cursor-pointer"
                      title="X / Twitter"
                      aria-label="X / Twitter"
                    >
                      <TwitterXIcon className="w-4 h-4 fill-current" />
                    </a>
                  </div>
                </div>

                {/* Col 2: Quick Navigation */}
                <div className="space-y-3">
                  <ul className="space-y-2.5 text-gray-600 font-medium">
                    <li><button onClick={() => handleNavigate('home')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Home</button></li>
                    {dynamicCategories.map(cat => (
                      <li key={cat.id}><button onClick={() => handleNavigate(cat.id)} className="hover:text-[#C91F26] transition-colors cursor-pointer capitalize">{cat.label.toLowerCase()}</button></li>
                    ))}
                    <li><button onClick={() => handleNavigate('corporate-gifting')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Corporate Gifting</button></li>
                  </ul>
                </div>

                {/* Col 3: Customer Account */}
                <div className="space-y-3">
                  <ul className="space-y-2.5 text-gray-600 font-medium">
                    <li><button onClick={() => userDisplayName ? setCurrentView('yourAccount') : setActiveModal('login')} className="hover:text-[#C91F26] transition-colors cursor-pointer">My Account</button></li>
                    <li><button onClick={() => setCurrentView('yourOrders')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Your Orders</button></li>
                    <li><button onClick={() => setCurrentView('yourAddresses')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Saved Addresses</button></li>
                    <li><button onClick={() => setIsWishlistModalOpen(true)} className="hover:text-[#C91F26] transition-colors cursor-pointer">Wishlist</button></li>
                    <li><button onClick={() => setActiveModal('checkout')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Quick Checkout</button></li>
                  </ul>
                </div>

                {/* Col 4: Store & Legal Policies */}
                <div className="space-y-3">
                  <ul className="space-y-2.5 text-gray-600 font-medium">
                    <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Terms &amp; Conditions</button></li>
                    <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Return Policy</button></li>
                    <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Shipping Policy</button></li>
                    <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Privacy Policy</button></li>
                    <li><button onClick={() => setCurrentView('storePolicies')} className="hover:text-[#C91F26] transition-colors cursor-pointer">Warranty</button></li>
                  </ul>
                </div>

                {/* Col 5: Corporate Contact */}
                <div className="space-y-3">
                  <div className="space-y-2 text-gray-600 text-xs font-medium">
                    <p>Kimatsu India Pvt. Ltd.</p>
                    <p>201–202 Tirupati Udyog, Goregaon East, Mumbai – 400063</p>
                    <p><a href="mailto:support@modenahome.in" className="hover:text-[#E60000] font-semibold">support@modenahome.in</a></p>
                    <p><a href="whatsapp://send?phone=919326641825" onClick={(e) => openWhatsAppDirect('919326641825', '', e)} className="hover:text-emerald-700 font-bold">+91 93266 41825</a></p>
                  </div>
                </div>

              </div>

              {/* Bottom Bar: Full-Width Copyright & Accepted Payment Methods */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 pt-2 font-medium">
                <div className="flex flex-wrap items-center gap-3">
                  <span>© {new Date().getFullYear()} <strong className="text-[#2A2724]">Kimatsu India Pvt. Ltd.</strong> (Modena Home). All rights reserved.</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-gray-700 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-xs">
                  <span className="font-bold text-[#2A2724]">100% PREPAID STORE:</span>
                  <span className="text-emerald-700 font-bold">UPI</span>
                  <span>•</span>
                  <span className="text-sky-700 font-bold">Razorpay</span>
                  <span>•</span>
                  <span>Cards</span>
                </div>
              </div>
            </div>
          </footer>
      {/* RETURN & REPLACEMENT INTERACTIVE MODAL */}
      {activeReturnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div onClick={() => setActiveReturnModalItem(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-50 my-auto border border-gray-200 p-6 sm:p-8 text-[#2A2724] max-h-[90vh] overflow-y-auto">
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
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-[11px] mb-3 space-y-1.5 font-medium">
                  <p><strong>Policy Notice:</strong> Damaged/wrong items must be reported within 48 hours of delivery with an unboxing video. Change-of-mind returns incur shipping costs.</p>
                  <p><em>Note for Cast Iron:</em> Variations in seasoning color, minor surface rust, and casting marks are inherent traits, not manufacturing defects.</p>
                </div>
                <select
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xs bg-gray-50 focus:outline-none focus:border-[#E60000] cursor-pointer font-medium"
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
                  <label className="border-2 border-dashed border-gray-300 hover:border-[#E60000] bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
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
                    <div className="w-9 h-9 rounded-full bg-red-50 text-[#E60000] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
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
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E60000]"
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
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${resolutionType === 'replace'
                      ? 'border-[#E60000] bg-red-50/50 ring-2 ring-[#E60000]'
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
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${resolutionType === 'refund'
                      ? 'border-[#E60000] bg-red-50/50 ring-2 ring-[#E60000]'
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
                        className="accent-[#E60000]"
                      />
                      <span>⚡ Razorpay (Original Payment Method)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'bank'}
                        onChange={() => setRefundMethod('bank')}
                        className="accent-[#E60000]"
                      />
                      <span>🏦 Bank Account Transfer</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'upi'}
                        onChange={() => setRefundMethod('upi')}
                        className="accent-[#E60000]"
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
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#E60000]"
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
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#E60000]"
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
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#E60000]"
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
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#E60000]"
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
                className="w-full bg-[#E60000] hover:bg-[#E60000] text-white py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-900/20 cursor-pointer"
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
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#2A2724] space-y-6">
            <button onClick={() => setActiveTrackOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-[#E60000] border-b border-gray-100 pb-4">
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
                <Copy className="w-3.5 h-3.5 text-[#E60000]" />
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
                  <div className="w-7 h-7 rounded-full bg-[#E60000] text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/30 animate-pulse">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#E60000]">Out for Delivery / In Transit</h5>
                    <p className="text-[11px] text-gray-600 font-medium">Assigned to Delivery Executive (Ramesh K. - +91 98765 43210)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Box */}
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-xs space-y-1">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E60000]" />
                <span>Delivery Address:</span>
              </span>
              <p className="text-gray-700 pl-5">Mohnish Niranjhan — 12/A Jayalakshmi nagar, puzhuthivakkam, CHENNAI, TAMIL NADU 600091</p>
            </div>

            <button
              onClick={() => setActiveTrackOrder(null)}
              className="w-full bg-[#2A2724] hover:bg-black text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
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
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#2A2724] space-y-5">
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
                  className="bg-[#2A2724] text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer hover:bg-black mt-2"
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
                          className={`w-7 h-7 ${star <= sellerFeedbackForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
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
                    className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:outline-none focus:border-[#E60000]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E60000] hover:bg-[#E60000] text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-red-900/20 cursor-pointer"
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
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-50 my-auto text-[#2A2724] space-y-6 max-h-[85vh] flex flex-col border border-gray-100">

            {/* Header with Title & Action Controls */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E60000] flex items-center justify-center shadow-inner border border-red-100 flex-shrink-0">
                  <Heart className="w-6 h-6 fill-[#E60000]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-inter leading-tight">Your Wishlist</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved • Total Value: <strong className="text-[#E60000] font-bold">₹{totalWishlistAmount.toLocaleString('en-IN')}</strong>
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
                    className="bg-[#E60000] hover:bg-[#E60000] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 whitespace-nowrap"
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
                  className="bg-[#E60000] text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer hover:bg-[#E60000] transition-all shadow-md mt-2"
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
                        <Heart className="w-4 h-4 fill-[#E60000] text-[#E60000]" />
                      </button>

                      <div
                        className="flex items-center gap-3.5 mb-3 cursor-pointer"
                        onClick={() => { handleSelectProduct(item); setIsWishlistModalOpen(false); }}
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
                          <span className="text-[9px] font-bold text-[#E60000] uppercase tracking-wider block mb-0.5">
                            {item.category || 'SAVED ITEM'}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 group-hover:text-[#E60000] transition-colors leading-snug">
                            {item.name}
                          </h4>
                          <span className="text-sm font-extrabold text-[#E60000] block mt-1">
                            {item.price_html || item.dealPrice || `₹${item.price}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-200/80 items-center">
                        <div className="flex-1">
                          <CartQuantityControl
                            product={item}
                            cart={cart}
                            onAddToCart={handleAddToCart}
                            onUpdateQuantity={updateQuantity}
                            size="full"
                            buttonText="ADD TO CART"
                            buttonClassName="bg-[#E60000] hover:bg-red-800 text-[11px] py-2.5"
                            controlClassName="bg-[#E60000] h-[36px]"
                          />
                        </div>
                        <button
                          onClick={() => {
                            handleSelectProduct(item);
                            setIsWishlistModalOpen(false);
                          }}
                          className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[11px] font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
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
      {/* FLOATING BOTTOM CART / BUY PILL BUTTON */}
      {cart.length > 0 && !isCartOpen && (
        <div
          className="fixed bottom-5 sm:bottom-6 left-4 sm:left-6 z-40 pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
          style={{
            transform: scrollDirection === 'down'
              ? 'translate3d(0, 0, 0)'
              : 'translate3d(calc(50vw - 50% - var(--cart-offset, 1.5rem)), 0, 0)'
          }}
        >
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="View Cart"
            className={`pointer-events-auto shadow-2xl border flex items-center transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer group select-none ${
              scrollDirection === 'down'
                ? 'w-14 h-14 rounded-full bg-[#C91F26] hover:bg-[#A9181E] text-white border-white/30 justify-center p-0 hover:scale-105 active:scale-95 shadow-[0_10px_25px_rgba(183,1,0,0.4)]'
                : 'bg-[#292725] hover:bg-[#1E1C1A] text-white px-5 sm:px-6 py-3.5 rounded-full border-white/20 gap-3.5 hover:scale-105 active:scale-95'
            }`}
          >
            {/* Cart Icon with Notification Badge */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <ShoppingBag
                className={`${scrollDirection === 'down' ? 'w-6 h-6' : 'w-5 h-5'} text-white group-hover:scale-110 transition-transform duration-300`}
              />
              <span
                className={`absolute -top-2 -right-2 ${
                  scrollDirection === 'down'
                    ? 'bg-white text-[#C91F26] border-[#C91F26]'
                    : 'bg-[#C91F26] group-hover:bg-white text-white group-hover:text-[#C91F26] border-[#292725]'
                } text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors shadow-xs`}
              >
                {totalItemCount}
              </span>
            </div>

            {/* Expanded Text Content */}
            <div
              className={`flex items-center gap-3.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                scrollDirection === 'down'
                  ? 'max-w-0 opacity-0 pointer-events-none'
                  : 'max-w-[340px] opacity-100'
              }`}
            >
              <div className="text-left font-inter whitespace-nowrap">
                <span className="text-[10px] text-gray-300 group-hover:text-white/80 block uppercase tracking-wider font-semibold">
                  Your Cart
                </span>
                <span className="text-xs sm:text-sm font-bold text-white block">
                  {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} • {currencySymbol}{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-[#C91F26] group-hover:bg-white text-white group-hover:text-[#C91F26] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ml-1 shadow-sm whitespace-nowrap">
                <span>VIEW CART</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>
        </div>
      )}

      <WhatsAppWidget
        isCartOpen={isCartOpen}
        isCheckoutOpen={activeModal === 'checkout'}
      />
      <Chatbot
        currentView={currentView}
        selectedProduct={selectedProduct}
        onSelectProduct={handleSelectProduct}
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
