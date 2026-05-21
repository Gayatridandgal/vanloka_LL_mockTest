import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

function ProgressBar({ current, total }) {
  const { language } = useLanguage();
  const percent = Math.round((current / total) * 100);

  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>
          {ui.questionOf[language]} {current} {ui.of[language]} {total}
        </span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
