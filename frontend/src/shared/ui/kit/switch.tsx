'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from './utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root data-slot="switch" className={cn('switch', className)} {...props}>
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={cn('switch__thumb')} />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
