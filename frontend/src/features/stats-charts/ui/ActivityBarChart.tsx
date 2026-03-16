import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ActivityChartEntry } from '@/entities/statistics/model/types'

interface ActivityBarChartProps {
  data: ActivityChartEntry[]
}

export function ActivityBarChart({ data }: ActivityBarChartProps) {
  // Format date for display
  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
        >
          <p style={{ margin: 0, color: 'var(--text)' }}>{formatXAxisLabel(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color, fontSize: '12px' }}>
              {entry.name}: {entry.value} мин
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxisLabel}
          stroke="var(--text-muted)"
          fontSize={11}
        />
        <YAxis stroke="var(--text-muted)" fontSize={11} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="studyTimeMinutes" fill="var(--primary)" name="Время" />
      </BarChart>
    </ResponsiveContainer>
  )
}
