import React from 'react';
import { FileText, TrendingUp, BarChart3, DollarSign } from 'lucide-react';

const FundamentalsPanel = ({ data }) => {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <FileText className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-lg font-medium">No fundamentals data available</p>
        <p className="text-sm">Search for a stock to see fundamental metrics</p>
      </div>
    );
  }

  const formatMarketCap = (val) => {
    if (val === null || val === undefined) return 'N/A';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatValue = (val, isPercentage = false) => {
    if (val === null || val === undefined) return 'N/A';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (isPercentage) return `${(num * 100).toFixed(2)}%`;
    return num.toFixed(2);
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined) return 'N/A';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `$${num.toFixed(2)}`;
  };

  const formatLargeNumber = (val) => {
    if (val === null || val === undefined) return 'N/A';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const categories = [
    {
      title: 'Valuation Metrics',
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      items: [
        { label: 'Market Cap', value: formatMarketCap(data.marketCap ?? data.market_cap) },
        { label: 'P/E Ratio', value: formatValue(data.trailingPE ?? data.pe_ratio) },
        { label: 'Forward P/E', value: formatValue(data.forwardPE ?? data.forward_pe) },
        { label: 'Price-to-Book (P/B)', value: formatValue(data.priceToBook) },
        { label: 'Dividend Yield', value: formatValue(data.dividendYield, true) },
      ],
    },
    {
      title: 'Growth & Profitability',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      items: [
        { label: 'EPS (Trailing)', value: formatPrice(data.trailingEps ?? data.eps) },
        { label: 'Revenue Growth (YoY)', value: formatValue(data.revenueGrowth, true) },
        { label: 'Operating Margin', value: formatValue(data.operatingMargins, true) },
      ],
    },
    {
      title: 'Financial Health',
      icon: BarChart3,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      items: [
        { label: 'Total Revenue', value: formatMarketCap(data.totalRevenue) },
        { label: 'Total Debt', value: formatMarketCap(data.totalDebt) },
        { label: 'Quick Ratio', value: formatValue(data.quickRatio) },
      ],
    },
    {
      title: 'Market Trading Activity',
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      items: [
        { label: 'Trading Volume', value: formatLargeNumber(data.volume) },
        { label: 'Average Volume (10D)', value: formatLargeNumber(data.averageVolume) },
        { label: '52-Week High', value: formatPrice(data.fiftyTwoWeekHigh) },
        { label: '52-Week Low', value: formatPrice(data.fiftyTwoWeekLow) },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/60">
                <div className={`w-9 h-9 rounded-xl ${cat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">{cat.title}</h3>
              </div>

              <div className="space-y-3.5">
                {cat.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">{item.label}</span>
                    <span className="font-bold text-slate-200 text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FundamentalsPanel;
