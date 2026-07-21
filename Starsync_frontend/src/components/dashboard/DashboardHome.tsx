import { ChevronLeft, ChevronRight, Hash, Search } from 'lucide-react'

import { Card } from '../ui/card'
import { Input } from '../ui/Input'
import { StaticRoomCard, WorkspaceActionCard } from './DashboardCards'
import { workspaceTemplates } from './dashboardData'
import type { RoomPurpose, StaticRoomPreview } from './dashboardTypes'

type DashboardHomeProps = {
  filteredPreviewCount: number
  onNextPage: () => void
  onOpenCreate: (roomName?: string, purpose?: RoomPurpose) => void
  onOpenJoin: () => void
  onPreviousPage: () => void
  onSearchChange: (value: string) => void
  onSelectPage: (page: number) => void
  page: number
  pageSize: number
  searchQuery: string
  totalPages: number
  visiblePreviews: StaticRoomPreview[]
}

export function DashboardHome({
  filteredPreviewCount,
  onNextPage,
  onOpenCreate,
  onOpenJoin,
  onPreviousPage,
  onSearchChange,
  onSelectPage,
  page,
  pageSize,
  searchQuery,
  totalPages,
  visiblePreviews,
}: DashboardHomeProps) {
  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-[#F7F7F8] sm:text-4xl">StarSync Dashboard</h2>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <WorkspaceActionCard
          title="Join Room"
          description="Enter a room code to open an existing workspace."
          icon={<Hash size={16} aria-hidden="true" />}
          actionLabel="Enter Code"
          onClick={onOpenJoin}
        />
        {workspaceTemplates.map((template) => (
          <WorkspaceActionCard
            key={template.title}
            title={template.title}
            description={template.description}
            icon={template.icon}
            onClick={() => onOpenCreate(template.defaultRoomName, template.purpose)}
          />
        ))}
      </section>

      <section className="mt-8 space-y-5">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-[#F7F7F8]">Room Examples</h3>
        </div>
        <div className="grid gap-5 text-center">
          <div className="relative mx-auto w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#70817D]" aria-hidden="true" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search room examples..."
              className="h-12 w-full rounded-xl bg-black/22 pl-11 text-base placeholder:text-[#5F6B68] focus:border-[#57F1DB]/35"
            />
          </div>
        </div>

        {visiblePreviews.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePreviews.map((room) => (
              <StaticRoomCard
                key={room.title}
                room={room}
                onUseTemplate={() => onOpenCreate(
                  room.title,
                  room.roomType === 'Competitive Room' ? 'COMPETING' : 'COLLABORATIVE',
                )}
              />
            ))}
          </div>
        ) : (
          <Card className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#060A12]/76 p-6 text-center text-sm text-[#BACAC5]">
            No room examples match that search.
          </Card>
        )}

        {filteredPreviewCount > pageSize ? (
          <div className="flex flex-nowrap items-center justify-center gap-1.5 overflow-x-auto px-1 pt-2 sm:gap-3 sm:px-0">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={page === 1}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#8D9B97] transition hover:text-[#F7F7F8] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"
            >
              <ChevronLeft size={15} aria-hidden="true" />
              <span className="sm:hidden">Prev</span>
              <span className="hidden sm:inline">Previous</span>
            </button>
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onSelectPage(pageNumber)}
                  className={[
                    'grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border text-sm font-semibold transition sm:h-10 sm:w-10',
                    pageNumber === page
                      ? 'border-[#57F1DB]/35 bg-white/[0.055] text-[#D6FFF6]'
                      : 'border-transparent text-[#F7F7F8] hover:border-white/10 hover:bg-white/[0.035]',
                  ].join(' ')}
                >
                  {pageNumber}
                </button>
              )
            })}
            <button
              type="button"
              onClick={onNextPage}
              disabled={page === totalPages}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#F7F7F8] transition hover:text-[#D6FFF6] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"
            >
              Next
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
