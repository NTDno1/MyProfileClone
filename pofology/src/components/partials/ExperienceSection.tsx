import { educations } from '@/data/educations';
import { experiences } from '@/data/experiences';
import styles from '@/styles/modules/ExperienceSection.module.scss';
import classNames from 'classnames';
import { FiBriefcase } from 'react-icons/fi';
import AcademicCap from '@/components/icons/AcademicCap';
import SectionTitle from '@/components/shared/SectionTitle';
import { useLanguage } from '@/contexts/LanguageContext';

const ExperienceSection = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <SectionTitle>{t('experience.title')} & {t('education.title')}</SectionTitle>
      <div className="py-15 mt-10 grid gap-8 md:grid-cols-2">
        {/* Experience */}
        <div>
          <div className="rounded-2xl bg-white px-10 py-8 shadow-lg dark:bg-gray-700">
            <ol className={classNames(styles['experience'], 'border-l border-gray-200 dark:border-gray-500')}>
              <li className={styles['experience-item']}>
                <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary-500 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-700">
                  <FiBriefcase className="h-5" />
                </span>
                <time className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('experience.vnr.period')}
                </time>
                <h3 className="mb-1 flex items-center text-lg font-semibold dark:text-gray-200">
                  {t('experience.vnr.title')}
                </h3>
                <p className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('experience.vnr.company')}
                </p>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-200">
                  {t('experience.vnr.description')}
                </p>
              </li>
              <li className={styles['experience-item']}>
                <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary-500 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-700">
                  <FiBriefcase className="h-5" />
                </span>
                <time className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('experience.hoplong.period')}
                </time>
                <h3 className="mb-1 flex items-center text-lg font-semibold dark:text-gray-200">
                  {t('experience.hoplong.title')}
                </h3>
                <p className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('experience.hoplong.company')}
                </p>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-200">
                  {t('experience.hoplong.description')}
                </p>
              </li>
            </ol>
          </div>
        </div>
        {/* Education */}
        <div>
          <div className="rounded-2xl bg-white px-10 py-8 shadow-lg dark:bg-gray-700">
            <ol className={classNames(styles['education'], 'border-l border-gray-200 dark:border-gray-500')}>
              <li className={styles['education-item']}>
                <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary-500 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-700">
                  <AcademicCap className="h-5" />
                </span>
                <time className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('education.bachelor.period')}
                </time>
                <h3 className="mb-1 flex items-center text-lg font-semibold dark:text-gray-200">
                  {t('education.bachelor.degree')}
                </h3>
                <p className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('education.bachelor.school')}
                </p>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-200">
                  {t('education.bachelor.description')}
                </p>
              </li>
              <li className={styles['education-item']}>
                <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary-500 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-700">
                  <AcademicCap className="h-5" />
                </span>
                <time className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('education.master.period')}
                </time>
                <h3 className="mb-1 flex items-center text-lg font-semibold dark:text-gray-200">
                  {t('education.master.degree')}
                </h3>
                <p className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-200">
                  {t('education.master.school')}
                </p>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-200">
                  {t('education.master.description')}
                </p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExperienceSection;
