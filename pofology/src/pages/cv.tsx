import CVSidebar from '@/components/cv/CVSidebar';
import CVMainContent from '@/components/cv/CVMainContent';
import CVLanguageSwitcher from '@/components/cv/CVLanguageSwitcher';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const CVPage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Nếu có query parameter print=true, tự động mở print dialog
    if (router.query.print === 'true') {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [router.query]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger print dialog - người dùng có thể chọn "Save as PDF"
    window.print();
  };

  return (
    <LanguageProvider>
      {/* Action Buttons - Fixed position */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 print:hidden">
        {/* Language Switcher */}
        <CVLanguageSwitcher />
        
        {/* Print & Download Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left Sidebar */}
        <div className="w-full md:w-[35%] lg:w-[30%]">
          <CVSidebar />
        </div>

        {/* Right Content */}
        <div className="w-full md:w-[65%] lg:w-[70%]">
          <CVMainContent />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
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
    </LanguageProvider>
  );
};

export default CVPage;
