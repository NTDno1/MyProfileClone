import Button from '@/components/form/Button';
import SectionTitle from '@/components/shared/SectionTitle';
import { FiCoffee } from 'react-icons/fi';
import { HiOutlineChartBar, HiOutlineFire, HiOutlineUsers } from 'react-icons/hi';
import ProgressBar from '@/components/shared/ProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';

const AboutSection = () => {
  const { t } = useLanguage();
  
  const handleDownloadCV = () => {
    // Mở trang CV với query parameter để tự động trigger print
    window.open('/cv?print=true', '_blank');
  };

  const handleViewCV = () => {
    window.open('/cv', '_blank');
  };
  
  return (
    <>
      <SectionTitle>{t('about.title')}</SectionTitle>

      <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-2 lg:gap-8">
        {/* Bio */}
        <div className="">
          <p className="text-justify">
            {t('about.description')}
          </p>
          <div className="mt-5 flex gap-3">
            <Button className="px-6" onClick={handleDownloadCV}>{t('about.download')}</Button>
            <Button className="px-6 bg-gray-500 hover:bg-gray-600" onClick={handleViewCV}>{t('about.view')}</Button>
          </div>
        </div>

        {/* Skills */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="">
            <div className="mb-3 flex justify-between">
              <h6 className="font-semibold">.NET</h6>
              <p>90%</p>
            </div>
            <ProgressBar color="blue" progress={90} />
          </div>
          <div className="">
            <div className="mb-3 flex justify-between">
              <h6 className="font-semibold">SQL Server</h6>
              <p>85%</p>
            </div>
            <ProgressBar color="amber" progress={85} />
          </div>

          <div className="">
            <div className="mb-3 flex justify-between">
              <h6 className="font-semibold">Problem Solving</h6>
              <p>88%</p>
            </div>
            <ProgressBar color="rose" progress={88} />
          </div>
          <div className="">
            <div className="mb-3 flex justify-between">
              <h6 className="font-semibold">Learning Ability</h6>
              <p>92%</p>
            </div>
            <ProgressBar color="green" progress={92} />
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex">
          <div className="mr-5 text-gray-300">
            <HiOutlineFire size={50} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">10+</h2>
            <p className="mt-1">{t('about.projects')}</p>
          </div>
        </div>
        <div className="flex">
          <div className="mr-5 text-gray-300">
            <FiCoffee size={50} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">500+</h2>
            <p className="mt-1">{t('about.coffee')}</p>
          </div>
        </div>

        <div className="flex">
          <div className="mr-5 text-gray-300">
            <HiOutlineUsers size={50} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">5+</h2>
            <p className="mt-1">{t('about.clients')}</p>
          </div>
        </div>

        <div className="flex">
          <div className="mr-5 text-gray-300">
            <HiOutlineChartBar size={50} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">2+</h2>
            <p className="mt-1">{t('about.experience')}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutSection;
