import React, { useEffect, useState } from 'react';

import styles from './VerifyEmailPage.module.css';

export function VerifyEmailPage({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  useEffect(() => {
    if (status !== 'ok') return;

    setSecondsLeft(5);

    const intervalId = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      window.location.hash = '/';
    }, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [status]);

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Подтверждение email</h1>
          <div className={styles.messageInfo}>Проверяем токен…</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Ошибка</h1>
          <div className={styles.messageError}>
            Неверный или истёкший токен.
          </div>
          <a href="/" className={styles.linkBtn}>
            Перейти ко входу
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Email подтверждён</h1>
        <div className={styles.messageInfo}>
          Перенаправление на вход через {secondsLeft} сек…
        </div>
        <a href="/" className={styles.linkBtn}>
          Перейти на вход сейчас
        </a>
      </div>
    </div>
  );
}
