'use client'

import * as RechartsPrimitive from 'recharts'

export interface DonutChartData {
  name: string
  value: number
  fill: string
}

export interface DonutChartProps {
  data: DonutChartData[]
  innerRadius?: number | string
  outerRadius?: number | string
  onSectorClick?: (sector: string) => void
}

export function DonutChart({
  data,
  innerRadius = '60%',
  outerRadius = '80%',
  onSectorClick,
}: DonutChartProps) {
  return (
    <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
      <RechartsPrimitive.PieChart>
        <RechartsPrimitive.Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={0}
          dataKey="value"
          onClick={data => onSectorClick?.(data.name)}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry, index) => (
            <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </RechartsPrimitive.Pie>
      </RechartsPrimitive.PieChart>
    </RechartsPrimitive.ResponsiveContainer>
  )
}
