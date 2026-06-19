import React, { useEffect, useState } from 'react'
import OnboardCardLayout from '../components/OnboardCardLayout'
import { InputOtp } from '../components/InputOtp'
import { useNavigate } from 'react-router-dom'
import { toast } from '@renderer/hooks/use-toast'
import { getLicensesByNumber, verifyLicense } from '@renderer/lib/license'
import { storage, enums } from '@renderer/helpers/storageHelper'
import { useSelector } from 'react-redux'
import type { RootState } from '@renderer/redux/store'

const MAX_ATTEMPTS = 5

const LicensePage: React.FC = () => {
  const [browserExist, setBrowserExist] = useState<boolean>(false)
  const [attempts, setAttempts] = useState<number>(0)
  const [otpValue, setOtpValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const navigate = useNavigate()

  const instances = useSelector((state: RootState) => state.instance.instances)
  const selectedId = useSelector((state: RootState) => state.selectedInstance.instanceId)

  useEffect(() => {
    const checkBrowser = async (): Promise<void> => {
      const exists = await window.api.getBrowserExists()
      setBrowserExist(exists)
    }
    checkBrowser()
  }, [])

  const handleLicenseCheck = async (): Promise<void> => {
    if (attempts >= MAX_ATTEMPTS) {
      toast({
        title: 'Too many attempts',
        description: 'Please restart the app and try again.',
        variant: 'destructive',
      })
      return
    }

    if (otpValue.trim().length !== 6) {
      toast({
        title: 'Invalid License Code',
        description: 'License code must be 6 digits',
        variant: 'destructive',
      })
      return
    }

    setAttempts((prev) => prev + 1)
    setIsLoading(true)

    try {
      const license = await getLicensesByNumber(otpValue)

      if (!license || !(await verifyLicense(otpValue))) {
        toast({
          title: 'Invalid License Code',
          description: 'License code does not exist or has expired.',
          variant: 'destructive',
        })
        return
      }

      storage.set(enums.LICENSE, license)

      if (!browserExist) {
        navigate('/browser/download')
      } else if (selectedId) {
        navigate('/dashboard')
      } else if (instances.length === 0) {
        navigate('/instance/create')
      } else {
        navigate('/instance')
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardCardLayout
      heading="License Code"
      paragraph="Enter the license code you received when you purchased SiA"
      btnText={isLoading ? 'Checking...' : 'Submit'}
      onClick={handleLicenseCheck}
    >
      <InputOtp value={otpValue} onChangeOtp={setOtpValue} />
    </OnboardCardLayout>
  )
}

export default LicensePage
