import * as React from 'react'
import { IMaskInput } from 'react-imask'
import { cn } from '@/lib/utils'

export interface MaskedInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
  > {
  mask: string
  value?: string
  onAccept?: (value: string) => void
  onChange?: (event: { target: { value: string } }) => void
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, onAccept, onChange, value, ...props }, ref) => {
    return (
      <IMaskInput
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        mask={mask}
        value={value || ''}
        inputRef={ref}
        onAccept={(value, mask) => {
          if (onAccept) {
            onAccept(value as string)
          }
          if (onChange) {
            onChange({ target: { value: value as string } })
          }
        }}
        {...props}
      />
    )
  },
)
MaskedInput.displayName = 'MaskedInput'

export { MaskedInput }
