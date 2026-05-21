import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import LanguageToggle from '../components/LanguageToggle';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Mock Test', to: '/test' },
  { label: 'Progress', to: '/dashboard' },
  { label: 'Results', to: '/results' },
];

const sampleStudents = [
  { name: 'Ananya Rao', focus: 'Road signs', score: '18/20', status: 'Ready' },
  { name: 'Rohit Shetty', focus: 'Signals', score: '15/20', status: 'Review' },
  { name: 'Meera Iyer', focus: 'Rules of the road', score: '19/20', status: 'Ready' },
  { name: 'Karan Patel', focus: 'Safety & penalties', score: '14/20', status: 'Needs help' },
];

const sampleInstructors = [
  { name: 'S. Kumar', role: 'Lead instructor', load: '24 learners' },
  { name: 'A. Nair', role: 'Assessment coach', load: '19 learners' },
  { name: 'P. Devi', role: 'Road safety mentor', load: '12 learners' },
];

const settings = [
  { label: 'Email reminders', value: 'Enabled' },
  { label: 'AI report generation', value: 'Enabled' },
  { label: 'Weekly summary', value: 'Friday 6 PM' },
  { label: 'Keyboard shortcuts', value: 'Enabled' },
];

function readHistory() {
  return JSON.parse(localStorage.getItem('vanloka_test_history') || '[]');
}

