import Image from 'next/image';
import React from 'react';
import Button from '@/components/form/Button';
import Input from '@/components/form/Input';
import TextArea from '@/components/form/Textarea';
import SectionTitle from '@/components/shared/SectionTitle';
import { useLanguage } from '@/contexts/LanguageContext';

const ContactSection = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <SectionTitle>{t('contact.title')}</SectionTitle>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        <div className="relative h-48">
          <Image src="/images/map.svg" layout="fill" className="dark:invert" alt="map" />
          <h6 className="text-2xl font-bold">{t('contact.talk')}</h6>
          <p className="mt-2">{t('contact.description')}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>{t('contact.email')}:</strong> datt19112001@gmail.com</p>
            <p><strong>{t('contact.phone')}:</strong> 098387462</p>
            <p><strong>{t('contact.location')}:</strong> Thanh Mỹ - Sơn Tây - Hà Nội</p>
            <p><strong>{t('contact.github')}:</strong> github.com/NTDno1</p>
            <p><strong>{t('contact.linkedin')}:</strong> linkedin.com/in/ntd1911</p>
          </div>
        </div>
        <div className="col-span-2">
          <div className="grid gap-8 md:grid-cols-2">
            <Input placeholder="Your Name" />
            <Input placeholder="Email Address" />
          </div>

          <div className="mt-8">
            <Input placeholder="Subject" />
          </div>
          <div className="mt-8">
            <TextArea placeholder="Message" />
          </div>
          <div className="mt-8">
            <Button className="mt-5 bg-primary-500 px-8 font-semibold text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-200">
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSection;
