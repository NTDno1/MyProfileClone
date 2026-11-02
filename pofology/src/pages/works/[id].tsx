import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { FiArrowUpRight, FiGithub } from 'react-icons/fi';
import AppLayout from '@/layouts/AppLayout';
import { works } from '@/data/works';
import { Work } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectVisual, projectTags } from '@/components/portfolio/ProjectCard';
import projectsVi from '@/locales/projects.vi.json';

export default function WorkDetail({ work }: { work: Work }) {
  const { language, t } = useLanguage();
  const translated = projectsVi[String(work.id) as keyof typeof projectsVi];
  const features = language === 'vi' ? translated.features : work.featureList;
  const attributeKeys: Record<string, string> = {
    Client: 'client',
    'Start Date': 'start',
    'End Date': 'end',
    Category: 'category',
    Skills: 'skills',
    Repository: 'repository',
    Type: 'type',
  };
  const valueKeys: Record<string, string> = {
    'Personal Project': 'personal',
    'Personal Enterprise Project': 'personalEnterprise',
    'Ministry of Finance': 'ministry',
    Ongoing: 'ongoing',
    'Backend Development': 'backend',
    'Fullstack Development': 'fullstack',
    'AI & Backend Development': 'ai',
    'Enterprise Project': 'enterprise',
    'Enterprise AI Platform': 'aiPlatform',
  };
  return (
    <AppLayout title={t('project.' + work.id + '.title')}>
      <article className="dev-container dev-detail">
        <nav className="dev-breadcrumb" aria-label={t('detail.breadcrumb')}>
          <Link href="/">
            <a>{t('nav.home')}</a>
          </Link>
          <span>/</span>
          <Link href="/works">
            <a>{t('nav.works')}</a>
          </Link>
          <span>/</span>
          <span>{t('project.' + work.id + '.title')}</span>
        </nav>
        <div className="dev-eyebrow">{t(work.id === 6 ? 'ui.ai' : 'ui.backend')}</div>
        <h1>{t('project.' + work.id + '.title')}</h1>
        <div className="dev-tags">
          {projectTags[work.id].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <ProjectVisual id={work.id} />
        <a className="dev-button dev-button-outline" href={work.previewUrl} target="_blank" rel="noopener noreferrer">
          <FiGithub />
          {t('ui.source')}
          <FiArrowUpRight />
        </a>
        <h2>{t('works.detail.summary')}</h2>
        <p>{language === 'vi' ? translated.description : work.description}</p>
        <h2>{t('works.detail.featureList')}</h2>
        <ul>
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <dl className="dev-project-facts">
          {work.attributes.map((attribute) => (
            <div key={attribute.name}>
              <dt>{t('detail.' + attributeKeys[attribute.name])}</dt>
              <dd>
                {typeof attribute.value === 'string' && valueKeys[attribute.value]
                  ? t('detail.value.' + valueKeys[attribute.value])
                  : attribute.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="dev-detail-cta">
          <h2>{t('works.detail.ctaTitle')}</h2>
          <p>{t('contact.intro')}</p>
          <Link href="/contact">
            <a className="dev-button">
              {t('ui.letsTalk')}
              <FiArrowUpRight />
            </a>
          </Link>
        </div>
      </article>
    </AppLayout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const work = works.find((item) => String(item.id) === params?.id);
  return work ? { props: { work } } : { notFound: true };
};
