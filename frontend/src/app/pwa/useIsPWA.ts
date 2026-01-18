import { useEffect, useState } from 'react';

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      ) {
        setIsPWA(true);
      }
    };

    checkPWA();
  }, []);

  return isPWA;
}
