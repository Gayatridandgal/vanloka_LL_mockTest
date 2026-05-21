import { Link, useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
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

  return (
    <main className="app-shell home-shell">
      <section className="hero-card">
        <div className="brand">{ui.appName[language]}</div>
        <LanguageToggle />
        <div className="hero-copy">
          <h1>{ui.headline[language]}</h1>
          <p>{ui.subtext[language]}</p>
        </div>
        {last && (
          <div className="last-score">
            {ui.lastScore[language]}: <strong>{last.score}/{last.total}</strong> - {ui.keepPracticing[language]}
          </div>
        )}
        <button className="btn primary big" onClick={() => navigate('/test')} type="button">
          {ui.startTest[language]}
        </button>
        <div className="stats-row">{ui.stats[language]}</div>
        <Link className="text-link" to="/dashboard">{ui.progress[language]}</Link>
      </section>
    </main>
  );
}

export default Home;
