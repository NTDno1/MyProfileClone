import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import { Work } from '@/types';

export const projectTags: Record<number, string[]> = {
  1: ['.NET 9', 'CQRS', 'PostgreSQL'],
  2: ['.NET', 'React', 'SQL Server'],
  3: ['SignalR', 'RabbitMQ', 'Angular'],
  4: ['.NET', 'SQL Server', 'IIS'],
  5: ['Microservices', 'Docker', 'RabbitMQ'],
  6: ['.NET 8', 'RAG', 'pgvector'],
};

const illustrations: Record<number, string> = {
  1: 'web-development',
  2: 'learning-management-system',
  3: 'social-media-app',
  4: 'project-management-system',
  5: 'project-management-system',
  6: 'digital-marketing-app',
};

export function ProjectVisual({ id }: { id: number }) {
  const { t } = useLanguage();
  const image = id === 1 ? '/images/services/web-development.png' : '/images/works/' + illustrations[id] + '.png';
  return (
    <div className={'dev-project-visual dev-project-visual-' + id}>
      <Image
        src={image}
        alt=""
        layout="fill"
        objectFit="contain"
        sizes="(max-width: 600px) 90vw, (max-width: 850px) 45vw, 380px"
      />
      <span className="friendly-image-caption">{t('project.illustration')}</span>
    </div>
  );
}

export default function ProjectCard({ work }: { work: Work }) {
  const { t } = useLanguage();
  const categories: Record<number, string> = {
    1: 'project.category.software',
    2: 'project.category.education',
    3: 'project.category.connection',
    4: 'project.category.work',
    5: 'project.category.work',
    6: 'project.category.ai',
  };
  return (
    <article className="dev-project-card">
      <Link href={'/works/' + work.id}>
        <a className="dev-project-image-link" aria-label={t('ui.details') + ': ' + t('project.' + work.id + '.title')}>
          <ProjectVisual id={work.id} />
          <span className="dev-project-arrow">
            <FiArrowUpRight />
          </span>
        </a>
      </Link>
      <div className="dev-project-body">
        <div className="dev-project-label">{t(categories[work.id])}</div>
        <h3>
          <Link href={'/works/' + work.id}>
            <a>{t('project.' + work.id + '.title')}</a>
          </Link>
        </h3>
        <p>{t('project.' + work.id + '.description')}</p>
        <Link href={'/works/' + work.id}>
          <a className="friendly-project-link">
            {t('ui.details')}
            <FiArrowRight />
          </a>
        </Link>
      </div>
    </article>
  );
}
