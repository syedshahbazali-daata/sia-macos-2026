import React from 'react'
import { CheckCircle, Clock, TrendingUp, Image, Star, LayoutGrid } from 'lucide-react'
import MetricCard from './MetricCard'
import { MetricsData } from '../Dashboard'

interface MetricsProps {
  metrics: MetricsData
}

const Metrics: React.FC<MetricsProps> = ({ metrics }) => (
  <div className="grid grid-cols-6 divide-x-2 divide-gray-200">
    {/* Total posts — primary blue metric */}
    <div className="pl-1 py-1">
      <div className="flex flex-col items-start gap-3">
        <div className="bg-[#EBF5FF] p-2 rounded-full">
          <LayoutGrid className="w-5 h-5 text-[#0081F1]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="xl:text-base text-sm text-[#0081F1] font-medium">Total Posts</p>
          <p className="text-2xl font-bold text-[#0081F1] font-notoSans">{metrics.total}</p>
        </div>
      </div>
    </div>

    {/* Completed */}
    <MetricCard
      title="Completed"
      mainValue={String(metrics.completed)}
      icon={<CheckCircle className="w-5 h-5" />}
      bgColor="bg-[#E8FAF0]"
      iconColor="text-[#00A957]"
    />

    {/* Pending */}
    <MetricCard
      title="Pending"
      mainValue={String(metrics.pending)}
      icon={<Clock className="w-5 h-5" />}
      bgColor="bg-[#FFF8E8]"
      iconColor="text-amber-500"
    />

    {/* Success rate */}
    <MetricCard
      title="Success Rate"
      mainValue={`${metrics.successRate}%`}
      icon={<TrendingUp className="w-5 h-5" />}
      bgColor="bg-[#e8efff]"
      iconColor="text-blue-600"
    />

    {/* Total media */}
    <MetricCard
      title="Media Files"
      mainValue={String(metrics.totalMedia)}
      icon={<Image className="w-5 h-5" />}
      bgColor="bg-[#f6edff]"
      iconColor="text-purple-500"
    />

    {/* Most active platform */}
    <MetricCard
      title="Top Platform"
      mainValue={metrics.mostActive || '—'}
      icon={<Star className="w-5 h-5" />}
      bgColor="bg-[#ffeded]"
      iconColor="text-red-500"
    />
  </div>
)

export default Metrics
