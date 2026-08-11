import React, { useState } from 'react';
import { X, Lock, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import logoMonoWhiteRed from '/modena_logo_mono-white_red.png';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const decodeHtml = (htmlStr) => {
    if (!htmlStr) return '';
    return htmlStr.replace(/<[^>]*>?/gm, '').replace(/&[^;]+;/g, '').trim();
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setToastMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://modena.local/wp-json/jwt-auth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: emailOrUsername.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // 1. Store token in localStorage
        localStorage.setItem('token', data.token);

        // 2. Save user details in localStorage & global state callback
        const displayName = data.user_display_name || data.user_nicename || emailOrUsername.trim();
        const userEmail = data.user_email || emailOrUsername.trim();
        
        localStorage.setItem('user_display_name', displayName);
        localStorage.setItem('user_email', userEmail);

        if (onLoginSuccess) {
          onLoginSuccess({
            token: data.token,
            displayName,
            email: userEmail,
            nicename: data.user_nicename
          });
        }

        // 3. Show toast alert & close modal
        const successToast = `Successfully logged in as ${displayName}!`;
        setToastMessage(successToast);
        alert(successToast);

        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        // Extract error message directly from API response data.message
        const rawErrorMsg = data.message || data.code || 'Authentication failed. Please check your credentials.';
        const cleanedMsg = decodeHtml(rawErrorMsg);
        setError(cleanedMsg);
      }
    } catch (err) {
      setError(err.message || 'Network error connecting to WordPress authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-[#2A2724]/70 backdrop-blur-md" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200 z-50 my-auto text-[#2A2724] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-5">
          <img
            src={logoMonoWhiteRed}
            alt="Modena Logo"
            className="h-8 w-auto object-contain brightness-0 filter invert-[0]"
          />
        </div>

        <h2 className="text-xl font-bold font-inter text-center mb-4 text-[#2A2724]">
          Sign In to Modena
        </h2>

        {/* Error message directly displayed in modal UI */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Toast Alert message */}
        {toastMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email-username"
              className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              Email or Username
            </label>
            <div className="relative">
              <input
                id="auth-email-username"
                name="username"
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="mohnishniranjhan@gmail.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[#E60000] focus:ring-2 focus:ring-[#E60000]/20 transition-all"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="auth-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[#E60000] focus:ring-2 focus:ring-[#E60000]/20 transition-all"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              id="agree-terms-modal"
              required
              defaultChecked
              className="mt-0.5 accent-[#E60000] cursor-pointer rounded"
            />
            <label htmlFor="agree-terms-modal" className="cursor-pointer leading-snug">
              By signing in, you agree to Modena’s <strong className="text-[#E60000]">Terms &amp; Conditions</strong>, <strong className="text-[#E60000]">Privacy Policy</strong> &amp; <strong className="text-[#E60000]">Return Policy</strong>.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E60000] hover:bg-[#E60000] text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
