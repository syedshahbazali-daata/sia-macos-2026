import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SiALogo from '../components/SiALogo'
import { storage, enums } from '@renderer/helpers/storageHelper'
import './animation.css'
import { verifyLicense } from '@renderer/lib/license'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@renderer/redux/store'
import { setInstanceId } from '@renderer/redux/slices/SelectedInstanceSlice'

const SPLASH_DELAY_MS = 3000

const SplashScreen = (): JSX.Element => {
  const navigate = useNavigate()
  const instances = useSelector((state: RootState) => state.instance.instances)
  const selectedId = useSelector((state: RootState) => state.selectedInstance.instanceId)
  const dispatch = useDispatch()

  useEffect(() => {
    const storedId = localStorage.getItem('selectedInstanceId')
    if (storedId) {
      dispatch(setInstanceId(storedId))
    }
  }, [dispatch])

  useEffect(() => {
    const checkLicense = async (): Promise<void> => {
      try {
        const license = storage.get(enums.LICENSE)

        if (!license) {
          navigate('/license')
          return
        }

        const isValid = await verifyLicense(license.license)
        if (!isValid) {
          navigate('/license')
          return
        }

        if (selectedId) {
          navigate('/dashboard')
        } else if (instances.length === 0) {
          navigate('/instance/create')
        } else {
          navigate('/instance')
        }
      } catch {
        navigate('/license')
      }
    }

    const timer = setTimeout(checkLicense, SPLASH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [navigate, selectedId, instances])

  return (
    <div className="animate-logo">
      <SiALogo />
    </div>
  )
}

export default SplashScreen
