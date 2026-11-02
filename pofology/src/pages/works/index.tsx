import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { works } from '@/data/works';
import ProjectCard from '@/components/portfolio/ProjectCard';
import { SectionHeading } from '@/components/portfolio/DeveloperPortfolio';
const filters = ['all', 'backend', 'ai', 'fullstack'] as const;
export default function Works() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<typeof filters[number]>('all');
  const groups = { all: [1, 2, 3, 4, 5, 6], ai: [6], fullstack: [2, 3], backend: [1, 4, 5] };
  const visible = [...works].reverse().filter((work) => groups[filter].includes(work.id));
  return (
    <AppLayout title="Works">
      <div className="dev-container dev-listing">
        <SectionHeading
          number="03"
          label={t('section.projects')}
          title={t('section.projectsTitle')}
          description={t('section.projectsDescription')}
        />
        <div className="dev-filters" role="group" aria-label={t('nav.works')}>
          {filters.map((item) => (
            <button
              type="button"
              key={item}
              className={item === filter ? 'is-active' : ''}
              aria-pressed={item === filter}
              onClick={() => setFilter(item)}
            >
              {t('ui.' + item)}
            </button>
          ))}
        </div>
        <div className="dev-project-grid">
          {visible.map((work) => (
            <ProjectCard key={work.id} work={work} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
