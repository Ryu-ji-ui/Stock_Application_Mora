import React from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus, Info, Calendar, ArrowUpRight } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const SentimentPanel = ({ data }) => {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <MessageSquare className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="text-lg font-medium">No sentiment data available</p>
        <p className="text-sm">Search for a stock to see sentiment analysis</p>
      </div>
    );
  }

  const score = data.avg_sentiment ?? data.score ?? 0;
  const label = data.label ?? 'Neutral';
  const newsCount = data.news_count ?? 0;
  const posCount = data.pos_count ?? 0;
  const negCount = data.neg_count ?? 0;
  const neuCount = data.neu_count ?? 0;
  const articles = data.articles ?? [];

  const normalizedScore = Math.max(-1, Math.min(1, score));
  const barPercent = ((normalizedScore + 1) / 2) * 100;

  const getScoreColor = () => {
    if (normalizedScore > 0.05) return 'text-emerald-400';
    if (normalizedScore < -0.05) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getBarGradient = () => {
    if (normalizedScore > 0.05) return 'from-emerald-600 to-emerald-400';
    if (normalizedScore < -0.05) return 'from-red-600 to-red-400';
    return 'from-yellow-600 to-yellow-400';
  };

  const getBadgeStyle = () => {
    const l = label.toLowerCase();
    if (l.includes('positive') || l.includes('bullish'))
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (l.includes('negative') || l.includes('bearish'))
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  };

  const SentimentIcon = () => {
    const l = label.toLowerCase();
    if (l.includes('positive') || l.includes('bullish'))
      return <TrendingUp className="w-6 h-6 text-emerald-400" />;
    if (l.includes('negative') || l.includes('bearish'))
      return <TrendingDown className="w-6 h-6 text-red-400" />;
    return <Minus className="w-6 h-6 text-yellow-400" />;
  };

  // Doughnut Chart Data for Sentiment Distribution
  const chartData = {
    labels: ['Bullish / Positive', 'Neutral', 'Bearish / Negative'],
    datasets: [
      {
        data: [posCount, neuCount, negCount],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Emerald
          'rgba(245, 158, 11, 0.8)', // Amber
          'rgba(239, 68, 68, 0.8)',   // Red
        ],
        borderColor: '#0f172a',
        borderWidth: 2.5,
        hoverOffset: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: { size: 11, family: 'Inter' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  const formatPublishTime = (timestamp) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Section: Score Banner & Distribution Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sentiment Gauge & Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Sentiment Score</p>
                <p className={`text-4xl font-bold mt-1 ${getScoreColor()}`}>
                  {normalizedScore >= 0 ? '+' : ''}{normalizedScore.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <SentimentIcon />
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getBadgeStyle()}`}>
                  {label}
                </span>
              </div>
            </div>

            {/* Score Slider Indicator */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase">
                <span>Bearish</span>
                <span>Neutral</span>
                <span>Bullish</span>
              </div>
              <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getBarGradient()} rounded-full transition-all duration-700`}
                  style={{ width: `${barPercent}%` }}
                />
                <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-600 -translate-x-1/2" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>-1.0</span>
                <span>0.0</span>
                <span>+1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Distribution Pie Chart */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Headline Distribution</span>
          <div className="h-[120px] relative">
            {newsCount > 0 ? (
              <Doughnut data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">No distribution data</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Total Articles Analyzed</p>
          <p className="text-xl font-bold text-slate-100">{newsCount}</p>
        </div>
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Bullish Mentions</p>
          <p className="text-xl font-bold text-emerald-400">{posCount}</p>
        </div>
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Bearish Mentions</p>
          <p className="text-xl font-bold text-red-400">{negCount}</p>
        </div>
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Confidence Score</p>
          <p className="text-xl font-bold text-slate-100">
            {newsCount >= 8 ? 'High' : newsCount >= 4 ? 'Medium' : 'Low'}
          </p>
        </div>
      </div>

      {/* Analyzed News Articles List */}
      {articles.length > 0 && (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-slate-850">
            <h3 className="text-sm font-semibold text-slate-200">Analyzed News Headlines</h3>
          </div>
          <div className="divide-y divide-slate-850 max-h-[400px] overflow-y-auto">
            {articles.map((item, idx) => {
              const labelColor = 
                item.sentiment === 'Positive' ? 'bg-emerald-500/15 text-emerald-400' :
                item.sentiment === 'Negative' ? 'bg-red-500/15 text-red-400' :
                'bg-yellow-500/15 text-yellow-400';
              return (
                <div key={idx} className="p-4 hover:bg-slate-800/25 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1 leading-snug"
                    >
                      <span className="truncate">{item.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    </a>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>{item.publisher}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatPublishTime(item.time)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${labelColor} uppercase tracking-wider`}>
                      {item.sentiment} ({item.score >= 0 ? '+' : ''}{item.score.toFixed(2)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentPanel;
