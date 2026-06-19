// @ts-nocheck
import { useNavigate } from 'react-router-dom'
import SiALogo from '../components/SiALogo'
import { storage, enums } from '@renderer/helpers/storageHelper'
import './animation.css'
import { useEffect } from 'react'
import { verifyLicense } from '@renderer/lib/license'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/redux/store'
import { addSchedulers } from '@renderer/redux/slices/SchedulerSlice'
import { setInstanceId } from '@renderer/redux/slices/SelectedInstanceSlice'
const SplashScreen = (): JSX.Element => {
  const navigate = useNavigate()
  const instances = useSelector((state: RootState) => state.instance.instances)
  const selectedId = useSelector((state: RootState) => state.selectedInstance.instanceId)

  const dispatch = useDispatch()

  useEffect(() => {
    const storedId = localStorage.getItem('selectedInstanceId')
    if (storedId) {
      dispatch(setInstanceId(storedId)) // Set the instance ID from local storage
    }
  }, [dispatch])

  useEffect(() => {
    console.log(selectedId)
    const checkLicense = async (): Promise<void> => {
      const license = storage.get(enums.LICENSE)
      if (!license) {
        navigate('/license')
      }
      if (license) {
        const result = await verifyLicense(license.license)
        console.log('result', result, license)

        if (result) {
          console.log('license found')

          // @ts-expect-error window object
          // const exists = await window.api.getBrowserExists()
          const exists = false
          console.log('exists', exists)


          if (!exists) {
            console.log('browser not found')
            navigate('/browser/download')
            // navigate('/dashboard')
          } else {
            if (selectedId) {
              navigate(`/dashboard`)
            } else if (instances.length === 0) {
              navigate('/instance/create')
            } else {
              navigate('/instance')
            }
          }
        } else navigate('/license')
      }
    }
    setTimeout(async () => {
      await checkLicense()
    }, 3000)
  }, [])

  return (
    <div className="animate-logo">
      <SiALogo />
    </div>
  )
}

export default SplashScreen
