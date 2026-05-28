import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import PageTopNav from '../components/PageTopNav';

function TestInstructions() {
  const navigate = useNavigate();
  const [showBeginDialog, setShowBeginDialog] = useState(false);

  return (
    <main className="app-shell test-shell">
      <PageTopNav />
      <div className="test-layout">
        <aside className="panel-card test-rail">
          <div className="test-rail-header">
            <div>
              <span className="eyebrow">Ready to begin</span>
              <div className="brand small">VanLoka MDS Mock Test</div>
            </div>
          </div>

          <div className="rail-section guidance-card">
            <div className="section-heading">
              <div>
                <h2>Test guide</h2>
                <span>Read these instructions before starting</span>
              </div>
            </div>

            <div className="guide-list">
              <div>
                <strong>1.</strong>
                <span>Answer all questions on your own.</span>
              </div>
              <div>
                <strong>2.</strong>
                <span>Do not refresh or close the browser during the attempt.</span>
              </div>
              <div>
                <strong>3.</strong>
                <span>Use the navigator to revisit questions if needed.</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="panel-card test-stage">
          <div className="test-intro">
            <span className="eyebrow">Page instructions</span>
            <h1>Ready to begin?</h1>
            <p className="topbar-copy">Review the rules and test guide first, then continue to the live mock test when you are ready.</p>

            <div className="rules-panel">
              <h2>Rules and regulations</h2>
              <ul className="rules-list">
                <li>Answer all questions carefully before submitting.</li>
                <li>Keep the browser open until the test is complete.</li>
                <li>Canceling the test will discard the current attempt.</li>
              </ul>
            </div>

            <div className="test-actions intro-actions">
              <button className="btn outline" onClick={() => navigate('/dashboard')} type="button">
                Review Later
              </button>
              <button className="btn primary" onClick={() => setShowBeginDialog(true)} type="button">
                Start Test
              </button>
            </div>
          </div>
        </section>
      </div>

      {showBeginDialog && (
        <ConfirmDialog
          cancelLabel="Later"
          confirmLabel="Begin Test"
          message="This will start the live mock test now. Continue only if you are ready."
          onCancel={() => setShowBeginDialog(false)}
          onConfirm={() => navigate('/test/start')}
          title="Begin test?"
        />
      )}
    </main>
  );
}

export default TestInstructions;