import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Start Test', to: '/test' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Results', to: '/results' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'hi', label: 'हिन्दी' },
];

const STORAGE_KEY = 'vanloka_theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(STORAGE_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function PageTopNav() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  if (!isAuthenticated) {
    return null;
  }

  const isHome = location.pathname === '/';

  return (
    <header className="page-navbar" role="navigation" aria-label="Page navigation">
      <div className="page-navbar-actions">
        {quickLinks.map((link) => (
          <Link className={`page-navbar-link ${location.pathname === link.to ? 'active' : ''}`} key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}

        <button className="page-navbar-link page-navbar-logout" onClick={logout} type="button">
          Logout
        </button>
      </div>

      {isHome && (
        <div className="page-corner-controls">
          <label className="page-corner-control">
            <span className="page-corner-select-shell">
              <select aria-label="Language Preference" value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <button className="theme-toggle page-corner-theme-toggle" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} type="button">
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === 'dark' ? '☀' : '☾'}
            </span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      )}
    </header>
  );
}

export default PageTopNav;
