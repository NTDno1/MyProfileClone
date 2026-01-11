import { FiMail, FiPhone, FiMapPin, FiCalendar, FiGithub, FiLinkedin, FiFacebook } from 'react-icons/fi';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

const CVSidebar = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-200 p-6 print:p-1 print:pt-0.5 min-h-screen print:min-h-0 print:pb-0.5 print-keep-together">
      {/* Profile Section - Removed since header has name */}
      
      {/* Contact Info - Removed, now in header */}

      {/* About Me - Keep on first page */}
      <div className="mb-3 print:mb-1 print:mt-0 print-keep-together">
        <h2 className="text-xl print:text-[9px] font-bold text-gray-700 mb-1 print:mb-0 uppercase">{t('cv.aboutMe.title')}</h2>
        <p className="text-sm print:text-[7.2px] text-gray-700 leading-tight print:leading-[1.1]">
          {t('cv.aboutMe.content')}
        </p>
        <p className="text-sm print:text-[7.2px] text-gray-700 leading-tight print:leading-[1.1] mt-0.5 print:mt-0">
          {t('cv.aboutMe.content2')}
        </p>
      </div>

      <hr className="border-gray-400 my-2 print:my-0.5" />

      {/* Skills */}
      <div className="mb-3 print:mb-1.5">
        <h2 className="text-xl print:text-xs font-bold text-gray-700 mb-1 print:mb-0.5 uppercase">{t('cv.skills.title')}</h2>
        
        <div className="space-y-1 print:space-y-0.5">
          <div>
            <h3 className="text-sm print:text-[9px] font-semibold text-gray-800 mb-0 print:mb-0">{t('cv.skills.backend.title')}</h3>
            <p className="text-xs print:text-[8px] text-gray-700 leading-tight print:leading-[1.1]">
              {t('cv.skills.backend.content')}
            </p>
          </div>

          <div>
            <h3 className="text-sm print:text-[9px] font-semibold text-gray-800 mb-0 print:mb-0">{t('cv.skills.database.title')}</h3>
            <p className="text-xs print:text-[8px] text-gray-700 leading-tight print:leading-[1.1]">
              {t('cv.skills.database.content')}
            </p>
          </div>

          <div>
            <h3 className="text-sm print:text-[9px] font-semibold text-gray-800 mb-0 print:mb-0">{t('cv.skills.frontend.title')}</h3>
            <p className="text-xs print:text-[8px] text-gray-700 leading-tight print:leading-[1.1]">
              {t('cv.skills.frontend.content')}
            </p>
          </div>

          <div>
            <h3 className="text-sm print:text-[9px] font-semibold text-gray-800 mb-0 print:mb-0">{t('cv.skills.tools.title')}</h3>
            <p className="text-xs print:text-[8px] text-gray-700 leading-tight print:leading-[1.1]">
              {t('cv.skills.tools.content')}
            </p>
          </div>
        </div>
      </div>

      <hr className="border-gray-400 my-2 print:my-1" />

      {/* Education */}
      <div className="mb-3 print:mb-1.5">
        <h2 className="text-xl print:text-xs font-bold text-gray-700 mb-1 print:mb-0.5 uppercase">{t('cv.education.title')}</h2>
        
        <div className="mb-1.5 print:mb-1">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-base print:text-[9px] font-bold text-gray-800">{t('cv.education.bachelor.full')}</h3>
            <span className="text-xs print:text-[8px] text-gray-600">06/2019 - 12/2023</span>
          </div>
          <p className="text-sm print:text-[8px] text-gray-700 mb-0 print:mb-0">{t('cv.education.bachelor.major')}</p>
          <p className="text-sm print:text-[8px] text-gray-600">• {t('cv.education.bachelor.specialty')}</p>
        </div>

        <div>
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-base print:text-[9px] font-bold text-gray-800">{t('cv.education.master.full')}</h3>
            <span className="text-xs print:text-[8px] text-gray-600">07/2025 - Now</span>
          </div>
          <p className="text-sm print:text-[8px] text-gray-700 mb-0 print:mb-0">{t('cv.education.master.major')}</p>
          <p className="text-sm print:text-[8px] text-gray-600">• {t('cv.education.master.specialty')}</p>
        </div>
      </div>

    </div>
  );
};

export default CVSidebar;
