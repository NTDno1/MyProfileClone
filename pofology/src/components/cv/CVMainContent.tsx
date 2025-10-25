import { useLanguage } from '@/contexts/LanguageContext';

const CVMainContent = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-8 md:p-12">
      {/* Work Experience */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('cv.workExperience.title')}</h2>
        
        {/* VNR Software */}
        <div className="mb-10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-800">VNR Sofware</h3>
            <span className="text-sm text-gray-600">{t('cv.vnr.period')}</span>
          </div>
          <h4 className="text-base text-gray-600 mb-4">{t('cv.vnr.position')}</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-bold text-gray-800 mb-2">{t('cv.workExperience.overview')}</h5>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• {t('cv.vnr.overview1')}</li>
                <li>• {t('cv.vnr.overview2')}</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-gray-800 mb-3">{t('cv.vnr.project1.title')}</h5>
              <div className="space-y-3 ml-4">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">• {t('cv.workExperience.description')}</span> {t('cv.vnr.project1.description')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">• {t('cv.workExperience.techStack')}</span> {t('cv.vnr.project1.techStack')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold">• {t('cv.workExperience.achievements')}</p>
                  <ul className="space-y-1 text-sm text-gray-700 ml-4">
                    <li>+ {t('cv.vnr.project1.achievement1')}</li>
                    <li>+ {t('cv.vnr.project1.achievement2')}</li>
                    <li>+ {t('cv.vnr.project1.achievement3')}</li>
                    <li>+ {t('cv.vnr.project1.achievement4')}</li>
                    <li>+ {t('cv.vnr.project1.achievement5')}</li>
                    <li>+ {t('cv.vnr.project1.achievement6')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOP LONG TECH */}
        <div className="mb-10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-800">HOP LONG TECH</h3>
            <span className="text-sm text-gray-600">{t('cv.hoplong.period')}</span>
          </div>
          <h4 className="text-base text-gray-600 mb-4">{t('cv.hoplong.position')}</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-bold text-gray-800 mb-2">{t('cv.workExperience.overview')}</h5>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• {t('cv.hoplong.overview')}</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-gray-800 mb-3">{t('cv.hoplong.project1.title')}</h5>
              <div className="space-y-3 ml-4">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">• {t('cv.workExperience.description')}</span> {t('cv.hoplong.project1.description')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">• {t('cv.workExperience.techStack')}</span> {t('cv.hoplong.project1.techStack')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold">• {t('cv.workExperience.achievements')}</p>
                  <ul className="space-y-1 text-sm text-gray-700 ml-4">
                    <li>+ {t('cv.hoplong.project1.achievement1')}</li>
                    <li>+ {t('cv.hoplong.project1.achievement2')}</li>
                    <li>+ {t('cv.hoplong.project1.achievement3')}</li>
                    <li>+ {t('cv.hoplong.project1.achievement4')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-gray-800 mb-3">{t('cv.hoplong.project2.title')}</h5>
              <div className="space-y-3 ml-4">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">• {t('cv.workExperience.description')}</span> {t('cv.hoplong.project2.description')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">• {t('cv.workExperience.techStack')}</span> {t('cv.hoplong.project2.techStack')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold">• {t('cv.workExperience.achievements')}</p>
                  <ul className="space-y-1 text-sm text-gray-700 ml-4">
                    <li>+ {t('cv.hoplong.project2.achievement1')}</li>
                    <li>+ {t('cv.hoplong.project2.achievement2')}</li>
                    <li>+ {t('cv.hoplong.project2.achievement3')}</li>
                    <li>+ {t('cv.hoplong.project2.achievement4')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-gray-300 my-8" />

      {/* Personal Project */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('cv.personalProject.title')}</h2>
        
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">{t('cv.personalProject.ecommerce.title')}</h3>
          <a 
            href="https://github.com/NTDno1/BaseProject" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mb-4 block"
          >
            https://github.com/NTDno1/BaseProject
          </a>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">• {t('cv.workExperience.techStack')}</span>
              </p>
              <ul className="space-y-1 text-sm text-gray-700 ml-4">
                <li>+ {t('cv.personalProject.ecommerce.techStack')}</li>
                <li>+ {t('cv.personalProject.ecommerce.patterns')}</li>
                <li>+ {t('cv.personalProject.ecommerce.utilities')}</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">• {t('cv.workExperience.description')}</span> {t('cv.personalProject.ecommerce.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-right mt-12">
        <p className="text-xs text-gray-500">© topcv.vn</p>
      </div>
    </div>
  );
};

export default CVMainContent;