function Dashboard() {
  const { language } = useLanguage();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const history = readHistory();
  const totalTests = history.length;

  const average = totalTests
    ? Math.round(history.reduce((sum, test) => sum + (test.score / test.total) * 100, 0) / totalTests)
    : 0;
  const best = totalTests ? Math.max(...history.map((test) => test.score)) : 0;
  const passed = history.filter((test) => test.score >= 12).length;
  const passRate = totalTests ? Math.round((passed / totalTests) * 100) : 0;
  const lastFive = history.slice(-5);
  const recentAttempts = useMemo(() => history.slice(-4).reverse(), [history]);
  const latestScore = history.at(-1);

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
    <main className="app-shell dashboard-layout dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand">{ui.appName[language]}</div>
          <p className="sidebar-subtitle">Progress dashboard</p>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link className={`nav-link ${item.to === '/dashboard' ? 'active' : ''}`} key={item.to} to={item.to}>
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
            <span className="info-label">Total attempts</span>
            <strong>{totalTests}</strong>
          </div>
          <div>
            <span className="info-label">Pass rate</span>
            <strong>{passRate}%</strong>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Operations command center</span>
            <h1>{ui.dashTitle[language]}</h1>
            <p className="topbar-copy">Track learner readiness, weak topics, and test throughput from one calm, high-density workspace.</p>
          </div>

          <div className="topbar-actions">
            <Link className="btn outline" to="/">{ui.backHome[language]}</Link>
            <Link className="btn primary" to="/test">{ui.startTest[language]}</Link>
          </div>
        </header>

        {totalTests === 0 ? (
          <section className="empty-state">
            <p>{ui.noHistory[language]}</p>
            <Link className="btn primary" to="/test">{ui.startTest[language]}</Link>
          </section>
        ) : (
          <>
            <section className="stats-grid dashboard-stats">
              <article className="metric-card">
                <span>{ui.totalTests[language]}</span>
                <strong>{totalTests}</strong>
                <p>All recorded attempts in this browser.</p>
              </article>
              <article className="metric-card">
                <span>{ui.averageScore[language]}</span>
                <strong>{average}%</strong>
                <p>Average score across the full history.</p>
              </article>
              <article className="metric-card">
                <span>{ui.bestScore[language]}</span>
                <strong>{best}/20</strong>
                <p>Best single attempt captured so far.</p>
              </article>
              <article className="metric-card">
                <span>{ui.passRate[language]}</span>
                <strong>{passRate}%</strong>
                <p>Share of attempts that met the pass mark.</p>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel-card report-card span-8">
                <div className="section-heading">
                  <div>
                    <h2>{ui.lastFive[language]}</h2>
                    <span>Score trend for the most recent attempts</span>
                  </div>
                  <span className="status-pill">{latestScore ? `${latestScore.score}/${latestScore.total}` : 'No recent score'}</span>
                </div>

                <div className="bar-chart">
                  {lastFive.map((test, index) => {
                    const height = Math.max(14, Math.round((test.score / test.total) * 100));
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

                <div className="timeline-list">
                  {recentAttempts.map((attempt, index) => (
                    <div className="timeline-row" key={`${attempt.date}-${index}`}>
                      <div>
                        <strong>{attempt.score}/{attempt.total}</strong>
                        <span>{new Date(attempt.date).toLocaleDateString()}</span>
                      </div>
                      <span>{Math.round((attempt.score / attempt.total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel-card map-card span-4">
                <div className="section-heading">
                  <div>
                    <h2>Vehicle tracking map</h2>
                    <span>Operational view for practice route checks</span>
                  </div>
                  <span className="status-pill success">Live</span>
                </div>

                <div className="map-viewport" aria-hidden="true">
                  <span className="route-line route-one" />
                  <span className="route-line route-two" />
                  <span className="route-node node-start">Start</span>
                  <span className="route-node node-mid">Queue</span>
                  <span className="route-node node-end">Finish</span>
                </div>

                <div className="legend-grid">
                  <div><span className="legend-dot primary" />Inspection lane</div>
                  <div><span className="legend-dot accent" />Practice loop</div>
                  <div><span className="legend-dot success" />Clear path</div>
                </div>
              </article>

              <article className="panel-card roster-card span-6">
                <div className="section-heading">
                  <div>
                    <h2>Student list</h2>
                    <span>Current learners in the program</span>
                  </div>
                  <span className="status-pill">{sampleStudents.length} active</span>
                </div>

                <div className="roster-list">
                  {sampleStudents.map((student) => (
                    <div className="person-row" key={student.name}>
                      <div className="avatar">{student.name.charAt(0)}</div>
                      <div>
                        <strong>{student.name}</strong>
                        <span>{student.focus}</span>
                      </div>
                      <div className="person-meta">
                        <strong>{student.score}</strong>
                        <span>{student.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel-card roster-card span-6">
                <div className="section-heading">
                  <div>
                    <h2>Instructor list</h2>
                    <span>Assigned trainers and review coverage</span>
                  </div>
                  <span className="status-pill warning">Coaching</span>
                </div>

                <div className="roster-list">
                  {sampleInstructors.map((instructor) => (
                    <div className="person-row" key={instructor.name}>
                      <div className="avatar alt">{instructor.name.charAt(0)}</div>
                      <div>
                        <strong>{instructor.name}</strong>
                        <span>{instructor.role}</span>
                      </div>
                      <div className="person-meta">
                        <strong>{instructor.load}</strong>
                        <span>Assigned</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel-card settings-card span-6">
                <div className="section-heading">
                  <div>
                    <h2>Settings</h2>
                    <span>Review the current workspace configuration</span>
                  </div>
                  <span className="status-pill">Default</span>
                </div>

                <div className="settings-list">
                  {settings.map((setting) => (
                    <div className="setting-row" key={setting.label}>
                      <span>{setting.label}</span>
                      <strong>{setting.value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel-card roster-card span-6">
                <div className="section-heading">
                  <div>
                    <h2>{ui.weakAreas[language]}</h2>
                    <span>Topics with the most incorrect answers</span>
                  </div>
                  <span className="status-pill danger">Needs attention</span>
                </div>

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
              </article>
            </section>

            <div className="dashboard-actions">
              <Link className="btn primary" to="/test">{ui.startTest[language]}</Link>
              <button className="btn danger" onClick={() => setShowClearConfirm(true)} type="button">{ui.clearHistory[language]}</button>
            </div>
          </>
        )}

        {showClearConfirm && (
          <ConfirmDialog
            cancelLabel="Cancel"
            confirmLabel="Clear History"
            danger
            message="This will permanently remove all saved mock test attempts from this browser."
            onCancel={() => setShowClearConfirm(false)}
            onConfirm={clearHistory}
            title="Clear test history?"
          />
        )}
      </section>
    </main>
  );
}

export default Dashboard;
