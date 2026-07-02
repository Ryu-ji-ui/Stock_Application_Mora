import pandas as pd
import numpy as np

def calculate_sma(data, window=20):
    return data['Close'].rolling(window=window).mean()

def calculate_ema(data, window=12):
    return data['Close'].ewm(span=window, adjust=False).mean()

def calculate_rsi(data, window=14):
    delta = data['Close'].diff()
    gain = delta.where(delta > 0, 0).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    # Prevent division by zero
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)

def calculate_macd(data, span1=12, span2=26, signal_span=9):
    exp1 = data['Close'].ewm(span=span1, adjust=False).mean()
    exp2 = data['Close'].ewm(span=span2, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=signal_span, adjust=False).mean()
    hist = macd - signal
    return macd, signal, hist

def calculate_bollinger_bands(data, window=20, num_sd=2):
    sma = calculate_sma(data, window)
    sd = data['Close'].rolling(window=window).std()
    upper = sma + (sd * num_sd)
    lower = sma - (sd * num_sd)
    return upper, lower

def generate_buy_sell_signals(data):
    # Calculate indicators
    data['SMA_20'] = calculate_sma(data, 20).bfill()
    data['SMA_50'] = calculate_sma(data, 50).bfill()
    data['EMA_12'] = calculate_ema(data, 12)
    data['EMA_26'] = calculate_ema(data, 26)
    
    # RSI
    data['RSI'] = calculate_rsi(data, 14)
    
    # MACD
    macd, macd_signal, macd_hist = calculate_macd(data)
    data['MACD'] = macd.fillna(0)
    data['MACD_Signal'] = macd_signal.fillna(0)
    data['MACD_Hist'] = macd_hist.fillna(0)
    
    # Bollinger Bands
    upper, lower = calculate_bollinger_bands(data, 20, 2)
    data['BB_Upper'] = upper.bfill()
    data['BB_Lower'] = lower.bfill()
    
    # Generate SMA Crossover Signals
    data['Signal'] = 0
    data['Signal'] = np.where(data['SMA_20'] > data['SMA_50'], 1, 0)
    data['Position'] = data['Signal'].diff().fillna(0)
    
    # Technical Scoring System (Range: -4 to +4)
    # - RSI: <30 is Bullish (+1), >70 is Bearish (-1)
    # - MACD Crossover: MACD > MACD_Signal (+1), MACD < MACD_Signal (-1)
    # - Price vs SMA20: Price > SMA20 (+1), Price < SMA20 (-1)
    # - SMA Crossover: SMA20 > SMA50 (+1), SMA20 < SMA50 (-1)
    rsi_score = np.where(data['RSI'] < 30, 1, np.where(data['RSI'] > 70, -1, 0))
    macd_score = np.where(data['MACD'] > data['MACD_Signal'], 1, -1)
    price_sma_score = np.where(data['Close'] > data['SMA_20'], 1, -1)
    sma_cross_score = np.where(data['SMA_20'] > data['SMA_50'], 1, -1)
    
    data['Overall_Score'] = rsi_score + macd_score + price_sma_score + sma_cross_score
    return data