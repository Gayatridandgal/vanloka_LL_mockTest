import { useLanguage } from '../context/LanguageContext';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
];

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-toggle" aria-label="Language selector">
      {languages.map((item) => (
        <button
          className={language === item.code ? 'active' : ''}
          key={item.code}
          onClick={() => setLanguage(item.code)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default LanguageToggle;
