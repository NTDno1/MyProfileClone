import PageTitle from '@/components/shared/PageTitle';
import AppLayout from '@/layouts/AppLayout';
import React, { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/form/Button';
import Input from '@/components/form/Input';
import TextArea from '@/components/form/Textarea';
import { FiMail, FiPhone, FiMapPin, FiGithub, FiLinkedin, FiFacebook } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

type Props = {};

const Contact = (props: Props) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Cảm ơn bạn đã liên hệ! Tôi sẽ phản hồi sớm nhất có thể.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AppLayout title="contact">
      <PageTitle
        breadcrumb={[
          { label: t('contact.page.breadcrumb.home'), path: '/' },
          { label: t('contact.page.breadcrumb.contact'), path: '' },
        ]}
      >
        {t('contact.page.title')}
      </PageTitle>
      <div className="container py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="relative mb-10 h-auto">
            <Image src="/images/map.svg" layout="fill" className="dark:invert" alt="map" />
            <div className="relative z-10 p-6">
              <h6 className="text-2xl font-bold">{t('contact.page.title')}</h6>
              <p className="mt-2">{t('contact.page.greeting')}</p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <FiMapPin className="text-primary-500" size={20} />
                  <div>
                    <p className="font-medium">{t('contact.page.address')}</p>
                    <p className="text-gray-400">Thanh Mỹ - Sơn Tây - Hà Nội</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FiPhone className="text-primary-500" size={20} />
                  <div>
                    <p className="font-medium">{t('contact.phone')}</p>
                    <p className="text-gray-400">098387462</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FiMail className="text-primary-500" size={20} />
                  <div>
                    <p className="font-medium">{t('contact.email')}</p>
                    <p className="text-gray-400">datt19112001@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h6 className="mb-4 font-semibold">{t('contact.page.social')}</h6>
                <div className="flex space-x-4">
                  <a href="https://www.facebook.com/nguyen.tien.at.85731" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors">
                    <FiFacebook size={24} />
                  </a>
                  <a href="https://www.linkedin.com/in/ntd1911" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors">
                    <FiLinkedin size={24} />
                  </a>
                  <a href="https://github.com/NTDno1" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors">
                    <FiGithub size={24} />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-8 md:grid-cols-2">
                <Input 
                  placeholder={t('contact.page.form.name')} 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input 
                  placeholder={t('contact.page.form.email')} 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-8">
                <Input 
                  placeholder={t('contact.page.form.subject')} 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mt-8">
                <TextArea 
                  placeholder={t('contact.page.form.message')} 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mt-8">
                <Button 
                  type="submit"
                  className="mt-5 bg-primary-500 px-8 font-semibold text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-200"
                >
                  {t('contact.page.form.submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Contact;
