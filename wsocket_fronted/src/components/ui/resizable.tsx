import { GripVertical } from 'lucide-react'
import type { ComponentProps } from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '../../utils/cn'

type ResizablePanelGroupProps = ComponentProps<typeof ResizablePrimitive.Group> & {
  direction: 'horizontal' | 'vertical'
}

export const ResizablePanelGroup = ({
  className,
  direction,
  ...props
}: ResizablePanelGroupProps) => {
  return (
    <ResizablePrimitive.Group
      orientation={direction}
      className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
      {...props}
    />
  )
}

export const ResizablePanel = ResizablePrimitive.Panel

type ResizableHandleProps = ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}

export const ResizableHandle = ({ className, withHandle, ...props }: ResizableHandleProps) => {
  return (
    <ResizablePrimitive.Separator
      className={cn(
        'group relative flex w-2 shrink-0 cursor-col-resize items-stretch justify-center bg-[#05080A]',
        'transition hover:bg-[#18D6A3]/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#18D6A3]/45',
        'data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize',
        className,
      )}
      {...props}
    >
      <span className="my-5 block w-px rounded-full bg-white/10 transition group-hover:w-1 group-hover:bg-[#18D6A3]/70" />
      {withHandle ? (
        <span className="absolute left-1/2 top-1/2 grid h-8 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-[#111214] text-zinc-500 shadow-lg shadow-black/30">
          <GripVertical size={14} aria-hidden="true" />
          </span>
        ) : null}
      </ResizablePrimitive.Separator>
  )
}
