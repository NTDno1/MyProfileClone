import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '@/hooks/use-theme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AnalyticsTracking } from '@/components/analytics/Tracking';
import '@/styles/app.scss';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      if (!window.location.hash) {
        window.scrollTo(0, 0);
      }
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (!url.includes('#')) {
        window.scrollTo(0, 0);
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

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
