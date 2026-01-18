// src/shared/lib/utils/session-store.ts
import type { StudyCard } from '@/entities/card';

const STORAGE_KEY = 'mnemonicflow:sessions:v1';

export type SessionKey = `deck:${string}` | 'review';

export type PersistedSession = {
  key: SessionKey;
  mode: 'deck' | 'review';
  activeDeckId: string | null;
  deckCards: StudyCard[];
  currentIndex: number;
  isStudying: boolean;
  savedAt: number;
};

type SessionsStore = {
  lastActiveKey?: SessionKey;
  sessions: Record<string, PersistedSession>;
};

const loadStore = (): SessionsStore => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { sessions: {} };
  try {
    return JSON.parse(raw) as SessionsStore;
  } catch {
    return { sessions: {} };
  }
};

const saveStore = (store: SessionsStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const makeSessionKey = (mode: 'deck' | 'review', deckId: string | null): SessionKey =>
  mode === 'deck' && deckId ? (`deck:${deckId}` as const) : 'review';

export const saveSession = (s: PersistedSession) => {
  const store = loadStore();
  store.sessions[s.key] = s;
  store.lastActiveKey = s.key;
  saveStore(store);
};

export const loadLastSession = (): PersistedSession | null => {
  const store = loadStore();
  const k = store.lastActiveKey;
  return k ? (store.sessions[k] ?? null) : null;
};

export const clearSession = (key: SessionKey) => {
  const store = loadStore();
  delete store.sessions[key];
  if (store.lastActiveKey === key) delete store.lastActiveKey;
  saveStore(store);
};

export const loadSession = (key: SessionKey): PersistedSession | null => {
  const store = loadStore();
  return store.sessions[key] ?? null;
};
