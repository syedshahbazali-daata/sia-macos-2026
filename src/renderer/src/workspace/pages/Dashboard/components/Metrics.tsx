// Metrics.tsx
import React from 'react';
import {
  CircleDollarSign,
  Zap,
  Lightbulb,
  File,
  Users,
  MessageCircleCode,
  Podcast,
} from 'lucide-react';
import MetricCard from './MetricCard';

export type MetricsData = {
  totalEarnings: string;
  subscriptions: string;
  tips: string;
  points: string;
  referrals: string;
  messages: string;
  streams: string;
};

interface MetricsProps {
  metrics: MetricsData;
}

const Metrics: React.FC<MetricsProps> = ({ metrics }) => (
  <div className="grid grid-cols-4 divide-x-2 divide-gray-200">
    <div className="pl-1 py-1">
      <div className="flex flex-col items-start gap-3">
        <div className="bg-[#EBF5FF] p-2 rounded-full">
          <CircleDollarSign className="w-5 h-5 text-[#0081F1]" />
        </div>
        <div className="flex items-start justify-start gap-1 flex-col">
          <p className="xl:text-base text-sm text-[#0081F1] font-medium">Total earnings</p>
          <p className="text-2xl font-bold text-[#0081F1] font-notoSans">{metrics.totalEarnings}</p>
        </div>
      </div>
    </div>
    <div className="flex items-start justify-between flex-col w-full">
      <MetricCard
        title="Subscriptions"
        mainValue={metrics.subscriptions}
        icon={<Zap className="w-5 h-5" />}
        bgColor="bg-[#E8FAF0]"
        iconColor="text-[#00A957]"
      />
      <MetricCard
        title="Tips"
        mainValue={metrics.tips}
        icon={<Lightbulb className="w-5 h-5" />}
        bgColor="bg-[#e8efff]"
        iconColor="text-blue-600"
      />
    </div>
    <div className="flex items-start justify-between flex-col w-full">
      <MetricCard
        title="Points"
        mainValue={metrics.points}
        icon={<File className="w-5 h-5" />}
        bgColor="bg-[#E8FAF0]"
        iconColor="text-[#00A957]"
      />
      <MetricCard
        title="Referrals"
        mainValue={metrics.referrals}
        icon={<Users className="w-5 h-5" />}
        bgColor="bg-[#ffeded]"
        iconColor="text-red-600"
      />
    </div>
    <div className="flex items-start justify-between flex-col w-full">
      <MetricCard
        title="Messages"
        mainValue={metrics.messages}
        icon={<MessageCircleCode className="w-5 h-5" />}
        bgColor="bg-[#f6edff]"
        iconColor="text-purple-500"
      />
      <MetricCard
        title="Streams"
        mainValue={metrics.streams}
        icon={<Podcast className="w-5 h-5" />}
        bgColor="bg-[#e8efff]"
        iconColor="text-blue-600"
      />
    </div>
  </div>
);

export default Metrics;
