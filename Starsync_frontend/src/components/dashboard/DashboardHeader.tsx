import { ArrowRight, Bell, Menu, Settings } from 'lucide-react'

import type { ChatUser } from '../../types/chat'
import { Avatar } from '../ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import type { DashboardTab } from './dashboardTypes'

type DashboardHeaderProps = {
  activeTab: DashboardTab
  onOpenSidebar: () => void
  showMobileMenu: boolean
  user: ChatUser | null | undefined
}

export function DashboardHeader({ activeTab, onOpenSidebar, showMobileMenu, user }: DashboardHeaderProps) {
  const displayName = user?.username ?? 'User'
  const avatarSeed = user?.username ?? user?.email ?? 'user'

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#030404]/95 px-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:h-20 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {showMobileMenu ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-[#95A5A0] transition hover:text-white lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        ) : null}
        <h1 className="truncate text-lg font-semibold tracking-tight text-[#F7F7F8] sm:text-xl">
          {activeTab === 'home' ? 'Workspace' : 'Rooms'}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="grid size-9 cursor-pointer place-items-center rounded-xl border border-white/10 bg-white/3 text-[#BACAC5] transition hover:border-[#57F1DB]/35 hover:text-white sm:size-10"
          aria-label="Notifications"
        >
          <Bell size={17} aria-hidden="true" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cursor-pointer rounded-full outline-none transition duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#57F1DB]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030404] active:scale-95"
              aria-label="Open user menu"
            >
              <Avatar name={displayName} seed={avatarSeed} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={12}
            className="z-[80] w-[min(17rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-white/14 bg-[#0D0E10]/98 p-[1px] text-white shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="rounded-[15px] bg-[#18181B]/92 p-3.5">
              <div className="flex min-w-0 items-center gap-3 border-b border-white/10 pb-3">
                <Avatar name={displayName} seed={avatarSeed} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F7F7F8]">{displayName}</p>
                  <p className="truncate text-xs leading-5 text-[#9AA7A3]">{user?.email ?? 'No email available'}</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold text-[#D6FFF6] transition duration-200 hover:border-[#57F1DB]/35 hover:bg-[#57F1DB]/10 active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <Settings size={15} aria-hidden="true" />
                  Settings
                </span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
