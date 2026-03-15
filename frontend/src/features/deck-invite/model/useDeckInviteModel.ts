import { useCallback, useEffect, useState } from 'react'

import { deckEditorsApi, type EditorInfo, type InviteCreateResponse } from '@/shared/api/deckEditors'
import { getErrorMessage } from '@/shared/lib/errors/getErrorMessage'

import type { DeckInviteProps } from './types'

export type DeckInviteViewModel = {
  // invite generation
  invite: InviteCreateResponse | null
  loadingInvite: boolean
  inviteError: string | null
  generateInvite: () => Promise<void>
  copyLink: () => void
  copied: boolean

  // editors list
  editors: EditorInfo[]
  loadingEditors: boolean
  removeEditor: (userId: string) => Promise<void>
}

export function useDeckInviteModel({ deckId, onClose }: DeckInviteProps): DeckInviteViewModel {
  const [invite, setInvite] = useState<InviteCreateResponse | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [editors, setEditors] = useState<EditorInfo[]>([])
  const [loadingEditors, setLoadingEditors] = useState(false)

  // Load editors list on mount
  useEffect(() => {
    ;(async () => {
      setLoadingEditors(true)
      try {
        const list = await deckEditorsApi.listEditors(deckId)
        setEditors(list)
      } catch {
        // non-critical — just show empty list
      } finally {
        setLoadingEditors(false)
      }
    })()
  }, [deckId])

  const generateInvite = useCallback(async () => {
    setLoadingInvite(true)
    setInviteError(null)
    try {
      const data = await deckEditorsApi.createInvite(deckId)
      setInvite(data)
    } catch (e) {
      setInviteError(getErrorMessage(e))
    } finally {
      setLoadingInvite(false)
    }
  }, [deckId])

  const copyLink = useCallback(() => {
    if (!invite) return
    navigator.clipboard.writeText(invite.invite_url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [invite])

  const removeEditor = useCallback(
    async (userId: string) => {
      try {
        await deckEditorsApi.removeEditor(deckId, userId)
        setEditors(prev => prev.filter(e => e.user_id !== userId))
      } catch (e) {
        console.error('removeEditor failed:', getErrorMessage(e))
      }
    },
    [deckId],
  )

  return {
    invite,
    loadingInvite,
    inviteError,
    generateInvite,
    copyLink,
    copied,
    editors,
    loadingEditors,
    removeEditor,
  }
}
