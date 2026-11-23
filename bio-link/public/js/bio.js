// Logic hiển thị trang Bio Link & nhận Live Preview từ trang Admin

(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === '1';
  const fbclidParam = urlParams.get('fbclid') || '';
  if (isPreview) {
    document.body.classList.add('is-iframe-preview');
  }

  let currentParticleEffect = '';

  function hexToRgba(hex, alphaPercent) {
    const clean = String(hex || '#ffffff').replace('#', '');
    let r = 255, g = 255, b = 255;
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
      r = parseInt(clean.slice(0, 2), 16);
      g = parseInt(clean.slice(2, 4), 16);
      b = parseInt(clean.slice(4, 6), 16);
    }
    const alpha = Math.max(0, Math.min(100, Number(alphaPercent ?? 88))) / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function renderParticles(effect) {
    const container = document.getElementById('particles-container');
    if (!container) return;
    if (currentParticleEffect === effect && container.children.length > 0) return;

    currentParticleEffect = effect;
    container.innerHTML = '';

    if (!effect || effect === 'none') return;

    const count = effect === 'bokeh' ? 14 : effect === 'sakura' ? 14 : 18;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      if (effect === 'bokeh') {
        el.className = 'particle-bokeh';
        const size = 24 + Math.random() * 68;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `${15 + Math.random() * 85}%`;
        el.style.animationDuration = `${7 + Math.random() * 9}s`;
        el.style.animationDelay = `${Math.random() * 5}s`;
      } else if (effect === 'sakura') {
        el.className = 'particle-sakura';
        const size = 9 + Math.random() * 10;
        el.style.width = `${size}px`;
        el.style.height = `${size * 0.8}px`;
        el.style.left = `${Math.random() * 95}%`;
        el.style.top = `-20px`;
        el.style.animationDuration = `${8 + Math.random() * 8}s`;
        el.style.animationDelay = `${Math.random() * 7}s`;
      } else if (effect === 'sparkles') {
        el.className = 'particle-sparkle';
        const size = 3 + Math.random() * 5;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.left = `${8 + Math.random() * 84}%`;
        el.style.top = `${6 + Math.random() * 88}%`;
        el.style.animationDuration = `${2 + Math.random() * 3}s`;
        el.style.animationDelay = `${Math.random() * 3}s`;
      }
      container.appendChild(el);
    }
  }

  function trackClick(id, title, url) {
    if (isPreview) return;
    const payload = JSON.stringify({
      id,
      title: title || id,
      url: url || '',
      referrer: document.referrer || '',
      fbclid: fbclidParam || null
    });
    fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  }

  function renderSocialsContainer(containerEl, socials) {
    containerEl.innerHTML = '';
    socials.forEach((soc) => {
      if (!soc.enabled) return;
      const a = document.createElement('a');
      a.className = 'social-circle-btn';
      a.href = soc.url || '#';
      if (!String(soc.url || '').startsWith('mailto:') && !String(soc.url || '').startsWith('tel:')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      a.title = soc.label || soc.platform;
      a.setAttribute('aria-label', soc.label || soc.platform);
      a.innerHTML = window.getBioIconSvg(soc.platform) || window.getBioIconSvg('globe');
      a.addEventListener('click', () => trackClick(soc.id || soc.platform, `MXH: ${soc.label || soc.platform}`, soc.url));
      containerEl.appendChild(a);
    });
  }

  function applyConfig(config) {
    if (!config) return;
    const profile = config.profile || {};
    const theme = config.theme || {};
    const links = Array.isArray(config.links) ? config.links : [];
    const socials = Array.isArray(config.socials) ? config.socials : [];
    const featured = config.featuredCard || {};
    const seo = config.seo || {};

    // 1. SEO & Meta
    if (seo.pageTitle) document.title = seo.pageTitle;
    const metaDesc = document.getElementById('meta-desc');
    if (metaDesc && seo.metaDescription) metaDesc.setAttribute('content', seo.metaDescription);
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme && theme.primaryColor) metaTheme.setAttribute('content', theme.primaryColor);

    // 2. CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor || '#d97793');
    root.style.setProperty('--secondary-color', theme.secondaryColor || '#f7d6e0');
    root.style.setProperty('--accent-color', theme.accentColor || '#b55672');
    root.style.setProperty('--bg-grad-start', theme.bgGradientStart || '#f6c4d2');
    root.style.setProperty('--bg-grad-mid', theme.bgGradientMid || '#e89ab2');
    root.style.setProperty('--bg-grad-end', theme.bgGradientEnd || '#c8738e');
    root.style.setProperty('--bg-overlay-color', theme.bgOverlayColor || '#7a354b');
    root.style.setProperty('--bg-overlay-opacity', String((Number(theme.bgOverlayOpacity ?? 35)) / 100));
    root.style.setProperty('--bg-blur', `${Number(theme.bgBlur ?? 3)}px`);
    root.style.setProperty('--btn-bg-rgba', hexToRgba(theme.buttonBgColor || '#ffffff', theme.buttonBgOpacity ?? 88));
    root.style.setProperty('--btn-text-color', theme.buttonTextColor || '#522938');
    root.style.setProperty('--text-color', theme.textColor || '#ffffff');
    root.style.setProperty('--heading-font', `'${theme.headingFont || 'Cormorant Garamond'}', Georgia, serif`);
    root.style.setProperty('--body-font', `'${theme.bodyFont || 'Plus Jakarta Sans'}', sans-serif`);
    root.style.setProperty('--avatar-size', `${Number(theme.avatarSize || 124)}px`);

    // 3. Phone Card Classes (Template 1, 2, 3 + Button Style + Radius)
    const phoneCard = document.getElementById('phone-card');
    const templateName = theme.template || 'template2';
    phoneCard.className = [
      'bio-phone-card',
      `template-${templateName}`,
      `radius-${theme.buttonRadius || 'pill'}`,
      `btn-style-${theme.buttonStyle || 'frosted-light'}`,
      theme.uppercaseLinks !== false ? 'uppercase-links' : ''
    ].filter(Boolean).join(' ');

    // 4. Background Image
    const cardBgImage = document.getElementById('card-bg-image');
    const ambientBackdrop = document.getElementById('ambient-backdrop');
    let activeBgUrl = '';
    if (templateName === 'template3') {
      activeBgUrl = theme.portraitBgImage || profile.avatar || theme.bgImage || '';
    } else if (theme.bgType !== 'gradient') {
      activeBgUrl = theme.bgImage || '';
    }

    if (activeBgUrl) {
      cardBgImage.style.backgroundImage = `url("${activeBgUrl}")`;
      cardBgImage.style.display = 'block';
      ambientBackdrop.style.backgroundImage = `url("${activeBgUrl}")`;
    } else {
      cardBgImage.style.backgroundImage = 'none';
      cardBgImage.style.display = 'none';
      ambientBackdrop.style.backgroundImage = 'none';
    }

    // 5. Particles
    renderParticles(theme.particleEffect || 'bokeh');

    // 6. Share button visibility
    const topUtility = document.getElementById('top-utility-bar');
    if (topUtility) {
      topUtility.style.display = seo.showShareButton === false ? 'none' : 'flex';
    }

    // 7. Avatar & Frame
    const avatarWrapper = document.getElementById('avatar-wrapper');
    const avatarImg = document.getElementById('profile-avatar');
    let frameStyle = theme.avatarFrame || 'organic';
    if (templateName === 'template1' && !theme.avatarFrame) frameStyle = 'circle';
    avatarWrapper.className = `avatar-wrapper frame-${frameStyle} fade-up`;
    if (avatarImg && profile.avatar) {
      avatarImg.src = profile.avatar;
      avatarImg.alt = profile.name || 'Avatar';
    }

    // 8. Profile Name, Subtitle, Quote
    const nameEl = document.getElementById('profile-name');
    const subEl = document.getElementById('profile-subtitle');
    const quoteEl = document.getElementById('profile-quote');

    if (nameEl) nameEl.textContent = profile.name || 'HIKARI MAEVE';
    if (subEl) {
      subEl.textContent = profile.subtitle || '';
      subEl.style.display = profile.subtitle ? 'block' : 'none';
    }
    if (quoteEl) {
      quoteEl.textContent = profile.quote || '';
      quoteEl.style.display = profile.quote ? 'block' : 'none';
    }

    // 9. Links List
    const linksContainer = document.getElementById('links-list');
    linksContainer.innerHTML = '';
    const activeLinks = links.filter((l) => l && l.enabled !== false);
    activeLinks.forEach((link, idx) => {
      const a = document.createElement('a');
      a.className = `bio-link-btn fade-up ${link.shimmer ? 'has-shimmer' : ''}`;
      a.style.animationDelay = `${0.1 + idx * 0.05}s`;
      a.href = link.url || '#';
      if (!String(link.url || '').startsWith('#') && !String(link.url || '').startsWith('mailto:') && !String(link.url || '').startsWith('tel:')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      a.addEventListener('click', () => trackClick(link.id));

      const iconSvg = window.getBioIconSvg(link.icon);
      const iconHtml = iconSvg ? `<span class="link-icon-left">${iconSvg}</span>` : '';
      const subHtml = link.subtitle ? `<span class="link-subtitle">${escapeHtml(link.subtitle)}</span>` : '';
      const badgeHtml = link.badge ? `<span class="link-badge">${escapeHtml(link.badge)}</span>` : '';

      a.innerHTML = `
        ${iconHtml}
        <span class="link-text-group">
          <span class="link-title">${escapeHtml(link.title || 'LINK')}</span>
          ${subHtml}
        </span>
        ${badgeHtml}
      `;
      linksContainer.appendChild(a);
    });

    // 10. Featured Collection Banner Card
    const featuredEl = document.getElementById('featured-card');
    const featuredBg = document.getElementById('featured-card-bg');
    const featuredOverlay = document.getElementById('featured-card-overlay');
    const featuredTitle = document.getElementById('featured-card-title');
    const featuredSub = document.getElementById('featured-card-subtitle');

    if (featured && featured.enabled) {
      featuredEl.style.display = 'flex';
      featuredEl.href = featured.url || '#';
      featuredBg.style.backgroundImage = featured.image ? `url("${featured.image}")` : 'none';
      featuredOverlay.style.background = `linear-gradient(90deg, ${hexToRgba(theme.primaryColor || '#1f7a9c', 76)} 0%, rgba(0, 0, 0, 0.28) 50%, ${hexToRgba(theme.primaryColor || '#1f7a9c', 76)} 100%)`;
      featuredTitle.textContent = featured.title || 'GET MY ENTIRE COLLECTION';
      if (featured.subtitle) {
        featuredSub.textContent = featured.subtitle;
        featuredSub.style.display = 'block';
      } else {
        featuredSub.style.display = 'none';
      }
    } else {
      featuredEl.style.display = 'none';
    }

    // 11. Social Icons (Top / Bottom / Both)
    const socialsTop = document.getElementById('socials-top');
    const socialsBottom = document.getElementById('socials-bottom');
    // In Template 3, default to top if socialPosition isn't explicitly overridden
    const pos = theme.socialPosition || (templateName === 'template3' ? 'top' : 'bottom');

    renderSocialsContainer(socialsTop, socials);
    renderSocialsContainer(socialsBottom, socials);

    const hasEnabledSocials = socials.some((s) => s && s.enabled);
    socialsTop.style.display = hasEnabledSocials && (pos === 'top' || pos === 'both') ? 'flex' : 'none';
    socialsBottom.style.display = hasEnabledSocials && (pos === 'bottom' || pos === 'both') ? 'flex' : 'none';

    // 12. Footer
    const footerEl = document.getElementById('bio-footer');
    if (footerEl) {
      footerEl.textContent = seo.footerText || '';
      footerEl.style.display = seo.footerText ? 'block' : 'none';
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Featured card click tracker
  const featuredCardEl = document.getElementById('featured-card');
  if (featuredCardEl) {
    featuredCardEl.addEventListener('click', () => trackClick('featured-card'));
  }

  // Share Modal handlers
  const shareModal = document.getElementById('share-modal');
  const btnOpenShare = document.getElementById('btn-open-share');
  const btnCloseShare = document.getElementById('btn-close-share');
  const btnCopyShare = document.getElementById('btn-copy-share-url');
  const shareUrlInput = document.getElementById('share-url-input');

  if (btnOpenShare && shareModal) {
    btnOpenShare.addEventListener('click', () => {
      if (shareUrlInput) shareUrlInput.value = window.location.origin;
      shareModal.classList.add('active');
    });
  }
  if (btnCloseShare && shareModal) {
    btnCloseShare.addEventListener('click', () => shareModal.classList.remove('active'));
  }
  if (shareModal) {
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) shareModal.classList.remove('active');
    });
  }
  if (btnCopyShare && shareUrlInput) {
    btnCopyShare.addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrlInput.value).then(() => {
        btnCopyShare.textContent = 'Đã chép ✓';
        setTimeout(() => { btnCopyShare.textContent = 'Copy'; }, 2000);
      });
    });
  }

  // Listen for live preview updates from Admin panel
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'BIO_PREVIEW_UPDATE') {
      applyConfig(event.data.config);
    }
  });

  // Initial fetch
  const trackQuery = isPreview
    ? ''
    : `?track=1&fbclid=${encodeURIComponent(fbclidParam)}&ref=${encodeURIComponent(document.referrer || '')}`;
  fetch(`/api/config${trackQuery}`)
    .then((r) => r.json())
    .then((res) => {
      if (res && res.data) {
        applyConfig(res.data);
      }
    })
    .catch((err) => {
      console.error('Error loading bio config:', err);
    });
})();
