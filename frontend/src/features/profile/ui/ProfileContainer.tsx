import React, { useEffect, useState } from 'react';

import { ProfileView } from './ProfileView';
import type { ApiHealth } from '../model/types';

type ProfileContainerProps = {
  isPWA: boolean;
};

export function ProfileContainer(props: ProfileContainerProps) {
  const [apiHealth, setApiHealth] = useState<ApiHealth>('checking');

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        // Health endpoint is public (no auth). Do not use apiRequest here,
        // because apiRequest can trigger token refresh flow on 401.
        const res = await fetch('/health', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        setApiHealth('healthy');
      } catch (error) {
        setApiHealth('unhealthy');
        console.warn('API is unavailable, using fallback data');
      }
    };

    void checkApiHealth();
  }, []);

  return (
    <ProfileView
      apiHealth={apiHealth}
      isPWA={props.isPWA}
      initials="У"
      name="АБД"
      email="user@example.com"
      version="1.0.0"
    />
  );
}
