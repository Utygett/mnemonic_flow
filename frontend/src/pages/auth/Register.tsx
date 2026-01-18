import React, { useState } from 'react';

import { Input } from '../../shared/ui/Input';
import { Button } from '../../shared/ui/Button/Button';

import { register as registerApi } from '../../shared/api/auth-client';

import styles from './Register.module.css';

export function Register({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      const data = await registerApi(email, password);

      setInfo(data?.message ?? 'Регистрация успешна. Подтвердите email и затем войдите.');
      setPassword('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка регистрации';
      setError(msg || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Регистрация</h1>

        {error && <div className={styles.messageError}>{error}</div>}
        {info && <div className={styles.messageInfo}>{info}</div>}

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Input label="Email" type="email" value={email} onChange={setEmail} disabled={loading} />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={setPassword}
            disabled={loading}
          />

          <Button variant="primary" size="large" fullWidth disabled={loading} type="submit">
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </Button>

          <button onClick={onSwitch} className={styles.linkBtn} type="button" disabled={loading}>
            Уже есть аккаунт? Войти
          </button>
        </form>
      </div>
    </div>
  );
}
