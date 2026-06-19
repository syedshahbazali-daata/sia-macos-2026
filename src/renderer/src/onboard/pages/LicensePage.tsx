import React, { useEffect, useState } from 'react'
import OnboardCardLayout from '../components/OnboardCardLayout'
import { InputOtp } from '../components/InputOtp'
import { useNavigate } from 'react-router-dom'
import { toast } from '@renderer/hooks/use-toast'
import { getLicensesByNumber, verifyLicense } from '@renderer/lib/license'
import { storage, enums } from '@renderer/helpers/storageHelper'
import { useSelector } from 'react-redux'
import { RootState } from '@renderer/redux/store'

const LicensePage: React.FC = () => {
  const [browserExist, setBrowserExist] = useState<boolean>(false)
  const [counter, setCounter] = useState<number>(0)
  const instances = useSelector((state: RootState) => state.instance.instances);
  const selectedId = useSelector((state: RootState) => state.selectedInstance.instanceId)




  useEffect(() => {
    const checkBrowserExists = async (): Promise<void> => {
      // Call the API exposed in the preload script
      // @ts-expect-error window object
      const exists = await window.api.getBrowserExists()
      console.log('Browser exists:', exists)
      setBrowserExist(exists)
    }

    checkBrowserExists()
  }, [])
  const [otpValue, setOtpValue] = useState<string>('')
  const navigate = useNavigate()

  const handleLicenseCheck = async (): Promise<boolean> => {
    setCounter((prevCounter) => prevCounter + 1)

    if (otpValue.trim() === '') {
      toast({
        title: 'Field Required',
        description: 'License code cannot be empty',
        variant: 'destructive'
      })
      return false
    }
    if (otpValue.trim().length !== 6) {
      toast({
        title: 'Invalid License Code',
        description: 'License code must be 6 digits',
        variant: 'destructive'
      })
      return false
    }

    try {
      const license = await getLicensesByNumber(otpValue)

      if (license) {
        const verify = await verifyLicense(license.license)
        if (verify) {
          storage.set(enums.LICENSE, license)
          if (!browserExist) {
            navigate('/browser/download')
          } else {
            if (selectedId){
              navigate(`/dashboard`)
             }else if(instances.length===0){
             navigate('/instance/create')
             }else{
               navigate('/instance')
             }
            }
            return true;
        } else {
          toast({
            title: 'Invalid License Code',
            description: 'License code does not exist',
            variant: 'destructive'
          })
          return false
        }
      } else {
        toast({
          title: 'Invalid License Code',
          description: 'License code does not exist',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive'
      })
      return false
    }
  }

  const handleClick = (): boolean => {
    if (counter < 4) {
      handleLicenseCheck().then((result) => {
        console.log('License valid:', result)
      })
    } else {
      toast({
        title: 'Too many attempts',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    }

    // Return false to comply with the expected synchronous return type
    return false
  }

  return (
    <OnboardCardLayout
      heading="License Code"
      paragraph="Enter the license code you received when you purchased the SiA"
      btnText="Submit"
      onClick={handleClick}
    >
      <InputOtp value={otpValue} onChangeOtp={setOtpValue} />
    </OnboardCardLayout>
  )
}

export default LicensePage
