import { FiMail, FiPhone, FiMapPin, FiCalendar, FiGithub, FiLinkedin } from 'react-icons/fi';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

const CVSidebar = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-200 p-8 min-h-screen">
      {/* Profile Section */}
      <div className="text-center mb-8">
        <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gray-300">
          <Image 
            src="/images/avatar/ava_cv.jpg" 
            alt={t('cv.name')}
            width={192}
            height={192}
            className="object-cover"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('cv.name')}</h1>
        <p className="text-lg text-gray-600">{t('cv.position')}</p>
      </div>

      {/* Contact Info */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3 text-gray-700">
          <FiPhone className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">0983877462</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700">
          <FiMail className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm break-all">datt19112001@gmail.com</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700">
          <FiMapPin className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Thanh Mỹ - Sơn Tây - Hà Nội</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700">
          <FiCalendar className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">19/11/2001</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700">
          <FiGithub className="w-5 h-5 flex-shrink-0" />
          <a href="https://github.com/NTDno1" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-blue-600 break-all">
            https://github.com/NTDno1
          </a>
        </div>
        <div className="flex items-center gap-3 text-gray-700">
          <FiLinkedin className="w-5 h-5 flex-shrink-0" />
          <a href="https://www.linkedin.com/in/ntd1911" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-blue-600 break-all">
            https://www.linkedin.com/in/ntd1911
          </a>
        </div>
      </div>

      <hr className="border-gray-400 my-6" />

      {/* About Me */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">{t('cv.aboutMe.title')}</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          {t('cv.aboutMe.content')}
        </p>
      </div>

      <hr className="border-gray-400 my-6" />

      {/* Skills */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">{t('cv.skills.title')}</h2>
        <p className="text-sm text-gray-700">
          .NET, SQL, PROBLEM SOLVING, ABILITY TO LEARN
        </p>
      </div>

      <hr className="border-gray-400 my-6" />

      {/* Education */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">{t('cv.education.title')}</h2>
        
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-gray-800">{t('cv.education.bachelor')}</h3>
            <span className="text-xs text-gray-600">09-2019 - 09-2024</span>
          </div>
          <p className="text-sm text-gray-700 mb-1">{t('cv.education.bachelor.school')}</p>
          <p className="text-sm text-gray-600">{t('cv.education.bachelor.major')}</p>
        </div>

        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-gray-800">{t('cv.education.master')}</h3>
            <span className="text-xs text-gray-600">07-2025 - 07-2027</span>
          </div>
          <p className="text-sm text-gray-700 mb-1">{t('cv.education.master.school')}</p>
          <p className="text-sm text-gray-600">{t('cv.education.master.major')}</p>
        </div>
      </div>

      <hr className="border-gray-400 my-6" />

      {/* Future Goals */}
      <div>
        <h2 className="text-xl font-bold text-gray-700 mb-4">{t('cv.futureGoals.title')}</h2>
        <ul className="space-y-2">
          <li className="text-sm text-gray-700">• {t('cv.futureGoals.ielts')}</li>
          <li className="text-sm text-gray-700">• {t('cv.futureGoals.fullstack')}</li>
        </ul>
      </div>
    </div>
  );
};

export default CVSidebar;
