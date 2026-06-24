import React, { useEffect, useState } from 'react'
import { Card } from '@renderer/components/ui/card'
import { Info } from 'lucide-react'
import Metrics from './components/Metrics'
import ShiftCard from './components/ShiftCard'
import DashboardChart from './components/DashboardChart'
import { storage, enums } from '@renderer/helpers/storageHelper'

const timePeriods = ['Yesterday', 'Today', 'This week', 'This month']

export type DataPoint = {
  date: string
  posts: number
}

export type MetricsData = {
  totalPosts: string
  completed: string
  pending: string
  successRate: string
  mediaFiles: string
  topPlatform: string
  platforms: string
}

interface SchedulerRecord {
  id: string
  Instance_id: string
  platform: string
  set_date: string
  set_time: string
  isScheduled: number
  description_text: string
  media_path: { filePath: string; isPaid: boolean }[]
}

const PLATFORM_DISPLAY: Record<string, string> = {
  'twitter post': 'Twitter',
  'tik tok post': 'TikTok',
  'instagram post': 'Instagram',
  'instagram story': 'Insta Story',
  'facebook': 'Facebook',
  'of post': 'OF Post',
  'of mass messaging': 'OF Msg',
  'youtube shorts': 'YouTube',
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function buildChartData(schedules: SchedulerRecord[], period: string): DataPoint[] {
  const now = new Date()

  if (period === 'Today') {
    const todayStr = toDateStr(now)
    const posts = schedules.filter((s) => s.set_date === todayStr)
    return Array.from({ length: 24 }, (_, h) => {
      const count = posts.filter((s) => parseInt(s.set_time.split(':')[0]) === h).length
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      return { date: label, posts: count }
    })
  }

  if (period === 'Yesterday') {
    const yest = new Date(now)
    yest.setDate(yest.getDate() - 1)
    const yestStr = toDateStr(yest)
    const posts = schedules.filter((s) => s.set_date === yestStr)
    return Array.from({ length: 24 }, (_, h) => {
      const count = posts.filter((s) => parseInt(s.set_time.split(':')[0]) === h).length
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      return { date: label, posts: count }
    })
  }

  if (period === 'This week') {
    const dow = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return { date: day, posts: schedules.filter((s) => s.set_date === toDateStr(d)).length }
    })
  }

  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return { date: String(day), posts: schedules.filter((s) => s.set_date === dateStr).length }
  })
}

function computeMetrics(schedules: SchedulerRecord[]): MetricsData {
  const total = schedules.length
  const completed = schedules.filter((s) => s.isScheduled === 1).length
  const pending = schedules.filter((s) => s.isScheduled === 0).length
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const totalMedia = schedules.reduce((sum, s) => sum + (s.media_path?.length ?? 0), 0)

  const platformCounts: Record<string, number> = {}
  schedules.forEach((s) => {
    const key = (s.platform || '').toLowerCase()
    platformCounts[key] = (platformCounts[key] || 0) + 1
  })
  const topKey = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const topPlatform = PLATFORM_DISPLAY[topKey] ?? topKey ?? '—'
  const platformCount = Object.keys(platformCounts).length

  return {
    totalPosts: String(total),
    completed: String(completed),
    pending: String(pending),
    successRate: `${successRate}%`,
    mediaFiles: String(totalMedia),
    topPlatform: topPlatform || '—',
    platforms: String(platformCount),
  }
}

function convertEpochToDaysHours(epochTimestamp: number): { days: number } {
  const days = Math.floor((Date.now() - epochTimestamp * 1000) / (1000 * 60 * 60 * 24))
  return { days }
}

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Today')
  const [licenseExpiry, setLicenseExpiry] = useState<{ days: number } | null>(null)
  const [schedules, setSchedules] = useState<SchedulerRecord[]>([])
  const [utcTime, setUtcTime] = useState<string>(new Date().toISOString().slice(11, 19) + ' UTC')

  const license = storage.get(enums.LICENSE)?.expiry_date?.seconds
  const instanceId = localStorage.getItem('selectedInstanceId')

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const all: SchedulerRecord[] = await window.electron.ipcRenderer.invoke('read-schedules')
        setSchedules((all || []).filter((s) => s.Instance_id === instanceId))
      } catch {
        setSchedules([])
      }
    }
    load()
  }, [instanceId])

  useEffect(() => {
    if (license) setLicenseExpiry(convertEpochToDaysHours(license))
    const intervalId = setInterval(() => {
      setUtcTime(new Date().toISOString().slice(11, 19) + ' UTC')
    }, 1000)
    return () => clearInterval(intervalId)
  }, [license])

  const metrics = computeMetrics(schedules)
  const chartData = buildChartData(schedules, selectedPeriod)

  return (
    <>
      <div className="w-full h-full p-4 flex flex-col items-center justify-center max-w-full max-h-full">
        <div className="w-full h-full mx-auto gap-4 flex flex-col items-center justify-start">
          {/* Top Section */}
          <Card className="p-4 bg-white w-full">
            {/* Header with Time Period Selector */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-baseline gap-3">
                <div className="flex items-baseline gap-2">
                  <h1 className="xl:text-xl text-base font-medium text-gray-900">
                    Overview
                  </h1>
                  <div className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center">
                    <Info size={12} className="text-gray-400" />
                  </div>
                </div>
                <div className="xl:text-sm px-2 text-[11px] font-semibold text-[#00A957]">
                  {utcTime}
                </div>
              </div>

              <div className="flex gap-2 border-[0.5px] border-gray-400 rounded-sm p-1">
                {timePeriods.map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 rounded-lg py-1.5 text-[13px] ${
                      selectedPeriod === period
                        ? 'bg-gray-100 text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Grid */}
            <Metrics metrics={metrics} />
          </Card>

          {/* Bottom Grid */}
          <div className="grid grid-cols-12 gap-4 w-full">
            <ShiftCard />
            <DashboardChart chartData={chartData} />
          </div>
        </div>

        <div>
          {licenseExpiry !== null && licenseExpiry.days * -1 <= 7 && (
            <div className="max-w-md p-4 absolute bottom-10 right-10 bg-yellow-100 border-r-4 border-yellow-500 text-yellow-900 rounded-md shadow-md">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.763-1.35 2.682-1.35 3.445 0l6.516 11.53c.773 1.368-.188 3.073-1.722 3.073H3.463c-1.534 0-2.495-1.705-1.722-3.073l6.516-11.53zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-4a1 1 0 011-1h.007a1 1 0 01.993.883L11 10v2a1 1 0 01-2 0v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-lg">License Expiration Notice</p>
                  <p className="text-sm">
                    {licenseExpiry.days > 0 ? (
                      <>Your license expired <span className="font-bold">{licenseExpiry.days} day{licenseExpiry.days !== 1 ? 's' : ''} ago</span>. Please renew it to continue using the service.</>
                    ) : (
                      <>Your license will expire in <span className="font-bold">{licenseExpiry.days * -1} day{licenseExpiry.days * -1 !== 1 ? 's' : ''}</span>. Please renew it to continue using the service.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Dashboard
