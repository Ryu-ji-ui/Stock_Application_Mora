def get_fundamentals(info):
    return {
        'marketCap': info.get('marketCap'),
        'trailingPE': info.get('trailingPE'),
        'forwardPE': info.get('forwardPE'),
        'trailingEps': info.get('trailingEps'),
        'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh'),
        'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow'),
        'dividendYield': info.get('dividendYield'),
        'beta': info.get('beta'),
        'priceToBook': info.get('priceToBook'),
        'revenueGrowth': info.get('revenueGrowth'),
        'operatingMargins': info.get('operatingMargins'),
        'totalRevenue': info.get('totalRevenue'),
        'totalDebt': info.get('totalDebt'),
        'quickRatio': info.get('quickRatio'),
        'volume': info.get('volume') or info.get('regularMarketVolume'),
        'averageVolume': info.get('averageVolume') or info.get('averageDailyVolume10Day')
    }