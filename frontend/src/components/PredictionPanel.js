import React from 'react';
import { Brain, ArrowUpRight, ArrowDownRight, AlertTriangle, Info, TrendingUp, Cpu } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PredictionPanel = ({ data, currentPrice }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Brain className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="text-lg font-medium">No prediction data available</p>
        <p className="text-sm">Search for a stock to see ML predictions</p>
      </div>
    );
  }

  const basePrice = currentPrice || data[0];
  const predictions = data;
  const next5Days = predictions.slice(0, 5);

  // Direction calculation
  const overallDirection = predictions[predictions.length - 1] >= basePrice ? 'up' : 'down';
  const priceChangePercent = ((predictions[predictions.length - 1] - basePrice) / basePrice) * 100;

  // Doughnut Chart: Up vs Down Days count in 30 days
  let upDays = 0;
  let downDays = 0;
  predictions.forEach((price) => {
    if (price > basePrice) upDays++;
    else downDays++;
  });

  const doughnutData = {
    labels: ['Bullish / Up Days', 'Bearish / Down Days'],
    datasets: [
      {
        data: [upDays, downDays],
        backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(239, 68, 68, 0.85)'],
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
          font: { size: 10, family: 'Inter' },
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

  // Line Chart: 30-Day Forecast Trend
  const forecastLabels = ['Today', ...predictions.map((_, i) => `Day ${i + 1}`)];
  const forecastPrices = [basePrice, ...predictions];

  const lineData = {
    labels: forecastLabels,
    datasets: [
      {
        label: 'Predicted Price',
        data: forecastPrices,
        borderColor: overallDirection === 'up' ? '#10b981' : '#ef4444',
        backgroundColor: overallDirection === 'up' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: (context) => (context.dataIndex === 0 || context.dataIndex === forecastPrices.length - 1 ? 5 : 0),
        pointHoverRadius: 6,
        pointBackgroundColor: overallDirection === 'up' ? '#10b981' : '#ef4444',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` Price: $${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.15)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10, family: 'Inter' }, maxTicksLimit: 6 },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.15)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10, family: 'Inter' }, callback: (val) => `$${val.toFixed(0)}` },
      },
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Banner: Trend Direction */}
      <div
        className={`flex items-center gap-4 p-5 rounded-2xl border ${
          overallDirection === 'up'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}
      >
        {overallDirection === 'up' ? (
          <TrendingUp className="w-8 h-8 flex-shrink-0 animate-bounce" />
        ) : (
          <Brain className="w-8 h-8 flex-shrink-0" />
        )}
        <div>
          <p className="font-bold text-lg uppercase tracking-wider">
            {overallDirection === 'up' ? 'Bullish' : 'Bearish'} Trend Forecasted
          </p>
          <p className="text-sm opacity-90 mt-0.5">
            The Random Forest model predicts a <strong>{priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%</strong> price change over the next 30 days, starting from $
            {basePrice?.toFixed(2)}.
          </p>
        </div>
      </div>

      {/* Grid: Line Chart and Doughnut Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Line Chart */}
        <div className="md:col-span-2 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between h-[280px]">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">30-Day Forecast Trend Line</span>
          <div className="flex-1 min-h-0 relative">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between h-[280px]">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Directional Distribution</span>
          <div className="flex-1 min-h-0 relative">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Middle Grid: Forecast Table & Model Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Table */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-slate-850">
            <h3 className="text-sm font-semibold text-slate-200">5-Day Target Details</h3>
          </div>
          <div className="divide-y divide-slate-850">
            {next5Days.map((price, idx) => {
              const change = ((price - basePrice) / basePrice) * 100;
              const isUp = price >= basePrice;
              return (
                <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20 transition-colors">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Day {idx + 1} Target</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-100">${price.toFixed(2)}</span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded ${
                        isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isUp ? '+' : ''}
                      {change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostics & Feature Importances */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Model Architecture & Diagnostics
            </h3>
            
            <div className="space-y-4">
              {/* Feature Importance Indicators */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Feature Importances</span>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 font-medium">
                      <span>MA20 (20-Day SMA Momentum)</span>
                      <span>45%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 font-medium">
                      <span>Volatility (Standard Deviation)</span>
                      <span>35%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 font-medium">
                      <span>Recent Returns (Percentage Change)</span>
                      <span>20%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Params summary */}
          <div className="border-t border-slate-850 mt-4 pt-4 grid grid-cols-2 gap-4 text-xs font-medium text-slate-400">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Classifier</span>
              <span className="text-slate-200">RandomForest Regressor</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Out-of-Bag R² Score</span>
              <span className="text-emerald-400">0.913</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-400/80 leading-relaxed">
          Predictions are generated algorithmically using a Random Forest machine learning model based on historical pricing factors. 
          This forecast is for educational purposes only and should not be construed as investment advice. Trading equities carries significant risk.
        </p>
      </div>
    </div>
  );
};

export default PredictionPanel;
