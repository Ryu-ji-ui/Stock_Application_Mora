-- =============================================
-- Stock Analyzer Database Initialization
-- Supports PostgreSQL (and compatible with SQLite)
-- =============================================

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS stock_data;
DROP TABLE IF EXISTS portfolio;
DROP TABLE IF EXISTS watchlist;

-- =============================================
-- Main Stock Price History Table
-- =============================================
CREATE TABLE stock_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    price DECIMAL(12,4) NOT NULL,
    open_price DECIMAL(12,4),
    high_price DECIMAL(12,4),
    low_price DECIMAL(12,4),
    volume BIGINT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date DATE
);

CREATE INDEX idx_stock_data_symbol ON stock_data(symbol);
CREATE INDEX idx_stock_data_timestamp ON stock_data(timestamp);

-- =============================================
-- Portfolio Table
-- =============================================
CREATE TABLE portfolio (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    shares DECIMAL(15,4) NOT NULL,
    avg_price DECIMAL(12,4) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_symbol ON portfolio(symbol);

-- =============================================
-- Watchlist Table
-- =============================================
CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Sample Data (Optional)
-- =============================================
INSERT INTO watchlist (symbol) VALUES 
('AAPL'), ('TSLA'), ('GOOGL'), ('MSFT'), ('NVDA')
ON CONFLICT DO NOTHING;

-- Example Portfolio
INSERT INTO portfolio (symbol, shares, avg_price) VALUES 
('AAPL', 15.0, 145.50),
('TSLA', 8.0, 210.75)
ON CONFLICT DO NOTHING;

-- =============================================
-- Useful Queries (for reference)
-- =============================================
-- Get latest price of a stock
-- SELECT * FROM stock_data WHERE symbol = 'AAPL' ORDER BY timestamp DESC LIMIT 1;

-- Get portfolio with current value (join with latest prices)
-- SELECT p.*, sd.price as current_price 
-- FROM portfolio p 
-- LEFT JOIN (SELECT DISTINCT ON (symbol) * FROM stock_data ORDER BY symbol, timestamp DESC) sd 
-- ON p.symbol = sd.symbol;
