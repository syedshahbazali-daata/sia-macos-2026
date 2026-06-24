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

  const attemptsLeft = MAX_ATTEMPTS - attempts
  const isLocked = attempts >= MAX_ATTEMPTS

  const handleLicenseCheck = async (): Promise<void> => {
    if (isLocked) {
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
        description: 'License code must be exactly 6 digits.',
        variant: 'destructive',
      })
      return
    }

    setAttempts((prev) => prev + 1)
    setIsLoading(true)

    try {
      const license = await getLicensesByNumber(otpValue)

      if (!license) {
        toast({
          title: 'License Not Found',
          description: `No license found for code ${otpValue}. ${attemptsLeft - 1} attempt${attemptsLeft - 1 !== 1 ? 's' : ''} remaining.`,
          variant: 'destructive',
        })
        return
      }

      const isValid = await verifyLicense(otpValue)
      if (!isValid) {
        toast({
          title: 'License Expired',
          description: 'This license has expired. Please renew your subscription.',
          variant: 'destructive',
        })
        return
      }

      storage.set(enums.LICENSE, license)

      toast({
        title: 'License Activated',
        description: `Welcome! Your ${license.plan.charAt(0).toUpperCase() + license.plan.slice(1)} plan is now active.`,
      })

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
        title: 'Connection Error',
        description: 'Could not reach the license server. Check your internet connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const paragraph = isLocked
    ? 'Maximum attempts reached. Please restart the app.'
    : `Enter the 6-digit license code from your purchase email.${attempts > 0 ? ` ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.` : ''}`

  return (
    <OnboardCardLayout
      heading="Activate License"
      paragraph={paragraph}
      btnText={isLoading ? 'Verifying...' : 'Activate'}
      onClick={handleLicenseCheck}
      disable={isLocked || isLoading}
      loading={isLoading}
    >
      <InputOtp value={otpValue} onChangeOtp={setOtpValue} />
    </OnboardCardLayout>
  )
}

export default LicensePage
