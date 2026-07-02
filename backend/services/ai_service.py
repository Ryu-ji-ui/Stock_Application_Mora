from openai import OpenAI
import os
from config import Config

def get_nvidia_client():
    api_key = Config.NVIDIA_API_KEY
    if not api_key or api_key == 'your_nvidia_api_key_here':
        return None
    
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

def generate_news_summary(symbol, news_items):
    """
    Generate a summary of the news sentiment using NVIDIA's Llama 3 70B model.
    """
    client = get_nvidia_client()
    if not client:
        return "NVIDIA API Key not configured. AI summary unavailable."

    if not news_items:
        return "No recent news available to analyze."

    # Prepare headlines
    headlines = []
    for item in news_items:
        title = item.get('title', '')
        if title:
            headlines.append(title)
            
    if not headlines:
        return "No readable headlines found for analysis."

    headlines_text = "\n- ".join(headlines)
    
    prompt = f"""
You are a financial analyst. Here are the latest news headlines for {symbol}:
- {headlines_text}

Provide a concise, 2-3 sentence summary of the overall market sentiment based on these headlines. 
Keep it objective and professional. Do not use filler phrases like "Based on the headlines".
"""

    try:
        response = client.chat.completions.create(
            model="meta/llama3-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=150,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling NVIDIA API: {str(e)}")
        return "AI analysis is currently unavailable."

def generate_stock_analysis(symbol, current_price, tech_signals):
    """
    Generate a brief technical analysis summary using NVIDIA's Llama 3 70B model.
    """
    client = get_nvidia_client()
    if not client:
        return None
        
    prompt = f"""
You are a technical analyst. 
Stock: {symbol}
Current Price: {current_price}
Technical Signals:
- Buy Signal: {tech_signals.get('buy')}
- Sell Signal: {tech_signals.get('sell')}
- Overall Score: {tech_signals.get('score')}

Provide a 1-2 sentence technical outlook based ONLY on this data.
"""
    try:
        response = client.chat.completions.create(
            model="meta/llama3-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=100,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling NVIDIA API: {str(e)}")
        return None
