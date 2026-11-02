import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiArrowUpRight,
  FiDownload,
  FiGithub,
  FiMail,
  FiMenu,
  FiMoon,
  FiPhone,
  FiSun,
  FiX,
} from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import { Theme, useTheme } from '@/hooks/use-theme';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

const links = [
  ['nav.services', '/#services'],
  ['nav.experience', '/#experience'],
  ['nav.works', '/#projects'],
  ['nav.about', '/#about'],
  ['nav.blog', '/blog'],
  ['nav.faq', '/#faq'],
  ['nav.why', '/#why-us'],
];

export default function Menu() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (router.pathname === '/') {
      e.preventDefault();
      if (window.location.hash) {
        history.replaceState(null, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
      }

      if (router.pathname === '/') {
        const scrollPos = window.scrollY + 180;
        const sectionIds = ['contact', 'why-us', 'about', 'faq', 'projects', 'experience', 'services'];
        let foundSection = '';
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (el && scrollPos >= el.offsetTop) {
            foundSection = `/#${id}`;
            break;
          }
        }
        setActiveSection(foundSection);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router.pathname]);

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeStart', close);
    router.events.on('hashChangeStart', close);
    return () => {
      router.events.off('routeChangeStart', close);
      router.events.off('hashChangeStart', close);
    };
  }, [router.events]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (deltaY > 60) {
      setOpen(false);
    }
    setTouchStartY(null);
  };

  return (
    <header className="dev-header">
      <div
        className="dev-scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
      <div className="dev-container dev-header-inner">
        <Link href="/">
          <a className="dev-logo" onClick={handleLogoClick} aria-label="Nguyễn Tiến Đạt — Home">
            <div className="dev-logo-avatar-wrap">
              <Image
                src="/images/avatar/ava1.jpg"
                alt="Nguyễn Tiến Đạt"
                width={36}
                height={36}
                className="dev-logo-avatar-img"
                priority
              />
              <span className="dev-logo-avatar-dot" />
            </div>
            <span className="dev-logo-text">Nguyễn Tiến Đạt</span>
          </a>
        </Link>


        <nav className="dev-desktop-nav" aria-label={t('ui.navigation')}>
          {links.map(([key, href]) => {
            const isActive = activeSection ? activeSection === href : router.asPath === href;
            return (
              <Link href={href} key={key}>
                <a className={isActive ? 'is-active' : ''}>{t(key)}</a>
              </Link>
            );
          })}
        </nav>

        <div className="dev-header-actions">
          <LanguageSwitcher />
          <button className="dev-icon-button" type="button" onClick={toggleTheme} aria-label={t('ui.theme')}>
            {theme === Theme.DARK ? <FiSun /> : <FiMoon />}
          </button>
          <Link href="/#contact">
            <a className="dev-button dev-button-small dev-header-contact">
              {t('ui.letsTalk')}
              <FiArrowUpRight />
            </a>
          </Link>
          <button
            type="button"
            className="dev-icon-button dev-menu-toggle"
            aria-label={t('ui.openMenu')}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(true)}
          >
            <FiMenu />
          </button>
        </div>
      </div>

      <Dialog open={open} onClose={setOpen} className="dev-mobile-dialog" data-theme={theme}>
        <div className="dev-menu-backdrop" aria-hidden="true" />
        <Dialog.Panel
          id="mobile-navigation"
          className="dev-mobile-panel"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="dev-mobile-swipe-handle" aria-hidden="true">
            <span className="dev-mobile-swipe-pill" />
          </div>

          <div className="dev-mobile-top">
            <Dialog.Title className="dev-logo">
              <a
                href="/"
                onClick={(e) => {
                  setOpen(false);
                  handleLogoClick(e);
                }}
                className="inline-flex items-center gap-2.5"
              >
                <div className="dev-logo-avatar-wrap">
                  <Image
                    src="/images/avatar/ava1.jpg"
                    alt="Nguyễn Tiến Đạt"
                    width={36}
                    height={36}
                    className="dev-logo-avatar-img"
                    priority
                  />
                  <span className="dev-logo-avatar-dot" />
                </div>
                <span className="dev-logo-text">Nguyễn Tiến Đạt</span>
              </a>
            </Dialog.Title>
            <button
              className="dev-icon-button"
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('ui.closeMenu')}
            >
              <FiX />
            </button>
          </div>

          <div className="dev-mobile-switchers">
            <LanguageSwitcher />
            <button className="dev-icon-button" type="button" onClick={toggleTheme} aria-label={t('ui.theme')}>
              {theme === Theme.DARK ? <FiSun /> : <FiMoon />}
            </button>
          </div>

          <nav aria-label={t('ui.navigation')} className="dev-mobile-nav-links">
            {links.map(([key, href]) => (
              <Link key={key} href={href}>
                <a onClick={() => setOpen(false)}>
                  {t(key)}
                  <FiArrowUpRight />
                </a>
              </Link>
            ))}
          </nav>

          <div className="dev-mobile-bottom-actions">
            <div className="dev-mobile-action-buttons">
              <Link href="/#contact">
                <a className="dev-button" onClick={() => setOpen(false)}>
                  {t('ui.letsTalk')}
                  <FiArrowUpRight />
                </a>
              </Link>
              <a
                href="/CV/Nguyen_Tien_Dat_CV.pdf"
                download
                className="dev-button dev-button-outline"
                onClick={() => setOpen(false)}
              >
                <FiDownload />
                {t('ui.download')}
              </a>
            </div>
            <div className="dev-mobile-contact-chips">
              <a href="tel:0983877462" className="dev-contact-chip">
                <FiPhone />
                <span>0983 877 462</span>
              </a>
              <a href="mailto:datt19112001@gmail.com" className="dev-contact-chip">
                <FiMail />
                <span>datt19112001@gmail.com</span>
              </a>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
