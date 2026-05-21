import { Link, useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

const featureCards = [
  {
    title: 'Structured practice',
    text: 'A clean test flow with a question navigator, progress tracking, and instant scoring.',
  },
  {
    title: 'Performance analytics',
    text: 'Review your latest attempts, identify weak categories, and focus on improvement.',
  },
  {
    title: 'Desktop-first layout',
    text: 'Optimized for large screens with clear hierarchy, cards, and responsive density.',
  },
  {
    title: 'Multilingual support',
    text: 'Switch between English, Kannada, and Hindi without losing the current session state.',
  },
];

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Start Test', to: '/test' },
  { label: 'Progress Dashboard', to: '/dashboard' },
  { label: 'Result Review', to: '/results' },
];

function getLastScore() {
  const history = JSON.parse(localStorage.getItem('vanloka_test_history') || '[]');
  return history.at(-1);
}

function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const last = getLastScore();
  const passedLast = last?.score >= 12;

  return (
    <main className="app-shell dashboard-layout landing-shell">
      <aside className="sidebar landing-sidebar">
        <div className="sidebar-brand">
          <div className="brand">{ui.appName[language]}</div>
          <p className="sidebar-subtitle">RTO learner license practice</p>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link className={`nav-link ${item.to === '/' ? 'active' : ''}`} key={item.to} to={item.to}>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="eyebrow">Language</span>
          <LanguageToggle />
        </div>

        <div className="sidebar-card info-stack">
          <div>
            <span className="info-label">Session mode</span>
            <strong>Practice and review</strong>
          </div>
          <div>
            <span className="info-label">Target pass mark</span>
            <strong>12 / 20</strong>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Enterprise practice suite</span>
            <h1>{ui.headline[language]}</h1>
            <p className="topbar-copy">A refined test experience for learners, instructors, and admin review on large screens.</p>
          </div>

          <div className="topbar-actions">
            <Link className="btn outline" to="/dashboard">{ui.progress[language]}</Link>
            <button className="btn primary" onClick={() => navigate('/test')} type="button">
              {ui.startTest[language]}
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <article className="panel-card hero-panel span-7">
            <span className="pill">Karnataka learner license prep</span>
            <h2>Practice, track, and improve with a clear desktop-first workflow.</h2>
            <p>
              VanLoka keeps the test flow focused with structured navigation, high-contrast analytics,
              and a calm interface that feels closer to a modern SaaS dashboard than a quiz app.
            </p>

            <div className="hero-actions">
              <button className="btn primary big" onClick={() => navigate('/test')} type="button">
                {ui.startTest[language]}
              </button>
              <Link className="btn outline big" to="/dashboard">
                {ui.progress[language]}
              </Link>
            </div>

            <div className="mini-metrics" aria-label="Mock test details">
              <div>
                <strong>20</strong>
                <span>Questions</span>
              </div>
              <div>
                <strong>30</strong>
                <span>Minutes</span>
              </div>
              <div>
                <strong>12/20</strong>
                <span>Pass mark</span>
              </div>
            </div>
          </article>

          <aside className={`panel-card insight-panel span-5 ${last ? 'has-score' : ''}`}>
            <div className="score-panel-header">
              <span className="eyebrow">Latest attempt</span>
              <span className={`status-pill ${passedLast ? 'success' : 'warning'}`}>{passedLast ? 'On track' : 'Needs review'}</span>
            </div>

            {last ? (
              <div className={`last-score professional ${passedLast ? 'pass' : 'fail'}`}>
                <span>{ui.lastScore[language]}</span>
                <strong>{last.score}/{last.total}</strong>
                <em>{passedLast ? 'Ready for another practice round' : ui.keepPracticing[language]}</em>
              </div>
            ) : (
              <div className="empty-state compact">
                <p>No results yet. Start your first mock test to unlock dashboard analytics.</p>
                <button className="btn primary" onClick={() => navigate('/test')} type="button">
                  {ui.startTest[language]}
                </button>
              </div>
            )}

            <div className="insight-grid">
              <div className="insight-card">
                <span>Reading speed</span>
                <strong>Steady</strong>
              </div>
              <div className="insight-card">
                <span>Attempt cadence</span>
                <strong>Consistent</strong>
              </div>
              <div className="insight-card">
                <span>Focus area</span>
                <strong>Road signs</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="stats-grid">
          <article className="metric-card">
            <span>Practice library</span>
            <strong>100+</strong>
            <p>{ui.stats[language]}</p>
          </article>
          <article className="metric-card">
            <span>Result speed</span>
            <strong>Instant</strong>
            <p>Scoring, review, and AI feedback are available after submission.</p>
          </article>
          <article className="metric-card">
            <span>Desktop layout</span>
            <strong>1440px+</strong>
            <p>Designed to take advantage of wide screens with generous spacing and hierarchy.</p>
          </article>
          <article className="metric-card">
            <span>Accessibility</span>
            <strong>Clear</strong>
            <p>Readable typography, strong contrast, and responsive touch targets across the app.</p>
          </article>
        </section>

        <section className="feature-grid">
          {featureCards.map((card) => (
            <article className="feature-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default Home;
