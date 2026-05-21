import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import QuestionCard from '../components/QuestionCard';
import { formatTime } from '../components/Timer';
import { questions } from '../data/questions';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';
import { generatePerformanceReport } from '../services/aiReport';

function prepareForReview(question) {
  return {
    ...question,
    shuffledOptions: [0, 1, 2, 3].map((originalIndex) => ({
      originalIndex,
      text: {
        en: question.options.en[originalIndex],
        kn: question.options.kn[originalIndex],
        hi: question.options.hi[originalIndex],
      },
    })),
  };
}

function getFallbackResult() {
  const history = JSON.parse(localStorage.getItem('vanloka_test_history') || '[]');
  return history.at(-1) || null;
}

function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);
  const result = state?.result || getFallbackResult();
  const testQuestions = state?.testQuestions || result?.answers.map((answer) => {
    const found = questions.find((question) => question.id === answer.questionId);
    return found ? prepareForReview(found) : null;
  }).filter(Boolean);

  const questionById = useMemo(() => {
    return new Map((testQuestions || []).map((question) => [question.id, question]));
  }, [testQuestions]);

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timerId = window.setTimeout(() => setToastMessage(''), 1800);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

  useEffect(() => {
    if (!result) return;

    const wrongAnswers = result.answers
      .filter((answer) => answer.selectedIndex !== answer.correct)
      .map((answer) => {
        const question = questionById.get(answer.questionId);
        return {
          question: question?.question?.[language] || '',
          category: question?.category || 'General RTO Knowledge',
        };
      });

    let isMounted = true;
    setReportLoading(true);
    setReportError(false);

    generatePerformanceReport(result.score, result.total, result.timeTaken, wrongAnswers, language)
      .then((report) => {
        if (!isMounted) return;
        if (report) {
          setAiReport(report);
        } else {
          setReportError(true);
        }
      })
      .catch((error) => {
        console.log('AI performance report failed:', error);
        if (isMounted) setReportError(true);
      })
      .finally(() => {
        if (isMounted) setReportLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // Run once on mount so the report does not regenerate during result review.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <p>{ui.noHistory[language]}</p>
          <Link className="btn primary" to="/">{ui.backHome[language]}</Link>
        </section>
      </main>
    );
  }

  const percentage = Math.round((result.score / result.total) * 100);
  const passed = result.score >= 12;

  const shareResult = async () => {
    const text = `I scored ${result.score}/${result.total} on VanLoka RTO Mock Test!`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setToastMessage('Result copied to clipboard');
    } catch (error) {
      console.log('Clipboard copy failed:', error);
      setToastMessage('Copy failed. Please try again.');
    }
  };

  return (
    <main className="app-shell results-shell">
      {passed && <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }).map((_, index) => <span key={index} />)}</div>}
      <div className="results-layout">
        <section className="panel-card result-summary">
          <div className="result-header">
            <div>
              <div className="brand small">{ui.appName[language]}</div>
              <span className="eyebrow">{ui.results[language]}</span>
            </div>
            <div className={`badge ${passed ? 'pass' : 'fail'}`}>{passed ? ui.passed[language] : ui.failed[language]}</div>
          </div>

          <h1>{ui.results[language]}</h1>
          <p className="score-line">
            {ui.scored[language]} <strong>{result.score}/{result.total}</strong> ({percentage}%)
          </p>
          <p className="muted">{ui.timeTaken[language]}: {formatTime(result.timeTaken)}</p>

          <div className="result-metrics">
            <div>
              <span>Correct answers</span>
              <strong>{result.score}</strong>
            </div>
            <div>
              <span>Incorrect answers</span>
              <strong>{result.total - result.score}</strong>
            </div>
            <div>
              <span>Pass target</span>
              <strong>12/20</strong>
            </div>
          </div>

          <div className="button-row">
            <button className="btn secondary" onClick={shareResult} type="button">{copied ? ui.copied[language] : ui.share[language]}</button>
            <button className="btn primary" onClick={() => setShowRetakeConfirm(true)} type="button">{ui.retake[language]}</button>
            <button className="btn outline" onClick={() => navigate('/dashboard')} type="button">{ui.dashboard[language]}</button>
          </div>
        </section>

        <aside className="panel-card result-rail">
          {reportLoading && (
            <div className="ai-report-card loading">
              <div className="skeleton-line wide"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line medium"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-icon"></div>
            </div>
          )}

          {!reportLoading && aiReport && (
            <div className="ai-report-card">
              <div className="ai-report-header">
                <span className="ai-badge">AI Insight</span>
                <span className="ai-label">Personalised Performance Report</span>
              </div>
              <p className="ai-report-text">{aiReport}</p>
              <div className="ai-report-footer">
                <span>Generated by VanLoka AI</span>
              </div>
            </div>
          )}

          {!reportLoading && reportError && (
            <div className="ai-report-card error">
              <p>Keep practicing! Review the questions you got wrong and try again.</p>
            </div>
          )}

          <div className="insight-stack">
            <div className="insight-card">
              <span>Review depth</span>
              <strong>{result.answers.filter((answer) => answer.selectedIndex !== answer.correct).length} questions</strong>
            </div>
            <div className="insight-card">
              <span>Retake readiness</span>
              <strong>{passed ? 'Optional' : 'Recommended'}</strong>
            </div>
          </div>
        </aside>
      </div>

      <section className="panel-card review-section">
        <div className="section-heading">
          <div>
            <h2>{ui.review[language]}</h2>
            <span>Detailed question-by-question review</span>
          </div>
        </div>

        <div className="review-list">
          {result.answers.map((answer, index) => {
            const question = questionById.get(answer.questionId);
            if (!question) return null;
            const userText = answer.selectedIndex === null ? ui.notAnswered[language] : question.options[language][answer.selectedIndex];
            const correctText = question.options[language][answer.correct];
            const isCorrect = answer.selectedIndex === answer.correct;

            return (
              <div className={`review-card ${isCorrect ? 'is-correct' : 'is-wrong'}`} key={answer.questionId}>
                <QuestionCard question={question} showReview userAnswer={answer.selectedIndex} />
                <div className="answer-review">
                  <p><strong>{index + 1}. {ui.yourAnswer[language]}:</strong> {userText}</p>
                  <p><strong>{ui.correctAnswer[language]}:</strong> {correctText}</p>
                  {!isCorrect && <p className="explanation">{question.explanation[language]}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showRetakeConfirm && (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Start New Test"
          message="Your current result is saved. Start a fresh mock test now?"
          onCancel={() => setShowRetakeConfirm(false)}
          onConfirm={() => navigate('/test')}
          title="Retake mock test?"
        />
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </main>
  );
}

export default Results;
