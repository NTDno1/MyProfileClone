import AppLayout from '@/layouts/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionHeading, WritingList } from '@/components/portfolio/DeveloperPortfolio';
export default function Blog() {
  const { t } = useLanguage();
  return (
    <AppLayout title="Blog">
      <div className="dev-container dev-listing">
        <SectionHeading
          number="05"
          label={t('section.writing')}
          title={t('section.writingTitle')}
          description={t('section.writingDescription')}
        />
        <WritingList all />
      </div>
    </AppLayout>
  );
}
