import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { RatingDistribution } from '@/entities/statistics/model/types'

interface RatingDistributionChartProps {
  ratingDistribution: RatingDistribution
}

const RATING_COLORS = {
  again: '#ff6b6b', // red
  hard: '#ffa94d', // orange
  good: '#51cf66', // green
  easy: '#339af0', // blue
}

const RATING_LABELS = {
  again: 'Снова',
  hard: 'Сложно',
  good: 'Хорошо',
  easy: 'Легко',
}

export function RatingDistributionChart({ ratingDistribution }: RatingDistributionChartProps) {
  const data = [
    { name: RATING_LABELS.again, value: ratingDistribution.again, color: RATING_COLORS.again },
    { name: RATING_LABELS.hard, value: ratingDistribution.hard, color: RATING_COLORS.hard },
    { name: RATING_LABELS.good, value: ratingDistribution.good, color: RATING_COLORS.good },
    { name: RATING_LABELS.easy, value: ratingDistribution.easy, color: RATING_COLORS.easy },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload
      return (
        <div
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
          }}
        >
          <p style={{ margin: 0, color: 'var(--text)', fontWeight: 500 }}>{entry.name}</p>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
            {entry.value} шт.
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h3 className="statsSection__title" style={{ textAlign: 'center', marginBottom: '8px' }}>
        Распределение оценок
      </h3>
      <div style={{ height: '200px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={60}
              layout="vertical"
              align="right"
              iconType="circle"
              formatter={(value: any, entry: any) => (
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {entry.name}: {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
