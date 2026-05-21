import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import Timer, { formatTime } from '../components/Timer';
import { questions } from '../data/questions';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

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
  const { language } = useLanguage();
  const [testQuestions] = useState(() => shuffle(questions).slice(0, TEST_SIZE).map(prepareQuestion));
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
      score,
      total: testQuestions.length,
      timeTaken: TOTAL_SECONDS - remainingSeconds,
      answers,
    };

    localStorage.setItem('vanloka_test_history', JSON.stringify([...readHistory(), result]));
    navigate('/results', { state: { result, testQuestions } });
  }, [navigate, remainingSeconds, selectedAnswers, testQuestions]);

  const selectAnswer = (index) => {
    setSelectedAnswers((current) => ({
      ...current,
      [currentQuestion.id]: index,
    }));
  };

  const requestCancel = () => {
    setDialog({
      title: 'Cancel mock test?',
      message: 'Your current answers will not be saved. Stay on the test if you want to complete this attempt.',
      confirmLabel: 'Cancel Test',
      cancelLabel: 'Keep Testing',
      danger: true,
      onConfirm: () => navigate('/'),
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
      <div className="test-layout">
        <aside className="panel-card test-rail">
          <div className="test-rail-header">
            <div>
              <span className="eyebrow">Live mock test</span>
              <div className="brand small">{ui.appName[language]}</div>
            </div>
            <button className="btn quiet danger-text" onClick={requestCancel} type="button">Cancel Test</button>
          </div>

          <Timer totalSeconds={TOTAL_SECONDS} onTick={setRemainingSeconds} onTimeUp={submitTest} />

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
        </section>
      </div>

      {dialog && (
        <ConfirmDialog
          cancelLabel={dialog.cancelLabel}
          confirmLabel={dialog.confirmLabel}
          danger={dialog.danger}
          message={dialog.message}
          onCancel={() => setDialog(null)}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
        />
      )}
    </main>
  );
}

export default MockTest;
