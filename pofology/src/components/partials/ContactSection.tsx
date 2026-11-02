import { FormEvent, useState } from 'react';
import {
  FiArrowUpRight,
  FiCheck,
  FiCopy,
  FiGithub,
  FiLinkedin,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiSend,
} from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ContactSection() {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('datt19112001@gmail.com');
      setFeedback('contact.copied');
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback('contact.copyFailed');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText('0983877462');
      setFeedback('contact.phoneCopied');
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback('contact.copyFailed');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setErrorMessage(data.message || t('contact.error'));
      }
    } catch {
      setErrorMessage(t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dev-contact" id="contact">
      <div className="dev-container dev-contact-grid">
        <div className="dev-contact-copy">
          <div className="dev-eyebrow">{t('contact.eyebrow')}</div>
          <h2>
            {t('contact.heading1')}
            <br />
            <span>{t('contact.heading2')}</span>
          </h2>
          <p>{t('contact.intro')}</p>

          <div className="dev-contact-quick-list">
            <div className="dev-contact-item">
              <div className="dev-contact-icon">
                <FiMail />
              </div>
              <div className="dev-contact-info">
                <span>Email</span>
                <a href="mailto:datt19112001@gmail.com">datt19112001@gmail.com</a>
              </div>
              <button
                type="button"
                className="dev-icon-button"
                onClick={copyEmail}
                aria-label={t('contact.copy')}
                title={t('contact.copy')}
              >
                {feedback === 'contact.copied' ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
              </button>
            </div>

            <div className="dev-contact-item">
              <div className="dev-contact-icon">
                <FiPhone />
              </div>
              <div className="dev-contact-info">
                <span>{t('contact.phoneLabel')}</span>
                <a href="tel:0983877462">0983 877 462</a>
              </div>
              <button
                type="button"
                className="dev-icon-button"
                onClick={copyPhone}
                aria-label={t('contact.copyPhone')}
                title={t('contact.copyPhone')}
              >
                {feedback === 'contact.phoneCopied' ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
              </button>
            </div>
          </div>

          {feedback && (
            <p className="dev-feedback" role="status">
              {t(feedback)}
            </p>
          )}

          <div className="dev-contact-social">
            <a href="https://zalo.me/0983877462" target="_blank" rel="noopener noreferrer">
              <FiPhone />
              Zalo (0983877462)
              <FiArrowUpRight />
            </a>
            <a href="https://facebook.com/datntd01" target="_blank" rel="noopener noreferrer">
              <FiMessageSquare />
              Facebook
              <FiArrowUpRight />
            </a>
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
          </div>
        </div>

        <div className="dev-contact-form-wrapper">
          {isSuccess ? (
            <div className="dev-contact-form dev-contact-success-state">
              <div className="dev-contact-success-icon-box">
                <FiCheck />
              </div>
              <h3>{t('contact.successTitle')}</h3>
              <p>{t('contact.successMessage')}</p>
              
              <div className="dev-contact-success-actions">
                <button
                  type="button"
                  className="figma-btn-primary"
                  onClick={() => setIsSuccess(false)}
                >
                  {t('contact.sendAnother')}
                </button>
                <a
                  href="https://zalo.me/0983877462"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="figma-btn-secondary"
                >
                  <FiMessageSquare />
                  <span>{t('contact.directZalo')}</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="dev-contact-form">
              <h3>{t('contact.formTitle')}</h3>

              {errorMessage && (
                <div className="dev-contact-error-banner" role="alert">
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="dev-form-row">
                <label htmlFor="contact-name">
                  {t('contact.page.form.name')} *
                  <input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder={t('contact.namePlaceholder')}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label htmlFor="contact-email">
                  {t('contact.page.form.email')} *
                  <input
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    required
                    type="email"
                    maxLength={200}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
              </div>

              <div className="dev-form-row">
                <label htmlFor="contact-phone">
                  {t('contact.page.form.phone')}
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    maxLength={30}
                    placeholder={t('contact.phonePlaceholder')}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>

                <label htmlFor="contact-subject">
                  {t('contact.page.form.subject')}
                  <input
                    id="contact-subject"
                    name="subject"
                    maxLength={200}
                    placeholder={t('contact.subjectPlaceholder')}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </label>
              </div>

              <label htmlFor="contact-message">
                {t('contact.page.form.message')} *
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  maxLength={3000}
                  placeholder={t('contact.messagePlaceholder')}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </label>

              <button type="submit" className="dev-button dev-contact-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>{t('contact.sending')}</span>
                ) : (
                  <>
                    <span>{t('contact.submit')}</span>
                    <FiSend />
                  </>
                )}
              </button>

              <p className="dev-form-note">{t('contact.formNote')}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
