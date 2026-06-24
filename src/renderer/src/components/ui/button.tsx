import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@renderer/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-secondary shadow hover:bg-primary/90 text-sm font-semibold font-notoSans  text-center',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 ',
        outline:
          'border  border-input bg-transparent shadow-sm  text-white font-medium hover:text-secondary/80 font-notoSans  text-center transition-all 0.3s',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 font-semibold',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        free:'bg-black text-white shadow py-0 hover:bg-black/85 font-notoSans  text-center',
        pro: 'bg-indigo-600 text-white shadow py-0 hover:bg-indigo-700 font-notoSans text-center',
        enterprise: 'bg-amber-500 text-white shadow py-0 hover:bg-amber-600 font-notoSans text-center',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
