import { Card } from '@renderer/components/ui/card'
import { Info } from 'lucide-react'
import React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DataPoint } from '../Dashboard'

interface DashboardChartProps {
  chartData: DataPoint[]
  period: string
}

const xLabel: Record<string, string> = {
  Yesterday: 'Hour',
  Today: 'Hour',
  'This week': 'Day',
  'This month': 'Day of month',
}

const DashboardChart: React.FC<DashboardChartProps> = ({ chartData, period }) => {
  const hasData = chartData.some((d) => d.posts > 0)

  return (
    <Card className="bg-white">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="xl:text-lg text-sm font-medium text-gray-900">Posts activity</h2>
            <div className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center">
              <Info size={12} className="text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">— {xLabel[period] ?? 'Date'}</span>
          </div>
          {!hasData && (
            <span className="text-xs text-gray-400">No posts scheduled for this period</span>
          )}
        </div>

        <div className="xl:h-[12rem] h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                dy={10}
                interval={period === 'This month' ? 4 : 'preserveStartEnd'}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                dx={-10}
                allowDecimals={false}
                width={30}
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
              />
              <Area
                type="monotone"
                dataKey="posts"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorPosts)"
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

export default DashboardChart
