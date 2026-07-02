import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import StatsCards from './StatsCards';
import StockChart from './StockChart';
import TechnicalPanel from './TechnicalPanel';
import SentimentPanel from './SentimentPanel';
import FundamentalsPanel from './FundamentalsPanel';
import PredictionPanel from './PredictionPanel';
import MutualFundsPanel from './MutualFundsPanel';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Eye,
  Briefcase,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  MessageSquare,
  FileText,
  Brain,
  Activity,
  User,
  Settings,
  Shield,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'http://localhost:5000/api';

// Sparkline component for watchlist cards
const Sparkline = ({ points, color }) => {
  const width = 80;
  const height = 24;
  if (!points || points.length === 0) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / spread) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={coords}
      />
    </svg>
  );
};

const Dashboard = ({ user, token, onLogout }) => {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('overview');
  const [watchlist, setWatchlist] = useState(['AAPL', 'TSLA', 'GOOGL', 'MSFT']);
  const [portfolio, setPortfolio] = useState([
    { symbol: 'AAPL', shares: 10, avgPrice: 150 },
    { symbol: 'TSLA', shares: 5, avgPrice: 200 },
  ]);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    symbol: '',
    shares: '',
    avgPrice: '',
  });

  const [newWatchlistTicker, setNewWatchlistTicker] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statsCounters, setStatsCounters] = useState({
    stocksAnalyzed: 0,
    predictionsMade: 0,
  });

  // Terminal & Options states
  const [isMultiChart, setIsMultiChart] = useState(false);
  const [foPositions, setFoPositions] = useState([
    { symbol: 'AAPL 16 Sept \'25 - 190Call', type: 'Call', strike: 190, qty: 75, avgPrice: 2.50, currentPrice: 3.40 },
    { symbol: 'TSLA 16 Sept \'25 - 180Put', type: 'Put', strike: 180, qty: 75, avgPrice: 4.10, currentPrice: 3.20 }
  ]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mora_theme') || 'dark';
  });
  const [terminalTab, setTerminalTab] = useState('chain');
  const [isBasketMode, setIsBasketMode] = useState(false);
  const [marketNews, setMarketNews] = useState(null);
  
  useEffect(() => {
    const fetchMarketNews = async () => {
      try {
        const res = await axios.get(`${API_BASE}/market-news`);
        setMarketNews(res.data);
      } catch (err) {
        console.error('Failed to fetch market news', err);
      }
    };
    fetchMarketNews();
  }, []);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [orderType, setOrderType] = useState('BUY');
  const [orderProduct, setOrderProduct] = useState('DELIVERY');
  const [orderQty, setOrderQty] = useState(75);
  const [orderPriceType, setOrderPriceType] = useState('MARKET');
  const [orderLimitPrice, setOrderLimitPrice] = useState('');
  const [balanceCash, setBalanceCash] = useState(176198.67);
  const [tradeHistory, setTradeHistory] = useState([
    { time: '14:24:10', details: 'BUY AAPL 16 Sept \'25 - 190Call Qty 75 @ $2.50 - Executed' },
    { time: '11:15:32', details: 'BUY TSLA 16 Sept \'25 - 180Put Qty 75 @ $4.10 - Executed' }
  ]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mora_theme', next);
      return next;
    });
  };

  const handleOptionClick = (type, strike, price) => {
    const optName = `${symbol} 16 Sept '25 - ${strike}${type}`;
    if (isBasketMode) {
      const existingIdx = foPositions.findIndex((p) => p.symbol === optName);
      if (existingIdx >= 0) {
        const updated = [...foPositions];
        const oldPos = updated[existingIdx];
        const newQty = oldPos.qty + 75;
        updated[existingIdx].avgPrice = (oldPos.qty * oldPos.avgPrice + 75 * price) / newQty;
        updated[existingIdx].qty = newQty;
        setFoPositions(updated);
      } else {
        setFoPositions([...foPositions, {
          symbol: optName,
          type: type,
          strike: strike,
          qty: 75,
          avgPrice: price,
          currentPrice: price + (Math.random() * 0.4 - 0.2)
        }]);
      }
      return;
    }

    setSelectedOption({
      symbol: symbol,
      type: type,
      strike: strike,
      price: price,
      name: optName
    });
    setOrderType('BUY');
    setOrderQty(75);
    setOrderProduct('DELIVERY');
    setOrderPriceType('MARKET');
    setOrderLimitPrice(price.toFixed(2));
    setShowOrderModal(true);
  };

  const handleExecuteOrder = () => {
    if (!selectedOption) return;
    
    const finalPrice = orderPriceType === 'MARKET' ? selectedOption.price : parseFloat(orderLimitPrice) || selectedOption.price;
    const cost = finalPrice * orderQty * 80;

    if (orderType === 'BUY' && cost > balanceCash) {
      alert('Insufficient balance to execute this buy order.');
      return;
    }

    const positionName = selectedOption.name;
    const existingIdx = foPositions.findIndex((p) => p.symbol === positionName);

    if (orderType === 'BUY') {
      setBalanceCash((prev) => prev - cost);
      if (existingIdx >= 0) {
        const updated = [...foPositions];
        const oldPos = updated[existingIdx];
        const newQty = oldPos.qty + orderQty;
        const newAvg = (oldPos.qty * oldPos.avgPrice + orderQty * finalPrice) / newQty;
        updated[existingIdx] = {
          ...oldPos,
          qty: newQty,
          avgPrice: newAvg,
          currentPrice: finalPrice
        };
        setFoPositions(updated);
      } else {
        setFoPositions([
          ...foPositions,
          {
            symbol: positionName,
            type: selectedOption.type,
            strike: selectedOption.strike,
            qty: orderQty,
            avgPrice: finalPrice,
            currentPrice: finalPrice
          }
        ]);
      }
    } else {
      if (existingIdx < 0 || foPositions[existingIdx].qty < orderQty) {
        alert('Insufficient F&O position quantity to sell.');
        return;
      }
      setBalanceCash((prev) => prev + cost);
      const updated = [...foPositions];
      const oldPos = updated[existingIdx];
      const newQty = oldPos.qty - orderQty;
      if (newQty === 0) {
        updated.splice(existingIdx, 1);
      } else {
        updated[existingIdx] = {
          ...oldPos,
          qty: newQty
        };
      }
      setFoPositions(updated);
    }

    const nowStr = new Date().toLocaleTimeString();
    setTradeHistory((prev) => [
      {
        time: nowStr,
        details: `${orderType} ${positionName} Qty ${orderQty} @ $${finalPrice.toFixed(2)} - Executed`
      },
      ...prev
    ]);

    setShowOrderModal(false);
  };

  // Settings & Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileUpdated, setProfileUpdated] = useState(false);

  const [securityForm, setSecurityForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    enable2FA: false
  });
  const [securityUpdated, setSecurityUpdated] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Global Axios Interceptor for 401 unauth (e.g. watchlist database reset)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          onLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [onLogout]);

  // Persistent Portfolio & Watchlist fetch
  const fetchPortfolio = useCallback(async () => {
    const authToken = token || localStorage.getItem('mora_token');
    if (!authToken) return;
    try {
      const res = await axios.get(`${API_BASE}/portfolio`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const formatted = res.data.map(item => ({
        id: item.id,
        symbol: item.symbol,
        shares: item.shares,
        avgPrice: item.avg_price
      }));
      setPortfolio(formatted);
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
    }
  }, [token]);

  const fetchWatchlist = useCallback(async () => {
    const authToken = token || localStorage.getItem('mora_token');
    if (!authToken) return;
    try {
      const res = await axios.get(`${API_BASE}/watchlist`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const symbols = res.data.map(item => item.symbol);
      setWatchlist(symbols);
    } catch (err) {
      console.error('Failed to fetch watchlist', err);
    }
  }, [token]);

  useEffect(() => {
    fetchPortfolio();
    fetchWatchlist();
  }, [fetchPortfolio, fetchWatchlist]);

  const fetchStock = useCallback(
    async (ticker) => {
      const t = ticker || symbol;
      setLoading(true);
      setError(null);
      try {
        const authToken = token || localStorage.getItem('mora_token');
        const res = await axios.get(`${API_BASE}/stock/${t}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        setStockData(res.data);
        setSymbol(t);
        setStatsCounters((prev) => ({
          stocksAnalyzed: prev.stocksAnalyzed + 1,
          predictionsMade:
            prev.predictionsMade +
            (res.data.predictions && res.data.predictions.length > 0 ? 1 : 0),
        }));
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Failed to fetch stock data. Make sure the backend is running.'
        );
      }
      setLoading(false);
    },
    [symbol, token]
  );

  useEffect(() => {
    fetchStock('AAPL');
  }, []);

  const handleSearch = (ticker) => {
    fetchStock(ticker);
  };

  const calculatePortfolioValue = () => {
    return portfolio.reduce((total, item) => {
      const currentPrice =
        stockData && item.symbol === symbol
          ? stockData.info?.currentPrice || item.avgPrice
          : item.avgPrice;
      return total + item.shares * currentPrice;
    }, 0);
  };

  // Persistent Watchlist API handlers
  const addToWatchlist = async (ticker) => {
    const t = (ticker || newWatchlistTicker).toUpperCase().trim();
    if (!t) return;
    const authToken = token || localStorage.getItem('mora_token');
    if (authToken) {
      try {
        await axios.post(
          `${API_BASE}/watchlist`,
          { symbol: t },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (!watchlist.includes(t)) {
          setWatchlist([...watchlist, t]);
        }
      } catch (err) {
        console.error('Failed to add to watchlist', err);
      }
    } else {
      if (!watchlist.includes(t)) {
        setWatchlist([...watchlist, t]);
      }
    }
    setNewWatchlistTicker('');
  };

  const removeFromWatchlist = async (ticker) => {
    const authToken = token || localStorage.getItem('mora_token');
    if (authToken) {
      try {
        await axios.delete(`${API_BASE}/watchlist/${ticker}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setWatchlist(watchlist.filter((s) => s !== ticker));
      } catch (err) {
        console.error('Failed to remove from watchlist', err);
      }
    } else {
      setWatchlist(watchlist.filter((s) => s !== ticker));
    }
  };

  // Persistent Portfolio API handlers
  const addToPortfolio = async () => {
    if (
      newPortfolioItem.symbol &&
      newPortfolioItem.shares &&
      newPortfolioItem.avgPrice
    ) {
      const sym = newPortfolioItem.symbol.toUpperCase().trim();
      const sh = parseFloat(newPortfolioItem.shares);
      const pr = parseFloat(newPortfolioItem.avgPrice);
      const authToken = token || localStorage.getItem('mora_token');

      if (authToken) {
        try {
          const res = await axios.post(
            `${API_BASE}/portfolio`,
            { symbol: sym, shares: sh, avg_price: pr },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          setPortfolio([
            ...portfolio,
            {
              id: res.data.id,
              symbol: res.data.symbol,
              shares: res.data.shares,
              avgPrice: res.data.avg_price,
            },
          ]);
        } catch (err) {
          console.error('Failed to add to portfolio', err);
        }
      } else {
        setPortfolio([
          ...portfolio,
          {
            symbol: sym,
            shares: sh,
            avgPrice: pr,
          },
        ]);
      }
      setNewPortfolioItem({ symbol: '', shares: '', avgPrice: '' });
    }
  };

  const removeFromPortfolio = async (index) => {
    const item = portfolio[index];
    const authToken = token || localStorage.getItem('mora_token');
    if (authToken && item.id) {
      try {
        await axios.delete(`${API_BASE}/portfolio/${item.id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setPortfolio(portfolio.filter((_, i) => i !== index));
      } catch (err) {
        console.error('Failed to remove from portfolio', err);
      }
    } else {
      setPortfolio(portfolio.filter((_, i) => i !== index));
    }
  };

  const getSignalText = () => {
    if (!stockData?.signals) return { text: 'HOLD', color: 'text-yellow-400', bg: 'bg-yellow-500/15' };
    if (stockData.signals.buy) return { text: 'BUY', color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
    if (stockData.signals.sell) return { text: 'SELL', color: 'text-red-400', bg: 'bg-red-500/15' };
    return { text: 'HOLD', color: 'text-yellow-400', bg: 'bg-yellow-500/15' };
  };

  const getSparklineData = (ticker) => {
    const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const points = [];
    let price = 100;
    for (let i = 0; i < 10; i++) {
      const change = Math.sin(seed + i) * 2.5;
      price += change;
      points.push(price);
    }
    return points;
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setProfileUpdated(true);
    setTimeout(() => setProfileUpdated(false), 3000);
  };

  const handleSecurityUpdate = (e) => {
    e.preventDefault();
    setSecurityUpdated(true);
    setSecurityForm({ ...securityForm, oldPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSecurityUpdated(false), 3000);
  };

  // --- RENDERS ---

  const renderDashboard = () => {
    const signal = getSignalText();
    return (
      <div className="space-y-6 page-enter text-left">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Welcome back, {user?.name || 'Trader'}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Analyze stocks and execute models from one central console.
          </p>
        </div>

        {stockData?.info?.is_simulated && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <span className="font-bold uppercase bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">Demo Mode</span>
            <span>Yahoo Finance API is rate-limited. Showing real-time simulated market data and predictions.</span>
          </div>
        )}

        <StatsCards
          stocksAnalyzed={statsCounters.stocksAnalyzed}
          portfolioValue={calculatePortfolioValue()}
          predictionsMade={statsCounters.predictionsMade}
        />

        {/* Global Markets Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-2">Global Markets & Popular Stocks</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* US Tech */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-5 glass-card-hover">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">🇺🇸 US Tech Stocks</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {['NVDA', 'AMD', 'INTC', 'AAPL', 'MSFT', 'META', 'GOOGL', 'TSLA'].map(tick => (
                  <button 
                    key={tick} 
                    onClick={() => { setSymbol(tick); setActiveSection('analysis'); }}
                    className="bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg p-2 text-center transition-all flex flex-col items-center group"
                  >
                    <span className="font-bold text-slate-200 text-xs group-hover:text-emerald-400">{tick}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Indian Market */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-5 glass-card-hover">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">🇮🇳 Indian Market</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'TATAMOTORS.NS', 'ITC.NS', 'WIPRO.NS', 'SBIN.NS'].map(tick => (
                  <button 
                    key={tick} 
                    onClick={() => { setSymbol(tick); setActiveSection('analysis'); }}
                    className="bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg p-2 text-center transition-all flex flex-col items-center group"
                  >
                    <span className="font-bold text-slate-200 text-[10px] sm:text-xs group-hover:text-emerald-400 truncate w-full">{tick.replace('.NS','')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Japanese Market */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-5 glass-card-hover">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">🇯🇵 Japanese Market</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {['SONY', 'TM', 'HMC', 'NTDOY', 'MUFG', 'SMFG', 'SFTBY', 'TAK'].map(tick => (
                  <button 
                    key={tick} 
                    onClick={() => { setSymbol(tick); setActiveSection('analysis'); }}
                    className="bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg p-2 text-center transition-all flex flex-col items-center group"
                  >
                    <span className="font-bold text-slate-200 text-xs group-hover:text-emerald-400">{tick}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Taiwanese Market */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-5 glass-card-hover">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">🇹🇼 Taiwanese Market</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {['TSM', 'UMC', 'ASX', 'CHT', '2330.TW', '2317.TW', '2454.TW', '2308.TW'].map(tick => (
                  <button 
                    key={tick} 
                    onClick={() => { setSymbol(tick); setActiveSection('analysis'); }}
                    className="bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg p-2 text-center transition-all flex flex-col items-center group"
                  >
                    <span className="font-bold text-slate-200 text-[10px] sm:text-xs group-hover:text-emerald-400 truncate w-full">{tick}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Market News & Sentiment Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market News Feed */}
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6 glass-card-hover flex flex-col h-96">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Market News
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {marketNews ? (
                marketNews.articles?.length > 0 ? (
                  marketNews.articles.map((article, idx) => (
                    <a key={idx} href={article.link} target="_blank" rel="noopener noreferrer" className="block bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 rounded-xl p-4 transition-all group">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-semibold text-slate-200 text-sm group-hover:text-emerald-400 transition-colors leading-tight">{article.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 ${article.sentiment === 'Positive' ? 'bg-emerald-500/20 text-emerald-400' : article.sentiment === 'Negative' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {article.sentiment}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{article.publisher}</span>
                        <span className="flex items-center gap-1 text-emerald-500/0 group-hover:text-emerald-500 transition-colors">Read <ExternalLink className="w-3 h-3" /></span>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No news articles found today.</p>
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="spinner mr-3" />
                  <span className="text-slate-400 text-sm">Loading market news...</span>
                </div>
              )}
            </div>
          </div>

          {/* Sentiment Doughnut */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6 glass-card-hover flex flex-col h-96">
            <h2 className="text-lg font-bold text-white mb-4">Market Sentiment</h2>
            <div className="flex-1 flex flex-col items-center justify-center">
              {marketNews ? (
                <div className="w-48 h-48 relative">
                  <Doughnut 
                    data={{
                      labels: ['Bullish', 'Bearish', 'Neutral'],
                      datasets: [{
                        data: [marketNews.pos_count || 1, marketNews.neg_count || 1, marketNews.neu_count || 1],
                        backgroundColor: ['#10b981', '#ef4444', '#64748b'],
                        borderWidth: 0,
                        hoverOffset: 4
                      }]
                    }}
                    options={{
                      cutout: '75%',
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, padding: 20 } },
                        tooltip: { backgroundColor: '#0f172a', titleColor: '#f1f5f9', bodyColor: '#cbd5e1' }
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-30px]">
                    <span className="text-2xl font-bold text-white">{marketNews.label || 'Neutral'}</span>
                  </div>
                </div>
              ) : (
                 <div className="flex items-center justify-center h-full">
                  <div className="spinner mr-3" />
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="spinner mr-3" />
            <span className="text-slate-400">Loading market data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-800/40 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {stockData && !loading && (
          <>
            {/* Stock Header */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-white">{symbol}</h2>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${signal.bg} ${signal.color}`}
                    >
                      {signal.text}
                    </span>
                  </div>
                  <p className="text-slate-400">
                    {stockData.info?.longName || stockData.info?.shortName || symbol}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-4xl font-bold text-white">
                    ${stockData.info?.currentPrice?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6">
              <StockChart
                data={stockData.history}
                predictions={stockData.predictions || []}
              />
            </div>

            {/* Quick Analysis Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Technical',
                  icon: BarChart3,
                  section: 'technical',
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                },
                {
                  label: 'Sentiment',
                  icon: MessageSquare,
                  section: 'sentiment',
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10',
                },
                {
                  label: 'Fundamentals',
                  icon: FileText,
                  section: 'fundamentals',
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                },
                {
                  label: 'Predictions',
                  icon: Brain,
                  section: 'predictions',
                  color: 'text-pink-400',
                  bg: 'bg-pink-500/10',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.section}
                    onClick={() => setActiveSection(item.section)}
                    className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 hover:bg-slate-800/60 transition-all text-left group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">View analysis →</p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderAnalysis = () => {
    const signal = getSignalText();
    const tabs = ['overview', 'technical', 'fundamentals', 'sentiment', 'predictions'];

    return (
      <div className="space-y-6 page-enter text-left">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchInput.trim()) fetchStock(searchInput.trim());
              }}
              placeholder="Enter stock symbol..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <button
            onClick={() => searchInput.trim() && fetchStock(searchInput.trim())}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-6 rounded-xl transition-all active:scale-95"
          >
            Analyze
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="spinner mr-3" />
            <span className="text-slate-400">Fetching market details...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-800/40 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {stockData && !loading && (
          <>
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-white">{symbol}</h2>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${signal.bg} ${signal.color}`}>
                      {signal.text}
                    </span>
                  </div>
                  <p className="text-slate-400">
                    {stockData.info?.longName || stockData.info?.shortName || symbol}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-4xl font-bold text-white">
                    ${stockData.info?.currentPrice?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex border-b border-slate-800 mt-6 overflow-x-auto gap-4">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAnalysisTab(tab)}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${
                      activeAnalysisTab === tab
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6">
              {activeAnalysisTab === 'overview' && (
                <div className="space-y-6">
                  <div className="h-[300px]">
                    <StockChart data={stockData.history} predictions={stockData.predictions || []} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/40">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Company Summary</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {stockData.info?.summaryProfile || 'No description summary details available.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sector</span>
                        <p className="text-xs text-slate-200 mt-1 font-semibold">{stockData.info?.sector || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Industry</span>
                        <p className="text-xs text-slate-200 mt-1 font-semibold">{stockData.info?.industry || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Employees</span>
                        <p className="text-xs text-slate-200 mt-1 font-semibold">
                          {stockData.info?.fullTimeEmployees?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Website</span>
                        {stockData.info?.website ? (
                          <a
                            href={stockData.info.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 hover:underline mt-1 font-semibold flex items-center gap-1"
                          >
                            Visit Site <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-slate-200 mt-1 font-semibold">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAnalysisTab === 'technical' && (
                <TechnicalPanel data={stockData.technical} signals={stockData.signals} />
              )}

              {activeAnalysisTab === 'fundamentals' && (
                <FundamentalsPanel data={stockData.fundamentals} />
              )}

              {activeAnalysisTab === 'sentiment' && (
                <SentimentPanel data={stockData.sentiment} />
              )}

              {activeAnalysisTab === 'predictions' && (
                <PredictionPanel data={stockData.predictions} currentPrice={stockData.info?.currentPrice} />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderWatchlist = () => (
    <div className="space-y-6 page-enter text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-sm text-slate-500 mt-1">Track and monitor your key tickers</p>
        </div>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input
          type="text"
          value={newWatchlistTicker}
          onChange={(e) => setNewWatchlistTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addToWatchlist();
          }}
          placeholder="Enter ticker (e.g. MSFT)..."
          className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm"
        />
        <button
          onClick={() => addToWatchlist()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center py-20 text-slate-500">
          <Eye className="w-12 h-12 mb-3 text-slate-600" />
          <p className="font-semibold text-lg text-slate-400">Your watchlist is empty</p>
          <p className="text-sm">Type a stock symbol above to start monitoring</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((ticker) => {
            const points = getSparklineData(ticker);
            const isGainer = points[points.length - 1] >= points[0];
            const sparkColor = isGainer ? '#10b981' : '#ef4444';
            const priceVal = points[points.length - 1] * 1.5;
            const diffPct = ((points[points.length - 1] - points[0]) / points[0]) * 100;

            return (
              <div
                key={ticker}
                className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/60 hover:border-slate-700/60 transition-all duration-300 group shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{ticker}</h3>
                    <p className="text-xs text-slate-500 font-medium">Equities Market</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-100">${priceVal.toFixed(2)}</p>
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 justify-end ${isGainer ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isGainer ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isGainer ? '+' : ''}{diffPct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-850">
                  <div className="flex-shrink-0">
                    <Sparkline points={points} color={sparkColor} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        fetchStock(ticker);
                        setActiveSection('analysis');
                      }}
                      className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" /> Analyze
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(ticker)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPortfolio = () => {
    const totalValue = calculatePortfolioValue();
    const totalCost = portfolio.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const doughnutData = {
      labels: portfolio.map((item) => item.symbol),
      datasets: [
        {
          data: portfolio.map((item) => {
            const currentPrice =
              stockData && item.symbol === symbol
                ? stockData.info?.currentPrice || item.avgPrice
                : item.avgPrice;
            return item.shares * currentPrice;
          }),
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 11, family: 'Inter' },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(51, 65, 85, 0.5)',
          borderWidth: 1,
        },
      },
    };

    return (
      <div className="space-y-6 page-enter text-left">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your equity holdings</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Value</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">
              ${totalValue.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</span>
            <p className="text-xl font-bold text-slate-100 mt-2">${totalValue.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invested</span>
            <p className="text-xl font-bold text-slate-150 mt-2">${totalCost.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Returns</span>
            <span className={`text-xl font-bold mt-2 flex items-center gap-1 ${totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalGain >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)} ({totalGainPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-850">
              <h3 className="text-sm font-semibold text-slate-200">Asset Holdings</h3>
            </div>
            
            {portfolio.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Briefcase className="w-12 h-12 mb-3 text-slate-650" />
                <p className="font-semibold text-base text-slate-400">No holdings in your portfolio</p>
                <p className="text-sm">Add your first stock below to track allocations</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/20">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Symbol</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Price</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Return (P&L)</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {portfolio.map((item, idx) => {
                      const currentPrice =
                        stockData && item.symbol === symbol
                          ? stockData.info?.currentPrice || item.avgPrice
                          : item.avgPrice;
                      const value = item.shares * currentPrice;
                      const pnl = (currentPrice - item.avgPrice) * item.shares;
                      const pnlPct = ((currentPrice - item.avgPrice) / item.avgPrice) * 100;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-3 text-left">
                            <span className="font-bold text-slate-100">{item.symbol}</span>
                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Equity</span>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-200 font-semibold">{item.shares}</td>
                          <td className="px-5 py-3 text-right text-slate-400 font-medium">${item.avgPrice.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right text-slate-200 font-semibold">${value.toFixed(2)}</td>
                          <td className={`px-5 py-3 text-right font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                            <span className="text-[10px] opacity-75 font-semibold block">
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  fetchStock(item.symbol);
                                  setActiveSection('analysis');
                                }}
                                className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                                title="Analyze"
                              >
                                <Activity className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeFromPortfolio(idx)}
                                className="p-1.5 text-slate-500 hover:text-red-450 transition-colors"
                                title="Sell"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between h-[340px]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Asset Allocation breakdown</span>
            <div className="flex-1 min-h-0 relative">
              {portfolio.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-650 text-xs font-medium">No asset distributions</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-350 mb-3">Add New Equity Holding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Ticker Symbol (e.g. TSLA)"
              value={newPortfolioItem.symbol}
              onChange={(e) =>
                setNewPortfolioItem({ ...newPortfolioItem, symbol: e.target.value })
              }
              className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm"
            />
            <input
              type="number"
              placeholder="Shares Quantity"
              value={newPortfolioItem.shares}
              onChange={(e) =>
                setNewPortfolioItem({ ...newPortfolioItem, shares: e.target.value })
              }
              className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm"
            />
            <input
              type="number"
              placeholder="Average Cost ($)"
              value={newPortfolioItem.avgPrice}
              onChange={(e) =>
                setNewPortfolioItem({ ...newPortfolioItem, avgPrice: e.target.value })
              }
              className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm"
            />
            <button
              onClick={addToPortfolio}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- NEW SETTING PANELS ---

  const renderProfile = () => (
    <div className="space-y-6 page-enter text-left">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Your trader profile account dashboard</p>
      </div>
      <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-950/20">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.name || 'Trader'}</h2>
            <p className="text-sm text-slate-500 font-medium">{user?.email || 'user@email.com'}</p>
          </div>
        </div>
        <div className="border-t md:border-t-0 md:border-l border-slate-800/80 pt-6 md:pt-0 md:pl-6 space-y-3.5 text-xs font-semibold">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase tracking-wider">Account Status</span>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Verified Pro</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase tracking-wider">Email Verification</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Verified</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase tracking-wider">Member Since</span>
            <span className="font-bold text-slate-400 uppercase tracking-wider">June 2026</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Watchlist Count</span>
          <p className="text-3xl font-bold text-slate-100 mt-2">{watchlist.length} Tickers</p>
        </div>
        <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Holdings Count</span>
          <p className="text-3xl font-bold text-slate-100 mt-2">{portfolio.length} Holdings</p>
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6 page-enter text-left max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your personal details and account settings</p>
      </div>

      {profileUpdated && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold animate-fadeIn">
          Profile changes updated successfully!
        </div>
      )}

      <form onSubmit={handleProfileUpdate} className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-6 space-y-4.5 shadow-xl backdrop-blur-xl">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Full Name</label>
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-705 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email Address</label>
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-705 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-950/20">
          Save Settings
        </button>
      </form>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6 page-enter text-left max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Security Settings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your system credentials and authentication settings</p>
      </div>

      {securityUpdated && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold animate-fadeIn">
          Security password and settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSecurityUpdate} className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-6 space-y-4.5 shadow-xl backdrop-blur-xl">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Current Password</label>
          <input
            type="password"
            value={securityForm.oldPassword}
            onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-705 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">New Password</label>
          <input
            type="password"
            value={securityForm.newPassword}
            onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-705 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={securityForm.confirmPassword}
            onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-705 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-b border-slate-800/80">
          <div>
            <p className="text-sm font-semibold text-slate-200">Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-slate-500 mt-0.5">Secure your portal with multi-factor OTP checks on login</p>
          </div>
          <button
            type="button"
            onClick={() => setSecurityForm({ ...securityForm, enable2FA: !securityForm.enable2FA })}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${securityForm.enable2FA ? 'bg-emerald-600' : 'bg-slate-700'}`}
          >
            <span className={`w-4 h-4 rounded-full bg-white absolute top-1 left-1 transition-transform ${securityForm.enable2FA ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-950/20">
          Update Security Settings
        </button>
      </form>
    </div>
  );

  // --- UPGRADED TERMINAL VIEW (PICTURES 3 & 4) ---

  const renderTerminal = () => {
    const currentPriceVal = stockData?.info?.currentPrice || 150.00;
    const baseStrike = Math.round(currentPriceVal / 5) * 5;
    const strikes = [baseStrike - 10, baseStrike - 5, baseStrike, baseStrike + 5, baseStrike + 10];
    const overallPL = foPositions.reduce((acc, pos) => acc + (pos.currentPrice - pos.avgPrice) * pos.qty, 0);

    const renderRightColumnContent = () => {
      switch (terminalTab) {
        case 'chain':
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/60">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Option Chain ({symbol})</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Basket</span>
                    <button 
                      onClick={() => setIsBasketMode(!isBasketMode)}
                      className={`w-6 h-3.5 rounded-full relative flex items-center transition-colors ${isBasketMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-white absolute transition-transform ${isBasketMode ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-slate-400 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850">
                        <th className="text-left py-2 font-bold uppercase">Call Price</th>
                        <th className="text-center py-2 font-bold uppercase">Strike</th>
                        <th className="text-right py-2 font-bold uppercase">Put Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {strikes.map((str) => {
                        const callVal = Math.max(0.5, (currentPriceVal - str) * 0.7 + 1.85);
                        const putVal = Math.max(0.5, (str - currentPriceVal) * 0.7 + 1.85);
                        const isCallUp = callVal > 2.0;
                        const isPutUp = putVal > 2.0;

                        return (
                          <tr key={str} className="hover:bg-slate-800/20 transition-all">
                            <td className="py-2.5 text-left font-medium">
                              <button
                                onClick={() => handleOptionClick('Call', str, callVal)}
                                className="hover:underline hover:text-emerald-400 text-left font-bold text-emerald-500"
                              >
                                ${callVal.toFixed(2)}
                              </button>
                              <span className={`block text-[9px] font-semibold ${isCallUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isCallUp ? '+' : ''}{( (callVal - 2.5)/2.5 * 100 ).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-300 bg-slate-900/30 rounded-lg px-2">
                              {str}
                            </td>
                            <td className="py-2.5 text-right font-medium">
                              <button
                                onClick={() => handleOptionClick('Put', str, putVal)}
                                className="hover:underline hover:text-emerald-400 text-right font-bold text-red-500 inline-block"
                              >
                                ${putVal.toFixed(2)}
                              </button>
                              <span className={`block text-[9px] font-semibold ${isPutUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isPutUp ? '+' : ''}{( (putVal - 2.5)/2.5 * 100 ).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800/50 mt-4 text-[9px] text-slate-500 font-medium leading-relaxed uppercase">
                ⚠️ Click on any option price to buy and add it to your positions.
              </div>
            </div>
          );
        case 'positions':
          return (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">F&O Positions</h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {foPositions.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-6 font-semibold">No open positions</p>
                ) : (
                  foPositions.map((pos, idx) => {
                    const pl = (pos.currentPrice - pos.avgPrice) * pos.qty;
                    return (
                      <div key={idx} className="glass-card-hover p-3 flex flex-col justify-between animate-fadeIn">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-100 text-xs">{pos.symbol}</span>
                            <span className="text-[9px] text-slate-500 font-medium block">Qty {pos.qty} | Avg ${pos.avgPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-200 block">${(pos.qty * pos.currentPrice).toFixed(2)}</span>
                            <span className={`text-[10px] font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setFoPositions(foPositions.filter((_, i) => i !== idx))}
                          className="mt-2 text-[9px] text-red-400 hover:text-red-300 font-semibold self-end uppercase"
                        >
                          Close Position
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        case 'orders':
          return renderOrdersPanel();
        case 'watchlist':
          return renderWatchlistPanel();
        case 'depth':
          return renderDepthPanel();
        case 'holdings':
          return renderHoldingsPanel();
        case 'balance':
          return renderBalancePanel();
        default:
          return null;
      }
    };

    const renderOrdersPanel = () => (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">Trade History</h3>
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {tradeHistory.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-6 font-semibold">No executed trades in this session</p>
          ) : (
            tradeHistory.map((t, idx) => (
              <div key={idx} className="bg-slate-950/30 border border-slate-800/60 p-2.5 rounded-xl text-[10px] space-y-1 animate-fadeIn">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-bold">{t.time}</span>
                  <span className="text-[9px] bg-slate-850 px-1 py-0.5 rounded font-bold uppercase text-emerald-400">Success</span>
                </div>
                <p className="text-slate-350 font-medium leading-relaxed">{t.details}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );

    const renderWatchlistPanel = () => (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">Watchlist</h3>
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {watchlist.map((ticker) => (
            <button
              key={ticker}
              onClick={() => fetchStock(ticker)}
              className="w-full text-left bg-slate-950/30 border border-slate-850 hover:border-slate-700 p-2.5 rounded-xl transition-all flex justify-between items-center animate-fadeIn"
            >
              <div>
                <span className="font-bold text-slate-200 text-xs">{ticker}</span>
                <span className="text-[9px] text-slate-500 font-medium block">Equities Market</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    );

    const renderHoldingsPanel = () => (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">Equity Holdings</h3>
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {portfolio.map((item) => (
            <button
              key={item.symbol}
              onClick={() => fetchStock(item.symbol)}
              className="w-full text-left bg-slate-950/30 border border-slate-850 hover:border-slate-700 p-2.5 rounded-xl transition-all flex justify-between items-center animate-fadeIn"
            >
              <div>
                <span className="font-bold text-slate-200 text-xs">{item.symbol}</span>
                <span className="text-[9px] text-slate-500 font-medium block">{item.shares} Shares | Avg ${item.avgPrice.toFixed(2)}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    );

    const renderBalancePanel = () => (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">Account Balance</h3>
        <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl space-y-4 animate-fadeIn">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Available Margin Cash</span>
            <p className="text-2xl font-bold text-slate-200 mt-1">₹{balanceCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-850 text-[10px]">
            <div>
              <span className="text-slate-500 font-bold uppercase block">Used Margin</span>
              <p className="text-slate-300 font-semibold mt-0.5">₹{((foPositions.reduce((acc, pos) => acc + pos.avgPrice * pos.qty, 0)) * 80).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase block">Opening Cash</span>
              <p className="text-slate-300 font-semibold mt-0.5">₹2,00,000</p>
            </div>
          </div>
        </div>
      </div>
    );

    const renderDepthPanel = () => {
      const bids = [
        { price: currentPriceVal - 0.05, qty: 1550 },
        { price: currentPriceVal - 0.10, qty: 2400 },
        { price: currentPriceVal - 0.15, qty: 1200 },
        { price: currentPriceVal - 0.20, qty: 3100 },
        { price: currentPriceVal - 0.25, qty: 450 }
      ];
      const asks = [
        { price: currentPriceVal + 0.05, qty: 900 },
        { price: currentPriceVal + 0.10, qty: 1800 },
        { price: currentPriceVal + 0.15, qty: 3200 },
        { price: currentPriceVal + 0.20, qty: 1450 },
        { price: currentPriceVal + 0.25, qty: 2100 }
      ];
      const totalBidQty = bids.reduce((sum, b) => sum + b.qty, 0);
      const totalAskQty = asks.reduce((sum, a) => sum + a.qty, 0);
      const totalQty = totalBidQty + totalAskQty || 1;

      return (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Market Depth ({symbol})</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div>
              <p className="font-bold text-emerald-400 mb-1">Bids (Buy)</p>
              <div className="space-y-1.5">
                {bids.map((b, i) => (
                  <div key={i} className="flex justify-between relative py-0.5">
                    <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10" style={{ width: `${(b.qty / totalQty) * 100}%` }} />
                    <span className="text-emerald-400 font-bold z-10">${b.price.toFixed(2)}</span>
                    <span className="text-slate-350 z-10">{b.qty}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-red-400 mb-1">Asks (Sell)</p>
              <div className="space-y-1.5">
                {asks.map((a, i) => (
                  <div key={i} className="flex justify-between relative py-0.5">
                    <div className="absolute left-0 top-0 bottom-0 bg-red-500/10" style={{ width: `${(a.qty / totalQty) * 100}%` }} />
                    <span className="text-red-400 font-bold z-10">${a.price.toFixed(2)}</span>
                    <span className="text-slate-350 z-10">{a.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-[9px] text-slate-500 font-bold">
            <span>TOTAL BID: {totalBidQty} ({(totalBidQty / totalQty * 100).toFixed(0)}%)</span>
            <span>TOTAL ASK: {totalAskQty} ({(totalAskQty / totalQty * 100).toFixed(0)}%)</span>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4 page-enter text-left h-full flex flex-col min-h-0 select-none">
        {/* Top Control Bar */}
        <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-100 uppercase tracking-wider text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Live Terminal — {symbol}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMultiChart(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isMultiChart
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Chart
            </button>
            <button
              onClick={() => setIsMultiChart(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isMultiChart
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Multi-Chart Grid (2x2)
            </button>
          </div>
        </div>

        {/* Layout containing Main Terminal columns + Right Sidebar tabs */}
        <div className="flex flex-1 min-h-0 gap-4 overflow-hidden relative">
          
          {isMultiChart ? (
            /* Multi-Chart Grid View (Picture 4) */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-4 pr-2">
              {['AAPL', 'TSLA', 'GOOGL', 'MSFT'].map((t) => {
                const points = getSparklineData(t);
                const isGainer = points[points.length - 1] >= points[0];
                const priceVal = points[points.length - 1] * 1.5;
                const diffPct = ((points[points.length - 1] - points[0]) / points[0]) * 100;
                const sparkColor = isGainer ? '#10b981' : '#ef4444';

                return (
                  <div key={t} className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-[260px] shadow-lg hover:border-slate-700/60 transition-all">
                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{t} • 1m • BSE</h3>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Volume SMA 9</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-100 text-sm">${priceVal.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold block ${isGainer ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isGainer ? '+' : ''}{diffPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 flex items-center justify-center relative py-4">
                      <svg className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={sparkColor} stopOpacity="0.2"/>
                            <stop offset="100%" stopColor={sparkColor} stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        <path
                          fill={`url(#grad-${t})`}
                          stroke="none"
                          d={`M 0,140 ${points.map((p, i) => `${(i / (points.length - 1)) * 320},${140 - ((p - Math.min(...points)) / (Math.max(...points) - Math.min(...points) || 1)) * 100}`).join(' ')} L 320,140 Z`}
                        />
                        <polyline
                          fill="none"
                          stroke={sparkColor}
                          strokeWidth="2"
                          points={points.map((p, i) => `${(i / (points.length - 1)) * 320},${140 - ((p - Math.min(...points)) / (Math.max(...points) - Math.min(...points) || 1)) * 100}`).join(' ')}
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Split Column View (Picture 3) */
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-y-auto pb-4 pr-1">
              
              {/* Left Column: Positions Panel */}
              <div className="lg:col-span-1 bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex flex-col h-full min-h-[300px] justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/60">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Equity F&O Positions ({foPositions.length})</h3>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 mb-4 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overall Profit & Loss</span>
                    <p className={`text-xl font-bold mt-1 ${overallPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {overallPL >= 0 ? '+' : ''}${overallPL.toFixed(2)}
                    </p>
                    <button
                      onClick={() => alert('Safe Exit constraints set successfully!')}
                      className="mt-2.5 w-full bg-slate-800 hover:bg-slate-700/80 text-[10px] font-bold text-slate-300 py-1 rounded-lg border border-slate-700/50 transition-colors uppercase tracking-wider"
                    >
                      🛡️ Set Safe Exit
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {foPositions.map((pos, idx) => {
                      const pl = (pos.currentPrice - pos.avgPrice) * pos.qty;
                      return (
                        <div key={idx} className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl hover:border-slate-800 transition-all flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-100 text-xs">{pos.symbol}</span>
                              <span className="text-[9px] text-slate-500 font-medium block">Qty {pos.qty} | Avg ${pos.avgPrice.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-200 block">${(pos.qty * pos.currentPrice).toFixed(2)}</span>
                              <span className={`text-[10px] font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setFoPositions(foPositions.filter((_, i) => i !== idx))}
                            className="mt-2 text-[9px] text-red-400 hover:text-red-300 font-semibold self-end uppercase"
                          >
                            Close Position
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Middle Column: Chart View */}
              <div className="lg:col-span-2 space-y-4 h-[500px] flex flex-col min-h-[400px]">
                {/* Header metrics */}
                <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex-shrink-0 flex justify-between items-center shadow-lg">
                  <div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">{symbol} • 1m • BSE</h2>
                    <span className="text-[10px] text-slate-500 font-semibold">Volume SMA 9: 7.875M</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">${currentPriceVal.toFixed(2)}</p>
                    <span className="text-xs text-emerald-400 font-bold block">+1.25%</span>
                  </div>
                </div>

                {/* Chart Pane */}
                <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-5 flex-1 min-h-0 flex flex-col justify-between shadow-xl relative">
                  <div className="flex-1 min-h-0 relative">
                    <StockChart data={stockData?.history || []} predictions={[]} />
                  </div>
                  {/* Indicator pane below chart */}
                  <div className="h-[60px] border-t border-slate-800/50 mt-4 pt-3 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase">
                      <span>RSI 14 (SMA 1)</span>
                      <span className="text-purple-400">58.63</span>
                    </div>
                    <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="absolute left-[30%] right-[30%] top-0 h-full bg-slate-700/50 border-l border-r border-slate-600/30" />
                      <div className="absolute top-0 bottom-0 left-[58%] w-1.5 bg-purple-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Toggleable Panel */}
              <div className="lg:col-span-1 bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex flex-col h-full min-h-[300px] justify-between shadow-xl">
                {renderRightColumnContent()}
              </div>

            </div>
          )}

          {/* Rightmost Vertical Icon Sidebar (Picture 1) */}
          <div className="flex-shrink-0 w-14 bg-slate-900/20 border-l border-slate-850/60 flex flex-col items-center py-2 gap-3 z-20">
            {[
              { id: 'chain', label: 'Chain', icon: TrendingUp },
              { id: 'positions', label: 'Positions', icon: Briefcase },
              { id: 'orders', label: 'Orders', icon: Activity },
              { id: 'watchlist', label: 'Watchlist', icon: Eye },
              { id: 'depth', label: 'Depth', icon: BarChart3 },
              { id: 'holdings', label: 'Holdings', icon: Settings },
              { id: 'balance', label: 'Balance', icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = terminalTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTerminalTab(tab.id)}
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-emerald-600/10 text-emerald-400 font-bold'
                      : 'text-slate-500 hover:text-slate-350 hover:bg-slate-850/40'
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-[7px] font-bold uppercase tracking-wider scale-90 mt-1">{tab.label.slice(0, 5)}</span>
                  {isActive && (
                    <div className="absolute right-0 top-1/4 bottom-1/4 w-[2px] bg-emerald-500 rounded-l" />
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    );
  };

  const renderFooter = () => (
    <footer className="mt-12 pt-12 pb-6 border-t border-slate-850/80 text-left bg-slate-950/40 -mx-6 px-6 relative z-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Row 1: Brand details and Directory Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Address */}
          <div className="space-y-4 col-span-1">
            <div className="flex items-center gap-3">
              <span className="text-emerald-500 font-black tracking-tighter text-xl uppercase">Mora</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Vaishnavi Tech Park, South Tower, 3rd Floor<br/>
              Sarjapur Main Road, Bellandur, Bengaluru – 560103<br/>
              Karnataka, India
            </p>
            <div className="pt-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Download the App</p>
              <div className="flex gap-2.5">
                <span className="cursor-pointer bg-slate-850 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] font-bold text-slate-350 flex items-center gap-1.5 hover:text-white transition-colors">
                  🍎 App Store
                </span>
                <span className="cursor-pointer bg-slate-850 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] font-bold text-slate-350 flex items-center gap-1.5 hover:text-white transition-colors">
                  🤖 Play Store
                </span>
              </div>
            </div>
          </div>

          {/* Directory Column 1: GROWW */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">GROWW</h4>
            <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-semibold">
              <span className="hover:text-emerald-405 cursor-pointer">About Us</span>
              <span className="hover:text-emerald-405 cursor-pointer">Pricing</span>
              <span className="hover:text-emerald-405 cursor-pointer">Blog</span>
              <span className="hover:text-emerald-405 cursor-pointer">Media & Press</span>
              <span className="hover:text-emerald-405 cursor-pointer">Careers</span>
              <span className="hover:text-emerald-405 cursor-pointer">Help & Support</span>
              <span className="hover:text-emerald-405 cursor-pointer">Trust & Safety</span>
              <span className="hover:text-emerald-405 cursor-pointer">Investor Relations</span>
            </div>
          </div>

          {/* Directory Column 2: PRODUCTS */}
          <div className="space-y-2 col-span-2 grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">PRODUCTS</h4>
              <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-semibold mt-2">
                <span className="hover:text-emerald-405 cursor-pointer">Stocks</span>
                <span className="hover:text-emerald-405 cursor-pointer">F&O</span>
                <span className="hover:text-emerald-405 cursor-pointer">MTF</span>
                <span className="hover:text-emerald-405 cursor-pointer">ETF</span>
                <span className="hover:text-emerald-405 cursor-pointer">IPO</span>
                <span className="hover:text-emerald-405 cursor-pointer">Mutual Funds</span>
                <span className="hover:text-emerald-405 cursor-pointer">Commodities</span>
              </div>
            </div>
            <div className="pt-6">
              <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-semibold">
                <span className="hover:text-emerald-405 cursor-pointer">915 Terminal</span>
                <span className="hover:text-emerald-405 cursor-pointer">Stock Screens</span>
                <span className="hover:text-emerald-405 cursor-pointer">Algo Trading</span>
                <span className="hover:text-emerald-405 cursor-pointer">Groww Charts</span>
                <span className="hover:text-emerald-405 cursor-pointer">Groww Digest</span>
                <span className="hover:text-emerald-405 cursor-pointer">Demat Account</span>
                <span className="hover:text-emerald-405 cursor-pointer">Groww AMC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Category lists (Market indices / sections) */}
        <div className="border-t border-slate-850 pt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="border-b border-emerald-500 pb-1 cursor-pointer">Share Market</span>
            <span className="hover:text-emerald-405 cursor-pointer">Indices</span>
            <span className="hover:text-emerald-405 cursor-pointer">F&O</span>
            <span className="hover:text-emerald-405 cursor-pointer">Mutual Funds</span>
            <span className="hover:text-emerald-405 cursor-pointer">ETFs</span>
            <span className="hover:text-emerald-405 cursor-pointer">Funds By Groww</span>
            <span className="hover:text-emerald-405 cursor-pointer">Calculators</span>
            <span className="hover:text-emerald-405 cursor-pointer">IPO</span>
            <span className="hover:text-emerald-405 cursor-pointer">Miscellaneous</span>
          </div>
        </div>

        {/* Row 3: Popular Stocks List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 pt-4 text-xs text-slate-500 font-semibold border-t border-slate-850/40">
          <div className="space-y-1">
            <p className="font-bold text-slate-400 mb-1">Top Gainers Stocks</p>
            <p className="hover:text-emerald-405 cursor-pointer">Tata Motors</p>
            <p className="hover:text-emerald-405 cursor-pointer">NHPC</p>
            <p className="hover:text-emerald-405 cursor-pointer">ITC</p>
            <p className="hover:text-emerald-405 cursor-pointer">Wipro</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-400 mb-1">Top Losers Stocks</p>
            <p className="hover:text-emerald-405 cursor-pointer">IREDA</p>
            <p className="hover:text-emerald-405 cursor-pointer">State Bank of India</p>
            <p className="hover:text-emerald-405 cursor-pointer">Adani Power</p>
            <p className="hover:text-emerald-405 cursor-pointer">CDSL</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-400 mb-1">Most Traded Stocks</p>
            <p className="hover:text-emerald-405 cursor-pointer">Tata Steel</p>
            <p className="hover:text-emerald-405 cursor-pointer">Tata Power</p>
            <p className="hover:text-emerald-405 cursor-pointer">Bharat Heavy Electricals</p>
            <p className="hover:text-emerald-405 cursor-pointer">Indian Oil Corporation</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-400 mb-1">Stocks Feed</p>
            <p className="hover:text-emerald-405 cursor-pointer">Suzlon Energy</p>
            <p className="hover:text-emerald-405 cursor-pointer">Zomato (Eternal)</p>
            <p className="hover:text-emerald-405 cursor-pointer">Yes Bank</p>
            <p className="hover:text-emerald-405 cursor-pointer">Infosys</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-400 mb-1">FII DII Activity</p>
            <p className="hover:text-emerald-405 cursor-pointer">IRFC</p>
            <p className="hover:text-emerald-405 cursor-pointer">Bharat Electronics</p>
            <p className="hover:text-emerald-405 cursor-pointer">HDFC Bank</p>
            <p className="hover:text-emerald-405 cursor-pointer">Reliance Power</p>
          </div>
        </div>

        {/* Row 4: Copyright and version */}
        <div className="border-t border-slate-850 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <span>© 2016-2026 Mora Terminal. All rights reserved.</span>
          <span>Version: 7.7.4</span>
        </div>

      </div>
    </footer>
  );

  const renderOrderFormModal = () => {
    if (!showOrderModal || !selectedOption) return null;
    const isBuy = orderType === 'BUY';
    const premiumUSD = selectedOption.price;
    const premiumINR = premiumUSD * 80;
    const reqCostINR = premiumINR * orderQty;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn text-left select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[390px] shadow-2xl overflow-hidden relative">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-850 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm truncate max-w-[240px] uppercase">{selectedOption.name}</h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded-full">+75</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                ₹{premiumINR.toFixed(2)} <span className="text-emerald-405 font-bold ml-1">(+200.87%)</span>
                <span className="text-slate-600 mx-1.5">|</span>
                <span className="text-emerald-405 hover:underline cursor-pointer">Depth</span>
              </p>
            </div>
            <button
              onClick={() => setShowOrderModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            
            {/* Toggles */}
            <div className="flex items-center justify-between">
              {/* Product Tabs */}
              <div className="bg-slate-950/40 p-0.5 rounded-lg border border-slate-850 flex gap-0.5">
                {['DELIVERY', 'INTRADAY'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setOrderProduct(p)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${
                      orderProduct === p
                        ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/30'
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {p === 'DELIVERY' ? 'Delivery' : 'Intraday'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
                {/* Buy / Sell Toggle Switch */}
                <div className="bg-slate-950/40 p-0.5 rounded-lg border border-slate-850 flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => setOrderType('BUY')}
                    className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-all ${
                      isBuy ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('SELL')}
                    className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-all ${
                      !isBuy ? 'bg-red-650 text-white' : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>
            </div>

            {/* Qty field */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Qty NSE</span>
                <span className="text-[10px] text-slate-500 font-semibold block">lot of 75</span>
              </div>
              <div className="flex items-center bg-slate-950/40 border border-slate-850 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={() => setOrderQty((q) => Math.max(75, q - 75))}
                  className="w-8 h-8 rounded-lg bg-slate-850 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors active:bg-slate-800"
                >
                  —
                </button>
                <span className="w-14 text-center font-bold text-slate-100 text-sm">{orderQty}</span>
                <button
                  type="button"
                  onClick={() => setOrderQty((q) => q + 75)}
                  className="w-8 h-8 rounded-lg bg-slate-850 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors active:bg-slate-800"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price field */}
            <div className="flex justify-between items-center py-2.5">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Price</span>
                <button
                  type="button"
                  onClick={() => setOrderPriceType(orderPriceType === 'MARKET' ? 'LIMIT' : 'MARKET')}
                  className="text-[10px] font-bold text-emerald-450 hover:underline flex items-center gap-1 mt-0.5"
                >
                  {orderPriceType === 'MARKET' ? 'Market' : 'Limit'} <Settings className="w-2.5 h-2.5" />
                </button>
              </div>
              {orderPriceType === 'MARKET' ? (
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl px-4 py-2.5 w-32 text-center text-slate-500 font-bold text-xs uppercase tracking-wider">
                  At market
                </div>
              ) : (
                <input
                  type="number"
                  step="0.05"
                  value={orderLimitPrice}
                  onChange={(e) => setOrderLimitPrice(e.target.value)}
                  className="bg-slate-950/40 border border-slate-850 rounded-xl px-4 py-2 text-right w-32 text-slate-100 font-bold text-sm focus:border-emerald-500/50 focus:ring-0 outline-none"
                />
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="bg-slate-950/40 p-4 border-t border-slate-850 flex flex-col gap-4">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Balance: ₹{balanceCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="flex items-center gap-1">Approx req: ₹{reqCostINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 🔄</span>
            </div>
            <button
              onClick={handleExecuteOrder}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md ${
                isBuy
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
                  : 'bg-red-650 hover:bg-red-500 shadow-red-950/20'
              }`}
            >
              {isBuy ? 'Buy' : 'Sell'}
            </button>
          </div>

        </div>
      </div>
    );
  };

  const renderDirectPanel = (panel) => {
    if (!stockData) {
      return (
        <div className="page-enter text-left">
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Activity className="w-12 h-12 mb-3 text-slate-650" />
            <p className="text-lg font-medium">No stock data loaded</p>
            <p className="text-sm">Use the search bar to analyze a stock first</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 page-enter text-left">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{symbol}</h1>
          <span className="text-slate-500">—</span>
          <span className="text-slate-400 capitalize">{panel} Analysis</span>
        </div>

        {stockData.info?.is_simulated && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <span className="font-bold uppercase bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">Demo Mode</span>
            <span>Yahoo Finance API is rate-limited. Showing real-time simulated market data.</span>
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6">
          {panel === 'technical' && (
            <TechnicalPanel data={stockData.technical} signals={stockData.signals} />
          )}
          {panel === 'sentiment' && (
            <SentimentPanel data={stockData.sentiment} />
          )}
          {panel === 'fundamentals' && (
            <FundamentalsPanel data={stockData.fundamentals} />
          )}
          {panel === 'predictions' && (
            <PredictionPanel
              data={stockData.predictions}
              currentPrice={stockData.info?.currentPrice}
            />
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'analysis':
        return renderAnalysis();
      case 'watchlist':
        return renderWatchlist();
      case 'portfolio':
        return renderPortfolio();
      case 'profile':
        return renderProfile();
      case 'account_settings':
        return renderAccountSettings();
      case 'security_settings':
        return renderSecuritySettings();
      case 'terminal':
        return renderTerminal();
      case 'mutual_funds':
        return <MutualFundsPanel token={token} onSearchFund={(sym) => { setSymbol(sym); setActiveSection('analysis'); }} />;
      case 'technical':
      case 'sentiment':
      case 'fundamentals':
      case 'predictions':
        return renderDirectPanel(activeSection);
      default:
        return renderDashboard();
    }
  };

  return (
    <div className={`dashboard-layout ${theme === 'light' ? 'light-mode' : ''}`}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main lg:ml-[260px]">
        <Navbar
          onSearch={handleSearch}
          user={user}
          activeSection={activeSection}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={onLogout}
          onSectionChange={setActiveSection}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="dashboard-content">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {renderOrderFormModal()}
    </div>
  );
};

export default Dashboard;
