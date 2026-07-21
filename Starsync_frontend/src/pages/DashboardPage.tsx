import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CreateRoomDialog } from '../components/dashboard/CreateRoomDialog'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { DashboardHome } from '../components/dashboard/DashboardHome'
import { DashboardRooms } from '../components/dashboard/DashboardRooms'
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { JoinRoomDialog } from '../components/dashboard/JoinRoomDialog'
import { roomPreviewPageSize, staticRoomPreviews } from '../components/dashboard/dashboardData'
import type { DashboardTab, RoomPurpose } from '../components/dashboard/dashboardTypes'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'
import type { CreateRoomPayload } from '../services/roomService'

export function DashboardPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { createRoom, isLoadingRooms, joinRoom, roomError, rooms } = useRooms()
  const [activeTab, setActiveTab] = useState<DashboardTab>('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createRoomPurpose, setCreateRoomPurpose] = useState<RoomPurpose>('COLLABORATIVE')
  const [defaultRoomName, setDefaultRoomName] = useState('')
  const [roomSearchQuery, setRoomSearchQuery] = useState('')
  const [previewSearchQuery, setPreviewSearchQuery] = useState('')
  const [previewPage, setPreviewPage] = useState(1)

  const createdRoomsCount = rooms.filter((room) => room.adminId === user?.id).length
  const joinedRoomsCount = rooms.filter((room) => room.adminId !== user?.id).length

  const filteredRooms = useMemo(() => {
    const query = roomSearchQuery.trim().toLowerCase()
    return rooms.filter((room) => !query || room.name.toLowerCase().includes(query) || (room.joinCode ?? '').toLowerCase().includes(query))
  }, [roomSearchQuery, rooms])

  const filteredPreviews = useMemo(() => {
    const query = previewSearchQuery.trim().toLowerCase()
    return staticRoomPreviews.filter((room) => !query || [room.title, room.roomType, room.description].some((value) => value.toLowerCase().includes(query)))
  }, [previewSearchQuery])

  const totalPreviewPages = Math.max(1, Math.ceil(filteredPreviews.length / roomPreviewPageSize))
  const previewStartIndex = (previewPage - 1) * roomPreviewPageSize
  const visiblePreviews = filteredPreviews.slice(previewStartIndex, previewStartIndex + roomPreviewPageSize)

  const changeTab = (tab: DashboardTab) => {
    setActiveTab(tab)
    setIsSidebarOpen(false)
  }

  const openCreateDialog = (roomName = '', purpose: RoomPurpose = 'COLLABORATIVE') => {
    setDefaultRoomName(roomName)
    setCreateRoomPurpose(purpose)
    setIsCreateModalOpen(true)
  }

  const handleJoin = (roomCode: string) => joinRoom(roomCode)
  const handleCreate = (payload: CreateRoomPayload) => createRoom(payload)

  const mainContent = (showMobileMenu: boolean) => (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardHeader activeTab={activeTab} onOpenSidebar={() => setIsSidebarOpen(true)} showMobileMenu={showMobileMenu} user={user} />
      <main className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="dashboard-workspace-field" />
        <div className="relative z-10 mx-auto w-full max-w-[1480px] space-y-8 px-4 pb-14 pt-6 sm:px-8 sm:pt-7 lg:px-10 xl:px-12">
          {activeTab === 'home' ? (
            <DashboardHome
              filteredPreviewCount={filteredPreviews.length}
              onNextPage={() => setPreviewPage((page) => Math.min(page + 1, totalPreviewPages))}
              onOpenCreate={openCreateDialog}
              onOpenJoin={() => setIsJoinModalOpen(true)}
              onPreviousPage={() => setPreviewPage((page) => Math.max(page - 1, 1))}
              onSearchChange={(value) => {
                setPreviewSearchQuery(value)
                setPreviewPage(1)
              }}
              onSelectPage={setPreviewPage}
              page={previewPage}
              pageSize={roomPreviewPageSize}
              searchQuery={previewSearchQuery}
              totalPages={totalPreviewPages}
              visiblePreviews={visiblePreviews}
            />
          ) : (
            <DashboardRooms
              createdCount={createdRoomsCount}
              isLoading={isLoadingRooms}
              joinedCount={joinedRoomsCount}
              onOpenRoom={(room) => navigate(`/rooms/${room.id}`, { state: { purpose: room.purpose } })}
              onSearchChange={setRoomSearchQuery}
              roomError={roomError}
              rooms={filteredRooms}
              searchQuery={roomSearchQuery}
            />
          )}
        </div>
      </main>
    </div>
  )

  return (
    <section className="relative flex h-dvh overflow-hidden bg-black text-[#E5E1E4]">
      {isSidebarOpen ? (
        <button type="button" className="fixed inset-0 z-40 cursor-default border-none bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar backdrop" />
      ) : null}

      <aside className={[
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/8 bg-[#07090A]/92 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl transition-transform duration-300 lg:hidden',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <DashboardSidebar activeTab={activeTab} isCollapsed={false} isMobile onChangeTab={changeTab} onCloseMobile={() => setIsSidebarOpen(false)} onLogout={logout} onToggleDesktop={() => undefined} />
      </aside>

      <div className="relative z-10 hidden min-w-0 flex-1 lg:flex">
        <aside className={[
          'relative z-40 flex h-full shrink-0 flex-col overflow-visible border-r border-white/8 bg-[#07090A]/92 px-3.5 py-5 shadow-2xl shadow-black/35 backdrop-blur-2xl transition-[width] duration-300',
          isDesktopSidebarCollapsed ? 'w-[5rem]' : 'w-48',
        ].join(' ')}>
          <DashboardSidebar activeTab={activeTab} isCollapsed={isDesktopSidebarCollapsed} isMobile={false} onChangeTab={changeTab} onCloseMobile={() => undefined} onLogout={logout} onToggleDesktop={() => setIsDesktopSidebarCollapsed((value) => !value)} />
        </aside>
        {mainContent(false)}
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:hidden">{mainContent(true)}</div>
      <JoinRoomDialog isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} onJoin={handleJoin} onJoined={(room) => navigate(`/rooms/${room.id}`, { state: { purpose: room.purpose } })} />
      {isCreateModalOpen ? (
        <CreateRoomDialog initialRoomName={defaultRoomName} isOpen onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreate} onCreated={(room) => navigate(`/rooms/${room.id}`, { state: { purpose: room.purpose } })} purpose={createRoomPurpose} />
      ) : null}
    </section>
  )
}
