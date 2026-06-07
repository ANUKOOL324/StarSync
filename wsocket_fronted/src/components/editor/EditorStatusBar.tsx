import { Circle, Wifi, WifiOff } from 'lucide-react'

import type { SaveStatus } from '../../types/editor'

type EditorStatusBarProps = {
  connectionStatus: 'connecting' | 'online' | 'offline'
  language: string
  remoteUserName?: string | null
  saveStatus: SaveStatus
}

export function EditorStatusBar({
  connectionStatus,
  language,
  remoteUserName,
  saveStatus,
}: EditorStatusBarProps) {
  const isOnline = connectionStatus === 'online'
  const ConnectionIcon = isOnline ? Wifi : WifiOff
  const connectionLabel = connectionStatus === 'offline'
    ? 'Offline / disconnected'
    : connectionStatus
  const saveLabel = (() => {
    if (saveStatus === 'remote' && remoteUserName) return `Updated by ${remoteUserName}`
    if (saveStatus === 'syncing') return 'Syncing...'
    if (saveStatus === 'unsaved') return 'Unsaved'
    if (saveStatus === 'saving') return 'Saving...'
    if (saveStatus === 'saved') return 'Saved'
    if (saveStatus === 'error') return 'Save failed'

    return 'Ready'
  })()

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#05080A]/80 px-3 py-2 text-xs text-slate-500 backdrop-blur-xl sm:px-4">
      <div className="flex items-center gap-2">
        <ConnectionIcon
          size={14}
          className={isOnline ? 'text-[#22C55E]' : 'text-red-300'}
          aria-hidden="true"
        />
        <span className="capitalize">{connectionLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <Circle size={8} className="fill-[#18D6A3] text-[#18D6A3]" aria-hidden="true" />
        <span className="capitalize">{language}</span>
        <span className="text-slate-700">/</span>
        <span>{saveLabel}</span>
      </div>
    </div>
  )
}
