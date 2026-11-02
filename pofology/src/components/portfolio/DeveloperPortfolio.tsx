import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FiArrowRight,
  FiArrowUpRight,
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiDownload,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import { works } from '@/data/works';
import { posts } from '@/data/posts';
import { experiences } from '@/data/experiences';
import ProjectCard from './ProjectCard';
import ContactSection from '@/components/partials/ContactSection';

export function SectionHeading({
  label,
  title,
  description,
  centered = false,
}: {
  number?: string;
  label: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`dev-section-heading ${centered ? 'dev-section-heading-centered' : ''}`}>
      <div className="dev-eyebrow">{label}</div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export function WritingList({ all = false }: { all?: boolean }) {
  const { language, t } = useLanguage();
  return (
    <div className="dev-writing-list">
      {(all ? posts : posts.slice(0, 3)).map((post) => (
        <Link key={post.id} href={'/blog/' + post.id}>
          <a className="dev-writing-row">
            <span className="dev-writing-number">
              <FiBookOpen />
            </span>
            <div>
              <span className="dev-writing-category">{t(post.id === 5 ? 'writing.ai' : 'writing.software')}</span>
              <h3>{t('post.' + post.id + '.title')}</h3>
            </div>
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Bangkok',
              }).format(new Date(post.publishedAt))}
            </time>
            <FiArrowUpRight />
          </a>
        </Link>
      ))}
    </div>
  );
}

const marqueeTechs = [
  '.NET 9 / C# 13',
  'ASP.NET Core',
  'Clean Architecture & CQRS',
  'PostgreSQL',
  'SQL Server Always On',
  'Docker & Docker Swarm',
  'RabbitMQ',
  'Redis Cache',
  'Enterprise AI & RAG',
  'Next.js & React',
  'MobiFone IT',
  'AgileTech',
  'HopLongTech',
];

