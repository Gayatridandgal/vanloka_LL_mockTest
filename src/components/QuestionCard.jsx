import { useLanguage } from '../context/LanguageContext';

const letters = ['A', 'B', 'C', 'D'];

function QuestionCard({ question, selectedIndex, onSelect, showReview = false, userAnswer }) {
  const { language } = useLanguage();

  return (
    <article className="question-card">
      <div className="category-pill">{question.category}</div>
      <h2>{question.question[language]}</h2>
      <div className="options-list">
        {question.shuffledOptions.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.originalIndex === question.correct;
          const wasUserAnswer = userAnswer === option.originalIndex;
          let reviewClass = '';
          if (showReview && isCorrect) reviewClass = 'correct';
          if (showReview && wasUserAnswer && !isCorrect) reviewClass = 'wrong';

          return (
            <button
              className={`option-card ${isSelected ? 'selected' : ''} ${reviewClass}`}
              disabled={showReview}
              key={`${question.id}-${option.originalIndex}`}
              onClick={() => onSelect(index)}
              type="button"
            >
              <span className="option-letter">{letters[index]}</span>
              <span>{option.text[language]}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default QuestionCard;
