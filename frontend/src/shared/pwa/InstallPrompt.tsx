import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Предотвращаем стандартный браузерный промпт
      e.preventDefault();
      // Сохраняем событие для использования позже
      setDeferredPrompt(e);
      // Показываем наш кастомный промпт
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Показываем промпт установки
    deferredPrompt.prompt();

    // Ждем выбора пользователя
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response: ${outcome}`);

    // Очищаем сохраненный промпт
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="install-prompt"
        >
          <div className="install-prompt__card">
            <div className="install-prompt__row">
              <div className="install-prompt__icon">
                <Download size={24} className="text-white" />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#E8EAF0', marginBottom: '0.25rem' }}>Установить приложение</h3>
                <p style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                  Добавьте MenmonicFlow на главный экран для быстрого доступа
                </p>

                <div className="install-prompt__actions">
                  <button onClick={handleInstall} className="btn-primary small">
                    Установить
                  </button>
                  <button onClick={handleDismiss} className="btn-ghost small">
                    Позже
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                style={{ background: 'transparent', border: 0, color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
