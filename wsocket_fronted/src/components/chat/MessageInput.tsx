import { Send } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

type MessageInputProps = {
  disabled?: boolean
  roomName: string
  onSend: (message: string) => void
}

export function MessageInput({ disabled, onSend, roomName }: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = inputRef.current?.value ?? ''

    onSend(message)

    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/8 bg-black/35 px-4 py-3 shadow-[0_-18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-6"
    >
      <div
        className={[
          'mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border bg-white/7 p-1.5 transition',
          isFocused ? 'border-teal-300/50 shadow-lg shadow-teal-500/10' : 'border-white/10',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          disabled={disabled}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          placeholder={`Message ${roomName}`}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled}
          className="grid size-10 place-items-center rounded-xl bg-teal-300 text-zinc-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Send message"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
