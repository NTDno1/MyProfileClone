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

    // 2. CSS Variables (Colors, Fonts & Deep Typography Sliders)
    const root = document.documentElement;
    const headingFontName = theme.headingFont || 'Cormorant Garamond';
    const bodyFontName = theme.bodyFont || 'Plus Jakarta Sans';
    const quoteFontName = theme.quoteFont && theme.quoteFont !== 'inherit' ? theme.quoteFont : '';
    const isScriptHeading = ['Great Vibes', 'Dancing Script', 'Sacramento'].includes(headingFontName);
    const isScriptQuote = ['Great Vibes', 'Dancing Script', 'Sacramento'].includes(quoteFontName);

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
    root.style.setProperty('--btn-border-color', theme.buttonBorderColor || 'rgba(255, 255, 255, 0.78)');
    root.style.setProperty('--text-color', theme.textColor || '#ffffff');
    root.style.setProperty('--subtitle-color', theme.subtitleColor || theme.textColor || '#ffffff');
    root.style.setProperty('--quote-color', theme.quoteColor || theme.textColor || '#ffffff');
    root.style.setProperty('--social-bg-color', theme.socialBgColor || '#ffffff');
    root.style.setProperty('--social-icon-color', theme.socialIconColor || theme.primaryColor || '#d97793');
    root.style.setProperty('--heading-font', `'${headingFontName}', Georgia, serif`);
    root.style.setProperty('--body-font', `'${bodyFontName}', sans-serif`);
    root.style.setProperty('--quote-font', quoteFontName ? `'${quoteFontName}', cursive, serif` : 'inherit');
    root.style.setProperty('--avatar-size', `${Number(theme.avatarSize || 124)}px`);

    const nameSize = Number(theme.nameFontSize || 0);
    const subSize = Number(theme.subtitleFontSize || 0);
    const bioSize = Number(theme.bioFontSize || 0);
    const btnSize = Number(theme.buttonFontSize || 0);
    const btnSubSize = Number(theme.buttonSubFontSize || 0);
    const quoteSize = Number(theme.quoteFontSize || 0);
    const btnHeight = Number(theme.buttonMinHeight || 0);
    const btnGap = Number(theme.buttonGap || 0);
    const hasCustomSpacing = theme.nameLetterSpacing !== null && theme.nameLetterSpacing !== undefined && theme.nameLetterSpacing !== '';

    if (nameSize > 0) root.style.setProperty('--name-font-size', `${nameSize}px`);
    if (subSize > 0) root.style.setProperty('--subtitle-font-size', `${subSize}px`);
    if (bioSize > 0) root.style.setProperty('--bio-font-size', `${bioSize}px`);
    if (btnSize > 0) root.style.setProperty('--btn-font-size', `${btnSize}px`);
    if (btnSubSize > 0) root.style.setProperty('--btn-sub-font-size', `${btnSubSize}px`);
    if (quoteSize > 0) root.style.setProperty('--quote-font-size', `${quoteSize}px`);
    if (hasCustomSpacing) root.style.setProperty('--name-letter-spacing', `${Number(theme.nameLetterSpacing)}px`);
    if (btnHeight > 0) root.style.setProperty('--btn-min-height', `${btnHeight}px`);
    if (btnGap > 0) root.style.setProperty('--btn-gap', `${btnGap}px`);

    // 3. Phone Card Classes (Templates 1–20 + Button Style + Radius + Social Style + Typography Flags)
    const phoneCard = document.getElementById('phone-card');
    const templateName = theme.template || 'template2';
    phoneCard.className = [
      'bio-phone-card',
      `template-${templateName}`,
      `radius-${theme.buttonRadius || 'pill'}`,
      `btn-style-${theme.buttonStyle || 'frosted-light'}`,
      `social-style-${theme.socialStyle || 'filled-circle'}`,
      theme.uppercaseLinks !== false ? 'uppercase-links' : '',
      theme.showDecorations === false ? 'hide-decorations' : '',
      isScriptHeading ? 'has-script-heading' : '',
      isScriptQuote ? 'has-script-quote' : '',
      nameSize > 0 ? 'has-custom-name-size' : '',
      hasCustomSpacing ? 'has-custom-name-spacing' : '',
      subSize > 0 ? 'has-custom-subtitle-size' : '',
      bioSize > 0 ? 'has-custom-bio-size' : '',
      btnSize > 0 ? 'has-custom-btn-size' : '',
      btnSubSize > 0 ? 'has-custom-btn-sub-size' : '',
      quoteSize > 0 ? 'has-custom-quote-size' : '',
      btnHeight > 0 ? 'has-custom-btn-height' : '',
      btnGap > 0 ? 'has-custom-btn-gap' : ''
    ].filter(Boolean).join(' ');

    // 3b. Decorative Inner Frame (Templates 7, 8, 11, 12)
    const decoFrame = document.getElementById('bio-deco-frame');
    if (decoFrame) {
      if (templateName === 'template7' || templateName === 'template12') {
        decoFrame.className = 'bio-deco-frame deco-starlight-rect';
        decoFrame.innerHTML = `
          <span class="bio-deco-star" style="top: -28px; right: 22px; font-size: 16px;">✦</span>
          <span class="bio-deco-star" style="top: -18px; right: 12px; font-size: 9px;">✦</span>
          <span class="bio-deco-star" style="top: 14px; left: 20px; font-size: 13px;">✦</span>
        `;
      } else if (templateName === 'template8' || templateName === 'template11') {
        decoFrame.className = 'bio-deco-frame deco-cathedral-arch';
        decoFrame.innerHTML = `
          <span class="bio-deco-star" style="top: 48px; right: 18px; font-size: 15px;">✦</span>
          <span class="bio-deco-star" style="top: 60px; right: 8px; font-size: 9px;">✦</span>
          <span class="bio-deco-star" style="top: 118px; left: 14px; font-size: 13px;">✦</span>
        `;
      } else {
        decoFrame.className = 'bio-deco-frame';
        decoFrame.innerHTML = '';
      }
    }

    // 4. Background Image & Top Cover Banner
    const cardBgImage = document.getElementById('card-bg-image');
    const ambientBackdrop = document.getElementById('ambient-backdrop');
    const coverBannerImg = document.getElementById('bio-cover-banner-img');
    const isPortraitHeroTemplate = ['template3', 'template5', 'template14'].includes(templateName);
    const isCoverTemplate = ['template4', 'template6', 'template15', 'template18'].includes(templateName);

    let activeBgUrl = '';
    if (isPortraitHeroTemplate) {
      if (templateName === 'template3' || theme.bgType !== 'gradient') {
        activeBgUrl = theme.portraitBgImage || profile.avatar || theme.bgImage || '';
      }
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
      ambientBackdrop.style.backgroundImage = profile.avatar ? `url("${profile.avatar}")` : 'none';
    }

    if (coverBannerImg && isCoverTemplate) {
      const coverUrl = theme.coverImage || theme.bgImage || profile.avatar || '';
      coverBannerImg.style.backgroundImage = coverUrl ? `url("${coverUrl}")` : 'none';
    }

    // 5. Particles
    const defaultParticle = ['template1', 'template2', 'template3'].includes(templateName) ? 'bokeh' : 'none';
    renderParticles(theme.particleEffect || defaultParticle);

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

    // 8. Profile Name, Subtitle, Bio Paragraph, Quote & Curved SVG TextPaths
    const nameEl = document.getElementById('profile-name');
    const subEl = document.getElementById('profile-subtitle');
    const bioEl = document.getElementById('profile-bio');
    const quoteEl = document.getElementById('profile-quote');
    const curvedNameEl = document.getElementById('curved-name-textpath');
    const curvedSubEl = document.getElementById('curved-subtitle-textpath');

    const displayName = profile.name || 'HIKARI MAEVE';
    const displaySub = profile.subtitle || '';
    if (nameEl) nameEl.textContent = displayName;
    if (curvedNameEl) curvedNameEl.textContent = displayName;

    if (subEl) {
      subEl.textContent = displaySub;
      subEl.style.display = displaySub ? 'block' : 'none';
    }
    if (curvedSubEl) {
      curvedSubEl.textContent = displaySub;
    }
    if (bioEl) {
      const bioText = String(profile.bio || '').trim();
      bioEl.textContent = bioText;
      bioEl.style.display = bioText ? 'block' : 'none';
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
      const rawHref = link.url === '/affiliate' ? '/tu-do' : link.url || '#';
      a.href = rawHref;
      if (
        !String(rawHref).startsWith('#') &&
        !String(rawHref).startsWith('/') &&
        !String(rawHref).startsWith('mailto:') &&
        !String(rawHref).startsWith('tel:')
      ) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      a.addEventListener('click', () => trackClick(link.id));

      const iconSvg = window.getBioIconSvg(link.icon);
      const iconHtml = iconSvg ? `<span class="link-icon-left">${iconSvg}</span>` : '';
      const cleanLinkTitle = /affiliate/i.test(String(link.title || ''))
        ? String(link.title)
            .replace(/TỦ ĐỒ AFFILIATE\s*&?\s*LINK ĐỒ XINH/gi, 'GÓC ĐỒ XINH & TỦ ĐỒ TUYỂN CHỌN')
            .replace(/\baffiliate\b/gi, 'Tuyển Chọn')
            .replace(/\s+/g, ' ')
            .trim()
        : link.title || 'LINK';
      const subHtml = link.subtitle
        ? `<span class="link-subtitle">${escapeHtml(String(link.subtitle).replace(/\baffiliate\b/gi, 'tuyển chọn'))}</span>`
        : '';
      const badgeHtml = link.badge ? `<span class="link-badge">${escapeHtml(link.badge)}</span>` : '';

      a.innerHTML = `
        ${iconHtml}
        <span class="link-text-group">
          <span class="link-title">${escapeHtml(cleanLinkTitle)}</span>
          ${subHtml}
        </span>
        ${badgeHtml}
      `;
      linksContainer.appendChild(a);
    });

    // 10. Featured Collection Banner Card (Standard Full-Bleed Banner or Split Promo Card)
    const featuredEl = document.getElementById('featured-card');
    const featuredBg = document.getElementById('featured-card-bg');
    const featuredOverlay = document.getElementById('featured-card-overlay');
    const featuredTitle = document.getElementById('featured-card-title');
    const featuredSub = document.getElementById('featured-card-subtitle');
    const featuredCta = document.getElementById('featured-card-cta');
    const featuredSideMedia = document.getElementById('featured-card-side-media');
    const featuredSideImg = document.getElementById('featured-card-side-img');

    if (featured && featured.enabled) {
      const useSplitLead = featured.style === 'split-lead' || (templateName === 'template6' && !featured.style);
      featuredEl.classList.toggle('featured-split-lead', useSplitLead);
      featuredEl.style.display = 'flex';
      featuredEl.href = featured.url || '#';
      const fImg = featured.image || profile.avatar || '';
      featuredBg.style.backgroundImage = fImg ? `url("${fImg}")` : 'none';
      featuredOverlay.style.background = `linear-gradient(90deg, ${hexToRgba(theme.primaryColor || '#1f7a9c', 76)} 0%, rgba(0, 0, 0, 0.28) 50%, ${hexToRgba(theme.primaryColor || '#1f7a9c', 76)} 100%)`;
      featuredTitle.textContent = featured.title || 'GET MY ENTIRE COLLECTION';
      if (featured.subtitle) {
        featuredSub.textContent = featured.subtitle;
        featuredSub.style.display = 'block';
      } else {
        featuredSub.style.display = 'none';
      }
      if (featuredCta) {
        const ctaLabel = String(featured.ctaText || '').trim();
        featuredCta.textContent = ctaLabel || 'XEM NGAY';
        featuredCta.style.display = useSplitLead && ctaLabel !== 'none' ? 'inline-flex' : 'none';
      }
      if (featuredSideMedia && featuredSideImg) {
        if (useSplitLead && fImg) {
          featuredSideImg.src = fImg;
          featuredSideMedia.style.display = 'block';
        } else {
          featuredSideMedia.style.display = 'none';
        }
      }
    } else {
      featuredEl.style.display = 'none';
    }

    // 11. Social Icons (Top / Bottom / Both / Hidden)
    const socialsTop = document.getElementById('socials-top');
    const socialsBottom = document.getElementById('socials-bottom');
    const pos = theme.socialPosition || (templateName === 'template3' ? 'top' : 'bottom');

    renderSocialsContainer(socialsTop, socials);
    renderSocialsContainer(socialsBottom, socials);

    const hasEnabledSocials = socials.some((s) => s && s.enabled) && pos !== 'hidden';
    socialsTop.style.display = hasEnabledSocials && (pos === 'top' || pos === 'both') ? 'flex' : 'none';
    socialsBottom.style.display = hasEnabledSocials && (pos === 'bottom' || pos === 'both') ? 'flex' : 'none';

    // 12. Footer (Locked to synchronized signature across all pages)
    const footerEl = document.getElementById('bio-footer');
    if (footerEl) {
      footerEl.textContent = 'Made with ♡ by My Love';
      footerEl.style.display = 'block';
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
