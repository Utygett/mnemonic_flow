import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/shared/ui/Button/Button'
import { apiRequest, ApiError } from '@/shared/api'
import { useAuth } from '@/app/providers/auth/AuthContext'
import { searchPublicDecks } from '@/entities/deck'
import type { PublicDeckSummary } from '@/entities/deck'

import type { AddDeckProps } from '../model/types'

import styles from './AddDeck.module.css'

async function addDeckToGroupCompat(groupId: string, deckId: string): Promise<void> {
  // Try common REST shapes.
  try {
    await apiRequest<void>(`/groups/${groupId}/decks/${deckId}`, { method: 'POST' })
    return
  } catch (e: any) {
    if (!(e instanceof ApiError) || e.status !== 404) throw e
  }

  await apiRequest<void>(`/groups/${groupId}/decks`, {
    method: 'POST',
    body: JSON.stringify({ deck_id: deckId }),
  })
}

async function removeDeckFromGroupCompat(groupId: string, deckId: string): Promise<void> {
  try {
    await apiRequest<void>(`/groups/${groupId}/decks/${deckId}`, { method: 'DELETE' })
    return
  } catch (e: any) {
    if (!(e instanceof ApiError) || e.status !== 404) throw e
  }

  const qs = new URLSearchParams({ deck_id: deckId })
  await apiRequest<void>(`/groups/${groupId}/decks?${qs.toString()}`, { method: 'DELETE' })
}

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

  const [groupDeckIds, setGroupDeckIds] = useState<Set<string>>(() => new Set(initialGroupDeckIds))

  const { currentUser } = useAuth()

  const filteredDecks = useMemo(
    () => decks.filter(d => d.owner_id !== currentUser?.id),
    [decks, currentUser]
  )

  // если родитель может менять initialGroupDeckIds (например, после рефреша группы)
  useEffect(() => {
    setGroupDeckIds(new Set(initialGroupDeckIds))
  }, [initialGroupDeckIds])

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setHasMore(true)
    }, 400)

    return () => clearTimeout(t)
  }, [searchQuery])

  // загрузка
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

      const currentOffset = decks.length

      const data = await searchPublicDecks({
        q: debouncedQuery,
        limit,
        offset: currentOffset,
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
    try {
      await addDeckToGroupCompat(groupId, deckId)
      setGroupDeckIds(prev => new Set(prev).add(deckId))
      onChanged?.(deckId, 'added')
    } catch (e: any) {
      alert(`Ошибка: ${e?.message ?? 'не удалось добавить колоду в группу'}`)
    }
  }

  const handleRemove = async (deckId: string) => {
    try {
      await removeDeckFromGroupCompat(groupId, deckId)
      setGroupDeckIds(prev => {
        const next = new Set(prev)
        next.delete(deckId)
        return next
      })
      onChanged?.(deckId, 'removed')
    } catch (e: any) {
      alert(`Ошибка: ${e?.message ?? 'не удалось удалить колоду из группы'}`)
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

              return (
                <div key={deck.deck_id} className={styles.card}>
                  <div className={styles.info}>
                    <h3 className={styles.deckTitle}>{deck.title}</h3>
                    {deck.description ? (
                      <div className={styles.deckMeta}>{deck.description}</div>
                    ) : null}
                  </div>

                  {!inGroup ? (
                    <Button onClick={() => handleAdd(deck.deck_id)} variant="primary" size="small">
                      <Plus size={16} />
                      Добавить
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleRemove(deck.deck_id)}
                      variant="secondary"
                      size="small"
                    >
                      <Trash2 size={16} />
                      Удалить
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
