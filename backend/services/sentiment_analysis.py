from textblob import TextBlob
from services.stock_service import get_cached_news
from services.ai_service import generate_news_summary


def get_news_sentiment(symbol):
    """
    Analyze sentiment from cached Yahoo Finance news headlines.
    Uses the shared cache from stock_service to avoid duplicate API calls.
    Returns detailed articles, breakdown counts, and an AI-generated summary.
    """
    try:
        news = get_cached_news(symbol)
        news = news[:10]  # Limit to 10 news items
        articles_with_sentiment = []
        
        pos_count = 0
        neg_count = 0
        neu_count = 0

        for item in news:
            title = item.get('title') if isinstance(item, dict) else ''
            if not title:
                continue
            try:
                polarity = TextBlob(title).sentiment.polarity
                
                if polarity > 0.05:
                    pos_count += 1
                    label = 'Positive'
                elif polarity < -0.05:
                    neg_count += 1
                    label = 'Negative'
                else:
                    neu_count += 1
                    label = 'Neutral'
                
                articles_with_sentiment.append({
                    'title': title,
                    'publisher': item.get('publisher', 'Unknown'),
                    'link': item.get('link', '#'),
                    'time': item.get('providerPublishTime', 0),
                    'score': round(polarity, 2),
                    'sentiment': label
                })
            except Exception:
                continue

        avg_sentiment = sum(a['score'] for a in articles_with_sentiment) / len(articles_with_sentiment) if articles_with_sentiment else 0
        
        if avg_sentiment > 0.05:
            overall_label = 'Bullish'
        elif avg_sentiment < -0.05:
            overall_label = 'Bearish'
        else:
            overall_label = 'Neutral'

        # Generate AI summary using NVIDIA NIM
        ai_summary = generate_news_summary(symbol, news)

        return {
            'avg_sentiment': round(avg_sentiment, 2),
            'label': overall_label,
            'news_count': len(articles_with_sentiment),
            'pos_count': pos_count,
            'neg_count': neg_count,
            'neu_count': neu_count,
            'articles': articles_with_sentiment,
            'ai_analysis': ai_summary
        }
    except Exception:
        return {
            'avg_sentiment': 0,
            'label': 'Neutral',
            'news_count': 0,
            'pos_count': 0,
            'neg_count': 0,
            'neu_count': 0,
            'articles': [],
            'ai_analysis': "Error generating sentiment analysis."
        }