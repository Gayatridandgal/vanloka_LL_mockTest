import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import PageTopNav from '../components/PageTopNav';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import Timer, { formatTime } from '../components/Timer';
import { questions } from '../data/questions';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';
import { getVerifiedTrainee } from '../services/traineeVerification';

const TEST_SIZE = 20;
const TOTAL_SECONDS = 1800;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function prepareQuestion(question) {
  const optionOrder = shuffle([0, 1, 2, 3]);
  return {
    ...question,
    shuffledOptions: optionOrder.map((originalIndex) => ({
      originalIndex,
      text: {
        en: question.options.en[originalIndex],
        kn: question.options.kn[originalIndex],
        hi: question.options.hi[originalIndex],
      },
    })),
  };
}

function readHistory() {
  return JSON.parse(localStorage.getItem('vanloka_test_history') || '[]');
}

function MockTest() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { language } = useLanguage();
  const trainee = state?.trainee || getVerifiedTrainee();
  const [testQuestions] = useState(() => shuffle(questions).slice(0, TEST_SIZE).map(prepareQuestion));
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SECONDS);
  const [dialog, setDialog] = useState(null);
  const submitted = useRef(false);

  const currentQuestion = testQuestions[currentIndex];
  const selectedIndex = selectedAnswers[currentQuestion.id];
  const isLast = currentIndex === testQuestions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = testQuestions.length - answeredCount;
  const progress = useMemo(() => Math.round(((currentIndex + 1) / testQuestions.length) * 100), [currentIndex, testQuestions.length]);

  const beginTest = () => {
    setHasAcceptedRules(true);
  };

  const submitTest = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;

    const answers = testQuestions.map((question) => {
      const shuffledIndex = selectedAnswers[question.id];
      const selectedOption = Number.isInteger(shuffledIndex) ? question.shuffledOptions[shuffledIndex] : null;
      const selectedOriginalIndex = selectedOption ? selectedOption.originalIndex : null;

      return {
        questionId: question.id,
        selectedIndex: selectedOriginalIndex,
        correct: question.correct,
        category: question.category,
      };
    });

    const score = answers.filter((answer) => answer.selectedIndex === answer.correct).length;
    const result = {
      date: new Date().toISOString(),
      trainee,
      score,
      total: testQuestions.length,
      timeTaken: TOTAL_SECONDS - remainingSeconds,
      answers,
    };

    localStorage.setItem('vanloka_test_history', JSON.stringify([...readHistory(), result]));
    navigate('/results', { state: { result, testQuestions } });
  }, [navigate, remainingSeconds, selectedAnswers, testQuestions, trainee]);

  const selectAnswer = (index) => {
    setSelectedAnswers((current) => ({
      ...current,
      [currentQuestion.id]: index,
    }));
  };

  const requestCancel = () => {
    setDialog({
      mode: 'cancel',
      title: 'Cancel mock test?',
      message: 'This will discard your current answers. Type CANCEL to confirm that you want to stop this attempt.',
      confirmLabel: 'Confirm Cancel',
      cancelLabel: 'Keep Testing',
      danger: true,
      validationText: 'CANCEL',
      validationValue: '',
      onConfirm: () => navigate('/dashboard'),
    });
  };

  const requestSubmit = () => {
    if (unansweredCount > 0) {
      setDialog({
        title: 'Submit with unanswered questions?',
        message: `${unansweredCount} question${unansweredCount === 1 ? ' is' : 's are'} still unanswered. You can go back and complete them, or submit now for scoring.`,
        confirmLabel: 'Submit Anyway',
        cancelLabel: 'Review Test',
        onConfirm: submitTest,
      });
      return;
    }

    submitTest();
  };

  const helperText = useMemo(() => {
    if (Number.isInteger(selectedIndex)) return '';
    return ui.selectAnswer[language];
  }, [language, selectedIndex]);

  return (
    <main className="app-shell test-shell">
      <PageTopNav />
      <div className="test-layout">
        <aside className="panel-card test-rail">
          <div className="test-rail-header">
            <div>
              <span className="eyebrow">Live mock test</span>
              <div className="brand small">{ui.appName[language]}</div>
            </div>
            <button className="btn quiet danger-text" onClick={requestCancel} type="button">Cancel Test</button>
          </div>

          <Timer isRunning={hasAcceptedRules} totalSeconds={TOTAL_SECONDS} onTick={setRemainingSeconds} onTimeUp={submitTest} />

          {trainee ? (
            <div className="trainee-mini-card">
              <span>Verified trainee</span>
              <strong>{trainee.name}</strong>
              <em>{trainee.phone ? `+91 ${trainee.phone}` : trainee.id}</em>
            </div>
          ) : (
            <Link className="btn outline full-width" to="/trainee">Verify trainee</Link>
          )}

          <div className="summary-grid">
            <div>
              <span>Question</span>
              <strong>{currentIndex + 1}/{testQuestions.length}</strong>
            </div>
            <div>
              <span>Answered</span>
              <strong>{answeredCount}/{testQuestions.length}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{formatTime(remainingSeconds)}</strong>
            </div>
            <div>
              <span>Pass mark</span>
              <strong>12/20</strong>
            </div>
          </div>

          <div className="rail-section">
            <div className="section-heading">
              <div>
                <h2>Question navigator</h2>
                <span>Jump across the full test</span>
              </div>
              <span className="status-pill">{progress}%</span>
            </div>

            <div className="question-palette" aria-label="Question navigator">
              {testQuestions.map((question, index) => (
                <button
                  className={`question-dot ${index === currentIndex ? 'active' : ''} ${Number.isInteger(selectedAnswers[question.id]) ? 'answered' : ''}`}
                  key={question.id}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="rail-section guidance-card">
            <div className="section-heading">
              <div>
                <h2>Test guide</h2>
                <span>Keep a steady pace and review your answer queue</span>
              </div>
            </div>

            <div className="guide-list">
              <div>
                <strong>1.</strong>
                <span>Answer the current question before moving on when possible.</span>
              </div>
              <div>
                <strong>2.</strong>
                <span>Use the navigator to revisit flagged or uncertain questions.</span>
              </div>
              <div>
                <strong>3.</strong>
                <span>Submit early if you have completed all 20 questions.</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="panel-card test-stage">
          {!hasAcceptedRules ? (
            <div className="test-intro">
              <span className="eyebrow">Ready to begin</span>
              <h1>{ui.headline[language]}</h1>
              <p className="topbar-copy">Review the rules below, then start the mock test when you are ready.</p>

              <div className="rules-panel">
                <h2>Rules and regulations</h2>
                <ul className="rules-list">
                  <li>Do not refresh or close the browser during the attempt.</li>
                  <li>Answer all questions carefully before submitting.</li>
                  <li>Use the navigator to revisit questions if needed.</li>
                  <li>Canceling the test will discard the current attempt.</li>
                </ul>
              </div>

              <div className="test-actions intro-actions">
                <button className="btn outline" onClick={() => navigate('/dashboard')} type="button">
                  Not Now
                </button>
                <button className="btn primary" onClick={beginTest} type="button">
                  Ready, Start Test
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="stage-header">
                <div>
                  <span className="eyebrow">Current question</span>
                  <h1>{ui.headline[language]}</h1>
                  <p className="topbar-copy">Answer clearly, keep the current pace, and use the navigator when you need to revisit a prompt.</p>
                </div>

                <ProgressBar current={currentIndex + 1} total={testQuestions.length} />
              </div>

              <QuestionCard question={currentQuestion} selectedIndex={selectedIndex} onSelect={selectAnswer} />

              <div className="test-actions">
                <button
                  className="btn outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((index) => index - 1)}
                  type="button"
                >
                  Previous
                </button>
                <span className="helper-text">{helperText || `${answeredCount} answered, ${unansweredCount} remaining`}</span>
                <div className="action-stack">
                  <button
                    className="btn primary"
                    onClick={isLast ? requestSubmit : () => setCurrentIndex((index) => index + 1)}
                    type="button"
                  >
                    {isLast ? ui.submitTest[language] : ui.next[language]}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {dialog && (
        <ConfirmDialog
          cancelLabel={dialog.cancelLabel}
          confirmLabel={dialog.confirmLabel}
          danger={dialog.danger}
          message={dialog.message}
          confirmDisabled={dialog.validationText ? dialog.validationValue?.trim().toUpperCase() !== dialog.validationText : false}
          onCancel={() => setDialog(null)}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
        >
          {dialog.mode === 'cancel' && (
            <div className="confirm-extra">
              <label className="confirm-validation">
                <span>Type CANCEL to continue</span>
                <input
                  autoComplete="off"
                  className="confirm-input"
                  onChange={(event) => setDialog((current) => (current ? { ...current, validationValue: event.target.value } : current))}
                  placeholder="CANCEL"
                  value={dialog.validationValue || ''}
                />
              </label>
            </div>
          )}

          {dialog.mode === 'submit' && null}
        </ConfirmDialog>
      )}

      {!hasAcceptedRules && (
        <ConfirmDialog
          cancelLabel="Review Later"
          confirmLabel="Ready, Start Test"
          message="Please read the rules carefully before you begin."
          onCancel={() => navigate('/dashboard')}
          onConfirm={beginTest}
          title="Ready to begin?"
        >
          <ul className="confirm-list">
            <li>Answer all questions on your own.</li>
            <li>Do not refresh or close the browser.</li>
            <li>Canceling will end the attempt and lose current answers.</li>
          </ul>
        </ConfirmDialog>
      )}
    </main>
  );
}

export default MockTest;
