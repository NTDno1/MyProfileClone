import React, { useState, useEffect } from 'react';
import { FaFacebookMessenger } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

interface MessengerButtonProps {
  facebookUsername?: string;
}

export default function MessengerButton({
  facebookUsername = process.env.NEXT_PUBLIC_MESSENGER_USERNAME || 'datntd01',
}: MessengerButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show gentle greeting tooltip after 2.5 seconds
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

  return (
    <aside
      className="dev-messenger-widget"
      aria-label="Nhắn tin qua Facebook Messenger"
    >
      {/* Speech Bubble Tooltip */}
      {showTooltip && !isDismissed && (
        <div className="dev-messenger-tooltip" role="tooltip">
          <div className="dev-messenger-tooltip-content">
            <span className="dev-messenger-tooltip-badge">Trực tuyến</span>
            <p className="dev-messenger-tooltip-text">
              Nhắn tin trực tiếp qua <strong>Messenger</strong> 👋
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

      {/* Floating Messenger Circle Button */}
      <a
        href={messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="dev-messenger-btn"
        aria-label="Mở cuộc trò chuyện trên Facebook Messenger"
        title="Nhắn tin với Nguyễn Tiến Đạt qua Messenger"
      >
        <span className="dev-messenger-online-pulse" aria-hidden="true" />
        <FaFacebookMessenger className="dev-messenger-icon" />
      </a>
    </aside>
  );
}

