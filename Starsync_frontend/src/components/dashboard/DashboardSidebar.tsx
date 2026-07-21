import { ChevronLeft, ChevronRight, Home, LayoutGrid, LogOut, X } from 'lucide-react'

import { Button } from '../ui/Button'
import type { DashboardTab } from './dashboardTypes'

type DashboardSidebarProps = {
  activeTab: DashboardTab
  isCollapsed: boolean
  isMobile: boolean
  onChangeTab: (tab: DashboardTab) => void
  onCloseMobile: () => void
  onLogout: () => void
  onToggleDesktop: () => void
}

const navItems = [
  { icon: Home, id: 'home' as const, label: 'Workspace' },
  { icon: LayoutGrid, id: 'rooms' as const, label: 'Rooms' },
]

export function DashboardSidebar({
  activeTab,
  isCollapsed,
  isMobile,
  onChangeTab,
  onCloseMobile,
  onLogout,
  onToggleDesktop,
}: DashboardSidebarProps) {
  return (
    <>
      <div className="flex w-full items-center justify-between border-b border-white/8 pb-6">
        <div className="flex min-w-0 items-center gap-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/3 shadow-lg shadow-black/30">
            <img src="/starsync-logo.png" alt="StarSync logo" className="h-9 w-9 rounded-full object-cover" />
          </span>
          <span className={[
            'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
            isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-24 opacity-100',
          ].join(' ')}>
            <p className="bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-lg font-normal leading-none tracking-[-0.06em] text-transparent">
              StarSync
            </p>
          </span>
        </div>

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#8D9B97] transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 py-6">
        {navItems.map(({ icon: Icon, id, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              title={isCollapsed ? label : undefined}
              className={[
                'flex w-full cursor-pointer items-center gap-0 rounded-xl border px-3.5 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'border-r-2 border-[#57F1DB] border-y-white/8 border-l-white/8 bg-white/[0.055] text-[#D6FFF6]'
                  : 'border-transparent text-[#95A5A0] hover:border-white/8 hover:bg-white/[0.035] hover:text-white',
              ].join(' ')}
            >
              <Icon size={17} className="shrink-0" aria-hidden="true" />
              <span className={[
                'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
                isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-24 opacity-100',
              ].join(' ')}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/8 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onLogout}
          className="w-full gap-0 px-3.5 py-2.5 text-xs !justify-start cursor-pointer transition-all duration-300 ease-in-out"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={14} className="shrink-0" aria-hidden="true" />
          <span className={[
            'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
            isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-2.5 w-14 opacity-100',
          ].join(' ')}>
            Logout
          </span>
        </Button>
      </div>

      {!isMobile ? (
        <button
          type="button"
          onClick={onToggleDesktop}
          className="absolute right-0 top-1/2 z-[80] grid size-9 -translate-y-1/2 translate-x-1/2 cursor-pointer place-items-center rounded-full border border-white/12 bg-[#141820] text-[#D6FFF6] shadow-xl shadow-black/45 transition hover:border-[#57F1DB]/45 hover:bg-[#1C232A]"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
        </button>
      ) : null}
    </>
  )
}
