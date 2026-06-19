import OnboardCardLayout from '../components/OnboardCardLayout'
import InstanceList from '../components/InstanceList'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@renderer/redux/store'

const InstancePage = (): JSX.Element => {
  const navigate = useNavigate()
  const selectedId = useSelector((state: RootState) => state.selectedInstance.instanceId)

  // const [selectedId, setSelectedId] = useState(instanceId)
  const [disable, setDisable] = useState(true)
  const instances = useSelector((state: RootState) => state.instance.instances) // Get instances from Redux state

  useEffect(() => {
    selectedId.trim() === '' ? setDisable(true) : setDisable(false)
  }, [instances, selectedId])

  useEffect(() => {
    setDisable(true)
  }, [instances])

  // If instance is selected then Navigate to the selected instance
  const handleInstanseCheck = (): boolean => {
    if (selectedId) navigate(`/instance/${selectedId}`)
    return true
  }

  return (
    <OnboardCardLayout
      heading="List of Instances"
      paragraph="Select any instance from the list below"
      btnText="Login"
      disable={disable}
      onClick={handleInstanseCheck}
    >
      <InstanceList />
    </OnboardCardLayout>
  )
}

export default InstancePage
