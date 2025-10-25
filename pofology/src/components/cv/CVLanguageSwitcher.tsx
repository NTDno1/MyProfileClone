import { useLanguage } from '@/contexts/LanguageContext';

const CVLanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-2 bg-white rounded-lg shadow-md p-1">
      <button
        onClick={() => setLanguage('vi')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'vi'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        🇻🇳 Tiếng Việt
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  );
};

export default CVLanguageSwitcher;

