from flask import Blueprint, jsonify, request
import pandas as pd
from services.stock_service import get_stock_data
from services.technical_analysis import generate_buy_sell_signals
from services.fundamental_analysis import get_fundamentals
from services.ml_model import train_model, predict_future
from services.sentiment_analysis import get_news_sentiment
from services.ai_service import generate_stock_analysis
from app.models import Portfolio, Watchlist, MutualFundPortfolio, db
from middleware.auth_middleware import token_required, token_optional

api_bp = Blueprint('api', __name__)

# Existing stock endpoint — now with optional auth
@api_bp.route('/stock/<symbol>', methods=['GET'])
@token_optional
def get_stock(symbol, current_user=None):
    period = request.args.get('period', '1y')

    try:
        hist, info = get_stock_data(symbol, period)
    except Exception as e:
        return jsonify({
            'error': f'Failed to fetch data for {symbol}. Yahoo Finance may be rate-limiting requests. Try again in a few minutes.',
            'details': str(e)
        }), 503

    if hist.empty:
        return jsonify({
            'error': f'No price data found for symbol "{symbol}". It may be delisted or invalid.'
        }), 404

    tech_data = generate_buy_sell_signals(hist.copy())
    fund = get_fundamentals(info)
    sentiment = get_news_sentiment(symbol)
    
    try:
        model, _ = train_model(hist.copy(), symbol)
        preds = predict_future(hist.copy(), model)
    except Exception:
        preds = []

    signals = {
        'buy': int(tech_data.get('Position', pd.Series([0])).iloc[-1] == 1),
        'sell': int(tech_data.get('Position', pd.Series([0])).iloc[-1] == -1),
        'score': int(tech_data.get('Overall_Score', pd.Series([0])).iloc[-1])
    }

    current_price = hist['Close'].iloc[-1] if not hist.empty else "Unknown"
    ai_tech_summary = generate_stock_analysis(symbol, current_price, signals)

    return jsonify({
        'history': hist.reset_index().to_dict('records'),
        'info': info,
        'technical': tech_data.reset_index().to_dict('records')[-50:],
        'fundamentals': fund,
        'sentiment': sentiment,
        'predictions': preds,
        'signals': signals,
        'ai_technical_analysis': ai_tech_summary
    })


# === Portfolio Routes (Protected) ===
@api_bp.route('/portfolio', methods=['GET'])
@token_required
def get_portfolio(current_user):
    items = Portfolio.query.filter_by(user_id=current_user.id).all()
    return jsonify([item.to_dict() for item in items])


@api_bp.route('/portfolio', methods=['POST'])
@token_required
def add_to_portfolio(current_user):
    data = request.json
    new_item = Portfolio(
        user_id=current_user.id,
        symbol=data['symbol'].upper(),
        shares=float(data['shares']),
        avg_price=float(data['avg_price'])
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201


@api_bp.route('/portfolio/<int:id>', methods=['DELETE'])
@token_required
def remove_from_portfolio(id, current_user):
    item = Portfolio.query.filter_by(id=id, user_id=current_user.id).first()
    if not item:
        return jsonify({'error': 'Portfolio item not found.'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Removed'})


# === Watchlist Routes (Protected) ===
@api_bp.route('/watchlist', methods=['GET'])
@token_required
def get_watchlist(current_user):
    items = Watchlist.query.filter_by(user_id=current_user.id).all()
    return jsonify([item.to_dict() for item in items])


@api_bp.route('/watchlist', methods=['POST'])
@token_required
def add_to_watchlist(current_user):
    data = request.json
    symbol = data['symbol'].upper()
    if not Watchlist.query.filter_by(symbol=symbol, user_id=current_user.id).first():
        new_item = Watchlist(user_id=current_user.id, symbol=symbol)
        db.session.add(new_item)
        db.session.commit()
    return jsonify({'message': 'Added to watchlist'})


@api_bp.route('/watchlist/<string:symbol>', methods=['DELETE'])
@token_required
def remove_from_watchlist(symbol, current_user):
    item = Watchlist.query.filter_by(symbol=symbol.upper(), user_id=current_user.id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return jsonify({'message': 'Removed'})

# === Market News Route ===
@api_bp.route('/market-news', methods=['GET'])
def get_market_news():
    # Use SPY as a proxy for general market news
    news = get_news_sentiment('SPY')
    return jsonify(news)

# === Mutual Fund Portfolio Routes (Protected) ===
@api_bp.route('/mutual-portfolio', methods=['GET'])
@token_required
def get_mutual_portfolio(current_user):
    items = MutualFundPortfolio.query.filter_by(user_id=current_user.id).all()
    return jsonify([item.to_dict() for item in items])

@api_bp.route('/mutual-portfolio', methods=['POST'])
@token_required
def add_to_mutual_portfolio(current_user):
    data = request.json
    new_item = MutualFundPortfolio(
        user_id=current_user.id,
        symbol=data['symbol'].upper(),
        units=float(data['units']),
        nav_price=float(data['nav_price'])
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@api_bp.route('/mutual-portfolio/<int:id>', methods=['DELETE'])
@token_required
def remove_from_mutual_portfolio(id, current_user):
    item = MutualFundPortfolio.query.filter_by(id=id, user_id=current_user.id).first()
    if not item:
        return jsonify({'error': 'Mutual Fund Portfolio item not found.'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Removed'})