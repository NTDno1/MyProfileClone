import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FiGlobe } from 'react-icons/fi';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 text-gray-700 transition-colors duration-150 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-400"
      title={`Switch to ${language === 'en' ? 'Vietnamese' : 'English'}`}
    >
      <FiGlobe size={18} />
      <span className="text-sm font-medium">
        {language === 'en' ? 'EN' : 'VI'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
