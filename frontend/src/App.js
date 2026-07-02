import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [page, setPage] = useState('auth');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('mora_token');
    const savedUser = localStorage.getItem('mora_user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsed);
        setPage('dashboard');
      } catch (err) {
        localStorage.removeItem('mora_token');
        localStorage.removeItem('mora_user');
      }
    }
  }, []);

  const handleLogin = (newToken, newUser) => {
    setTransitioning(true);
    setTimeout(() => {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('mora_token', newToken);
      localStorage.setItem('mora_user', JSON.stringify(newUser));
      setPage('dashboard');
      setTransitioning(false);
    }, 300);
  };

  const handleLogout = () => {
    setTransitioning(true);
    setTimeout(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('mora_token');
      localStorage.removeItem('mora_user');
      setPage('auth');
      setTransitioning(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div
        className={transitioning ? 'page-exit' : 'page-enter'}
        key={page}
      >
        {page === 'auth' && <AuthPage onLogin={handleLogin} />}
        {page === 'dashboard' && (
          <Dashboard user={user} token={token} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}

export default App;