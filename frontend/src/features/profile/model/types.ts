export type ApiHealth = 'healthy' | 'unhealthy' | 'checking';

export type ProfileViewProps = {
  apiHealth: ApiHealth;
  isPWA: boolean;

  // пока захардкожено как было, но уже через props
  initials: string;
  name: string;
  email: string;
  version: string;
};
