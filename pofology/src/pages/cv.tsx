import CVHeader from '@/components/cv/CVHeader';
import CVSidebar from '@/components/cv/CVSidebar';
import CVMainContent from '@/components/cv/CVMainContent';
import CVLanguageSwitcher from '@/components/cv/CVLanguageSwitcher';
import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FiMenu, FiX, FiHome } from 'react-icons/fi';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const CVPageContent: NextPage = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (router.query.print === 'true') {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [router.query]);

  const handlePrint = () => {
    setMobileMenuOpen(false);
    window.print();
  };

  const handleDownload = async () => {
    setMobileMenuOpen(false);
    try {
      const response = await fetch('/api/download-cv');
      if (!response.ok) {
        throw new Error('Failed to download CV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'NguyenTienDatCV.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CV:', error);
      window.print();
    }
  };

  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 right-4 z-50 md:hidden bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors print:hidden"
        aria-label={t(mobileMenuOpen ? 'ui.closeMenu' : 'ui.openMenu')}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      <div className={`fixed top-4 right-4 z-40 flex flex-col gap-3 print:hidden transition-all duration-300 ${
        mobileMenuOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'md:opacity-100 md:translate-y-0 md:pointer-events-auto opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <CVLanguageSwitcher />

        <Link href="/">
          <a
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-lg text-sm md:text-base"
          >
            <FiHome className="w-5 h-5" />
            <span className="hidden md:inline">{t('cv.home')}</span>
          </a>
        </Link>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg text-sm md:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t('cv.print')}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg text-sm md:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('cv.download')}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div id="cv-content" className="bg-white min-h-screen print:bg-white">
        <CVHeader />

        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-[35%] lg:w-[30%] print:w-[35%]">
            <CVSidebar />
          </div>

          <div className="w-full md:w-[65%] lg:w-[70%] print:w-[65%]">
            <CVMainContent />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background: white !important;
          }
          .fixed {
            display: none !important;
          }
          @page {
            margin: 0;
            size: A4;
          }
        }
      `}</style>
    </>
  );
};

const CVPage: NextPage = () => {
  return <CVPageContent />;
};

export default CVPage;
