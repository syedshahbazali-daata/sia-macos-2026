import { Card } from '@renderer/components/ui/card'
import { Info } from 'lucide-react'
import React from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { PlatformDataPoint } from '../Dashboard'

interface PlatformChartProps {
  data: PlatformDataPoint[]
}

const PlatformChart: React.FC<PlatformChartProps> = ({ data }) => {
  const isEmpty = data.length === 0

  return (
    <Card className="bg-white">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="xl:text-lg text-sm font-medium text-gray-900">Platform breakdown</h2>
          <div className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center">
            <Info size={12} className="text-gray-400" />
          </div>
        </div>

        {isEmpty ? (
          <div className="flex items-center justify-center h-28 text-gray-400 text-sm">
            No posts yet
          </div>
        ) : (
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#374151' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: 'none',
                    borderRadius: '0.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value, 'Posts']}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={14}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  )
}

export default PlatformChart
