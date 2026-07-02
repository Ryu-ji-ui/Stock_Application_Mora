import React from 'react';
import { BarChart3, DollarSign, Brain } from 'lucide-react';

const StatsCards = ({ stocksAnalyzed, portfolioValue, predictionsMade }) => {
  const cards = [
    {
      label: 'Stocks Analyzed',
      value: stocksAnalyzed ?? 0,
      format: (v) => v.toLocaleString(),
      icon: BarChart3,
      colorClass: 'stat-card-purple',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Portfolio Value',
      value: portfolioValue ?? 0,
      format: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      colorClass: 'stat-card-emerald',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Predictions Made',
      value: predictionsMade ?? 0,
      format: (v) => v.toLocaleString(),
      icon: Brain,
      colorClass: 'stat-card-blue',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`stat-card ${card.colorClass}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-slate-100">
                  {card.format(card.value)}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
