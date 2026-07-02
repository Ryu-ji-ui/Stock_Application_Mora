import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Mail, Lock, Eye, EyeOff, User, Shield,
  ArrowLeft, CheckCircle, Github, Apple
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/auth';

const AuthPage = ({ onLogin }) => {
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const showError = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        email: formData.email,
        password: formData.password,
      });
      const { token, user } = res.data;
      localStorage.setItem('mora_token', token);
      localStorage.setItem('mora_user', JSON.stringify(user));
      onLogin(token, user);
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      showError('Please fill in all fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setUserId(res.data.user_id);
      setView('otp');
      setResendTimer(30);
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Registration failed.');
    }
    setLoading(false);
  };

  const handleOtpChange = useCallback((index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      if (newOtp.every((d) => d !== '')) {
        submitOtp(newOtp.join(''));
      }
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      submitOtp(newOtp.join(''));
    }
  }, [otp]);

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (otpCode) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/verify-otp`, {
        user_id: userId,
        otp_code: otpCode || otp.join(''),
      });
      const { token, user } = res.data;
      localStorage.setItem('mora_token', token);
      localStorage.setItem('mora_user', JSON.stringify(user));
      onLogin(token, user);
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Invalid OTP code.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      await axios.post(`${API_BASE}/resend-otp`, { user_id: userId });
      setResendTimer(30);
      setError('');
    } catch (err) {
      showError('Failed to resend OTP.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      showError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/forgot-password`, { email: formData.email });
      setForgotSuccess(true);
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to send reset link.');
    }
    setLoading(false);
  };

  const switchView = (newView) => {
    setView(newView);
    setError('');
    setForgotSuccess(false);
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const renderParticles = () => (
    <div className="particles-container">
      {Array.from({ length: 18 }, (_, i) => (
        <div key={i} className="particle" />
      ))}
    </div>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="text-center mb-8">
        <img
          src="/images/mora-logo.png"
          alt="Mora Logo"
          className="w-16 h-16 mx-auto mb-4 logo-glow"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Welcome to Mora
        </h1>
        <p className="text-slate-400 text-sm">
          AI-Powered Stock Analysis & Predictions
        </p>
      </div>

      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email or Username"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
          autoComplete="email"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-11 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer"
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => switchView('forgotPassword')}
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Forgot Password?
        </button>
      </div>

      {error && (
        <div className={`bg-red-950/50 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl ${shakeError ? 'shake' : ''}`}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-emerald-900/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <span className="spinner" /> : 'Sign In'}
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500">Or continue with</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <div className="flex gap-3">
        <button type="button" className="social-btn" onClick={() => {}}>
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button type="button" className="social-btn" onClick={() => {}}>
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </button>
        <button type="button" className="social-btn" onClick={() => {}}>
          <Apple className="w-4 h-4" />
          <span>Apple</span>
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => switchView('signup')}
          className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          Sign Up
        </button>
      </p>
    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSignup} className="space-y-5">
      <div className="text-center mb-8">
        <img
          src="/images/mora-logo.png"
          alt="Mora Logo"
          className="w-16 h-16 mx-auto mb-4 logo-glow"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Create Account
        </h1>
        <p className="text-slate-400 text-sm">
          Join Mora and start analyzing stocks with AI
        </p>
      </div>

      <div className="relative">
        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
          autoComplete="name"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email Address"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
          autoComplete="email"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-11 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-11 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <div className={`bg-red-950/50 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl ${shakeError ? 'shake' : ''}`}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-emerald-900/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <span className="spinner" /> : 'Create Account'}
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500">Or continue with</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <div className="flex gap-3">
        <button type="button" className="social-btn" onClick={() => {}}>
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button type="button" className="social-btn" onClick={() => {}}>
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </button>
        <button type="button" className="social-btn" onClick={() => {}}>
          <Apple className="w-4 h-4" />
          <span>Apple</span>
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => switchView('login')}
          className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          Sign In
        </button>
      </p>
    </form>
  );

  const renderOtpForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">
          Verify Your Email
        </h1>
        <p className="text-slate-400 text-sm">
          We've sent a 6-digit code to your email<br />
          <span className="text-slate-500">(check console for development)</span>
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (otpRefs.current[index] = el)}
            type="text"
            maxLength={6}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={(e) => {
              e.preventDefault();
              const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
              handleOtpChange(0, paste);
            }}
            className="otp-input"
            autoFocus={index === 0}
          />
        ))}
      </div>

      {error && (
        <div className={`bg-red-950/50 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl text-center ${shakeError ? 'shake' : ''}`}>
          {error}
        </div>
      )}

      <button
        onClick={() => submitOtp()}
        disabled={loading || otp.some((d) => !d)}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-emerald-900/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <span className="spinner" /> : 'Verify'}
      </button>

      <div className="text-center">
        <button
          onClick={handleResendOtp}
          disabled={resendTimer > 0}
          className={`text-sm transition-colors ${
            resendTimer > 0
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-emerald-400 hover:text-emerald-300 cursor-pointer'
          }`}
        >
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP Code'}
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        <button
          type="button"
          onClick={() => switchView('login')}
          className="text-slate-400 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </button>
      </p>
    </div>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">
          Reset Password
        </h1>
        <p className="text-slate-400 text-sm">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {forgotSuccess ? (
        <div className="text-center space-y-4 py-4">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
          <p className="text-emerald-400 font-medium text-lg">Reset link sent!</p>
          <p className="text-slate-500 text-sm">
            Check your email or the console for the reset link.
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
              autoComplete="email"
            />
          </div>

          {error && (
            <div className={`bg-red-950/50 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl ${shakeError ? 'shake' : ''}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-emerald-900/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <span className="spinner" /> : 'Send Reset Link'}
          </button>
        </>
      )}

      <p className="text-center text-sm text-slate-500 mt-4">
        <button
          type="button"
          onClick={() => switchView('login')}
          className="text-slate-400 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </button>
      </p>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="landing-bg" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/landing-bg.png)` }} />
      <div className="landing-overlay" />
      {renderParticles()}

      <div className="auth-card mx-4">
        <div className="auth-card-glow" />
        {view === 'login' && renderLoginForm()}
        {view === 'signup' && renderSignupForm()}
        {view === 'otp' && renderOtpForm()}
        {view === 'forgotPassword' && renderForgotPasswordForm()}
      </div>
    </div>
  );
};

export default AuthPage;
