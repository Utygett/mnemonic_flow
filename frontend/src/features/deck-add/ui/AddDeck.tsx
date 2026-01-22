import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/shared/ui/Button/Button'
import { useAuth } from '@/app/providers/auth/AuthContext'
import { searchPublicDecks } from '@/entities/deck'
import { addDeckToGroup, removeDeckFromGroup } from '@/entities/group'
import type { PublicDeckSummary } from '@/entities/deck'

import type { AddDeckProps } from '../model/types'

import styles from './AddDeck.module.css'

export const AddDeck = ({
  groupId,
  initialGroupDeckIds = [],
  onClose,
  onChanged,
}: AddDeckProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const [decks, setDecks] = useState<PublicDeckSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const limit = 20
  const [hasMore, setHasMore] = useState(true)

  const madeLocalChanges = useRef(false)

  const [groupDeckIds, setGroupDeckIds] = useState<Set<string>>(() => new Set(initialGroupDeckIds))

  const [pendingDeckIds, setPendingDeckIds] = useState<Set<string>>(new Set())

  const { currentUser } = useAuth()

  const filteredDecks = useMemo(
    () => decks.filter(d => d.owner_id !== currentUser?.id),
    [decks, currentUser]
  )

  const initialIdsKey = JSON.stringify(initialGroupDeckIds.slice().sort())

  useEffect(() => {
    if (madeLocalChanges.current) return
    setGroupDeckIds(new Set(initialGroupDeckIds))
  }, [initialIdsKey])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setHasMore(true)
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await searchPublicDecks({
          q: debouncedQuery,
          limit,
          offset: 0,
        })

        if (cancelled) return

        setDecks(data)
        setHasMore(data.length === limit)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message ?? 'Ошибка загрузки колод')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const loadMore = async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      setError(null)

      const data = await searchPublicDecks({
        q: debouncedQuery,
        limit,
        offset: decks.length,
      })

      setDecks(prev => [...prev, ...data])
      setHasMore(data.length === limit)
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка загрузки колод')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (deckId: string) => {
    if (pendingDeckIds.has(deckId)) return

    setPendingDeckIds(prev => new Set(prev).add(deckId))

    try {
      await addDeckToGroup(groupId, deckId)

      madeLocalChanges.current = true

      setGroupDeckIds(prev => {
        const next = new Set(prev)
        next.add(deckId)
        return next
      })

      await onChanged?.(deckId, 'added')
    } catch (e: any) {
      alert(`Ошибка: ${e?.message ?? 'не удалось добавить колоду в группу'}`)
    } finally {
      setPendingDeckIds(prev => {
        const next = new Set(prev)
        next.delete(deckId)
        return next
      })
    }
  }

  const handleRemove = async (deckId: string) => {
    if (pendingDeckIds.has(deckId)) return

    setPendingDeckIds(prev => new Set(prev).add(deckId))

    try {
      await removeDeckFromGroup(groupId, deckId)

      madeLocalChanges.current = true

      setGroupDeckIds(prev => {
        const next = new Set(prev)
        next.delete(deckId)
        return next
      })

      await onChanged?.(deckId, 'removed')
    } catch (e: any) {
      alert(`Ошибка: ${e?.message ?? 'не удалось удалить колоду из группы'}`)
    } finally {
      setPendingDeckIds(prev => {
        const next = new Set(prev)
        next.delete(deckId)
        return next
      })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Колоды группы</h2>
        <Button onClick={onClose} variant="secondary" size="small">
          Закрыть
        </Button>
      </div>

      <div className={styles.search}>
        <Search className={styles.searchIcon} size={20} />
        <input
          type="text"
          placeholder="Поиск публичных колод..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {loading && decks.length === 0 ? (
          <div className={styles.stateText}>Загрузка...</div>
        ) : decks.length === 0 ? (
          <div className={styles.stateText}>Колоды не найдены</div>
        ) : (
          <>
            {filteredDecks.map(deck => {
              const inGroup = groupDeckIds.has(deck.deck_id)
              const isPending = pendingDeckIds.has(deck.deck_id)

              return (
                <div key={deck.deck_id} className={styles.card}>
                  <div className={styles.info}>
                    <h3 className={styles.deckTitle}>{deck.title}</h3>
                    {deck.description ? (
                      <div className={styles.deckMeta}>{deck.description}</div>
                    ) : null}
                  </div>

                  {!inGroup ? (
                    <Button
                      onClick={() => handleAdd(deck.deck_id)}
                      variant="primary"
                      size="small"
                      disabled={isPending}
                    >
                      <Plus size={16} />
                      {isPending ? 'Добавление...' : 'Добавить'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleRemove(deck.deck_id)}
                      variant="secondary"
                      size="small"
                      disabled={isPending}
                    >
                      <Trash2 size={16} />
                      {isPending ? 'Удаление...' : 'Удалить'}
                    </Button>
                  )}
                </div>
              )
            })}

            {hasMore && (
              <Button
                onClick={loadMore}
                variant="secondary"
                size="medium"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Загрузка...' : 'Загрузить ещё'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
