import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FiLinkedin, FiGithub, FiFacebook } from 'react-icons/fi';
import Button from '@/components/form/Button';
import HeroBackground from './HeroBackground';
import Typed from 'react-typed';
import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection = () => {
  const { t, language } = useLanguage();
  
  const typedStrings = language === 'vi' 
    ? ['Backend Developer', 'Fullstack Developer', '.NET Developer']
    : ['Backend Developer', 'Fullstack Developer', '.NET Developer'];

  return (
    <div className="hero relative -mt-16 flex items-center justify-center">
      <HeroBackground />
      <div className="flex flex-col items-center px-4">
        <div className="overflow-hidden rounded-full w-[140px] h-[140px] md:w-[180px] md:h-[180px]">
          <Image 
            src="/images/avatar/ava1.jpg" 
            width={180} 
            height={180} 
            alt="avatar" 
            className="object-cover w-full h-full"
          />
        </div>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-center">Nguyễn Tiến Đạt</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1 text-sm md:text-base">
          {t('hero.title')}
          <Typed
            strings={typedStrings}
            typeSpeed={60}
            backSpeed={30}
            loop
          />
        </div>
        <p className="mt-2 text-base md:text-lg text-gray-600 dark:text-gray-400">WEB DEVELOPER</p>
        <div className="mt-4 flex gap-5">
          <Link href="https://www.facebook.com/nguyen.tien.at.85731">
            <a className="text-gray-700 transition-colors duration-150 hover:text-primary-500">
              <FiFacebook size={25} />
            </a>
          </Link>
          <Link href="https://www.linkedin.com/in/ntd1911">
            <a className="text-gray-700 transition-colors duration-150 hover:text-primary-500">
              <FiLinkedin size={25} />
            </a>
          </Link>
          <Link href="https://github.com/NTDno1">
            <a className="text-gray-700 transition-colors duration-150 hover:text-primary-500">
              <FiGithub size={25} />
            </a>
          </Link>
        </div>
        <Button className="mt-5 px-8">{t('hero.hire')}</Button>
      </div>

      <div className="absolute bottom-0 flex flex-col items-center ">
        <p className="mb-3 text-sm">{t('hero.scroll')}</p>
        <div className="relative flex h-7 w-5 justify-center rounded-full border-2 border-gray-600 dark:border-gray-100">
          <div className="animate-scroll absolute h-1 w-1 bg-gray-600 dark:bg-gray-100" style={{ top: '6px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
