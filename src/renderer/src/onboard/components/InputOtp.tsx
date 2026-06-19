import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@renderer/components/ui/input-otp' // Importing OTP input components

// InputOtp component to handle OTP input and display
export function InputOtp({
  value,
  onChangeOtp
}: {
  value: string
  onChangeOtp: (value: string) => void
}): JSX.Element {
  // Function to handle OTP change and log the value
  const handleOtpChange = (value: string): void => {
    onChangeOtp(value)
  }

  return (
    // Wrapper div for styling
    <div className="card-child-wrapper mt-20">
      <InputOTP
        value={value}
        onChange={handleOtpChange}
        className="w-[423px] h-[74.92px]"
        maxLength={6}
      >
        {/* First group of OTP slots */}
        <InputOTPGroup className="flex">
          {Array.from({ length: 3 }).map((_, i) => (
            <InputOTPSlot className="text-white h-14 w-14 font-bold" key={i} index={i} />
          ))}
        </InputOTPGroup>

        {/* Separator between OTP groups */}
        <InputOTPSeparator className="text-white" />

        {/* Second group of OTP slots */}
        <InputOTPGroup className="flex ">
          {Array.from({ length: 3 }).map((_, i) => (
            <InputOTPSlot className="h-14 w-14 font-bold" key={i + 3} index={i + 3} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}
