import { ThemeProvider } from '@/hooks/use-theme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/styles/app.scss';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <LanguageProvider>
        <ThemeProvider>
          <Component {...pageProps} />
        </ThemeProvider>
      </LanguageProvider>
    </>
  );
}

export default MyApp;
