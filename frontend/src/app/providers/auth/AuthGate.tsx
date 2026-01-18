import React from 'react';
import { useAuth } from './AuthContext';
import { Login, Register } from '../../../pages/auth';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, currentUser } = useAuth();
  const [mode, setMode] = React.useState<'login' | 'register'>('login');

  if (!token || !currentUser) {
    return mode === 'login' ? (
      <Login onSwitch={() => setMode('register')} />
    ) : (
      <Register onSwitch={() => setMode('login')} />
    );
  }

  return <>{children}</>;
}
