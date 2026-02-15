import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import { Button } from '../../../shared/ui/Button/Button'
import { LevelIndicator } from '../../../shared/ui/LevelIndicator'

import styles from './OnboardingPage.module.css'

interface OnboardingPageProps {
  onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Добро пожаловать в MnemonicFlow',
      description: 'Учитесь эффективно с карточками, которые растут вместе с вами',
      image: '📚',
    },
    {
      title: 'Уровни мастерства',
      description: 'Каждая карточка проходит путь от знакомства до полного освоения',
      image: '🎯',
    },
    {
      title: 'Начните прямо сейчас',
      description: 'Создайте свою или выберите первую колоду и начните путь к знаниям',
      image: '🚀',
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  return (
    <div className={styles.page}>
      {/* Контент */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={styles.stepCard}
            >
              <div className={styles.image}>{steps[currentStep].image}</div>

              <h1 className={styles.title}>{steps[currentStep].title}</h1>

              <p className={styles.description}>{steps[currentStep].description}</p>

              {/* Level Demo (только на шаге 1) */}
              {currentStep === 1 && (
                <div className={styles.demo}>
                  <div className={styles.levelList}>
                    {[0, 1, 2, 3].map(level => (
                      <div key={level} className={styles.levelRow}>
                        <span className={styles.levelLabel}>Уровень {level}</span>
                        <LevelIndicator currentLevel={level as 0 | 1 | 2 | 3} size="medium" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.dots}>
            {steps.map((_, index) => (
              <div
                key={index}
                className={index === currentStep ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              />
            ))}
          </div>

          <div className={styles.buttonContainer}>
            <Button onClick={handleNext} variant="primary" size="large" fullWidth>
              {currentStep < steps.length - 1 ? 'Далее' : 'Начать'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
