import React from 'react';
import { Activity, TrendingUp, TrendingDown, Info } from 'lucide-react';

const TechnicalPanel = ({ data, signals }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Activity className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="text-lg font-medium">No technical data available</p>
        <p className="text-sm">Search for a stock to see technical indicators</p>
      </div>
    );
  }

  const latest = data[data.length - 1] || {};
  const rsi = latest.RSI ?? latest.rsi ?? null;
  const macd = latest.MACD ?? latest.macd ?? null;
  const macdSignal = latest.MACD_Signal ?? latest.macd_signal ?? null;
  const sma20 = latest.SMA_20 ?? latest.sma_20 ?? latest.SMA20 ?? null;
  const sma50 = latest.SMA_50 ?? latest.sma_50 ?? latest.SMA50 ?? null;
  const ema12 = latest.EMA_12 ?? latest.ema_12 ?? null;
  const ema26 = latest.EMA_26 ?? latest.ema_26 ?? null;
  const bbUpper = latest.BB_Upper ?? latest.bb_upper ?? null;
  const bbLower = latest.BB_Lower ?? latest.bb_lower ?? null;
  const score = latest.Overall_Score ?? latest.overall_score ?? signals?.score ?? 0;
  const closePrice = latest.Close ?? latest.close ?? 0;

  const getRsiColor = (val) => {
    if (val === null || val === undefined) return 'text-slate-400';
    if (val < 30) return 'text-emerald-400';
    if (val > 70) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getRsiLabel = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (val < 30) return 'Oversold (Buy)';
    if (val > 70) return 'Overbought (Sell)';
    return 'Neutral';
  };

  const getRsiBg = (val) => {
    if (val === null || val === undefined) return 'bg-slate-500/10';
    if (val < 30) return 'bg-emerald-500/10';
    if (val > 70) return 'bg-red-500/10';
    return 'bg-yellow-500/10';
  };

  const formatNumber = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return typeof val === 'number' ? val.toFixed(2) : String(val);
  };

  const getGaugeText = (scoreValue) => {
    if (scoreValue >= 3) return { text: 'Strong Buy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (scoreValue >= 1) return { text: 'Buy', color: 'text-emerald-400/80', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' };
    if (scoreValue <= -3) return { text: 'Strong Sell', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    if (scoreValue <= -1) return { text: 'Sell', color: 'text-red-400/80', bg: 'bg-red-500/5', border: 'border-red-500/20' };
    return { text: 'Neutral', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  };

  const gauge = getGaugeText(score);

  const indicators = [
    {
      label: 'RSI (14)',
      value: formatNumber(rsi),
      subLabel: getRsiLabel(rsi),
      color: getRsiColor(rsi),
      bg: getRsiBg(rsi),
    },
    {
      label: 'MACD (12, 26, 9)',
      value: formatNumber(macd),
      subLabel: macd !== null && macdSignal !== null ? (macd > macdSignal ? 'Bullish Cross' : 'Bearish Cross') : 'N/A',
      color: macd !== null && macdSignal !== null ? (macd > macdSignal ? 'text-emerald-400' : 'text-red-400') : 'text-slate-400',
      bg: macd !== null && macdSignal !== null ? (macd > macdSignal ? 'bg-emerald-500/10' : 'bg-red-500/10') : 'bg-slate-500/10',
    },
    {
      label: 'Bollinger Bands',
      value: `${formatNumber(bbLower)} - ${formatNumber(bbUpper)}`,
      subLabel: closePrice && bbUpper && closePrice > bbUpper * 0.97 ? 'Near Upper Band' : closePrice && bbLower && closePrice < bbLower * 1.03 ? 'Near Lower Band' : 'Inside Bands',
      color: closePrice && bbUpper && closePrice > bbUpper * 0.97 ? 'text-red-400' : closePrice && bbLower && closePrice < bbLower * 1.03 ? 'text-emerald-400' : 'text-slate-300',
      bg: 'bg-slate-500/5',
    },
    {
      label: 'EMA (12, 26) Cross',
      value: `${formatNumber(ema12)} / ${formatNumber(ema26)}`,
      subLabel: ema12 && ema26 && ema12 > ema26 ? 'Bullish (12 > 26)' : 'Bearish (12 < 26)',
      color: ema12 && ema26 && ema12 > ema26 ? 'text-emerald-400' : 'text-red-400',
      bg: ema12 && ema26 && ema12 > ema26 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
  ];

  const gaugePercent = ((score + 4) / 8) * 100;
  const recentData = data.slice(-8).reverse();

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className={`md:col-span-2 flex items-center gap-4 p-5 rounded-2xl border ${gauge.bg} ${gauge.border} ${gauge.color}`}>
          {score >= 1 ? (
            <TrendingUp className="w-8 h-8 flex-shrink-0" />
          ) : score <= -1 ? (
            <TrendingDown className="w-8 h-8 flex-shrink-0" />
          ) : (
            <Activity className="w-8 h-8 flex-shrink-0" />
          )}
          <div>
            <span className="font-bold text-xl uppercase tracking-wider">{gauge.text} Indicator</span>
            <p className="text-sm opacity-90 mt-1 leading-relaxed">
              Overall score is <strong className="underline">{score > 0 ? `+${score}` : score}</strong> (out of -4 to +4 range).
              {score >= 3 && " Technical indicators show very strong buying momentum across multiple timelines."}
              {(score === 1 || score === 2) && " Moving averages and momentum oscillators suggest a favorable buy zone."}
              {score === 0 && " Indicators are split equally. The stock is currently in a neutral consolidation phase."}
              {(score === -1 || score === -2) && " Momentum is shifting downward. Caution is advised as indicators show sell triggers."}
              {score <= -3 && " Heavy selling pressure detected. Most indicators point to a strong bearish momentum."}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Summary Meter</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${gauge.bg} ${gauge.color}`}>{gauge.text}</span>
          </div>

          <div className="space-y-2.5">
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full"
                style={{ width: '100%' }}
              />
              <div 
                className="absolute top-[-3px] w-3 h-3 bg-white border border-slate-950 rounded-full shadow-lg transition-all duration-700 -translate-x-1/2"
                style={{ left: `${gaugePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Strong Sell</span>
              <span>Neutral</span>
              <span>Strong Buy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((ind) => (
          <div
            key={ind.label}
            className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4.5 hover:bg-slate-800/40 transition-all duration-200"
          >
            <p className="text-xs font-medium text-slate-500 mb-1">{ind.label}</p>
            <p className="text-lg font-bold text-slate-100 mb-2">{ind.value}</p>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ind.bg} ${ind.color}`}>
              {ind.subLabel}
            </span>
          </div>
        ))}
      </div>

      {recentData.length > 0 && (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-slate-850 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Historical Technical Details</h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Showing last {recentData.length} periods
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/20">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">RSI (14)</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">MACD Line</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Signal Line</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SMA 20</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bollinger Band (L / U)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {recentData.map((row, idx) => {
                  const rowDate = row.Date || row.timestamp || row.date || '';
                  const rowRsi = row.RSI ?? row.rsi;
                  const rowMacd = row.MACD ?? row.macd;
                  const rowMacdSig = row.MACD_Signal ?? row.macd_signal;
                  const rowSma20 = row.SMA_20 ?? row.sma_20 ?? row.SMA20;
                  const rowUpper = row.BB_Upper ?? row.bb_upper;
                  const rowLower = row.BB_Lower ?? row.bb_lower;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/25 transition-colors">
                      <td className="px-5 py-3 text-slate-400 font-medium">
                        {rowDate ? new Date(rowDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        <span className={`px-2 py-0.5 rounded text-xs ${getRsiBg(rowRsi)} ${getRsiColor(rowRsi)}`}>
                          {formatNumber(rowRsi)}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-semibold ${rowMacd > rowMacdSig ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatNumber(rowMacd)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-400 font-medium">
                        {formatNumber(rowMacdSig)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-300 font-medium">
                        ${formatNumber(rowSma20)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-400 font-medium">
                        ${formatNumber(rowLower)} - ${formatNumber(rowUpper)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalPanel;
