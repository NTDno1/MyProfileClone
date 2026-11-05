import React from 'react';
import Head from 'next/head';
import Menu from '@/components/partials/Menu';
import Footer from '@/components/partials/Footer';
import MessengerButton from '@/components/widgets/MessengerButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, Theme } from '@/hooks/use-theme';
interface Props {
  title?: string;
  children: React.ReactNode;
}
export default function AppLayout({ children, title }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const titles: Record<string, string> = {
    Home: 'nav.home',
    Works: 'nav.works',
    Blog: 'nav.blog',
    contact: 'nav.contact',
  };
  const pageTitle = title ? t(titles[title] || title) + ' — Nguyễn Tiến Đạt' : 'Nguyễn Tiến Đạt — Backend Developer';
  return (
    <div className="developer-site" data-theme={theme}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={t('site.description')} />
        <meta name="theme-color" content={theme === Theme.DARK ? '#202724' : '#faf8f4'} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={t('site.description')} />
      </Head>
      <a className="dev-skip" href="#main-content">
        {t('ui.skip')}
      </a>
      <Menu />
      <main id="main-content">{children}</main>
      <MessengerButton />
      <Footer />
    </div>
  );
}
