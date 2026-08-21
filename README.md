# Stock_Application_Mora
# 📈 AI-Powered Stock Trading & Investment Platform

An advanced, full-stack stock analysis and investment tracking platform. This application integrates Artificial Intelligence (AI) to analyze market trends, predict stock movements, and provide technical and fundamental analysis. It also offers comprehensive portfolio and watchlist management for a variety of asset classes.

## 🌟 Project Overview

The platform allows users to:
- Track various financial assets: Stocks, Mutual Funds, Bonds, Gold, Silver, Crypto, and NFTs.
- Manage Watchlists, Portfolios, Trades, and Alerts.
- Receive AI-generated market predictions and technical analysis.
- View real-time or historical charts using dynamic visual interfaces.

---

## 🏗️ System Architecture

### 1. Frontend 🖥️
Built with modern web technologies, providing a dynamic, responsive, and visually appealing user interface.

- **Core Library**: React.js (v18)
- **Styling**: Tailwind CSS for utility-first, responsive design.
- **Animations**: Framer Motion for smooth micro-interactions.
- **Data Visualization**: Chart.js & `react-chartjs-2` for rendering financial charts.
- **HTTP Client**: Axios for API communication.
- **Icons & UI Components**: Lucide React & Headless UI.

### 2. Backend ⚙️
A robust RESTful API built with Python, handling data fetching, machine learning predictions, and business logic.

- **Framework**: Flask
- **Database ORM**: Flask-SQLAlchemy (Relational DB mapping)
- **Financial Data**: `yfinance` for fetching historical data and fundamentals.
- **Machine Learning & Analysis**: 
  - `scikit-learn` & `pandas` for technical indicators, moving averages, and local predictive models (persisted via `.pkl` files).
  - `TextBlob` for sentiment analysis on market news.
- **AI Integration**: OpenAI SDK (with architecture capable of supporting APIs like Gemini, Claude, Llama, etc.) to generate human-readable technical summaries and predictions.

### 3. Authentication & Security 🔐
Secure, token-based authentication system with email verification.

- **Password Hashing**: Werkzeug Security (`generate_password_hash`, `check_password_hash`).
- **Token System**: JSON Web Tokens (JWT) for stateless session management.
- **Email Verification**: Time-based 6-digit OTP (One Time Password) required upon registration.
- **Password Reset**: UUID-based reset tokens for secure password recovery.

#### Authentication Flow (TypeScript Interface Representation)

```typescript
// Example representation of the Auth Flow API Responses
interface AuthResponse {
  message: string;
  token?: string;
  user?: UserProfile;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

// 1. Registration (/api/auth/register) -> Returns 201 Created & generates OTP
// 2. OTP Verification (/api/auth/verify-otp) -> Validates OTP, sets email_verified = true, returns JWT Token
// 3. Login (/api/auth/login) -> Returns JWT Token (requires verified email)
// 4. Password Recovery (/api/auth/forgot-password & /api/auth/reset-password) -> Uses secure UUID tokens
```

---

## 🗄️ Database Models

The relational database (managed via SQLAlchemy) consists of the following core models:

1. **User**: Stores user credentials and profile details.
2. **OTP / PasswordResetToken**: Manages temporary codes and tokens for auth workflows.
3. **Portfolio**: Tracks user's stock holdings (symbol, shares, average price).
4. **MutualFundPortfolio**: Tracks mutual fund holdings (units, NAV price).
5. **Watchlist**: Tracks user's favorite symbols.
6. **StockData**: Caches historical price queries.

### Auth Routes (`/api/auth`)
- `POST /register` - Register a new user and generate OTP.
- `POST /verify-otp` - Verify email and retrieve JWT.
- `POST /resend-otp` - Invalidate old OTPs and send a new one.
- `POST /login` - Authenticate and retrieve JWT.
- `POST /forgot-password` / `POST /reset-password` - Account recovery workflows.
- `GET /me` - Retrieve current logged-in user profile.

### Application Routes (`/api`)
- `GET /stock/<symbol>` - Fetch comprehensive stock data, including historical prices, fundamentals, AI technical analysis, and ML predictions.
- `GET / POST / DELETE /portfolio` - Manage user stock portfolio.
- `GET / POST / DELETE /mutual-portfolio` - Manage mutual fund holdings.
- `GET / POST / DELETE /watchlist` - Manage user watchlists.
- `GET /market-news` - Retrieve general market sentiment.
