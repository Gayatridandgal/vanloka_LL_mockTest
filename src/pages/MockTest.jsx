import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
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
  const submitted = useRef(false);

  const currentQuestion = testQuestions[currentIndex];
  const selectedIndex = selectedAnswers[currentQuestion.id];
  const isLast = currentIndex === testQuestions.length - 1;

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

  const helperText = useMemo(() => {
    if (Number.isInteger(selectedIndex)) return '';
    return ui.selectAnswer[language];
  }, [language, selectedIndex]);

  return (
    <main className="app-shell test-shell">
      <Timer totalSeconds={TOTAL_SECONDS} onTick={setRemainingSeconds} onTimeUp={submitTest} />
      <section className="test-panel">
        <div className="test-header">
          <div className="brand small">{ui.appName[language]}</div>
          <ProgressBar current={currentIndex + 1} total={testQuestions.length} />
        </div>
        <QuestionCard question={currentQuestion} selectedIndex={selectedIndex} onSelect={selectAnswer} />
        <div className="test-actions">
          <span className="helper-text">{helperText}</span>
          {isLast ? (
            <button className="btn primary" disabled={!Number.isInteger(selectedIndex)} onClick={submitTest} type="button">
              {ui.submitTest[language]}
            </button>
          ) : (
            <button
              className="btn primary"
              disabled={!Number.isInteger(selectedIndex)}
              onClick={() => setCurrentIndex((index) => index + 1)}
              type="button"
            >
              {ui.next[language]}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default MockTest;
