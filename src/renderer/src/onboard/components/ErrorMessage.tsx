import { forwardRef, useImperativeHandle } from 'react'
import { useToast } from '@renderer/hooks/use-toast'
import { ToastAction } from '@renderer/components/ui/toast'

// Using forwardRef to expose the showErrorToast method
const ErrorMessage = forwardRef<{ showErrorToast: () => void }, { message: string }>(
  ({ message }, ref) => {
    const { toast } = useToast()

    const showErrorToast = () => {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: message,
        variant: 'destructive',
        action: <ToastAction altText="Try again">Try again</ToastAction>
      })
    }

    // Expose the showErrorToast method to the parent component via ref
    useImperativeHandle(ref, () => ({
      showErrorToast
    }))

    return null // No UI rendered for ErrorMessage component itself
  }
)

export default ErrorMessage
