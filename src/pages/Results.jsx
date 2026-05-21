import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import { formatTime } from '../components/Timer';
import { questions } from '../data/questions';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

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
  const result = state?.result || getFallbackResult();
  const testQuestions = state?.testQuestions || result?.answers.map((answer) => {
    const found = questions.find((question) => question.id === answer.questionId);
    return found ? prepareForReview(found) : null;
  }).filter(Boolean);

  const questionById = useMemo(() => {
    return new Map((testQuestions || []).map((question) => [question.id, question]));
  }, [testQuestions]);

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
    const text = `I scored ${result.score}/${result.total} on VanLoka RTO Mock Test! 🚗`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <main className="app-shell results-shell">
      {passed && <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }).map((_, index) => <span key={index} />)}</div>}
      <section className="result-summary">
        <div className="brand small">{ui.appName[language]}</div>
        <h1>{ui.results[language]}</h1>
        <p className="score-line">
          {ui.scored[language]} <strong>{result.score}/{result.total}</strong> ({percentage}%)
        </p>
        <div className={`badge ${passed ? 'pass' : 'fail'}`}>{passed ? ui.passed[language] : ui.failed[language]}</div>
        <p className="muted">{ui.timeTaken[language]}: {formatTime(result.timeTaken)}</p>
        <div className="button-row">
          <button className="btn secondary" onClick={shareResult} type="button">{copied ? ui.copied[language] : ui.share[language]}</button>
          <button className="btn primary" onClick={() => navigate('/test')} type="button">{ui.retake[language]}</button>
          <button className="btn outline" onClick={() => navigate('/dashboard')} type="button">{ui.dashboard[language]}</button>
        </div>
      </section>

      <section className="review-section">
        <h2>{ui.review[language]}</h2>
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
      </section>
    </main>
  );
}

export default Results;
