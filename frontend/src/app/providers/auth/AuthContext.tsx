import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  currentUser: User | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = '/api';

/**
 * Проверяет, истекает ли JWT токен или скоро истечёт (менее 5 минут до exp).
 * @param token JWT токен
 * @returns true, если токен истёк или скоро истечёт
 */
function isTokenExpiredOrExpiring(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return false;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    // Если токен уже истёк или истечёт через меньше 5 минут
    return exp - nowSeconds < fiveMinutes;
  } catch (e) {
    // Не смогли распарсить — считаем невалидным
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refresh_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (jwtToken: string) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('unauthorized');
    }

    if (!res.ok) {
      throw new Error('temporary_error');
    }

    const user: User = await res.json();
    setCurrentUser(user);
  };

  // Обновить access token через refresh
  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      if (!res.ok) {
        logout();
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token ?? refreshToken;

      localStorage.setItem('access_token', newAccessToken);
      localStorage.setItem('refresh_token', newRefreshToken);
      setToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      return newAccessToken;
    } catch (err) {
      logout();
      return null;
    }
  };

  // Логин с access + refresh токенами
  const login = async (accessToken: string, newRefreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    await fetchMe(accessToken);
  };

  // Логаут
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
  };

  // Подтягиваем пользователя при старте, если access token есть
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // Проверяем, не истёк ли токен или скоро истечёт
      if (isTokenExpiredOrExpiring(token)) {
        console.log('[AuthContext] Token expired or expiring soon, refreshing...');
        const newToken = await refreshAccessToken();
        if (!newToken) {
          setLoading(false);
          return;
        }
        // Используем новый токен для fetchMe
        try {
          await fetchMe(newToken);
        } catch (err) {
          if ((err as Error).message === 'unauthorized') logout();
          console.error('fetchMe error after refresh:', err);
        }
        setLoading(false);
        return;
      }

      // Токен ещё действителен, используем его
      try {
        await fetchMe(token);
      } catch (err) {
        if ((err as Error).message === 'unauthorized') logout();
        console.error('fetchMe error:', err);
      }
      setLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ token, refreshToken, currentUser, login, logout, refreshAccessToken }}>
      {!loading ? children : <div className="min-h-screen center-vertical"><p>Загрузка...</p></div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
