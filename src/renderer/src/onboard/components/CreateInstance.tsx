import { Input } from '@renderer/components/ui/input'
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Define the interface for CreateInstance props
interface CreateInstanceProps {
  instanceName: string
  password: string
  setInstanceName: (name: string) => void
  setPassword: (password: string) => void
}
// CreateInstance functional component
const CreateInstance: React.FC<CreateInstanceProps> = ({
  instanceName,
  password,
  setInstanceName,
  setPassword
}) => {
  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false)
  // Handle changes in the instance name input
  const handleInstanceNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInstanceName(e.target.value)
  }

  // Handle changes in the password input
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value)
  }

  // Toggle password visibility
  const togglePasswordVisibility = (): void => {
    setShowPassword((prev) => !prev)
  }
  return (
    // Wrapper div for the inputs
    <div className="w-full h-full flex justify-end  items-end flex-col pb-4">
      {/* Instance Name Input */}
      <Input
        placeholder="Instance Name"
        value={instanceName}
        autoFocus
        onChange={handleInstanceNameChange}
        className="rounded-[6px] w-full mb-5 bg-transparent h-[48px] focus:border-2"
        required
      />
      {/* Password Input */}
      <Input
        placeholder="Set Password"
        value={password}
        type={showPassword ? 'text' : 'password'}
        onChange={handlePasswordChange}
        className="rounded-[6px] w-full bg-transparent h-[48px] focus:border-2 relative"
        required
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-2 top-[110px] text-gray-600"
      >
        {showPassword ? <EyeOff /> : <Eye />}
      </button>
    </div>
  )
}

export default CreateInstance
