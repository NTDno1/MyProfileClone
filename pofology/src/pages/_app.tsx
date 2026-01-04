import { ThemeProvider } from '@/hooks/use-theme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AnalyticsTracking } from '@/components/analytics/Tracking';
import '@/styles/app.scss';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <LanguageProvider>
        <ThemeProvider>
          <AnalyticsTracking />
          <Component {...pageProps} />
        </ThemeProvider>
      </LanguageProvider>
    </>
  );
}

export default MyApp;
