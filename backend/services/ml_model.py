import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os
import time

# In-memory model cache: { symbol: { 'model': model, 'timestamp': float } }
_model_cache = {}
MODEL_CACHE_TTL = 3600  # 1 hour — models don't need frequent retraining


def prepare_features(data):
    data = data.copy()
    data['Return'] = data['Close'].pct_change()
    data['MA20'] = data['Close'].rolling(20).mean()
    data['Volatility'] = data['Close'].rolling(20).std()
    data = data.dropna()
    X = data[['MA20', 'Volatility', 'Return']].shift(1).dropna()
    y = data['Close'].iloc[1:]
    # Align X and y to have the same index
    common_idx = X.index.intersection(y.index)
    X = X.loc[common_idx]
    y = y.loc[common_idx]
    return X, y


def train_model(data, symbol):
    """
    Train a RandomForest model for the given symbol.
    Uses in-memory cache to avoid retraining on every API request.
    Falls back to saved .pkl file if available.
    """
    symbol_upper = symbol.upper()

    # Check in-memory cache first
    if symbol_upper in _model_cache:
        cached = _model_cache[symbol_upper]
        if (time.time() - cached['timestamp']) < MODEL_CACHE_TTL:
            return cached['model'], None

    # Check for saved model on disk
    model_path = f'models/{symbol_upper}_model.pkl'
    if os.path.exists(model_path):
        try:
            file_age = time.time() - os.path.getmtime(model_path)
            if file_age < MODEL_CACHE_TTL:
                model = joblib.load(model_path)
                _model_cache[symbol_upper] = {
                    'model': model,
                    'timestamp': time.time()
                }
                return model, None
        except Exception:
            pass  # Fall through to retrain

    # Train fresh model
    X, y = prepare_features(data)
    if len(X) < 10:
        raise ValueError(f"Not enough data to train model for {symbol}")

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save to disk
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, model_path)

    # Cache in memory
    _model_cache[symbol_upper] = {
        'model': model,
        'timestamp': time.time()
    }

    return model, None


def predict_future(data, model, days=30):
    predictions = []
    X, _ = prepare_features(data)
    if len(X) == 0:
        return []

    last_row = X.iloc[-1:].copy()

    for _ in range(days):
        pred = model.predict(last_row)[0]
        predictions.append(float(pred))
        # Simple update for next prediction
        last_row['MA20'] = (last_row['MA20'] * 19 + pred) / 20
        last_row['Volatility'] = last_row['Volatility'] * 0.95
    return predictions