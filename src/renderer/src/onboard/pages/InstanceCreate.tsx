import { Instance } from '@renderer/types/Instance'
import { useState } from 'react'
import OnboardCardLayout from '../components/OnboardCardLayout'
import CreateInstance from '../components/CreateInstance'
import { useNavigate } from 'react-router-dom'
import { toast } from '@renderer/hooks/use-toast'
import ErrorMessage from '../components/ErrorMessage'
import { useDispatch, useSelector } from 'react-redux'
import { addInstance } from '@renderer/redux/slices/instanceSlice.js'
import { RootState } from '@renderer/redux/store'
import { avatars } from '@renderer/lib/avatars'

export const InstanceCreate: React.FC = () =>
  // {
  // setInstancesArray,
  // InstancesArray,
  // }: {
  //   setInstancesArray: (value: Instance[]) => void;
  //   InstancesArray: Instance[];
  // }
  {
    const dispatch = useDispatch()
    const InstancesArray = useSelector((state: RootState) => state.instance.instances)
    // const availableAvatars = useSelector((state: RootState) => state.instance.availableAvatars) // Available avatars from Redux
    const [instanceName, setInstanceName] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const usedAvatars = InstancesArray.map((instance) => instance.instanceAvatar)
    const availableAvatars = avatars.filter((avatar) => !usedAvatars.includes(avatar))
    const uniqueId = `${new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 14)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

    const handleCreateInstance = (): boolean => {
      // Pick the first available avatar
      // const newInstanceAvatar = availableAvatars[0]
      const newInstance: Instance = {
        instanceAvatar: availableAvatars[0],
        instanceName: instanceName,
        instanceId: uniqueId,
        instancePassword: password,
        userDir: `userdir-${uniqueId}`
      }
      // name and password required
      if (!instanceName || !password) {
        toast({
          title: 'Missing Information',
          description: 'Instance name and password cannot be empty.',
          variant: 'destructive'
        })
        return false
      }
      if (instanceName.length < 3) {
        toast({
          title: 'Name is too Short',
          description: 'Instance name must be at least 3 characters.',
          variant: 'destructive'
        })
        return false
      }

      const isNameExist = InstancesArray.some((instance) => instance.instanceName === instanceName)
      if (InstancesArray.length < 5 && !isNameExist) {
        // setInstancesArray([...InstancesArray, newInstance]);
        // Dispatch the action to add the new instance to the Redux store
        dispatch(addInstance(newInstance))
        // Clear fields after submission
        setInstanceName('')
        setPassword('')
        navigate('/instance')
      } else {
        const toastTitle = isNameExist
          ? `Name ${newInstance.instanceName} already exists`
          : 'Instance Limit Reached'
        ;<ErrorMessage message="Instance name must be at least 3 characters long." />
        toast({
          title: toastTitle,
          description: isNameExist
            ? 'A name cannot be used in two instances'
            : 'You can only add up to 5 instances',
          variant: 'destructive'
        })
        return false
      }
      return true
    }

    return (
      <OnboardCardLayout
        heading="Setup Instance"
        paragraph="Enter the details to setup the instance"
        btnText="Create Instance"
        onClick={handleCreateInstance} // Attach the handler to the button
        cancelBtn={InstancesArray.length === 0 ? false : true}
      >
        <CreateInstance
          instanceName={instanceName}
          password={password}
          setInstanceName={setInstanceName}
          setPassword={setPassword}
        />
      </OnboardCardLayout>
    )
  }
