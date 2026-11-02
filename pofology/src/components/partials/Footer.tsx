import Link from 'next/link';
import { FiArrowUpRight, FiGithub, FiLinkedin } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="dev-footer">
      <div className="dev-container">
        <div className="dev-footer-top">
          <div>
            <Link href="/">
              <a className="dev-logo">
                Tiến Đạt<span className="dev-accent">.</span>
              </a>
            </Link>
            <p>{t('footer.note')}</p>
          </div>
          <div className="dev-footer-links">
            <a href="https://github.com/NTDno1" target="_blank" rel="noopener noreferrer">
              <FiGithub />
              GitHub
              <FiArrowUpRight />
            </a>
            <a href="https://linkedin.com/in/ntd1911" target="_blank" rel="noopener noreferrer">
              <FiLinkedin />
              LinkedIn
              <FiArrowUpRight />
            </a>
            <Link href="/cv">
              <a>
                {t('ui.cv')}
                <FiArrowUpRight />
              </a>
            </Link>
          </div>
        </div>
        <div className="dev-footer-bottom">
          <p>
            © {new Date().getFullYear()} Nguyễn Tiến Đạt. {t('footer.rights')}
          </p>
          <p className="dev-mono">
            <span className="dev-status-dot" />
            {t('footer.timezone')}
          </p>
        </div>
      </div>
    </footer>
  );
}
