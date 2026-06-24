import { Card } from '@renderer/components/ui/card'
import { Info } from 'lucide-react'
import React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataPoint } from '../Dashboard'

interface DashboardChartProps {
  chartData?: DataPoint[]
}

const DashboardChart: React.FC<DashboardChartProps> = ({ chartData }) => {
  return (
    <Card className="col-span-9 bg-white">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="xl:text-lg text-sm font-medium text-gray-900">Posts activity</h2>
            <div className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center">
              <Info size={12} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div className="xl:h-[18rem] h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                dx={-10}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: 'none',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [value, 'Posts']}
              />
              <Area
                type="monotone"
                dataKey="posts"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorPosts)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

export default DashboardChart
