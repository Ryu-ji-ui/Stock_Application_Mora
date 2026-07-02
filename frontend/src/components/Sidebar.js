import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Eye,
  Briefcase,
  BarChart3,
  MessageSquare,
  FileText,
  Brain,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
      { id: 'terminal', label: 'Trading Terminal', icon: TrendingUp },
      { id: 'analysis', label: 'Stock Analysis', icon: TrendingUp },
    ],
  },
  {
    section: 'PORTFOLIO',
    items: [
      { id: 'watchlist', label: 'Watchlist', icon: Eye },
      { id: 'portfolio', label: 'My Portfolio', icon: Briefcase },
    ],
  },
  {
    section: 'ANALYSIS',
    items: [
      { id: 'technical', label: 'Technical', icon: BarChart3 },
      { id: 'sentiment', label: 'Sentiment', icon: MessageSquare },
      { id: 'fundamentals', label: 'Fundamentals', icon: FileText },
      { id: 'predictions', label: 'ML Predictions', icon: Brain },
    ],
  },
];

const Sidebar = ({ activeSection, onSectionChange, user, onLogout, isOpen, onClose }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`sidebar ${isOpen ? 'open' : ''}`}
      >
        {/* Logo Area */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/images/mora-logo.png"
              alt="Mora"
              className="w-9 h-9"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="text-xl font-bold text-white tracking-tight">
              Mora
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map((group) => (
            <div key={group.section} className="mb-5">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  const isHovered = hoveredItem === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSectionChange(item.id);
                        onClose();
                      }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 shadow-glow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-emerald-400 to-purple-500 rounded-full" />
                      )}
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                          isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {(isActive || isHovered) && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-all ${
                            isActive ? 'text-emerald-500' : 'text-slate-600'
                          }`}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email || 'user@email.com'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
