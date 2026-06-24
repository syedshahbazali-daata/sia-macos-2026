import { faCalendarAlt, faClock, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '@renderer/components/ui/button'
import { RootState } from '@renderer/redux/store'
import { clearSchedulersByPlatform, deleteScheduler } from '@renderer/redux/slices/SchedulerSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import DeleteConfirmationModal from '../MediaSection/components/MediaPreview/components/DeleteConfirmationModal'
import React, { useEffect, useState } from 'react'
import ViewScheduleModal from './components/ViewScheduleModal/ViewScheduleModal'
import { storage, enums } from '@renderer/helpers/storageHelper'
import { Scheduler } from '@renderer/types/scheduler'

// selectors.ts


const getInstanceDetails = () => {
  const instances = storage.get(enums.INSTANCE, [])
  const selectedInstance = localStorage.getItem('selectedInstanceId')
  return instances.find((instance: { instanceId: string }) => instance.instanceId === selectedInstance)
}


export const selectAllSchedulers = (state: RootState): Scheduler[] => state.scheduler

const ScheduledPlans = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState('')
  const [showModalId, setShowModalId] = useState<string | null>(null)
  const currentScheduler = useSelector((state: RootState) => state.currentScheduler)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)


  const selectedInstance = localStorage.getItem('selectedInstanceId') ?? ''
  const [selectedInstanceAccounts, setSelectedInstanceAccounts] = useState<string[]>([])

  useEffect(() => {
    window.electron.ipcRenderer.send('show-attached-accounts')
    window.electron.ipcRenderer.on('attached-accounts', (_event, accounts) => {
      const instanceAccounts = accounts.find((account: Record<string, string[]>) => Object.keys(account)[0] === selectedInstance)
      setSelectedInstanceAccounts(instanceAccounts?.[selectedInstance] ?? [])




    });

  }, []);




  const schedulers = useSelector(selectAllSchedulers)
  const platformSchedulers = schedulers?.filter(
    (scheduler) => scheduler.platform === currentScheduler.platform && scheduler.isScheduled === 0 &&
      scheduler.Instance_id === selectedInstance
  )



  const checkCurrentPlatformAccountAttached = () => {
    let isAttached = false;
    for (let i = 0; i < selectedInstanceAccounts.length; i++) {
      let currentPlatform = currentScheduler.platform.toLowerCase()
      if (currentPlatform.includes('of')) {
        currentPlatform = 'of'
      } else if (currentPlatform.includes('tik')) {
        currentPlatform = 'tiktok'

      } else {
        currentPlatform = currentPlatform.split(' ')[0]
      }

      if (selectedInstanceAccounts[i].toLowerCase() === currentPlatform
      ) {
        isAttached = true;
        break;
      }
    }

    return isAttached;
  }

  const isCurrentPlatformAccountAttached = checkCurrentPlatformAccountAttached();








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

  const onConfirmDelete = async (): Promise<void> => {
    //
    const result = await window.electron.ipcRenderer.invoke('delete-scheduler', deleteId)
    if (result === 'success') {
      dispatch(deleteScheduler(deleteId))
    }
    setIsOpen(false)
  }

  const clearAll = async (): Promise<void> => {
    // delete-scheduler-by-platform
    const result = await window.electron.ipcRenderer.invoke(
      'delete-scheduler-by-platform',
      currentScheduler.platform
    )
    if (result === 'success') {
      dispatch(clearSchedulersByPlatform(currentScheduler.platform))
    }
    setIsClearAllOpen(false)
  }

  return (
    <div className="flex flex-col gap-5 2xl:w-[30%] w-[25%] h-full p-4 bg-gray-300 rounded-2xl">
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

      <h1 className="font-poppins text-2xl font-bold text-gray-90">
        Scheduled Plans
        {platformSchedulers.length > 0 && (
          <div
            onClick={() => setIsClearAllOpen(true)}
            className="flex items-start gap-1 cursor-pointer"
          >
            <p
              className="text-xs text-gray-600 tracking-wide cursor-pointer hover:text-gray-700 transition-colors duration-300">
              Clear All
            </p>
          </div>
        )}
      </h1>

      <div className="flex flex-col w-full h-full overflow-y-auto gap-3 " style={{
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none' /* IE and Edge */,
      }}>
        {platformSchedulers.length === 0 && <p>No scheduled plans available</p>}
        {platformSchedulers?.map((scheduler: Scheduler) => (
          <React.Fragment key={scheduler.id}>
            <div
              className="cursor-pointer flex flex-col bg-white rounded-2xl shadow-md p-3 "
              // key={scheduler.id}
              onClick={() => {
                setShowModalId(scheduler.id)
                setShowModal(true)
              }}
            >
              <div className="flex items-start justify-between mb-[10px]">
                <h2 className="font-poppins text-lg leading-6 font-semibold text-gray-800">
                  {scheduler.platform}
                </h2>

                <div className="flex items-center justify-end flex-col gap-2">
                  <FontAwesomeIcon
                    icon={faTrash}
                    className=" text-red-500 hover:text-red-600 cursor-pointer text-base z-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteId(scheduler.id)
                      setIsOpen(true)
                    }}
                  />
                </div>
              </div>
              <p className=" text-xs text-gray-600">
                {scheduler.description_text?.slice(0, 40) + '...'}
              </p>
              <div className="flex items-center text-xs text-gray-600 ">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500 text-xs"/>
                {/*{new Date(scheduler.set_date).toLocaleDateString()}*/}
                {scheduler.set_date}
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <FontAwesomeIcon icon={faClock} className="mr-2 text-xs text-gray-500"/>
                {new Date(scheduler.set_date + ' ' + scheduler.set_time).toLocaleTimeString(
                  'en-US',
                  {
                    hour12: true
                  }
                )}
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
        ))}
      </div>
      <div className="flex flex-col w-full bg-gray-300 rounded-lg justify-end mt-5">
        <Button


          disabled={loading}
          onClick={handleRunScheduler}
          className="flex items-center justify-center w-full h-10 text-white rounded-lg text-sm tracking-wide gap-2 bg-[#0f172a] hover:bg-[#0f172a]/90">

          {!isCurrentPlatformAccountAttached && (
            <p>Attach Account</p>
          )}
          {isCurrentPlatformAccountAttached && (

            <p>Run Scheduler</p>
          )}


          {/*Run Scheduler*/}
        </Button>
      </div>
    </div>
  )
}

export default ScheduledPlans
