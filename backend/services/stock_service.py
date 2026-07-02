import yfinance as yf
import time
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import requests

# Enforce a 2.5 second timeout on all requests (like yfinance) to prevent hanging
_orig_request = requests.Session.request


def _timeout_request(self, method, url, *args, **kwargs):
    if 'timeout' not in kwargs:
        kwargs['timeout'] = 2.5
    return _orig_request(self, method, url, *args, **kwargs)


requests.Session.request = _timeout_request


# In-memory cache: { (symbol, period): { 'data': (hist, info, news), 'timestamp': float } }
_cache = {}
CACHE_TTL = 300  # 5 minutes


def _get_cache_key(symbol, period):
    return (symbol.upper(), period)


def _is_cache_valid(key):
    if key not in _cache:
        return False
    return (time.time() - _cache[key]['timestamp']) < CACHE_TTL


def _generate_mock_data(symbol, period='1y'):
    symbol = symbol.upper()
    # Base prices to make simulated graphs look realistic
    base_prices = {
        'AAPL': 180.0,
        'TSLA': 210.0,
        'MSFT': 420.0,
        'GOOGL': 175.0,
        'AMZN': 185.0,
        'NVDA': 120.0,
        'META': 480.0,
        'NFLX': 600.0
    }
    base_price = base_prices.get(symbol, 100.0)

    # Determine period in days
    days = 365
    if period == '1d':
        days = 1
    elif period == '5d':
        days = 5
    elif period == '1m':
        days = 30
    elif period == '3m':
        days = 90
    elif period == '6m':
        days = 180
    elif period == '1y':
        days = 365
    elif period == '2y':
        days = 730
    elif period == '5y':
        days = 1825

    # Generate business days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.bdate_range(start=start_date, end=end_date)
    n_days = len(date_range)
    if n_days == 0:
        n_days = 5
        date_range = pd.bdate_range(end=end_date, periods=5)

    # Generate random walk with slight upward drift
    np.random.seed(hash(symbol) % (2**32))
    returns = np.random.normal(loc=0.0004, scale=0.015, size=n_days)
    price_factor = np.exp(np.cumsum(returns))
    close_prices = base_price * price_factor

    # Generate OHLCV
    high_prices = close_prices * (1 + np.abs(np.random.normal(0, 0.007, n_days)))
    low_prices = close_prices * (1 - np.abs(np.random.normal(0, 0.007, n_days)))
    open_prices = np.zeros(n_days)
    open_prices[0] = base_price
    for i in range(1, n_days):
        open_prices[i] = close_prices[i-1] * (1 + np.random.normal(0, 0.002))

    high_prices = np.maximum(high_prices, np.maximum(open_prices, close_prices))
    low_prices = np.minimum(low_prices, np.minimum(open_prices, close_prices))
    volumes = np.random.randint(1000000, 10000000, size=n_days)

    hist = pd.DataFrame({
        'Open': open_prices,
        'High': high_prices,
        'Low': low_prices,
        'Close': close_prices,
        'Volume': volumes
    }, index=date_range)
    hist.index.name = 'Date'

    # Mock Info
    info = {
        'symbol': symbol,
        'longName': f'{symbol} Inc. (Simulated)',
        'shortName': f'{symbol} (Simulated)',
        'currentPrice': float(close_prices[-1]),
        'regularMarketPrice': float(close_prices[-1]),
        'open': float(open_prices[-1]),
        'dayHigh': float(high_prices[-1]),
        'dayLow': float(low_prices[-1]),
        'fiftyTwoWeekHigh': float(high_prices.max()),
        'fiftyTwoWeekLow': float(low_prices.min()),
        'volume': int(volumes[-1]),
        'averageVolume': int(volumes.mean()),
        'marketCap': int(close_prices[-1] * 10000000),
        'trailingPE': 25.4,
        'forwardPE': 22.5,
        'trailingEps': 6.5,
        'beta': 1.15,
        'priceToBook': 4.2,
        'revenueGrowth': 0.12,
        'operatingMargins': 0.24,
        'totalRevenue': 380000000000,
        'totalDebt': 95000000000,
        'quickRatio': 1.35,
        'dividendYield': 0.015,
        'volume': int(volumes[-1]),
        'averageVolume': int(volumes.mean()),
        'summaryProfile': f'This is simulated stock data for {symbol} rendered because the live Yahoo Finance API returned a 429 rate limit error.',
        'is_simulated': True
    }

    # Mock News
    news = [
        {
            'title': f'{symbol} announces new AI integrations, sparking strong bullish investor sentiment',
            'publisher': 'Mora Market News',
            'link': 'https://mora.analyzer',
            'providerPublishTime': int(time.time()) - 3600
        },
        {
            'title': f'Technical analysis indicators flag breakout zone for {symbol} stock',
            'publisher': 'Mora Technical Insights',
            'link': 'https://mora.analyzer',
            'providerPublishTime': int(time.time()) - 7200
        },
        {
            'title': f'How {symbol} simulated model performance compares to peers this quarter',
            'publisher': 'Mora Analytics',
            'link': 'https://mora.analyzer',
            'providerPublishTime': int(time.time()) - 14400
        }
    ]

    return hist, info, news