export default function DeveloperPortfolio() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(1);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      if (!window.location.hash) {
        window.scrollTo(0, 0);
      }

      const handleScroll = () => {
        setShowBackToTop(window.scrollY > 350);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      // Setup swipe / scroll reveal on mobile and desktop
      let observer: IntersectionObserver | null = null;
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
              }
            });
          },
          { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
        );

        // Assign staggered indices to items in grids
        const gridContainers = document.querySelectorAll(
          '.figma-services-grid, .dev-project-grid, .figma-milestones-grid, .figma-why-grid, .dev-timeline, .dev-education-list, .figma-faq-container, .dev-writing-list'
        );
        gridContainers.forEach((container) => {
          Array.from(container.children).forEach((child, idx) => {
            (child as HTMLElement).style.setProperty('--reveal-index', `${idx}`);
          });
        });

        const targets = document.querySelectorAll(
          '.figma-service-card, .dev-project-card, .figma-milestone-card, .dev-job-card, .figma-hero-author-card, .dev-about-photo-card, .dev-education-card, .figma-why-card, .figma-faq-item, .dev-section-heading, .figma-section-header, .figma-robot-wrapper, .dev-writing-row, .dev-contact-grid'
        );
        targets.forEach((el) => {
          el.classList.add('figma-scroll-reveal');
          observer?.observe(el);
        });
      }

      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer?.disconnect();
      };
    }
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      id: 1,
      num: '01',
      question: t('figma.faq.q1'),
      answer: t('figma.faq.a1'),
    },
    {
      id: 2,
      num: '02',
      question: t('figma.faq.q2'),
      answer: t('figma.faq.a2'),
    },
    {
      id: 3,
      num: '03',
      question: t('figma.faq.q3'),
      answer: t('figma.faq.a3'),
    },
    {
      id: 4,
      num: '04',
      question: t('figma.faq.q4'),
      answer: t('figma.faq.a4'),
    },
    {
      id: 5,
      num: '05',
      question: t('figma.faq.q5'),
      answer: t('figma.faq.a5'),
    },
  ];

  return (
    <>
      {/* 1. FIGMA HERO SECTION */}
      <section className="figma-hero" id="hero">
        <div className="figma-hero-glow-bg" aria-hidden="true" />
        <div className="dev-container">
          <div className="figma-hero-grid">
            <div className="figma-hero-content">
              <div className="figma-status-chip">
                <span className="figma-status-dot-pulse" />
                <span>{t('figma.hero.role')}</span>
              </div>

              <h1 className="figma-hero-title">
                {t('figma.hero.title')}{' '}
                <span className="figma-highlight-badge">{t('figma.hero.badge')}</span>
              </h1>

              <p className="figma-hero-subtitle">{t('figma.hero.subtitle')}</p>

              <div className="figma-hero-actions">
                <Link href="/#contact">
                  <a className="figma-btn-primary">
                    <FiCalendar />
                    <span>{t('figma.hero.bookCall')}</span>
                    <FiArrowRight />
                  </a>
                </Link>
                <a
                  href="/CV/Nguyen_Tien_Dat_CV.pdf"
                  download
                  className="figma-btn-secondary"
                >
                  <FiDownload />
                  <span>{t('figma.hero.downloadCv')}</span>
                </a>
              </div>

              <div className="figma-hero-author-card">
                <div className="figma-author-card-top">
                  <div className="figma-author-card-avatar-wrap">
                    <Image
                      src="/images/avatar/ava1.jpg"
                      alt="Nguyễn Tiến Đạt"
                      width={60}
                      height={60}
                      className="figma-author-card-img"
                      priority
                    />
                    <span className="figma-author-online-pulse" />
                  </div>

                  <div className="figma-author-card-identity">
                    <div className="figma-author-card-name-group">
                      <h3 className="figma-author-card-name">Nguyễn Tiến Đạt</h3>
                      <span className="figma-author-verified-badge" title="Verified Solution Architect">
                        <FiCheckCircle />
                      </span>
                    </div>

                    <p className="figma-author-card-role">{t('figma.hero.role')}</p>

                    <div className="figma-author-card-badges">
                      <span className="figma-author-status-pill">
                        <span className="dev-status-pulse-dot" />
                        <span>{t('hero.activeStatus')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="figma-author-card-bottom">
                  <span className="figma-author-proof-text">
                    <strong>{t('figma.hero.years')}</strong> {t('figma.hero.proof')}
                  </span>
                  <div className="figma-avatar-stack">
                    <span className="figma-avatar-chip">.NET</span>
                    <span className="figma-avatar-chip">SQL</span>
                    <span className="figma-avatar-chip">AI</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="figma-hero-art">
              <div className="figma-robot-wrapper">
                <div className="figma-robot-aura" aria-hidden="true" />
                <div className="figma-robot-image-box">
                  <Image
                    src="/figma/hero-robot.png"
                    alt="Nguyen Tien Dat - High Performance Architecture"
                    width={480}
                    height={480}
                    priority
                    className="figma-robot-img"
                  />
                </div>

                {/* Floating Tech Chips */}
                <div className="figma-floating-chip figma-chip-1">
                  <FiCpu className="text-blue-500 dark:text-blue-400" />
                  <div>
                    <strong>.NET 9 & CQRS</strong>
                    <span>{t('figma.chip.cqrs')}</span>
                  </div>
                </div>

                <div className="figma-floating-chip figma-chip-2">
                  <FiShield className="text-emerald-500 dark:text-emerald-400" />
                  <div>
                    <strong>{t('figma.chip.haTitle')}</strong>
                    <span>{t('figma.chip.ha')}</span>
                  </div>
                </div>

                <div className="figma-floating-chip figma-chip-3">
                  <FiZap className="text-amber-500 dark:text-amber-400" />
                  <div>
                    <strong>Enterprise AI & RAG</strong>
                    <span>{t('figma.chip.ai')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TECH STACK CONTINUOUS MARQUEE (COMPANIES IN FIGMA) */}
      <section className="figma-marquee-section" aria-label="Core Technologies and Companies">
        <div className="figma-marquee-track">
          <div className="figma-marquee-content">
            {marqueeTechs.concat(marqueeTechs).map((tech, index) => (
              <span key={`${tech}-${index}`} className="figma-marquee-item">
                <span className="figma-marquee-bullet" />
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OUR ULTIMATE SET OF SERVICES (DỊCH VỤ & GIẢI PHÁP KỸ THUẬT) */}
      <section className="figma-section" id="services">
        <div className="dev-container">
          <SectionHeading
            label={t('figma.services.heading')}
            title={t('figma.services.title')}
            centered
          />

          <div className="figma-services-grid">
            {/* Service 1 */}
            <div className="figma-service-card">
              <div className="figma-card-icon-box">
                <Image
                  src="/figma/service-analytics.png"
                  alt={t('figma.services.s1.title')}
                  width={140}
                  height={140}
                  className="figma-3d-icon"
                />
              </div>
              <h3>{t('figma.services.s1.title')}</h3>
              <p>{t('figma.services.s1.desc')}</p>
              <div className="figma-card-tags">
                <span>ASP.NET Core</span>
                <span>Clean Architecture</span>
                <span>CQRS</span>
                <span>MediatR</span>
                <span>DDD</span>
              </div>
            </div>

            {/* Service 2 */}
            <div className="figma-service-card figma-service-card-featured">
              <div className="figma-card-icon-box">
                <Image
                  src="/figma/service-ai.png"
                  alt={t('figma.services.s2.title')}
                  width={140}
                  height={140}
                  className="figma-3d-icon"
                />
              </div>
              <h3>{t('figma.services.s2.title')}</h3>
              <p>{t('figma.services.s2.desc')}</p>
              <div className="figma-card-tags">
                <span>RAG Pipeline</span>
                <span>pgvector (HNSW)</span>
                <span>AI Gateway</span>
                <span>NL-to-SQL</span>
                <span>Ollama</span>
              </div>
            </div>

            {/* Service 3 */}
            <div className="figma-service-card">
              <div className="figma-card-icon-box">
                <Image
                  src="/figma/service-data.png"
                  alt={t('figma.services.s3.title')}
                  width={140}
                  height={140}
                  className="figma-3d-icon"
                />
              </div>
              <h3>{t('figma.services.s3.title')}</h3>
              <p>{t('figma.services.s3.desc')}</p>
              <div className="figma-card-tags">
                <span>SQL Always On</span>
                <span>Deadlock Tuning</span>
                <span>RabbitMQ</span>
                <span>Redis</span>
                <span>Docker Swarm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CAREER JOURNEY & TIMELINE (ĐẨY LÊN ĐỨNG SAU PHẦN DỊCH VỤ GIẢI PHÁP KỸ THUẬT THEO YÊU CẦU) */}
      <section className="figma-section figma-section-tinted" id="experience">
        <div className="dev-container dev-journey-grid">
          <div className="dev-journey-sticky">
            <SectionHeading
              label={t('section.experience')}
              title={t('section.experienceTitle')}
              description={t('section.experienceDescription')}
            />

            <div className="dev-education-card">
              <div className="dev-education-header">
                <div className="dev-education-icon-box">
                  <FiAward />
                </div>
                <div>
                  <h3>{t('section.education')}</h3>
                  <span className="dev-education-subtitle">{t('education.subtitle')}</span>
                </div>
              </div>

              <div className="dev-education-list">
                <div className="dev-education-item">
                  <div className="dev-edu-tag">PTIT</div>
                  <div className="dev-edu-content">
                    <h4>{t('education.master.degree')}</h4>
                    <p className="dev-edu-school">{t('education.master.school')}</p>
                    <span className="dev-edu-years">
                      <FiCalendar /> 2025 — 2027
                    </span>
                  </div>
                </div>

                <div className="dev-education-item">
                  <div className="dev-edu-tag dev-edu-tag-fpt">FPT</div>
                  <div className="dev-edu-content">
                    <h4>{t('education.bachelor.degree')}</h4>
                    <p className="dev-edu-school">{t('education.bachelor.school')}</p>
                    <span className="dev-edu-years">
                      <FiCalendar /> 2019 — 2024
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dev-timeline">
            {experiences.map((job, index) => {
              const isCurrent = index === 0;
              const techStacks = [
                ['ASP.NET Core', '7 Microservices', 'Clean Architecture', 'Chữ ký số HSM', 'SQL Server Always On', 'IIS'],
                ['.NET 9 / CQRS', 'Enterprise AI & RAG', 'PostgreSQL (pgvector)', 'RabbitMQ', 'SignalR', 'Docker Swarm'],
                ['SQL Server Tuning', 'Deadlock Elimination', 'Stored Procedures', 'ERP Middleware', 'TikTok API'],
              ];
              const techList = techStacks[index] || [];
              const initials = ['M', 'A', 'H'][index] || 'C';

              return (
                <article
                  key={job.company}
                  className={`dev-job-card ${isCurrent ? 'is-current-job' : ''}`}
                >
                  <div className={`dev-job-dot ${isCurrent ? 'is-active-dot' : ''}`}>
                    {isCurrent && <span className="dev-job-dot-ping" />}
                  </div>

                  <div className="dev-job-card-top">
                    <div className="dev-job-company-group">
                      <span className={`dev-company-avatar dev-company-avatar-${initials.toLowerCase()}`}>
                        {initials}
                      </span>
                      <div>
                        <div className="dev-job-title-row">
                          <h3 className="dev-job-company-name">{job.company}</h3>
                          {isCurrent && (
                            <span className="dev-job-active-pill">
                              <span className="dev-status-pulse-dot" />
                              {t('ui.current')}
                            </span>
                          )}
                        </div>
                        <span className="dev-job-role-badge">
                          <FiBriefcase />
                          {t(index === 2 ? 'job.fullstack' : 'job.backend')}
                        </span>
                      </div>
                    </div>

                    <div className="dev-job-date-pill">
                      <FiCalendar />
                      <span>
                        {job.startDate} — {job.endDate === 'Now' ? t('ui.current') : job.endDate}
                      </span>
                    </div>
                  </div>

                  <p className="dev-job-description">
                    {t('job.' + ['mobifone', 'agile', 'hoplong'][index] + '.description')}
                  </p>

                  <div className="dev-job-tech-wrap">
                    {techList.map((tech) => (
                      <span key={tech} className="dev-job-tech-tag">
                        {tech}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. WHY WE STARTED / PROVEN MILESTONES (DẤU ẤN NỔI BẬT - KÈM AVATAR TÁC GIẢ) */}
      <section className="figma-section figma-section-tinted" id="milestones">
        <div className="dev-container">
          <SectionHeading
            label={t('figma.milestones.heading')}
            title={t('figma.milestones.title')}
            centered
          />

          <div className="figma-milestones-grid">
            <div className="figma-milestone-card">
              <span className="figma-quote-mark" aria-hidden="true">“</span>
              <p className="figma-quote-text">{t('figma.milestones.q1.text')}</p>
              <div className="figma-quote-author">
                <div>
                  <strong>Nguyễn Tiến Đạt</strong>
                  <span>{t('figma.milestones.q1.author')}</span>
                </div>
              </div>
            </div>

            <div className="figma-milestone-card figma-milestone-card-highlight">
              <span className="figma-quote-mark" aria-hidden="true">“</span>
              <p className="figma-quote-text">{t('figma.milestones.q2.text')}</p>
              <div className="figma-quote-author">
                <div>
                  <strong>Nguyễn Tiến Đạt</strong>
                  <span>{t('figma.milestones.q2.author')}</span>
                </div>
              </div>
            </div>

            <div className="figma-milestone-card">
              <span className="figma-quote-mark" aria-hidden="true">“</span>
              <p className="figma-quote-text">{t('figma.milestones.q3.text')}</p>
              <div className="figma-quote-author">
                <div>
                  <strong>Nguyễn Tiến Đạt</strong>
                  <span>{t('figma.milestones.q3.author')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/#experience">
              <a className="figma-btn-primary inline-flex">
                <span>{t('figma.milestones.explore')}</span>
                <FiArrowRight />
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FEATURED PROJECTS (DỰ ÁN TIÊU BIỂU) */}
      <section className="figma-section" id="projects">
        <div className="dev-container">
          <div className="dev-section-top">
            <SectionHeading
              label={t('section.projects')}
              title={t('section.projectsTitle')}
              description={t('section.projectsDescription')}
            />
            <Link href="/works">
              <a className="figma-btn-secondary figma-btn-compact">
                <span>{t('ui.all')}</span>
                <FiArrowRight />
              </a>
            </Link>
          </div>
          <div className="dev-project-grid">
            {[6, 5, 3].map((id) => (
              <ProjectCard key={id} work={works.find((work) => work.id === id)!} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS (HỎI ĐÁP FAQ) */}
      <section className="figma-section figma-section-tinted" id="faq">
        <div className="dev-container">
          <SectionHeading
            label={t('figma.faq.heading')}
            title={t('figma.faq.title')}
            centered
          />

          <div className="figma-faq-container">
            {faqItems.map((item) => {
              const isOpen = openFaq === item.id;
              return (
                <div
                  key={item.id}
                  className={`figma-faq-item ${isOpen ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="figma-faq-header"
                    onClick={() => toggleFaq(item.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="figma-faq-num">{item.num}</span>
                    <span className="figma-faq-question">{item.question}</span>
                    <span className="figma-faq-toggle">
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="figma-faq-body">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. ABOUT SECTION (VỀ MÌNH - KÈM ẢNH AVATAR THỰC TẾ) */}
      <section className="figma-section" id="about">
        <div className="dev-container dev-about-grid">
          <div className="dev-about-visual-col">
            <div className="dev-about-photo-card">
              <div className="dev-about-photo-wrapper">
                <Image
                  src="/images/avatar/ava1.jpg"
                  alt="Nguyễn Tiến Đạt — Backend Developer & Solution Architect"
                  width={380}
                  height={460}
                  objectFit="cover"
                  className="dev-about-photo-img"
                  priority
                />
                <div className="dev-about-badge-status">
                  <span className="dev-status-pulse-dot" />
                  <span>{t('about.statusBadge')}</span>
                </div>
              </div>

              <div className="dev-about-stats-strip">
                <div className="dev-about-stat-item">
                  <strong>4+</strong>
                  <span>{t('about.stat.experienceYears')}</span>
                </div>
                <div className="dev-about-stat-item">
                  <strong>10+</strong>
                  <span>{t('about.stat.largeSystems')}</span>
                </div>
                <div className="dev-about-stat-item">
                  <strong>99.9%</strong>
                  <span>{t('about.stat.uptime')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dev-about-content">
            <SectionHeading label={t('section.about')} title={t('section.aboutTitle')} />
            <p>{t('section.aboutBody')}</p>
            <p>{t('section.aboutBody2')}</p>

            <div className="dev-about-chips">
              <span className="dev-about-chip">{t('about.chip.location')}</span>
              <span className="dev-about-chip">{t('about.chip.master')}</span>
              <span className="dev-about-chip">{t('about.chip.bachelor')}</span>
              <span className="dev-about-chip">.NET 9 / CQRS / Distributed</span>
              <span className="dev-about-chip">Enterprise AI & RAG</span>
            </div>

            <div className="dev-about-bottom">
              <a className="figma-btn-primary" href="/CV/Nguyen_Tien_Dat_CV.pdf" download>
                <FiDownload />
                <span>{t('ui.download')}</span>
              </a>
              <Link href="/#contact">
                <a className="figma-btn-secondary">
                  <span>{t('ui.letsTalk')}</span>
                  <FiArrowRight />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. WRITING / JOURNAL (BÀI VIẾT) */}
      <section className="figma-section figma-section-tinted" id="writing">
        <div className="dev-container">
          <div className="dev-section-top">
            <SectionHeading label={t('section.writing')} title={t('section.writingTitle')} />
            <Link href="/blog">
              <a className="figma-btn-secondary figma-btn-compact">
                <span>{t('blog.viewAll')}</span>
                <FiArrowRight />
              </a>
            </Link>
          </div>
          <WritingList />
        </div>
      </section>

      {/* 9. WHY CHOOSE US (TẠI SAO CHỌN TÔI - ĐÃ CHUYỂN XUỐNG GẦN CUỐI THEO YÊU CẦU) */}
      <section className="figma-section" id="why-us">
        <div className="dev-container">
          <SectionHeading
            label={t('figma.why.heading')}
            title={t('figma.why.title')}
            centered
          />

          <div className="figma-why-grid">
            {/* Value 1 */}
            <div className="figma-why-card">
              <div className="figma-why-icon">
                <FiZap />
              </div>
              <h4>{t('figma.why.c1.title')}</h4>
              <p>{t('figma.why.c1.desc')}</p>
            </div>

            {/* Value 2 */}
            <div className="figma-why-card">
              <div className="figma-why-icon">
                <FiCheckCircle />
              </div>
              <h4>{t('figma.why.c2.title')}</h4>
              <p>{t('figma.why.c2.desc')}</p>
            </div>

            {/* Value 3 */}
            <div className="figma-why-card">
              <div className="figma-why-icon">
                <FiAward />
              </div>
              <h4>{t('figma.why.c3.title')}</h4>
              <p>{t('figma.why.c3.desc')}</p>
            </div>

            {/* Value 4 */}
            <div className="figma-why-card">
              <div className="figma-why-icon">
                <FiShield />
              </div>
              <h4>{t('figma.why.c4.title')}</h4>
              <p>{t('figma.why.c4.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. CONTACT SECTION (LIÊN HỆ) */}
      <ContactSection />

      {/* 11. FLOATING MOBILE BACK TO TOP BUTTON */}
      <button
        type="button"
        className={`dev-mobile-back-to-top ${showBackToTop ? 'is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <FiChevronUp />
      </button>

      {/* 12. DEDICATED MOBILE BOTTOM ACTION DOCK (ƯU TIÊN ĐIỆN THOẠI) */}
      <aside className="figma-mobile-dock" aria-label="Quick Mobile Actions">
        <a href="tel:0983877462" className="figma-dock-btn" aria-label={t('figma.dock.call')}>
          <div className="figma-dock-icon figma-dock-call">
            <FiPhone />
          </div>
          <span>{t('figma.dock.call')}</span>
        </a>

        <a href="mailto:datt19112001@gmail.com" className="figma-dock-btn" aria-label={t('figma.dock.email')}>
          <div className="figma-dock-icon figma-dock-email">
            <FiMail />
          </div>
          <span>{t('figma.dock.email')}</span>
        </a>

        <a
          href="https://facebook.com/datntd01"
          target="_blank"
          rel="noopener noreferrer"
          className="figma-dock-btn"
          aria-label={t('figma.dock.chat')}
        >
          <div className="figma-dock-icon figma-dock-chat">
            <FiMessageCircle />
          </div>
          <span>{t('figma.dock.chat')}</span>
        </a>

        <Link href="/cv">
          <a className="figma-dock-btn" aria-label={t('figma.dock.cv')}>
            <div className="figma-dock-icon figma-dock-cv">
              <FiAward />
            </div>
            <span>{t('figma.dock.cv')}</span>
          </a>
        </Link>
      </aside>
    </>
  );
}
