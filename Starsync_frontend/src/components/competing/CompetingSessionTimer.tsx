import { Clock3, Play, RotateCcw, StopCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Input } from '../ui/Input'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import type { SessionStatus } from './competingTypes'
import { clampTimerPart, formatSessionClock, toSessionSeconds } from './competingUtils'

function TimerButtonTooltip({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={6}
        hideArrow
        className="rounded-md border border-white/12 bg-[#3a3a3c] px-2.5 py-1 text-[11px] font-medium leading-none text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function CompetingSessionTimer({
  canManage,
  draftHours,
  draftMinutes,
  onDraftHoursChange,
  onDraftMinutesChange,
  onReset,
  onStart,
  onEnd,
  remainingSeconds,
  sessionStatus,
}: {
  canManage: boolean
  draftHours: number
  draftMinutes: number
  onDraftHoursChange: (hours: number) => void
  onDraftMinutesChange: (minutes: number) => void
  onReset: () => void
  onStart: () => void
  onEnd?: () => void
  remainingSeconds: number
  sessionStatus: SessionStatus
}) {
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false)
  const isRunning = sessionStatus === 'running'
  const isEnded = sessionStatus === 'ended'
  const draftSeconds = toSessionSeconds(draftHours, draftMinutes)
  const clockSeconds = isRunning || isEnded ? remainingSeconds : draftSeconds
  const clockLabel = formatSessionClock(clockSeconds)
  const canStart = draftSeconds > 0

  const applyDraftFromInputs = (hours: number, minutes: number) => {
    const nextHours = clampTimerPart(hours, 0, 23)
    let nextMinutes = clampTimerPart(minutes, 0, 59)

    if (nextHours === 0 && nextMinutes === 0) {
      nextMinutes = 1
    }

    onDraftHoursChange(nextHours)
    onDraftMinutesChange(nextMinutes)
  }

  if (!canManage) {
    return (
      <span className="inline-flex shrink-0 rounded-md bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-px shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-200 hover:via-white/20">
        <div className="flex shrink-0 items-center gap-1.5 rounded-[5px] bg-[#18181B]/78 px-2 py-1.5 backdrop-blur-2xl sm:gap-2 sm:px-2.5">
          <Clock3 size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="font-mono text-xs font-semibold tabular-nums text-white sm:text-sm">{clockLabel}</span>
          {sessionStatus === 'waiting' ? (
            <span className="hidden text-xs text-slate-500 sm:inline">Waiting</span>
          ) : null}
          {isEnded ? <span className="text-[11px] text-amber-200 sm:text-xs">Ended</span> : null}
        </div>
      </span>
    )
  }

  return (
    <span className="inline-flex shrink-0 rounded-md bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-px shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-200 hover:via-white/20">
      <div className="flex shrink-0 items-center gap-0.5 rounded-[5px] bg-[#18181B]/78 p-0.5 backdrop-blur-2xl">
      <TimerButtonTooltip label="Start">
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0 sm:size-8"
            onClick={onStart}
            disabled={isRunning || !canStart}
            aria-label="Start session timer"
          >
            <Play size={14} aria-hidden="true" />
          </Button>
        </span>
      </TimerButtonTooltip>

      <DropdownMenu open={isTimerMenuOpen} onOpenChange={setIsTimerMenuOpen}>
        <TimerButtonTooltip label="Set timer">
          <DropdownMenuTrigger asChild disabled={isRunning}>
            <button
              type="button"
              className={[
                'min-w-[68px] rounded-md px-1.5 py-1 font-mono text-xs tabular-nums transition sm:min-w-[84px] sm:px-2 sm:text-sm',
                isRunning
                  ? 'font-semibold text-white'
                  : isEnded
                    ? 'font-semibold text-slate-400'
                    : 'font-semibold text-white hover:bg-white/[0.05]',
                isRunning ? 'cursor-default' : 'cursor-pointer',
              ].join(' ')}
              aria-label="Set session timer"
            >
              {clockLabel}
            </button>
          </DropdownMenuTrigger>
        </TimerButtonTooltip>
        <DropdownMenuContent
          align="center"
          side="bottom"
          sideOffset={10}
          collisionPadding={12}
          className="w-[220px] overflow-visible border-none bg-transparent p-0 text-slate-200 shadow-none data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:duration-200 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 data-[state=open]:zoom-in-95"
        >
          <div className="overflow-hidden rounded-2xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="overflow-hidden rounded-[14px] bg-[#18181B]/78 backdrop-blur-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <span className="grid size-7 place-items-center rounded-full border border-amber-300/20 bg-amber-400/10 text-amber-200">
                  <Clock3 size={14} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">Session timer</p>
                </div>
              </div>

              <div className="space-y-3 px-3 py-3">
                <div className="flex items-center justify-center gap-3">
                  <label className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">hr</span>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={draftHours}
                      onChange={(event) => {
                        applyDraftFromInputs(Number(event.target.value), draftMinutes)
                      }}
                      className="h-9 w-14 border-white/10 bg-white/4 text-center font-mono text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </label>
                  <label className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">min</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={draftMinutes}
                      onChange={(event) => {
                        applyDraftFromInputs(draftHours, Number(event.target.value))
                      }}
                      className="h-9 w-14 border-white/10 bg-white/4 text-center font-mono text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </label>
                </div>

                <TimerButtonTooltip label="Start">
                  <span className="inline-flex w-full">
                    <button
                      type="button"
                      disabled={!canStart}
                      onClick={() => {
                        onStart()
                        setIsTimerMenuOpen(false)
                      }}
                      className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 border-white/10 bg-[#18181B]/90 px-5 text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:border-white/20 active:bg-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play size={14} aria-hidden="true" />
                      Start Timer
                    </button>
                  </span>
                </TimerButtonTooltip>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <TimerButtonTooltip label="End">
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 sm:size-8"
            onClick={onEnd}
            disabled={!isRunning}
            aria-label="End session timer"
          >
            <StopCircle size={14} aria-hidden="true" />
          </Button>
        </span>
      </TimerButtonTooltip>

      <TimerButtonTooltip label="Reset">
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0 border-0 text-slate-300 hover:bg-white/8 hover:text-white sm:size-8"
            onClick={onReset}
            disabled={!isRunning && !isEnded}
            aria-label="Reset session timer"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </Button>
        </span>
      </TimerButtonTooltip>
      </div>
    </span>
  )
}
