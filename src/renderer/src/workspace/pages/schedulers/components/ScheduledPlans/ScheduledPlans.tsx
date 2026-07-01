import { faCalendarAlt, faClock, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '@renderer/components/ui/button'
import { RootState } from '@renderer/redux/store'
import { clearSchedulersByPlatform, deleteScheduler } from '@renderer/redux/slices/SchedulerSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import DeleteConfirmationModal from '../MediaSection/components/MediaPreview/components/DeleteConfirmationModal'
import React, { useEffect, useState } from 'react'
import ViewScheduleModal from './components/ViewScheduleModal/ViewScheduleModal'
import CopyScheduleModal from './components/CopyScheduleModal/CopyScheduleModal'
import { storage, enums } from '@renderer/helpers/storageHelper'
import { Scheduler } from '@renderer/types/scheduler'
import { ALL_PLATFORMS_VALUE } from '../CreatePost/CreatePost'
import { PlayCircle } from 'lucide-react'

import twitter from '@renderer/assets/twitter-icon.png'
import facebook from '@renderer/assets/facebook-icon.png'
import instagram from '@renderer/assets/instagram-icon.png'
import tiktok from '@renderer/assets/tiktok-icon.png'
import OF from '@renderer/assets/of-icon.png'
import youtube from '@renderer/assets/youtube-icon.png'

const PLATFORM_ICON_SRC: Record<string, string> = {
  'Twitter Post': twitter,
  'Instagram post': instagram,
  'Instagram story': instagram,
  'Facebook': facebook,
  'Tik Tok Post': tiktok,
  'YouTube Shorts': youtube,
  'OF Post': OF,
  'OF Mass Messaging': OF,
}

const getInstanceDetails = () => {
  const instances = storage.get(enums.INSTANCE, [])
  const selectedInstance = localStorage.getItem('selectedInstanceId')
  return instances.find((instance: { instanceId: string }) => instance.instanceId === selectedInstance)
}

function platformToAccountKey(platform: string): string {
  const p = platform.toLowerCase()
  if (p.includes('of')) return 'of'
  if (p.includes('tik')) return 'tiktok'
  return p.split(' ')[0]
}

export const selectAllSchedulers = (state: RootState): Scheduler[] => state.scheduler

const ScheduledPlans = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState('')
  const [showModalId, setShowModalId] = useState<string | null>(null)
  const [copySchedulerId, setCopySchedulerId] = useState<string | null>(null)
  const currentScheduler = useSelector((state: RootState) => state.currentScheduler)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const selectedInstance = localStorage.getItem('selectedInstanceId') ?? ''
  const [selectedInstanceAccounts, setSelectedInstanceAccounts] = useState<string[]>([])

  useEffect(() => {
    const handler = (_event: unknown, accounts: Record<string, string[]>[]) => {
      const instanceAccounts = accounts.find(
        (account) => Object.keys(account)[0] === selectedInstance
      )
      setSelectedInstanceAccounts(instanceAccounts?.[selectedInstance] ?? [])
    }

    window.electron.ipcRenderer.send('show-attached-accounts')
    const removeListener = window.electron.ipcRenderer.on('attached-accounts', handler)

    return removeListener
  }, [])

  const schedulers = useSelector(selectAllSchedulers)
  const isAllMode = currentScheduler.platform === ALL_PLATFORMS_VALUE

  // Single-platform mode: same as before
  const platformSchedulers = schedulers?.filter(
    (scheduler) =>
      scheduler.platform === currentScheduler.platform &&
      scheduler.isScheduled === 0 &&
      scheduler.Instance_id === selectedInstance
  )

  // All-mode: schedulers across all connected platforms for this instance
  const allModeSchedulers = schedulers?.filter((scheduler) => {
    if (scheduler.isScheduled !== 0 || scheduler.Instance_id !== selectedInstance) return false
    const key = platformToAccountKey(scheduler.platform)
    return selectedInstanceAccounts.some((acc) => acc.toLowerCase() === key)
  })

  // Group all-mode schedulers by platform
  const groupedByPlatform = allModeSchedulers.reduce(
    (acc, s) => {
      if (!acc[s.platform]) acc[s.platform] = []
      acc[s.platform].push(s)
      return acc
    },
    {} as Record<string, Scheduler[]>
  )

  const checkCurrentPlatformAccountAttached = () => {
    for (const acc of selectedInstanceAccounts) {
      let p = currentScheduler.platform.toLowerCase()
      if (p.includes('of')) p = 'of'
      else if (p.includes('tik')) p = 'tiktok'
      else p = p.split(' ')[0]
      if (acc.toLowerCase() === p) return true
    }
    return false
  }

  const isCurrentPlatformAccountAttached = checkCurrentPlatformAccountAttached()

  const handleRunScheduler = async (): Promise<void> => {
    if (!isCurrentPlatformAccountAttached) {
      navigate('/settings?tab=attached-account')
      return
    }
    const instanceDetails = getInstanceDetails()
    setLoading(true)
    await window.electron.ipcRenderer.invoke(
      'run-scheduler',
      currentScheduler.platform,
      platformSchedulers,
      instanceDetails?.userDir
    )
    setLoading(false)
  }

  const handleRunAll = async (): Promise<void> => {
    const instanceDetails = getInstanceDetails()
    const platformGroups = Object.entries(groupedByPlatform).map(([platform, scheds]) => ({
      platform,
      schedulers: scheds,
    }))
    setLoading(true)
    await window.electron.ipcRenderer.invoke(
      'run-all-schedulers',
      platformGroups,
      instanceDetails?.userDir
    )
    setLoading(false)
  }

  const onConfirmDelete = async (): Promise<void> => {
    const result = await window.electron.ipcRenderer.invoke('delete-scheduler', deleteId)
    if (result === 'success') dispatch(deleteScheduler(deleteId))
    setIsOpen(false)
  }

  const clearAll = async (): Promise<void> => {
    const result = await window.electron.ipcRenderer.invoke(
      'delete-scheduler-by-platform',
      currentScheduler.platform
    )
    if (result === 'success') dispatch(clearSchedulersByPlatform(currentScheduler.platform))
    setIsClearAllOpen(false)
  }

  const copyScheduler =
    (isAllMode ? allModeSchedulers : platformSchedulers).find(
      (s) => s.id === copySchedulerId
    ) ?? null

  // ── Shared card renderer ──────────────────────────────────────────────────
  const renderCard = (scheduler: Scheduler) => (
    <React.Fragment key={scheduler.id}>
      <div
        className="cursor-pointer flex flex-col bg-white rounded-2xl shadow-md p-3"
        onClick={() => {
          setShowModalId(scheduler.id)
          setShowModal(true)
        }}
      >
        <div className="flex items-start justify-between mb-[10px]">
          <h2 className="font-poppins text-lg leading-6 font-semibold text-gray-800">
            {scheduler.platform}
          </h2>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCopy}
              className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm"
              title="Copy to other platforms"
              onClick={(e) => {
                e.stopPropagation()
                setCopySchedulerId(scheduler.id)
              }}
            />
            <FontAwesomeIcon
              icon={faTrash}
              className="text-red-500 hover:text-red-600 cursor-pointer text-base"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteId(scheduler.id)
                setIsOpen(true)
              }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600">
          {scheduler.description_text?.slice(0, 40) + '...'}
        </p>
        <div className="flex items-center text-xs text-gray-600">
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500 text-xs" />
          {scheduler.set_date}
        </div>
        <div className="flex items-center text-xs text-gray-600">
          <FontAwesomeIcon icon={faClock} className="mr-2 text-xs text-gray-500" />
          {new Date(scheduler.set_date + ' ' + scheduler.set_time).toLocaleTimeString('en-US', {
            hour12: true,
          })}
        </div>
      </div>
      {showModalId === scheduler.id && (
        <ViewScheduleModal
          scheduler={scheduler}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}
    </React.Fragment>
  )

  return (
    <div className="flex flex-col gap-5 2xl:w-[32%] w-[28%] h-full p-4 bg-gray-300 rounded-2xl">
      <DeleteConfirmationModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={onConfirmDelete}
      />
      <DeleteConfirmationModal
        isOpen={isClearAllOpen}
        onCancel={() => setIsClearAllOpen(false)}
        onConfirm={clearAll}
      />
      {copyScheduler && (
        <CopyScheduleModal
          scheduler={copyScheduler}
          onClose={() => setCopySchedulerId(null)}
        />
      )}

      <h1 className="font-poppins text-2xl font-bold text-gray-90 whitespace-nowrap">
        Scheduled Plans
        {!isAllMode && platformSchedulers.length > 0 && (
          <div
            onClick={() => setIsClearAllOpen(true)}
            className="flex items-start gap-1 cursor-pointer"
          >
            <p className="text-xs text-gray-600 tracking-wide cursor-pointer hover:text-gray-700 transition-colors duration-300">
              Clear All
            </p>
          </div>
        )}
      </h1>

      {/* ── Single-platform mode ── */}
      {!isAllMode && (
        <>
          <div
            className="flex flex-col w-full h-full overflow-y-auto gap-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {platformSchedulers.length === 0 && <p>No scheduled plans available</p>}
            {platformSchedulers.map(renderCard)}
          </div>
          <div className="flex flex-col w-full bg-gray-300 rounded-lg justify-end mt-5">
            <Button
              disabled={loading}
              onClick={handleRunScheduler}
              className="flex items-center justify-center w-full h-10 text-white rounded-lg text-sm tracking-wide gap-2 bg-[#0f172a] hover:bg-[#0f172a]/90"
            >
              {!isCurrentPlatformAccountAttached ? 'Attach Account' : 'Run Scheduler'}
            </Button>
          </div>
        </>
      )}

      {/* ── All Platforms mode ── */}
      {isAllMode && (
        <>
          <div
            className="flex flex-col w-full h-full overflow-y-auto gap-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {allModeSchedulers.length === 0 && (
              <p className="text-sm text-gray-500">No scheduled plans on connected platforms.</p>
            )}
            {Object.entries(groupedByPlatform).map(([platform, scheds]) => (
              <div key={platform} className="flex flex-col gap-2">
                {/* Platform group header */}
                <div className="flex items-center gap-2 px-1">
                  {PLATFORM_ICON_SRC[platform] && (
                    <img
                      src={PLATFORM_ICON_SRC[platform]}
                      alt={platform}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {platform}
                  </span>
                  <span className="text-xs text-gray-400">({scheds.length})</span>
                </div>
                {scheds.map(renderCard)}
              </div>
            ))}
          </div>

          <div className="flex flex-col w-full bg-gray-300 rounded-lg justify-end mt-5">
            <Button
              disabled={loading || allModeSchedulers.length === 0}
              onClick={handleRunAll}
              className="flex items-center justify-center w-full h-10 text-white rounded-lg text-sm tracking-wide gap-2 bg-[#0f172a] hover:bg-[#0f172a]/90 disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              {loading ? 'Running…' : 'Run All'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default ScheduledPlans
