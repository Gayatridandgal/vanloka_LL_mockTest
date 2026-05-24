import { Link, useNavigate } from 'react-router-dom';
import PageTopNav from '../components/PageTopNav';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

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
    <main className="app-shell landing-shell landing-page">
      <PageTopNav />
      <section className="workspace landing-workspace">
        <header className="landing-hero panel-card">
          <div className="landing-copy">
            <span className="eyebrow">Enterprise practice suite</span>
            <h1>{ui.headline[language]}</h1>
            <p className="landing-subcopy">A minimal, full-width practice portal for learners on desktop and laptop screens.</p>
            <div className="hero-actions landing-actions">
              <button className="btn primary big" onClick={() => navigate('/trainee')} type="button">
                Trainee App Link
              </button>
              <button className="btn outline big" onClick={() => navigate('/test')} type="button">
                {ui.startTest[language]}
              </button>
              <Link className="btn secondary big" to="/dashboard">
                {ui.progress[language]}
              </Link>
            </div>
          </div>

          <div className="landing-summary">
            <div className="summary-card">
              <span>Practice library</span>
              <strong>100+ questions</strong>
            </div>
            <div className="summary-card">
              <span>Test length</span>
              <strong>30 minutes</strong>
            </div>
            <div className="summary-card">
              <span>Pass mark</span>
              <strong>12 / 20</strong>
            </div>
          </div>
        </header>

        <section className="landing-grid">
          <article className={`panel-card landing-card ${last ? 'has-score' : ''}`}>
            <div className="section-heading">
              <div>
                <h2>Latest attempt</h2>
                <span>Quick result snapshot</span>
              </div>
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
                <p>No results yet. Start your first mock test to unlock analytics.</p>
                <button className="btn primary" onClick={() => navigate('/test')} type="button">
                  {ui.startTest[language]}
                </button>
              </div>
            )}
          </article>

          <article className="panel-card landing-card">
            <div className="section-heading">
              <div>
                <h2>Quick access</h2>
                <span>Minimal navigation</span>
              </div>
            </div>

            <div className="landing-links">
              <Link className="landing-link" to="/trainee">Trainee App Link</Link>
              <Link className="landing-link" to="/dashboard">Progress Dashboard</Link>
              <Link className="landing-link" to="/results">Result Review</Link>
            </div>
          </article>

          <article className="panel-card landing-card">
            <div className="section-heading">
              <div>
                <h2>What you get</h2>
                <span>Designed for desktop and laptop screens</span>
              </div>
            </div>

            <div className="landing-points">
              <div>
                <strong>Clean layout</strong>
                <span>No sidebar clutter, only the essentials.</span>
              </div>
              <div>
                <strong>Full width</strong>
                <span>Content stretches naturally across larger screens.</span>
              </div>
              <div>
                <strong>Simple flow</strong>
                <span>Start test, confirm session, review result.</span>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

export default Home;
