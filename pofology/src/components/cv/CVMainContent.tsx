import { useLanguage } from '@/contexts/LanguageContext';

const CVMainContent = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-6 md:p-8 print:p-1.5 print:pb-1">
      {/* Work Experience */}
      <section className="mb-5 print:mb-2">
        <h2 className="text-2xl print:text-base font-bold text-gray-800 mb-2 print:mb-1 uppercase">{t('cv.workExperience.title')}</h2>
        
        {/* MobiFoneIT */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.workExperience.mobifoneit.company')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">{t('cv.workExperience.mobifoneit.period')}</span>
          </div>
          <h4 className="text-base print:text-[10px] text-gray-600 mb-1 print:mb-0">{t('cv.workExperience.mobifoneit.position')}</h4>
          
          <div className="space-y-1 print:space-y-0">
            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.mobifoneit.project.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.arch')}</span> {t('cv.workExperience.mobifoneit.project.arch.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.ha')}</span> {t('cv.workExperience.mobifoneit.project.ha.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.storage')}</span> {t('cv.workExperience.mobifoneit.project.storage.content')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AgileTech */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.workExperience.agiletech.company')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">{t('cv.workExperience.agiletech.period')}</span>
          </div>
          <h4 className="text-base print:text-[10px] text-gray-600 mb-1 print:mb-0">{t('cv.workExperience.agiletech.position')}</h4>
          
          <div className="space-y-1 print:space-y-0">
            <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.leadership')}</span> {t('cv.workExperience.agiletech.leadership.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.development')}</span> {t('cv.workExperience.agiletech.development.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.messaging')}</span> {t('cv.workExperience.agiletech.messaging.content')}</li>
              <li className="ml-4 print:ml-3">+ {t('cv.workExperience.agiletech.messaging.redis')}</li>
              <li className="ml-4 print:ml-3">+ {t('cv.workExperience.agiletech.messaging.rabbitmq')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.performance')}</span> {t('cv.workExperience.agiletech.performance.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.deployment')}</span> {t('cv.workExperience.agiletech.deployment.content')}</li>
            </ul>
          </div>
        </div>

        {/* HopLongTech */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.workExperience.hoplongtech.company')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">{t('cv.workExperience.hoplongtech.period')}</span>
          </div>
          <h4 className="text-base print:text-[10px] text-gray-600 mb-1 print:mb-0">{t('cv.workExperience.hoplongtech.position')}</h4>
          
          <div className="space-y-1 print:space-y-0">
            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.hoplongtech.erp.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• {t('cv.workExperience.hoplongtech.erp.content1')}</li>
                <li className="ml-4 print:ml-3">+ {t('cv.workExperience.hoplongtech.erp.dapper')}</li>
                <li className="ml-4 print:ml-3">+ <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.optimization')}</span> {t('cv.workExperience.hoplongtech.erp.optimization.content')}</li>
                <li className="ml-4 print:ml-3">+ {t('cv.workExperience.hoplongtech.erp.frontend')}</li>
                <li className="ml-4 print:ml-3">+ {t('cv.workExperience.hoplongtech.erp.stability')}</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.hoplongtech.ecommerce.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• {t('cv.workExperience.hoplongtech.ecommerce.content1')}</li>
                <li className="ml-4 print:ml-3">+ {t('cv.workExperience.hoplongtech.ecommerce.arch')}</li>
                <li className="ml-4 print:ml-3">+ {t('cv.workExperience.hoplongtech.ecommerce.tiktok')}</li>
                <li className="ml-4 print:ml-3">+ {t('cv.workExperience.hoplongtech.ecommerce.facebook')}</li>
              </ul>
            </div>
          </div>
        </div>

      </section>

      <hr className="border-gray-300 my-3 print:my-1.5" />

      {/* Personal Project */}
      <section>
        <h2 className="text-2xl print:text-base font-bold text-gray-800 mb-2 print:mb-1 uppercase">{t('cv.projects.title')}</h2>
        
        {/* Base Structure Project */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.projects.baseStructure.title')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">-</span>
          </div>
          <a 
            href="https://github.com/NTDno1/BaseProject" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm print:text-[9px] text-blue-600 hover:underline mb-1 print:mb-0 block"
          >
            {t('cv.projects.baseStructure.link')} https://github.com/NTDno1/BaseProject
          </a>
          
          <div className="space-y-1 print:space-y-0">
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 font-semibold mb-0 print:mb-0">• {t('cv.projects.baseStructure.techStack')}</p>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>+ {t('cv.projects.baseStructure.techStack.core')}</li>
                <li>+ {t('cv.projects.baseStructure.techStack.patterns')}</li>
                <li>+ {t('cv.projects.baseStructure.techStack.utils')}</li>
              </ul>
            </div>
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
                <span className="font-semibold">• {t('cv.projects.baseStructure.description')}</span> {t('cv.projects.baseStructure.description.content')}
              </p>
            </div>
          </div>
        </div>

        {/* Education Management System */}
        <div>
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.projects.education.title')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">-</span>
          </div>
          <a 
            href="https://gitlab.com/NTDno1/sep490_g22" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm print:text-[9px] text-blue-600 hover:underline mb-1 print:mb-0 block"
          >
            {t('cv.projects.baseStructure.link')} https://gitlab.com/NTDno1/sep490_g22
          </a>
          
          <div className="space-y-1 print:space-y-0">
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
                <span className="font-semibold">• {t('cv.projects.education.techStack')}</span> {t('cv.projects.education.techStack.content')}
              </p>
            </div>
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
                <span className="font-semibold">• {t('cv.projects.education.description')}</span> {t('cv.projects.education.description.content')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-right mt-4 print:mt-1">
      </div>
    </div>
  );
};

export default CVMainContent;
