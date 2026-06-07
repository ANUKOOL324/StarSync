import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

type MessageInputProps = {
  disabled?: boolean
  roomName: string
  onStopTyping: () => void
  onSend: (message: string) => void
  onTyping: () => void
}

export function MessageInput({
  disabled,
  onSend,
  onStopTyping,
  onTyping,
  roomName,
}: MessageInputProps) {
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

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    isTypingRef.current = false

    onSend(message)
    onStopTyping()

    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = '44px'
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

    input.style.height = '44px'
    input.style.height = `${Math.min(input.scrollHeight, 132)}px`
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-white/10 bg-[#09090B]/95 px-4 py-3 shadow-[0_-22px_55px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-6"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className={[
          'mx-auto flex max-w-5xl items-end gap-2 rounded-2xl border bg-slate-950/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition duration-150',
          isFocused
            ? 'border-[#18D6A3]/30 bg-slate-950/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_55px_rgba(24,214,163,0.09)]'
            : 'border-white/10',
        ].join(' ')}
      >
        <textarea
          ref={inputRef}
          disabled={disabled}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${roomName}`}
          rows={1}
          className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500"
        />
        <button
          type="submit"
          disabled={disabled}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-[#18D6A3] text-[#03110E] shadow-[0_12px_30px_rgba(24,214,163,0.22)] transition duration-150 hover:-translate-y-0.5 hover:bg-[#35E0B4] hover:shadow-[0_14px_34px_rgba(245,158,11,0.12)] focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/35 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          aria-label="Send message"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
