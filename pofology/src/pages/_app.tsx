import { ThemeProvider } from '@/hooks/use-theme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/styles/app.scss';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <LanguageProvider>
        <ThemeProvider>
          <Component {...pageProps} />
        </ThemeProvider>
      </LanguageProvider>
    </>
  );
}

export default MyApp;
