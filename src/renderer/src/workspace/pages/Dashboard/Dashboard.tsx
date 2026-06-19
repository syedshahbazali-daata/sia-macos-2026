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
  earnings: number
}

export type Metrics = {
  totalEarnings: string
  subscriptions: string
  tips: string
  points: string
  referrals: string
  messages: string
  streams: string
}

const generateRandomData = () => {
  const days = ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7']
  const chartData = days.map((day) => ({
    date: day,
    earnings: Math.floor(Math.random() * 1000) // Random earnings data
  }))
  const metrics: Metrics = {
    totalEarnings: `$${(Math.random() * 50000).toFixed(2)}`,
    subscriptions: `$${(Math.random() * 10000).toFixed(2)}`,
    tips: `$${(Math.random() * 5000).toFixed(2)}`,
    points: `$${(Math.random() * 500).toFixed(2)}`,
    referrals: `$${(Math.random() * 100).toFixed(2)}`,
    messages: `$${(Math.random() * 20000).toFixed(2)}`,
    streams: `$${(Math.random() * 100).toFixed(2)}`
  }
  return { chartData, metrics }
}

interface DashboardProps {
  data?: DataPoint[]
}
function convertEpochToDaysHours(epochTimestamp) {
  // Convert the epoch timestamp to milliseconds
  const milliseconds = epochTimestamp * 1000

  // Get the current time in milliseconds
  const currentTime = Date.now()

  // Calculate the difference in milliseconds
  const difference = currentTime - milliseconds

  // Convert the difference to days and hours
  const days = Math.floor(difference / (1000 * 60 * 60 * 24))

  return { days }
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Today')
  const [licenseExpiry, setLicenseExpiry] = useState({
    days: 100
  })
  const [{ chartData, metrics }, setChartAndMetrics] = useState(generateRandomData())
  const [utcTime, setUtcTime] = useState<string>(new Date().toISOString().slice(11, 19) + ' UTC')
  const license = storage.get(enums.LICENSE)?.expiry_date?.seconds

  useEffect(() => {
    setChartAndMetrics(generateRandomData())
  }, [selectedPeriod])

  useEffect(() => {
    if (license) {
      const obj = convertEpochToDaysHours(license)
      setLicenseExpiry(obj)
    }
    // Update UTC time every second
    const intervalId = setInterval(() => {
      const now = new Date()
      setUtcTime(now.toISOString().slice(11, 19) + ' UTC')
    }, 1000)

    return () => clearInterval(intervalId) // Cleanup interval on component unmount
  }, [])

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
                    Creator earnings overview
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
          <div className="grid grid-cols-12 gap-4 w-full ">
            {/* Shifts Card - 5 columns */}
            <ShiftCard />

            {/* Sales Chart - 7 columns */}
            <DashboardChart chartData={chartData} />
          </div>
        </div>

        <div>
          {licenseExpiry.days * -1 <= 7 && (
            <div className="max-w-md p-4 absolute bottom-10 right-10 bg-yellow-100 border-r-4 border-yellow-500 text-yellow-900 rounded-md shadow-md">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.763-1.35 2.682-1.35 3.445 0l6.516 11.53c.773 1.368-.188 3.073-1.722 3.073H3.463c-1.534 0-2.495-1.705-1.722-3.073l6.516-11.53zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-4a1 1 0 011-1h.007a1 1 0 01.993.883L11 10v2a1 1 0 01-2 0v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-lg">License Expiration Notice</p>
                  <p className="text-sm">
                    Your license will expire in{' '}
                    <span className="font-bold">{licenseExpiry.days * -1} days</span>. Please renew
                    it to continue using the service.
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
