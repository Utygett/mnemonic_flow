import React, { useState } from 'react';

import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button/Button';

import { useAuth } from '@/app/providers/auth/AuthContext';
import { login as loginApi } from '@/shared/api/auth-client';

import styles from './Login.module.css';

type Mode = 'login' | 'forgot';

export function Login({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const data = await loginApi(email, password);
      await login(data.access_token, data.refresh_token);
    } catch (e: unknown) {
      console.error('Login error:', e);
      const msg = e instanceof Error ? e.message : 'Ошибка входа';
      setError(msg || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const rawText = await res.text();
      let payload: any = null;
      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msg =
          payload?.detail?.message ?? payload?.detail ?? rawText ?? 'Не удалось отправить ссылку';
        setError(String(msg));
        return;
      }

      setInfo('Если этот email существует, на него отправлена ссылка для сброса пароля.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{mode === 'login' ? 'Вход' : 'Восстановление пароля'}</h1>

        {error && <div className={styles.messageError}>{error}</div>}
        {info && <div className={styles.messageInfo}>{info}</div>}

        <Input label="Email" value={email} onChange={setEmail} />

        {mode === 'login' && (
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <Input label="Пароль" type="password" value={password} onChange={setPassword} />

            <Button variant="primary" size="large" fullWidth disabled={loading} type="submit">
              {loading ? 'Входим...' : 'Войти'}
            </Button>

            <button
              onClick={() => {
                setMode('forgot');
                setError(null);
                setInfo(null);
              }}
              className={styles.linkBtn}
              type="button"
              disabled={loading}
            >
              Забыли пароль?
            </button>

            <button onClick={onSwitch} className={styles.linkBtn} type="button" disabled={loading}>
              Нет аккаунта? Зарегистрироваться
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleForgot();
            }}
          >
            <Button variant="primary" size="large" fullWidth disabled={loading} type="submit">
              {loading ? 'Отправляем...' : 'Отправить ссылку'}
            </Button>

            <button
              onClick={() => {
                setMode('login');
                setError(null);
                setInfo(null);
              }}
              className={styles.linkBtn}
              type="button"
              disabled={loading}
            >
              Вернуться ко входу
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
