import React, { useEffect, useState } from 'react';

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-status">
      <div className="offline-status__inner">
        <div className="pulse-dot" />
        <span style={{ color: '#FF9A76' }}>Работаем в офлайн-режиме</span>
      </div>
    </div>
  );
}
