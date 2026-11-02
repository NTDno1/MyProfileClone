import { useLanguage } from '@/contexts/LanguageContext';
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="dev-language" role="group" aria-label={t('ui.language')}>
      {(['vi', 'en'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-label={lang === 'vi' ? 'Tiếng Việt' : 'English'}
          aria-pressed={language === lang}
          onClick={() => setLanguage(lang)}
          className={language === lang ? 'is-active' : ''}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
