import React, { useRef, useEffect, useState } from 'react';

const StockChart = ({ data = [], predictions = [] }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: Math.max(100, entry.contentRect.width),
          height: Math.max(100, entry.contentRect.height),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full min-h-[300px] flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-base font-medium">No chart data available</p>
          <p className="text-sm text-slate-600 mt-1">Search for a stock to see price history</p>
        </div>
      </div>
    );
  }

  // Slice last 60 bars for candle resolution
  const recentData = data.slice(-60);
  const N = recentData.length;

  // Extract prices & volume
  const candles = recentData.map((d) => ({
    open: d.Open ?? d.open ?? d.Close ?? d.close ?? 0,
    high: d.High ?? d.high ?? d.Close ?? d.close ?? 0,
    low: d.Low ?? d.low ?? d.Close ?? d.close ?? 0,
    close: d.Close ?? d.close ?? 0,
    volume: d.Volume ?? d.volume ?? 0,
    date: d.Date || d.timestamp || d.date || '',
  }));

  // Parse predictions
  const predValues = predictions.map((p) =>
    typeof p === 'object' ? (p.price ?? p.predicted ?? p.value ?? 0) : p
  );

  // Price range calculation
  let minPrice = Math.min(...candles.map(c => c.low));
  let maxPrice = Math.max(...candles.map(c => c.high));
  
  if (predValues.length > 0) {
    const predMin = Math.min(...predValues);
    const predMax = Math.max(...predValues);
    minPrice = Math.min(minPrice, predMin);
    maxPrice = Math.max(maxPrice, predMax);
  }

  const pad = (maxPrice - minPrice) * 0.1 || 1.0;
  minPrice = Math.max(0, minPrice - pad);
  maxPrice = maxPrice + pad;
  const priceRange = maxPrice - minPrice;

  // Volume range calculation
  const maxVolume = Math.max(...candles.map(c => c.volume)) || 1;

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Retrieve theme colors dynamically
    const computedStyles = getComputedStyle(canvas);
    const bgColor = computedStyles.getPropertyValue('--color-bg-primary') || '#080b0e';
    const gridColor = computedStyles.getPropertyValue('--color-border') || '#20252b';
    const textColor = computedStyles.getPropertyValue('--color-text-secondary') || '#94a3b8';
    const textMuted = computedStyles.getPropertyValue('--color-text-muted') || '#55606e';
    
    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const leftMargin = 15;
    const rightMargin = 70;
    const topMargin = 20;
    const bottomMargin = 25;
    const graphWidth = dimensions.width - leftMargin - rightMargin;
    const graphHeight = dimensions.height - topMargin - bottomMargin;

    if (graphWidth <= 0 || graphHeight <= 0) return;

    const totalBars = N + predValues.length;
    const barWidth = graphWidth / totalBars;
    const candleWidth = Math.max(1.5, barWidth * 0.7);

    // Coordinate helper
    const getY = (val) => {
      return topMargin + graphHeight - ((val - minPrice) / priceRange) * graphHeight;
    };

    // Draw Gridlines & Labels
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.fillStyle = textColor;
    ctx.font = '10px Inter, sans-serif';
    ctx.textBaseline = 'middle';

    // Horizontal grids
    const numGridsY = 5;
    for (let i = 0; i <= numGridsY; i++) {
      const price = minPrice + (priceRange * i) / numGridsY;
      const y = getY(price);
      
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(leftMargin + graphWidth, y);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), leftMargin + graphWidth + 8, y);
    }

    // Vertical grids & dates
    const numGridsX = 6;
    const skip = Math.max(1, Math.floor(N / numGridsX));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < N; i += skip) {
      const x = leftMargin + i * barWidth + barWidth / 2;
      const dateVal = candles[i].date;
      let dateLabel = '';
      if (dateVal) {
        const dateObj = new Date(dateVal);
        dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      ctx.beginPath();
      ctx.moveTo(x, topMargin);
      ctx.lineTo(x, topMargin + graphHeight);
      ctx.stroke();

      ctx.fillText(dateLabel, x, topMargin + graphHeight + 6);
    }

    // Volume Bars (bottom 15% transparent)
    const volMaxHeight = graphHeight * 0.15;
    const volBaseY = topMargin + graphHeight;
    
    candles.forEach((c, i) => {
      const x = leftMargin + i * barWidth;
      const isUp = c.close >= c.open;
      const volHeight = (c.volume / maxVolume) * volMaxHeight;

      ctx.fillStyle = isUp ? 'rgba(0, 176, 108, 0.18)' : 'rgba(223, 73, 73, 0.18)';
      ctx.fillRect(x + (barWidth - candleWidth) / 2, volBaseY - volHeight, candleWidth, volHeight);
    });

    // Candlesticks
    candles.forEach((c, i) => {
      const x = leftMargin + i * barWidth + barWidth / 2;
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      const isUp = c.close >= c.open;
      
      const candleColor = isUp ? '#00b06c' : '#df4949';
      ctx.strokeStyle = candleColor;
      ctx.fillStyle = candleColor;

      // Wick
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      const rectX = x - candleWidth / 2;
      const rectY = Math.min(yOpen, yClose);
      const rectHeight = Math.max(1, Math.abs(yOpen - yClose));
      ctx.fillRect(rectX, rectY, candleWidth, rectHeight);
    });

    // Predictions (dashed pink line)
    if (predValues.length > 0) {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      const lastX = leftMargin + (N - 1) * barWidth + barWidth / 2;
      const lastY = getY(candles[N - 1].close);
      ctx.moveTo(lastX, lastY);

      predValues.forEach((p, idx) => {
        const predX = leftMargin + (N + idx) * barWidth + barWidth / 2;
        const predY = getY(p);
        ctx.lineTo(predX, predY);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Last close price tracker
    if (N > 0) {
      const lastCandle = candles[N - 1];
      const lastY = getY(lastCandle.close);
      const isUp = lastCandle.close >= lastCandle.open;
      const lastPriceColor = isUp ? '#00b06c' : '#df4949';

      ctx.strokeStyle = lastPriceColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(leftMargin, lastY);
      ctx.lineTo(leftMargin + graphWidth, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label Tag pill
      ctx.fillStyle = lastPriceColor;
      const pillHeight = 16;
      const pillWidth = 52;
      const pillX = leftMargin + graphWidth + 4;
      const pillY = lastY - pillHeight / 2;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
      } else {
        ctx.rect(pillX, pillY, pillWidth, pillHeight);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lastCandle.close.toFixed(2), pillX + pillWidth / 2, pillY + pillHeight / 2);
    }

    // Crosshairs
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < totalBars) {
      const hX = leftMargin + hoverIndex * barWidth + barWidth / 2;
      const hY = mousePos.y;

      ctx.strokeStyle = textMuted;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hX, topMargin);
      ctx.lineTo(hX, topMargin + graphHeight);
      ctx.stroke();

      // Horizontal line
      if (hY >= topMargin && hY <= topMargin + graphHeight) {
        ctx.beginPath();
        ctx.moveTo(leftMargin, hY);
        ctx.lineTo(leftMargin + graphWidth, hY);
        ctx.stroke();

        // Highlight price Y-axis
        const hoverPrice = minPrice + ((topMargin + graphHeight - hY) / graphHeight) * priceRange;
        ctx.fillStyle = '#1e293b';
        ctx.setLineDash([]);
        
        const pillX = leftMargin + graphWidth + 4;
        const pillY = hY - 8;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pillX, pillY, 52, 16, 3);
        } else {
          ctx.rect(pillX, pillY, 52, 16);
        }
        ctx.fill();

        ctx.strokeStyle = textColor;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hoverPrice.toFixed(2), pillX + 26, pillY + 8);
      }

      ctx.setLineDash([]);
    }
  }, [dimensions, candles, predValues, hoverIndex, mousePos]);

  // Hover data mapping
  const activeCandle = hoverIndex !== null && hoverIndex < N ? candles[hoverIndex] : (candles[N - 1] || null);
  const activePred = hoverIndex !== null && hoverIndex >= N ? predValues[hoverIndex - N] : null;
  const isUp = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const metricsColor = isUp ? 'text-emerald-400' : 'text-red-400';

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const leftMargin = 15;
    const rightMargin = 70;
    const graphWidth = dimensions.width - leftMargin - rightMargin;
    const totalBars = N + predValues.length;
    const barWidth = graphWidth / totalBars;

    let idx = Math.floor((x - leftMargin) / barWidth);
    if (idx >= 0 && idx < totalBars) {
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div ref={containerRef} className="relative h-full w-full flex flex-col justify-between select-none">
      {/* Top Overlay metrics block */}
      <div className="absolute top-1 left-3 z-10 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold bg-slate-950/70 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-slate-800/40">
        {activePred !== null ? (
          <span className="text-pink-400">
            ML Prediction for Day {hoverIndex - N + 1}: <span className="font-bold">${activePred.toFixed(2)}</span>
          </span>
        ) : activeCandle ? (
          <>
            <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider pt-0.5">Metrics</span>
            <span className="text-slate-300">O: <span className={metricsColor}>${activeCandle.open.toFixed(2)}</span></span>
            <span className="text-slate-300">H: <span className={metricsColor}>${activeCandle.high.toFixed(2)}</span></span>
            <span className="text-slate-300">L: <span className={metricsColor}>${activeCandle.low.toFixed(2)}</span></span>
            <span className="text-slate-300">C: <span className={metricsColor}>${activeCandle.close.toFixed(2)}</span></span>
            <span className="text-slate-400 hidden sm:inline">Vol: <span className="text-slate-300 font-bold">{(activeCandle.volume / 1000000).toFixed(2)}M</span></span>
          </>
        ) : null}
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};

export default StockChart;