import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import MyProfile from './components/MyProfile'
import AttachedAccounts from './components/AttachedAccounts'
import EditSignatures from './components/EditSignatures'
import CustomDescriptions from './components/CustomDescriptions'
import AllDescriptions from './components/AllDescriptions'

const Settings = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialTab = params.get('tab') ?? 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div className="flex flex-row w-full h-[90%] p-1">
      <div className="flex flex-col bg-gray-300 gap-5 w-full h-full p-5 mx-5 rounded-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[100%] h-full">
          <TabsList className="flex gap-5">
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="attached-account">Attached Accounts</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="custom-descriptions">Custom Descriptions</TabsTrigger>
            <TabsTrigger value="all-descriptions">All Descriptions</TabsTrigger>
          </TabsList>
          <MyProfile />
          <AttachedAccounts />
          <EditSignatures />
          <CustomDescriptions />
          <AllDescriptions />
        </Tabs>
      </div>
    </div>
  )
}

export default Settings
