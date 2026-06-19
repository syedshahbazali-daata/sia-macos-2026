import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Loader2Icon } from 'lucide-react'

// Define props for the button
export interface ButtonForCardProps {
  disable?: boolean
  loading?: boolean
  btnText: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  onClick: () => void
}

const ButtonForCard: React.FC<ButtonForCardProps> = ({
  loading,
  disable,
  btnText,
  variant,
  onClick
}) => {
  return (
    <Button
    className={`${btnText==='Cancel'?'h-[16px] ':'h-[48px]'} py-2 px-5 border-none cursor-pointer w-full mt-5 transition-all 5s`}
      onClick={onClick}
      disabled={loading || disable}
      variant={variant}
    >
      {loading && <Loader2Icon className="animate-spin mr-2" />}
      {btnText}
    </Button>
  )
}

export default ButtonForCard
