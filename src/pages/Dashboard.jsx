import { Link } from 'react-router-dom';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

function readHistory() {
  return JSON.parse(localStorage.getItem('vanloka_test_history') || '[]');
}

function Dashboard() {
  const { language } = useLanguage();
  const history = readHistory();
  const totalTests = history.length;

  const average = totalTests
    ? Math.round(history.reduce((sum, test) => sum + (test.score / test.total) * 100, 0) / totalTests)
    : 0;
  const best = totalTests ? Math.max(...history.map((test) => test.score)) : 0;
  const passed = history.filter((test) => test.score >= 12).length;
  const passRate = totalTests ? Math.round((passed / totalTests) * 100) : 0;
  const lastFive = history.slice(-5);

  const wrongByCategory = history.reduce((counts, test) => {
    test.answers.forEach((answer) => {
      if (answer.selectedIndex !== answer.correct) {
        counts[answer.category] = (counts[answer.category] || 0) + 1;
      }
    });
    return counts;
  }, {});
  const weakAreas = Object.entries(wrongByCategory).sort((a, b) => b[1] - a[1]);

  const clearHistory = () => {
    localStorage.removeItem('vanloka_test_history');
    window.location.reload();
  };

  return (
    <main className="app-shell dashboard-shell">
      <section className="dashboard-header">
        <div>
          <div className="brand small">{ui.appName[language]}</div>
          <h1>{ui.dashTitle[language]}</h1>
        </div>
        <Link className="btn outline" to="/">{ui.backHome[language]}</Link>
      </section>

      {totalTests === 0 ? (
        <section className="empty-state">
          <p>{ui.noHistory[language]}</p>
          <Link className="btn primary" to="/test">{ui.startTest[language]}</Link>
        </section>
      ) : (
        <>
          <section className="metric-grid">
            <div className="metric-card"><span>{ui.totalTests[language]}</span><strong>{totalTests}</strong></div>
            <div className="metric-card"><span>{ui.averageScore[language]}</span><strong>{average}%</strong></div>
            <div className="metric-card"><span>{ui.bestScore[language]}</span><strong>{best}/20</strong></div>
            <div className="metric-card"><span>{ui.passRate[language]}</span><strong>{passRate}%</strong></div>
          </section>

          <section className="analytics-card">
            <h2>{ui.lastFive[language]}</h2>
            <div className="bar-chart">
              {lastFive.map((test, index) => {
                const height = Math.max(8, Math.round((test.score / test.total) * 100));
                return (
                  <div className="bar-item" key={`${test.date}-${index}`}>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${height}%` }} />
                    </div>
                    <span>{test.score}/{test.total}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="analytics-card">
            <h2>{ui.weakAreas[language]}</h2>
            {weakAreas.length ? (
              <div className="weak-list">
                {weakAreas.slice(0, 3).map(([category, count]) => (
                  <div className="weak-item" key={category}>
                    <span>{category}</span>
                    <strong>{count} {ui.mostWrong[language]}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Excellent. No wrong answers recorded.</p>
            )}
          </section>

          <button className="btn danger" onClick={clearHistory} type="button">{ui.clearHistory[language]}</button>
        </>
      )}
    </main>
  );
}

export default Dashboard;