def get_stock_data(symbol, period='1y'):
    """
    Fetch stock history and info from Yahoo Finance with caching.
    Returns (hist DataFrame, info dict).
    Uses a single Ticker object to minimize API calls.
    Falls back to mock data if yfinance fails (e.g. 429 rate limits).
    """
    key = _get_cache_key(symbol, period)

    if _is_cache_valid(key):
        cached = _cache[key]['data']
        return cached['hist'], cached['info']

    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        if hist.empty:
            raise ValueError(f"Empty stock history returned for {symbol}")

        info = stock.info or {}
        news = stock.news or []

        # Sometimes info misses current price due to partial failures
        if not info or 'currentPrice' not in info:
            if not hist.empty:
                last_price = float(hist['Close'].iloc[-1])
                info['currentPrice'] = last_price
                info['regularMarketPrice'] = last_price
                info['longName'] = info.get('longName', symbol)
                info['shortName'] = info.get('shortName', symbol)

        info['is_simulated'] = False

        _cache[key] = {
            'data': {
                'hist': hist,
                'info': info,
                'news': news,
            },
            'timestamp': time.time()
        }

        return hist, info
    except Exception as e:
        # Check if we have cached data first (even if expired)
        if key in _cache:
            cached = _cache[key]['data']
            return cached['hist'], cached['info']

        print(f"Failed to fetch live data for {symbol}: {str(e)}. Generating simulated mock data.")
        hist, info, news = _generate_mock_data(symbol, period)

        _cache[key] = {
            'data': {
                'hist': hist,
                'info': info,
                'news': news,
            },
            'timestamp': time.time()
        }
        return hist, info


def get_cached_news(symbol, period='1y'):
    """
    Get cached news for a symbol. Calls get_stock_data first to populate cache.
    """
    key = _get_cache_key(symbol, period)

    if _is_cache_valid(key):
        return _cache[key]['data'].get('news', [])

    try:
        get_stock_data(symbol, period)
    except Exception:
        pass

    if key in _cache:
        return _cache[key]['data'].get('news', [])
    return []


def get_real_time_price(symbol):
    """Get current price, using cached info if available."""
    key = _get_cache_key(symbol, '1y')

    if _is_cache_valid(key):
        info = _cache[key]['data']['info']
        return info.get('currentPrice') or info.get('regularMarketPrice')

    try:
        stock = yf.Ticker(symbol)
        info = stock.info or {}
        price = info.get('currentPrice') or info.get('regularMarketPrice')
        if price:
            return price
    except Exception:
        pass

    # Fallback to simulated price if live fails
    hist, info, _ = _generate_mock_data(symbol)
    return info.get('currentPrice')


def clear_cache(symbol=None):
    """Clear cache for a specific symbol or all symbols."""
    global _cache
    if symbol:
        keys_to_remove = [k for k in _cache if k[0] == symbol.upper()]
        for k in keys_to_remove:
            del _cache[k]
    else:
        _cache = {}