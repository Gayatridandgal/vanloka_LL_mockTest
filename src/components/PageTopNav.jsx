import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return null;
  }

  const isHome = location.pathname === '/';

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header className="page-navbar" role="navigation" aria-label="Page navigation">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-end md:gap-0">
        
        {/* Mobile Hamburger Toggle */}
        <div className="flex w-full justify-end md:hidden">
          <button
            aria-controls="page-navbar-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>

        {/* Navbar Links & Controls */}
        <div
          id="page-navbar-menu"
          className={`${menuOpen ? 'flex' : 'hidden'} page-navbar-stack md:grid w-full`}
        >
          <div className="page-navbar-actions flex-col md:flex-row">
            {quickLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`page-navbar-link ${isActive ? 'active' : ''} w-full md:w-auto`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <button className="page-navbar-link page-navbar-logout w-full md:w-auto" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>

          {isHome && (
            <div className="page-corner-controls flex-col md:flex-row mt-2 md:mt-0 w-full md:w-auto justify-end">
              <label className="page-corner-control w-full md:w-auto flex justify-between md:inline-flex">
                <div className="page-corner-select-shell">
                  <select
                    aria-label="Language Preference"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <button
                className="page-corner-control page-corner-theme-toggle w-full md:w-auto justify-center"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                type="button"
              >
                <span aria-hidden="true" style={{ marginRight: '8px' }}>
                  {theme === 'dark' ? '☀' : '☾'}
                </span>
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default PageTopNav;
