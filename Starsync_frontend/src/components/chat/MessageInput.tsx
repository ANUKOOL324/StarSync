import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

type MessageInputProps = {
  disabled?: boolean
  roomName?: string
  onStopTyping: () => void
  onSend: (message: string) => void
  onTyping: () => void
  sendButtonVariant?: 'default' | 'competing'
  variant?: 'default' | 'sidebar'
}

const INPUT_HEIGHT = {
  default: { min: 44, max: 120 },
  sidebar: { min: 40, max: 96 },
} as const

export function MessageInput({
  disabled,
  onSend,
  onStopTyping,
  onTyping,
  sendButtonVariant = 'default',
  variant = 'default',
}: MessageInputProps) {
  const heightLimits = INPUT_HEIGHT[variant]
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const typingTimeoutRef = useRef<number | null>(null)
  const isTypingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = inputRef.current?.value ?? ''
    const trimmedMessage = message.trim()

    if (disabled || !trimmedMessage) {
      return
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    isTypingRef.current = false

    onSend(trimmedMessage)
    onStopTyping()

    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = `${heightLimits.min}px`
      inputRef.current.style.overflowY = 'hidden'
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const handleInput = () => {
    const input = inputRef.current

    if (!input) return

    const hasText = !!input.value.trim()

    if (hasText) {
      if (!isTypingRef.current) {
        isTypingRef.current = true
        onTyping()
      } else {
        onTyping()
      }

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        isTypingRef.current = false
        onStopTyping()
      }, 1500)
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false
        if (typingTimeoutRef.current) {
          window.clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }
        onStopTyping()
      }
    }

    input.style.height = `${heightLimits.min}px`
    const nextHeight = Math.min(input.scrollHeight, heightLimits.max)
    input.style.height = `${nextHeight}px`
    input.style.overflowY = input.scrollHeight > heightLimits.max ? 'auto' : 'hidden'
  }

  const isSidebar = variant === 'sidebar'
  const isCompetingSendButton = sendButtonVariant === 'competing'
  const sendButtonSizeClass = isSidebar ? 'size-9' : 'size-10'
  const sendIconSize = isSidebar ? 16 : 17

  const sendButton = (
    <button
      type="submit"
      disabled={disabled}
      className={[
        'grid shrink-0 place-items-center transition duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45',
        isCompetingSendButton
          ? [
              sendButtonSizeClass,
              'rounded-[11px] border-0 bg-[#18181B]/78 text-[#18D6A3] backdrop-blur-2xl hover:bg-[#18D6A3]/08 hover:text-[#18D6A3] active:scale-[0.97] active:bg-[#18D6A3]/16 active:text-[#35E0B4] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] disabled:hover:bg-[#18181B]/78 disabled:active:scale-100',
            ].join(' ')
          : [
              sendButtonSizeClass,
              'rounded-xl border border-white/15 bg-[#18D6A3] text-[#03110E] shadow-[0_12px_30px_rgba(24,214,163,0.22)] hover:-translate-y-0.5 hover:bg-[#35E0B4] hover:shadow-[0_14px_34px_rgba(245,158,11,0.12)] focus:ring-2 focus:ring-[#18D6A3]/35 active:translate-y-0 active:scale-[0.98] disabled:hover:translate-y-0',
            ].join(' '),
      ].join(' ')}
      aria-label="Send message"
    >
      <Send size={sendIconSize} aria-hidden="true" />
    </button>
  )

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        'shrink-0 border-t border-white/10 bg-[#09090B]/95 backdrop-blur-xl',
        isSidebar ? 'px-3 py-2' : 'px-4 py-3 shadow-[0_-22px_55px_rgba(0,0,0,0.22)] sm:px-6',
      ].join(' ')}
      style={{ paddingBottom: isSidebar ? 'max(0.5rem, env(safe-area-inset-bottom))' : 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className={[
          'flex items-end gap-2 rounded-2xl border bg-slate-950/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition duration-150',
          isSidebar ? 'w-full' : 'mx-auto max-w-5xl',
          isFocused
            ? 'border-[#18D6A3]/30 bg-slate-950/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_55px_rgba(24,214,163,0.09)]'
            : 'border-white/10',
        ].join(' ')}
      >
        <textarea
          ref={inputRef}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Lets chat !"
          rows={1}
          style={{ height: `${heightLimits.min}px` }}
          className={[
            'min-w-0 flex-1 resize-none overflow-y-hidden bg-transparent px-3 py-2 text-sm leading-5 text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500',
            isSidebar ? 'min-h-10' : 'min-h-11 leading-6',
          ].join(' ')}
        />
        {isCompetingSendButton ? (
          <span className="inline-flex shrink-0 rounded-xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-px shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-150 hover:via-white/20">
            {sendButton}
          </span>
        ) : (
          sendButton
        )}
      </div>
      {disabled ? (
        <p className={['mt-2 px-1 text-xs text-slate-500', isSidebar ? '' : 'mx-auto max-w-5xl'].join(' ')}>
          Connecting... messages can be sent once the room is live.
        </p>
      ) : null}
    </form>
  )
}
