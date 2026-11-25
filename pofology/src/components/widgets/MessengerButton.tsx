import React, { useState, useEffect } from 'react';
import { FaFacebookMessenger } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { trackContactClick } from '@/components/analytics/Tracking';

interface MessengerButtonProps {
  facebookUsername?: string;
  zaloPhone?: string;
}

export default function MessengerButton({
  facebookUsername = process.env.NEXT_PUBLIC_MESSENGER_USERNAME || 'datntd01',
  zaloPhone = process.env.NEXT_PUBLIC_ZALO_PHONE || '0983877462',
}: MessengerButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('messenger_tooltip_dismissed');
      if (!dismissed) {
        setShowTooltip(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('messenger_tooltip_dismissed', 'true');
    } catch {}
  };

  const messengerUrl = `https://m.me/${facebookUsername}`;
  const zaloUrl = `https://zalo.me/${zaloPhone}`;

  return (
    <aside
      className="dev-messenger-widget"
      aria-label="Liên hệ trực tiếp qua Zalo và Facebook Messenger"
    >
      {/* Speech Bubble Tooltip */}
      {showTooltip && !isDismissed && (
        <div className="dev-messenger-tooltip" role="tooltip">
          <div className="dev-messenger-tooltip-content">
            <span className="dev-messenger-tooltip-badge">Trực tuyến</span>
            <p className="dev-messenger-tooltip-text">
              Nhắn tin qua <strong>Zalo</strong> hoặc <strong>Messenger</strong> 👋
            </p>
          </div>
          <button
            type="button"
            className="dev-messenger-tooltip-close"
            onClick={handleDismissTooltip}
            aria-label="Đóng thông báo"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Vertical Stack: Zalo + Messenger */}
      <div className="dev-floating-actions">
        {/* Floating Zalo Circle Button */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="dev-zalo-btn"
          onClick={() => trackContactClick('zalo')}
          aria-label={`Nhắn tin qua Zalo (${zaloPhone})`}
          title={`Liên hệ Zalo: ${zaloPhone}`}
        >
          <span className="dev-zalo-pulse" aria-hidden="true" />
          <svg
            className="dev-zalo-icon"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M24 6C13.506 6 5 13.387 5 22.5c0 4.655 2.238 8.854 5.834 11.839-.248 2.41-1.367 4.716-2.548 6.135-.322.387-.062.98.442.968 3.214-.074 6.727-1.153 9.18-2.61C19.812 39.266 21.86 39.5 24 39.5c10.494 0 19-7.387 19-16.5S34.494 6 24 6Z"
              fill="#FFFFFF"
            />
            <text
              x="24"
              y="27"
              textAnchor="middle"
              fill="#0068FF"
              fontFamily="Arial, Helvetica, sans-serif"
              fontWeight="800"
              fontSize="13.5"
              letterSpacing="-0.4"
            >
              Zalo
            </text>
          </svg>
        </a>

        {/* Floating Messenger Circle Button */}
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="dev-messenger-btn"
          onClick={() => trackContactClick('messenger')}
          aria-label="Mở cuộc trò chuyện trên Facebook Messenger"
          title="Nhắn tin với Nguyễn Tiến Đạt qua Messenger"
        >
          <span className="dev-messenger-online-pulse" aria-hidden="true" />
          <FaFacebookMessenger className="dev-messenger-icon" />
        </a>
      </div>
    </aside>
  );
}
