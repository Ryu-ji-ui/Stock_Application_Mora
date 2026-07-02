import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, Briefcase, Plus, Trash2, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

const TOP_FUNDS = [
  { symbol: 'VFIAX', name: 'Vanguard 500 Index Fund', type: 'Index', aum: '$1.14T' },
  { symbol: 'FXAIX', name: 'Fidelity 500 Index Fund', type: 'Index', aum: '$540B' },
  { symbol: 'SWPPX', name: 'Schwab S&P 500 Index', type: 'Index', aum: '$85B' },
  { symbol: 'VTSAX', name: 'Vanguard Total Stock Market', type: 'Index', aum: '$1.5T' },
  { symbol: 'PRGFX', name: 'T. Rowe Price Growth Stock', type: 'Growth', aum: '$52B' },
];

const MutualFundsPanel = ({ token, onSearchFund }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    const authToken = token || localStorage.getItem('mora_token');
    if (!authToken) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/mutual-portfolio`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setPortfolio(res.data);
    } catch (err) {
      console.error('Failed to fetch MF portfolio', err);
    } finally {
      setLoading(false);
    }
  };

  const addFundToPortfolio = async (symbol) => {
    const authToken = token || localStorage.getItem('mora_token');
    if (!authToken) {
      alert("Please log in to add to portfolio.");
      return;
    }
    const units = prompt(`How many units of ${symbol} are you adding?`, "10");
    if (!units || isNaN(units)) return;
    
    const nav_price = prompt(`What is the NAV price for ${symbol}?`, "100.00");
    if (!nav_price || isNaN(nav_price)) return;

    try {
      await axios.post(
        `${API_BASE}/mutual-portfolio`,
        { symbol, units: parseFloat(units), nav_price: parseFloat(nav_price) },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      fetchPortfolio();
    } catch (err) {
      console.error('Failed to add to MF portfolio', err);
      alert('Failed to add fund.');
    }
  };

  const removeFund = async (id) => {
    const authToken = token || localStorage.getItem('mora_token');
    if (!authToken) return;
    try {
      await axios.delete(`${API_BASE}/mutual-portfolio/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchPortfolio();
    } catch (err) {
      console.error('Failed to remove MF', err);
    }
  };

  return (
    <div className="space-y-6 page-enter text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-400" />
          Mutual Funds
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Track and analyze top performing mutual funds.
        </p>
      </div>

      {/* Top Funds Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-200 mb-4">Popular Mutual Funds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {TOP_FUNDS.map((fund) => (
            <motion.div 
              key={fund.symbol} 
              whileHover={{ y: -4 }}
              className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-5 glass-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-100 text-lg">{fund.symbol}</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded uppercase">{fund.type}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">{fund.name}</p>
                <p className="text-xs font-semibold text-slate-500 mt-2">AUM: <span className="text-slate-300">{fund.aum}</span></p>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => onSearchFund(fund.symbol)}
                  className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-lg transition-colors font-medium text-center"
                >
                  Analyze
                </button>
                <button
                  onClick={() => addFundToPortfolio(fund.symbol)}
                  className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 p-2 rounded-lg transition-colors flex items-center justify-center"
                  title="Add to Portfolio"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mutual Fund Portfolio */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-700/40 rounded-2xl p-6 glass-card-hover">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            My Mutual Fund Portfolio
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="spinner" /></div>
        ) : portfolio.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700/50 rounded-xl">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p>Your mutual fund portfolio is empty.</p>
            <p className="text-xs mt-1">Add popular funds from the list above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Fund</th>
                  <th className="pb-3 font-semibold">Units</th>
                  <th className="pb-3 font-semibold">Avg NAV</th>
                  <th className="pb-3 font-semibold">Total Invested</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {portfolio.map((item) => {
                  const invested = item.units * item.nav_price;
                  return (
                    <tr key={item.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 font-bold text-slate-200">
                        {item.symbol}
                        <span className="block text-[10px] text-slate-500 font-normal">Added {new Date(item.added_at).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 text-slate-300">{item.units.toFixed(2)}</td>
                      <td className="py-4 text-slate-300">${item.nav_price.toFixed(2)}</td>
                      <td className="py-4 font-medium text-emerald-400">${invested.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => removeFund(item.id)}
                          className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MutualFundsPanel;
