import { Input } from '@renderer/components/ui/input'
import OnboardCardLayout from '../components/OnboardCardLayout'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@renderer/hooks/use-toast'
// import { RootState } from '@renderer/redux/store'
import { useSelector } from 'react-redux'
import { getSelectedInstance } from '@renderer/redux/slices/SelectedInstanceSlice'
import { EyeOff, Eye } from 'lucide-react'

// PasswordScreen component for password input and validation
const PasswordScreen = (): JSX.Element => {
  const [inputPassword, setInputPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const selectedInstance = useSelector(getSelectedInstance)!

  // Handler for password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputPassword(e.target.value)
  }

  // Function to validate password and navigate to dashboard
  const getPassword = (): boolean => {
    if (inputPassword.length === 0) {
      toast({
        title: 'Field Required',
        description: 'Password cannot be empty.',
        variant: 'destructive'
      })
      return false
    }
    if (inputPassword !== selectedInstance?.instancePassword) {
      toast({
        title: 'Invalid Password',
        description: 'Password does not match',
        variant: 'destructive'
      })
      return false
    }
    if (inputPassword === selectedInstance?.instancePassword) navigate('/dashboard')
    return true
  }

  // Toggle password visibility
  const togglePasswordVisibility = (): void => {
    setShowPassword((prev) => !prev)
  }

  return (
    // OnboardCardLayout component to wrap the input and button
    <OnboardCardLayout
      heading="Run Instance"
      paragraph="Enter the password to run the instance"
      btnText="Run Instance"
      onClick={getPassword}
      cancelBtn={true}
    >
      <div className="flex justify-center h-full items-end pb-6">
        {/* Input field for password */}
        <Input
          placeholder="Enter Password"
          value={inputPassword}
          autoFocus
          type={showPassword ? 'text' : 'password'}
          onChange={handlePasswordChange}
          className="rounded-[6px] w-full bg-transparent h-[48px] focus:border-2"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-2 top-[101px] text-gray-600"
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </OnboardCardLayout>
  )
}

export default PasswordScreen
