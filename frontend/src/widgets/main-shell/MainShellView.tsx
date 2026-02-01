import React from 'react'

import { BottomNav } from '@/widgets/bottom-nav'
import { InstallPrompt } from '@/shared/pwa/InstallPrompt'

import { OfflineStatus } from '@/app/overlays/OfflineStatus'
import { PWAUpdatePrompt } from '@/app/overlays/PWAUpdatePrompt'

import type { MainShellViewProps } from './mainShell.types'

export function MainShellView(props: MainShellViewProps) {
  return (
    <div className="relative">
      <PWAUpdatePrompt />
      <OfflineStatus />

      {props.content}

      {!props.hideBottomNav && (
        <BottomNav activeTab={props.activeTab} onTabChange={props.onTabChange} />
      )}
      <InstallPrompt />
    </div>
  )
}
