import { useEffect, useRef, useState } from 'react';
import { ui } from '../data/ui_strings';
import { useLanguage } from '../context/LanguageContext';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function Timer({ totalSeconds, onTimeUp, onTick }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const calledTimeUp = useRef(false);
  const { language } = useLanguage();

  useEffect(() => {
    setRemaining(totalSeconds);
    calledTimeUp.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    onTick?.(remaining);
  }, [remaining, onTick]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          clearInterval(timerId);
          if (!calledTimeUp.current) {
            calledTimeUp.current = true;
            onTimeUp();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [onTimeUp]);

  return (
    <div className={`timer ${remaining < 300 ? 'danger' : ''}`}>
      <span>{ui.timeLeft[language]}</span>
      <strong>{formatTime(remaining)}</strong>
    </div>
  );
}

export default Timer;
export { formatTime };
