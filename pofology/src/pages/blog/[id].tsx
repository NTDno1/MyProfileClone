import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import AppLayout from '@/layouts/AppLayout';
import { posts } from '@/data/posts';
import { Post } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
export default function BlogSingle({ post }: { post: Post }) {
  const { language, t } = useLanguage();
  const date = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(post.publishedAt));
  return (
    <AppLayout title={t('post.' + post.id + '.title')}>
      <article className="dev-container dev-detail">
        <nav className="dev-breadcrumb" aria-label={t('detail.breadcrumb')}>
          <Link href="/">
            <a>{t('nav.home')}</a>
          </Link>
          <span>/</span>
          <Link href="/blog">
            <a>{t('nav.blog')}</a>
          </Link>
        </nav>
        <div className="dev-eyebrow">{post.id === 5 ? 'AI / RAG' : '.NET / ARCHITECTURE'}</div>
        <h1>{t('post.' + post.id + '.title')}</h1>
        <p className="dev-mono">
          <time dateTime={new Date(post.publishedAt).toISOString()}>{date}</time> · Nguyễn Tiến Đạt
        </p>
        <div
          className="dev-article-content"
          lang={language}
          dangerouslySetInnerHTML={{ __html: t('article.' + post.id) }}
        />
        <div className="dev-detail-cta">
          <Link href="/blog">
            <a className="dev-text-link">
              <FiArrowLeft />
              {t('blog.viewAll')}
            </a>
          </Link>
        </div>
      </article>
    </AppLayout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const post = posts.find((item) => String(item.id) === params?.id);
  return post ? { props: { post } } : { notFound: true };
};
