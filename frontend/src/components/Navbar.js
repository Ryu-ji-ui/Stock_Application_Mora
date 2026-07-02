import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, User, Settings, LogOut, Shield, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sectionTitles = {
  dashboard: 'Dashboard Overview',
  analysis: 'Stock Analysis',
  watchlist: 'Watchlist',
  portfolio: 'My Portfolio',
  technical: 'Technical Analysis',
  sentiment: 'Sentiment Analysis',
  fundamentals: 'Fundamental Analysis',
  predictions: 'ML Predictions',
};

const Navbar = ({ onSearch, user, activeSection, onMenuToggle, onLogout, onSectionChange, theme, onToggleTheme }) => {
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Welcome to Mora Stock Analyzer! Explore ML-driven insights.', time: '1h ago', unread: true },
    { id: 2, text: 'Model Update: AAPL prediction model has been retrained.', time: '3h ago', unread: true },
    { id: 3, text: 'Watchlist alert: TSLA crossed above $215.00.', time: '1d ago', unread: false },
  ]);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchValue.trim().toUpperCase();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { id: 'analysis', label: 'Stocks' },
    { id: 'terminal', label: 'F&O' },
    { id: 'mutual_funds', label: 'Mutual Funds' },
    { id: 'terminal', label: 'Terminal' }
  ];

  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60 flex-shrink-0"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile menu + Logo + Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-black tracking-tighter text-lg uppercase flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Mora
            </span>
            <div className="hidden lg:flex items-center gap-5 ml-6 border-l border-slate-800 pl-6">
              {navLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => {
                    if (onSectionChange) {
                      onSectionChange(link.id);
                    }
                  }}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeSection === link.id
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-4 hidden sm:flex">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
              placeholder="Search Stocks, F&O, Indices..."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-32 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
            />
            <div className="absolute right-24 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none bg-slate-700/40 border border-slate-600/35 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              <span>Ctrl</span>
              <span>+</span>
              <span>K</span>
            </div>
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>


        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-3">
          {/* Light/Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all duration-200 active:scale-95"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Notification Icon Container */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all duration-200 active:scale-95 animate-fadeIn"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl py-3 z-50"
                >
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                  <button
                    onClick={() => setNotifications(notifications.map((n) => ({ ...n, unread: false })))}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium animate-fadeIn"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/40">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-800/40 transition-colors flex gap-2.5 text-left">
                        {n.unread && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />}
                        <div className="flex-1 animate-fadeIn">
                          <p className="text-xs text-slate-300 leading-relaxed">{n.text}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Container */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 p-1 hover:bg-slate-800/60 rounded-xl transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-emerald-950/20">
                {getInitials(user?.name)}
              </div>
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl py-3 z-50"
                >
                {/* Header info */}
                <div className="px-4 pb-3 border-b border-slate-800/80 text-left">
                  <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'Trader'}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || 'user@email.com'}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      if (onSectionChange) onSectionChange('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onSectionChange) onSectionChange('account_settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onSectionChange) onSectionChange('security_settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>Security Settings</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-800/80 my-1" />

                {/* Logout */}
                <div className="px-2 pt-1 animate-fadeIn">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <form onSubmit={handleSubmit} className="sm:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
            placeholder="Search stock symbol..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-20 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </form>
    </motion.header>
  );
};

export default Navbar;
