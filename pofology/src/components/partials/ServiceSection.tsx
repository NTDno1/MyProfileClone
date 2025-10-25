import classNames from 'classnames';
import Image from 'next/image';
import React from 'react';
import SectionTitle from '@/components/shared/SectionTitle';
import { services } from '@/data/services';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const bgClasses = [
  'bg-indigo-500 text-indigo-100',
  'bg-yellow-400 text-yellow-900',
  'bg-pink-400 text-pink-900',
  'bg-purple-500 text-purple-100',
  'bg-green-500 text-green-100',
  'bg-blue-500 text-blue-100',
  'bg-red-500 text-red-100',
  'bg-slate-500 text-slate-100',
  'bg-teal-500 text-teal-100',
];

const getBackgroundClass = (index: number) => {
  return bgClasses[index % bgClasses.length];
};

const ServiceSection = () => {
  const { t } = useLanguage();
  
  const serviceData = [
    {
      name: t('services.backend.name'),
      description: t('services.backend.description'),
      image: services[0].image
    },
    {
      name: t('services.database.name'),
      description: t('services.database.description'),
      image: services[1].image
    },
    {
      name: t('services.integration.name'),
      description: t('services.integration.description'),
      image: services[2].image
    }
  ];
  
  return (
    <>
      <SectionTitle>{t('services.title')}</SectionTitle>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {serviceData.map((service, index) => (
          <div
            key={index}
            className={classNames('rounded-2xl py-8 px-4 text-center shadow-md md:px-8', getBackgroundClass(index))}
          >
            <Image src={service.image} height={80} width={80} alt={service.name} />
            <h4 className="mt-4 text-xl font-semibold">{service.name}</h4>
            <p className="mt-4">{service.description}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center">
        {t('services.custom')}{' '}
        <Link href="/contact">
          <a>{t('services.contact')} &#128079;</a>
        </Link>
      </p>
    </>
  );
};

export default ServiceSection;
