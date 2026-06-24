import React from 'react'
import {
  LayoutGrid,
  CheckCircle,
  Clock,
  TrendingUp,
  Image,
  Star,
  Layers,
} from 'lucide-react'
import MetricCard from './MetricCard'
import { MetricsData } from '../Dashboard'

interface MetricsProps {
  metrics: MetricsData
}

const Metrics: React.FC<MetricsProps> = ({ metrics }) => (
  <div className="grid grid-cols-4 divide-x-2 divide-gray-200">
    {/* Total Posts — primary large metric */}
    <div className="pl-1 py-1">
      <div className="flex flex-col items-start gap-3">
        <div className="bg-[#EBF5FF] p-2 rounded-full">
          <LayoutGrid className="w-5 h-5 text-[#0081F1]" />
        </div>
        <div className="flex items-start justify-start gap-1 flex-col">
          <p className="xl:text-base text-sm text-[#0081F1] font-medium">Total Posts</p>
          <p className="text-2xl font-bold text-[#0081F1] font-notoSans">{metrics.totalPosts}</p>
        </div>
      </div>
    </div>

    <div className="flex items-start justify-between flex-col w-full">
      <MetricCard
        title="Completed"
        mainValue={metrics.completed}
        icon={<CheckCircle className="w-5 h-5" />}
        bgColor="bg-[#E8FAF0]"
        iconColor="text-[#00A957]"
      />
      <MetricCard
        title="Pending"
        mainValue={metrics.pending}
        icon={<Clock className="w-5 h-5" />}
        bgColor="bg-[#FFF8E8]"
        iconColor="text-amber-500"
      />
    </div>

    <div className="flex items-start justify-between flex-col w-full">
      <MetricCard
        title="Success Rate"
        mainValue={metrics.successRate}
        icon={<TrendingUp className="w-5 h-5" />}
        bgColor="bg-[#e8efff]"
        iconColor="text-blue-600"
      />
      <MetricCard
        title="Media Files"
        mainValue={metrics.mediaFiles}
        icon={<Image className="w-5 h-5" />}
        bgColor="bg-[#f6edff]"
        iconColor="text-purple-500"
      />
    </div>

    <div className="flex items-start justify-between flex-col w-full">
      <MetricCard
        title="Top Platform"
        mainValue={metrics.topPlatform}
        icon={<Star className="w-5 h-5" />}
        bgColor="bg-[#ffeded]"
        iconColor="text-red-500"
      />
      <MetricCard
        title="Platforms Used"
        mainValue={metrics.platforms}
        icon={<Layers className="w-5 h-5" />}
        bgColor="bg-[#E8FAF0]"
        iconColor="text-[#00A957]"
      />
    </div>
  </div>
)

export default Metrics
