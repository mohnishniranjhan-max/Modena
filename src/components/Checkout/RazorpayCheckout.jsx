import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, AlertCircle, Loader2, Shield } from 'lucide-react';
import { trackPurchase } from '../../utils/analytics';

export default function RazorpayCheckout({
  amount,
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  onPaymentSuccess,
  buttonText
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Razorpay JS SDK if available
  useEffect(() => {
    if (!document.getElementById('razorpay-js-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-js-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Request Payment Order from WordPress Razorpay REST API
      const res = await fetch('/wp-json/modena/v1/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create Razorpay payment order');
      }

      // If backend returned a mock order (due to missing key secret or local dev mode), do not open SDK with invalid order ID
      if (data.is_mock || data.razorpay_order_id?.startsWith('order_mock_')) {
        console.warn('Razorpay API Key Secret missing on backend. Running mock payment success...');
        setTimeout(() => {
          if (onPaymentSuccess) {
            onPaymentSuccess({
              paymentId: 'pay_mock_' + Date.now(),
              sessionId: data.razorpay_order_id,
              method: 'razorpay_mock',
              verification: { verified: true, message: 'Mock payment success' }
            });
          }
          setLoading(false);
        }, 1000);
        return;
      }

      // 2. Check if Razorpay SDK is available
      if (window.Razorpay) {
        const options = {
          key: data.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || '', // Provided securely by server or client env
          amount: data.amount * 100, // paise
          currency: data.currency || 'INR',
          name: 'Modena Kitchenware',
          description: `Order Payment (₹${(amount || 0).toFixed(2)})`,
          order_id: data.razorpay_order_id, 
          handler: async function (response) {
            // 3. Verify payment with backend REST API
            try {
              const verifyRes = await fetch('/wp-json/modena/v1/verify-razorpay-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              
              if (!verifyData.success || !verifyData.verified) {
                setError(verifyData.message || 'Payment signature verification failed.');
                return;
              }

              // Fire Purchase event to Meta Pixel & CAPI with deduplicated event ID
              trackPurchase(response.razorpay_order_id, amount, [], {
                email: customerEmail,
                phone: customerPhone,
                firstName: customerName
              });

              if (onPaymentSuccess) {
                onPaymentSuccess({
                  paymentId: response.razorpay_payment_id,
                  sessionId: response.razorpay_order_id,
                  method: 'razorpay',
                  verification: verifyData
                });
              }
            } catch (vErr) {
              console.error('Payment verification warning:', vErr);
              setError('An error occurred during payment verification.');
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
          },
          theme: {
            color: '#2A2724'
          }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response) {
          console.error(response.error.description);
          setError(response.error.description || 'Payment Failed');
        });
        rzp1.open();
      } else {
        setError('Razorpay SDK failed to load. Please check your internet connection and try again.');
      }
    } catch (err) {
      console.error('Razorpay Order Error:', err);
      setError(err.message || 'An error occurred while creating the payment order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={handleInitiatePayment}
        disabled={loading}
        className="w-full bg-[#2A2724] hover:bg-[#2A2724] text-white py-3.5 px-6 rounded-lg font-headline-md text-base shadow-md hover:shadow-lg transition-all tracking-wide text-center flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group border border-[#514C48]"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <span>{buttonText || `Pay ₹${amount ? amount.toFixed(2) : '0.00'} securely`}</span>
          </>
        )}
      </button>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-3 text-[11px] text-[#8A827C] bg-[#EFEAE6] py-2 px-3 rounded-md border border-[#EFEAE6]">
        <div className="flex items-center gap-1 text-[#0f766e] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-bit Razorpay Encryption</span>
        </div>
        <span className="text-[#E2DCD7]">|</span>
        <div className="flex items-center gap-1 text-[#1e293b]">
          <span className="font-semibold text-slate-800">Razorpay</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
