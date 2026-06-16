import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#D6FFF6]',
        className,
      )}
      {...props}
    />
  )
}
