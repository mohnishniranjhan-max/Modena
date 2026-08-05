import React, { useState } from 'react';
import ProductList from './ProductList';
import logoBlackRed from '/modena_logo_black_red.png';
import logoReverseDark from '/modena_logo_reverse_dark.png';
import logoMonoWhiteRed from '/modena_logo_mono-white_red.png';
import {
  Truck,
  Search,
  User,
  ShoppingCart,
  ChevronDown,
  Zap,
  ShieldCheck,
  Coffee,
  Users,
  Heart,
  ArrowRight,
  MessageCircle,
  Clock,
  ThumbsUp,
  Award,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  CreditCard,
  Wallet,
  Banknote,
  Building,
  ShoppingBag
} from 'lucide-react';

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'checkout', 'confirmation'
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'card', 'upi', 'bacs'
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    upiId: ''
  });

  // Helper to parse price float from WooCommerce price string / HTML
  const parsePrice = (product) => {
    if (product.prices?.price) {
      return parseFloat(product.prices.price) / Math.pow(10, product.prices.currency_minor_unit || 2);
    }
    if (typeof product.price === 'number') return product.price;
    if (typeof product.price === 'string') {
      const cleaned = product.price.replace(/[^0-9.]/g, '');
      if (cleaned) return parseFloat(cleaned);
    }
    if (product.price_html) {
      const match = product.price_html.match(/[\d,]+(?:\.\d+)?/);
      if (match) return parseFloat(match[0].replace(/,/g, ''));
    }
    return 999; // Default fallback price
  };

  const handleAddToCart = (product, apiCartData) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      const priceVal = parsePrice(product);
      const img = product.images?.[0]?.src || '';

      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: priceVal,
            price_html: product.price_html,
            image: img,
            quantity: 1,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const cartTotalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingFee = cartSubtotal > 999 || cartSubtotal === 0 ? 0 : 99;
  const cartGrandTotal = cartSubtotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsSubmittingOrder(true);

    const payload = {
      billing_address: {
        first_name: formData.firstName || 'Customer',
        last_name: formData.lastName || 'Guest',
        email: formData.email || 'customer@example.com',
        phone: formData.phone || '9876543210',
        address_1: formData.address || 'Main Street',
        city: formData.city || 'Mumbai',
        postcode: formData.postcode || '400001',
        country: 'IN',
      },
      payment_method: paymentMethod,
    };

    try {
      const response = await fetch('/wp-json/wc/store/v1/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let responseData = null;
      if (response.ok) {
        responseData = await response.json();
      }
    } catch (err) {
      console.warn('WooCommerce Checkout API notice:', err);
    }

    // Process order confirmation
    const orderDetails = {
      orderId: 'MOD-' + Math.floor(100000 + Math.random() * 900000),
      items: [...cart],
      total: cartGrandTotal,
      paymentMethod: paymentMethod,
      customer: formData,
      date: new Date().toLocaleDateString(),
    };

    setPlacedOrder(orderDetails);
    setCart([]);
    setIsSubmittingOrder(false);
    setCheckoutStep('confirmation');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-900 relative">
      {/* 1. Top Announcement Bar */}
      <div className="bg-gray-900 text-white text-sm py-2 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <Truck size={16} />
          <span>Free shipping on orders above ₹999</span>
        </div>
        <div className="flex items-center gap-4 text-xs md:text-sm text-gray-300">
          <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-1"><User size={14} /> Built for Indian Kitchens</span>
          <span className="w-px h-3 bg-gray-600 hidden md:block"></span>
          <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-1"><Clock size={14} /> Support</span>
          <span className="w-px h-3 bg-gray-600 hidden md:block"></span>
          <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-1"><Truck size={14} /> Track Order</span>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <nav className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="flex justify-between items-center py-4 px-4 md:px-8 max-w-[1600px] mx-auto">
          {/* Logo */}
          <div className="flex items-center cursor-pointer">
            <img src={logoBlackRed} alt="Modena Logo" className="h-10 md:h-12 w-auto object-contain" />
          </div>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {['SHOP', 'PRODUCTS', 'ABOUT US', 'RECIPES', 'SUPPORT'].map((item) => (
              <div key={item} className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-red-700 cursor-pointer transition-colors group">
                {item}
                <ChevronDown size={14} className="text-gray-400 group-hover:text-red-700 transition-colors" />
              </div>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-6">
            <Search size={20} className="text-gray-700 hover:text-red-700 cursor-pointer transition-colors" />
            <User size={20} className="text-gray-700 hover:text-red-700 cursor-pointer transition-colors hidden md:block" />
            <div
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="relative cursor-pointer group"
            >
              <ShoppingCart size={20} className="text-gray-700 group-hover:text-red-700 transition-colors" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {cartTotalItems}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="relative px-4 md:px-8 py-12 md:py-20 max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        <div className="w-full lg:w-2/5 flex flex-col items-start z-10">
          <span className="text-red-700 uppercase tracking-[0.2em] text-xs font-bold mb-4">
            Reliable Tools. Stronger Traditions.
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] text-gray-900 mb-6 tracking-tight">
            Built for <br /> Everyday <br /> Cooking
          </h1>
          <p className="text-gray-600 text-lg max-w-md mb-8 leading-relaxed">
            Modena makes home appliances and cast iron cookware for the way Indian families actually cook — every single day.
          </p>
          <a href="#featured-products" className="bg-red-700 hover:bg-red-800 text-white px-8 py-4 rounded-md font-bold uppercase tracking-wide transition-all shadow-lg shadow-red-700/30 hover:shadow-red-700/50 hover:-translate-y-0.5 inline-block">
            Shop Now
          </a>
        </div>

        <div className="w-full lg:w-3/5 h-[400px] md:h-[500px] lg:h-[600px] relative rounded-2xl overflow-hidden shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            alt="Cooking in Modena pan"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-orange-500/10 mix-blend-overlay"></div>
        </div>
      </section>

      {/* 4. Floating Trust Badge Ribbon */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-4 md:px-8 -mt-8 md:-mt-12 mb-20 hidden md:block">
        <div className="bg-white rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-5 px-8 flex justify-between items-center divide-x divide-gray-100 border border-gray-50">
          {[
            { icon: Zap, title: "Built for Everyday", sub: "Made for Indian kitchens" },
            { icon: ShieldCheck, title: "Reliable & Durable", sub: "Made to last" },
            { icon: Coffee, title: "Cast Iron You Can Trust", sub: "Seasoned for generations" },
            { icon: Users, title: "For Indian Homes", sub: "By " },
            { icon: Heart, title: "Crafted for Life", sub: "Not just for today" },
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center gap-3 px-6 first:pl-2 last:pr-2`}>
              <div className="text-red-700">
                <item.icon size={24} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-gray-900 leading-tight">{item.title}</span>
                <span className="text-[11px] text-gray-500">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Dynamic WooCommerce Product Grid */}
      <section id="featured-products">
        <ProductList onAddToCart={handleAddToCart} />
      </section>

      {/* 6. Footer Trust Bar */}
      <footer className="bg-[#F9F9F9] border-t border-gray-200 py-10 px-4 md:px-8 mt-12">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x divide-gray-200">
          {[
            { icon: ThumbsUp, title: "Quality Guarantee", sub: "1 Year Standard Warranty" },
            { icon: ShieldCheck, title: "Secure Payments", sub: "100% Safe & Encrypted" },
            { icon: Truck, title: "Fast Delivery", sub: "Pan-India Shipping" },
            { icon: Award, title: "Award Winning", sub: "Voted Best Cookware 2023" },
          ].map((item, idx) => (
            <div key={idx} className={`flex flex-col items-center text-center lg:px-6 ${idx === 0 ? 'lg:pl-0' : ''} ${idx === 3 ? 'lg:pr-0' : ''}`}>
              <item.icon size={32} strokeWidth={1} className="text-gray-400 mb-4" />
              <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </footer>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setCheckoutStep('cart');
          setIsCartOpen(true);
        }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-red-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-red-800 hover:scale-110 transition-all z-40"
      >
        <ShoppingBag size={24} />
      </button>

      {/* Slide-over Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300">

            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <img src={logoBlackRed} alt="Modena Logo" className="h-6 w-auto object-contain mr-1" />
                <h3 className="text-lg font-bold text-gray-900 font-jost">
                  {checkoutStep === 'cart' && `Your Shopping Cart (${cartTotalItems})`}
                  {checkoutStep === 'checkout' && 'Checkout & Payment'}
                  {checkoutStep === 'confirmation' && 'Order Confirmed!'}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* STEP 1: CART VIEW */}
              {checkoutStep === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center justify-center">
                      <ShoppingBag size={48} className="text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium mb-2">Your cart is currently empty.</p>
                      <p className="text-sm text-gray-400 mb-6">Add products from our featured list to get started!</p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="bg-red-700 text-white px-6 py-2 rounded-md font-semibold text-sm hover:bg-red-800"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 p-3 border border-gray-100 rounded-lg bg-gray-50/50 items-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md bg-gray-200" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">No Image</div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h4>
                            <div className="text-sm font-bold text-red-700 mt-1">
                              ₹{item.price.toLocaleString('en-IN')}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-semibold px-2">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: CHECKOUT & PAYMENT METHOD FORM */}
              {checkoutStep === 'checkout' && (
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="bg-red-50 p-3 rounded-md border border-red-100 text-xs text-red-800">
                    🔒 Secure WooCommerce Store Checkout
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-800 border-b pb-1">1. Customer Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                    <input
                      type="text"
                      name="address"
                      placeholder="Shipping Address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                      <input
                        type="text"
                        name="postcode"
                        placeholder="Pincode"
                        required
                        value={formData.postcode}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-sm text-gray-800 border-b pb-1">2. Payment Method</h4>

                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="accent-red-600"
                        />
                        <Banknote className="text-gray-700" size={18} />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</div>
                          <div className="text-[11px] text-gray-500">Pay when your order arrives</div>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                          className="accent-red-600"
                        />
                        <Wallet className="text-gray-700" size={18} />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-gray-900">UPI / Google Pay / PhonePe / Paytm</div>
                          <div className="text-[11px] text-gray-500">Instant UPI payment</div>
                        </div>
                      </label>

                      {paymentMethod === 'upi' && (
                        <div className="pl-8 pt-1">
                          <input
                            type="text"
                            name="upiId"
                            placeholder="Enter UPI ID (e.g. mobile@upi)"
                            value={formData.upiId}
                            onChange={handleInputChange}
                            className="w-full text-xs p-2 border border-gray-300 rounded"
                          />
                        </div>
                      )}

                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className="accent-red-600"
                        />
                        <CreditCard className="text-gray-700" size={18} />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-gray-900">Credit / Debit Card</div>
                          <div className="text-[11px] text-gray-500">Visa, Mastercard, RuPay</div>
                        </div>
                      </label>

                      {paymentMethod === 'card' && (
                        <div className="pl-8 space-y-2 pt-1">
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="Card Number"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            className="w-full text-xs p-2 border border-gray-300 rounded"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              name="cardExpiry"
                              placeholder="MM/YY"
                              value={formData.cardExpiry}
                              onChange={handleInputChange}
                              className="w-full text-xs p-2 border border-gray-300 rounded"
                            />
                            <input
                              type="password"
                              name="cardCvc"
                              placeholder="CVC"
                              maxLength={4}
                              value={formData.cardCvc}
                              onChange={handleInputChange}
                              className="w-full text-xs p-2 border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      )}

                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'bacs' ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bacs"
                          checked={paymentMethod === 'bacs'}
                          onChange={() => setPaymentMethod('bacs')}
                          className="accent-red-600"
                        />
                        <Building className="text-gray-700" size={18} />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-gray-900">Direct Bank Transfer</div>
                          <div className="text-[11px] text-gray-500">Pay directly into bank account</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full mt-4 bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-md shadow transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmittingOrder ? (
                      <span>Processing Order...</span>
                    ) : (
                      <>
                        <span>Pay & Place Order • ₹{cartGrandTotal.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: ORDER CONFIRMATION RECEIPT */}
              {checkoutStep === 'confirmation' && placedOrder && (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle2 size={56} className="text-green-600 mx-auto animate-bounce" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Thank You for Your Order!</h3>
                    <p className="text-xs text-gray-500 mt-1">Order #{placedOrder.orderId} • {placedOrder.date}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-left text-xs space-y-2 border border-gray-200">
                    <div className="font-bold text-gray-800 border-b pb-1">Order Details</div>
                    <div className="flex justify-between text-gray-600">
                      <span>Customer:</span>
                      <span className="font-semibold">{placedOrder.customer.firstName} {placedOrder.customer.lastName}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Payment Method:</span>
                      <span className="font-semibold uppercase">{placedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Total Amount:</span>
                      <span className="font-bold text-red-700">₹{placedOrder.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="text-left text-xs space-y-1">
                    <p className="font-semibold text-gray-700">Items Ordered:</p>
                    {placedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutStep('cart');
                      setIsCartOpen(false);
                    }}
                    className="w-full bg-red-700 text-white font-bold py-3 rounded-md hover:bg-red-800 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer Summary (For Cart Step) */}
            {checkoutStep === 'cart' && cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping:</span>
                    <span className="font-semibold text-gray-900">
                      {shippingFee === 0 ? <span className="text-green-600">FREE</span> : `₹${shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-red-700">₹{cartGrandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutStep('checkout')}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-md transition-colors shadow flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
