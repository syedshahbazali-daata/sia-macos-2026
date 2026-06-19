import { useDispatch, useSelector } from 'react-redux'
import CreatePost from './components/CreatePost/CreatePost'
import ScheduledPlans, { selectAllSchedulers } from './components/ScheduledPlans/ScheduledPlans'
import { addSchedulers } from '@renderer/redux/slices/SchedulerSlice'
import { useEffect } from 'react'

const Schedulers = (): JSX.Element => {
  const schedulers = useSelector(selectAllSchedulers)
  const dispatch = useDispatch()

  const readSchedulesData = async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke('read-schedules')
      dispatch(addSchedulers(data))
    } catch (error) {
      console.error('Error reading schedules:', error)
    }
  }

  useEffect(() => {
    if (schedulers.length === 0) {
      readSchedulesData()
    }

    // Listen for scheduler history updates
    window.electron.ipcRenderer.on('scheduler-history-updated', () => {
      readSchedulesData()
    })

    // Cleanup listener on component unmount
    return () => {
      window.electron.ipcRenderer.removeListener('scheduler-history-updated', readSchedulesData)
    }
  }, [])

  return (
    <div className="flex items-center justify-center flex-row w-full h-[94%] p-1">
      <CreatePost />
      <ScheduledPlans />
    </div>
  )
}

export default Schedulers
