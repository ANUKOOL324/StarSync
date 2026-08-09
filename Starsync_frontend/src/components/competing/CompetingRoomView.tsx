import { Check, Copy, LogOut, MoreVertical, Trash2, Trophy, X } from 'lucide-react'
import type { ChatRoom } from '../../types/chat'
import { Button } from '../ui/Button'
import { Dialog, DialogContent } from '../ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Modal } from '../ui/Modal'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { TooltipProvider } from '../ui/tooltip'
import { CompetingEditorPanel } from './CompetingEditorPanel'
import { CompetingMembersAndChatPanel } from './CompetingMembersAndChatPanel'
import { PROBLEM_PANEL_COLLAPSED_SIZE_PX, PROBLEM_PANEL_EXPANDED_MIN_SIZE_PX, SESSION_PANEL_COLLAPSED_SIZE_PX, SESSION_PANEL_EXPANDED_MIN_SIZE_PX } from './CompetingPanelRails'
import { CompetingProblemPanel } from './CompetingProblemPanel'
import { CompetingSessionTimer } from './CompetingSessionTimer'
import { toSessionSeconds } from './competingUtils'
import type { CompetingRoomWorkspaceState } from './useCompetingRoomWorkspaceState'

type CompetingRoomViewProps = { room: ChatRoom; state: CompetingRoomWorkspaceState }

export function CompetingRoomView({ room, state }: CompetingRoomViewProps) {
  const {
    assignedProblems, canManageTimer, connectionStatus, copyStatus, draftHours, draftMinutes,
    fetchSubmissions, handleCopyRoomCode, handleDeleteRoom, handleEndTimer, handleLeaveRoom,
    handlePanelLayoutChanged, handleProblemPanelExpand, handleProblemPanelResize, handleResetTimer,
    handleSessionPanelExpand, handleSessionPanelResize, handleStartTimer, hasMoreMessages, isAdmin,
    isInviteDialogOpen, isLoadingHistory, isLoadingOlder, isLoadingProblems, isProblemPanelCollapsed,
    isSessionPanelCollapsed, loadOlderMessages, members, membersError, messages, onlineUsers,
    problemLoadError, problemPanelRef, problemPanelTab, remainingSeconds, retryMessage, roomDisplay,
    selectedProblem, selectedProblemRunId, sendMessage, sendStopTyping, sendTyping, sessionPanelRef,
    sessionPanelTab, sessionStatus, setCopyStatus, setDraftHours, setDraftMinutes, setIsInviteDialogOpen,
    setProblemPanelTab, setRemainingSeconds, setSelectedProblemId, setSessionPanelTab, setShowEndedModal,
    showEndedModal, submissions, typingUsers,
  } = state

  return (
    <TooltipProvider>
      <section className="competing-room-ui flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#05070A] text-[#E5E1E4]">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#060A10]/95 px-2 py-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:gap-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-1 sm:gap-3 sm:pr-0">
            <button
              type="button"
              disabled
              className="hidden size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-slate-400 transition-all duration-200 cursor-default disabled:opacity-100 disabled:pointer-events-none disabled:border-white/10 disabled:bg-white/[0.035] disabled:shadow-none sm:grid"
              aria-label="Back to dashboard"
            >
              <img src="/starsync-logo.png" alt="StarSync" className="size-5 rounded-full object-cover" />
            </button>

            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-white sm:text-[15px]">
              {roomDisplay.displayName}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <CompetingSessionTimer
              canManage={canManageTimer}
              draftHours={draftHours}
              draftMinutes={draftMinutes}
              onDraftHoursChange={(hours) => {
                setDraftHours(hours)

                if (sessionStatus === 'waiting') {
                  setRemainingSeconds(toSessionSeconds(hours, draftMinutes))
                }
              }}
              onDraftMinutesChange={(minutes) => {
                setDraftMinutes(minutes)

                if (sessionStatus === 'waiting') {
                  setRemainingSeconds(toSessionSeconds(draftHours, minutes))
                }
              }}
              onStart={handleStartTimer}
              onReset={handleResetTimer}
              onEnd={handleEndTimer}
              remainingSeconds={remainingSeconds}
              sessionStatus={sessionStatus}
            />
            <span className="hidden shrink-0 rounded-md bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-px shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-200 hover:via-white/20 lg:inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-3.5 font-semibold !rounded-[5px] !border-0 !bg-[#18181B]/78 !text-[#18D6A3] backdrop-blur-2xl transition-all duration-200 hover:!bg-[#18D6A3]/08 hover:!text-[#18D6A3] sm:h-9"
                onClick={() => {
                  setCopyStatus('idle')
                  setIsInviteDialogOpen(true)
                }}
              >
                Invite
              </Button>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open room menu"
                  className="rounded-full border-white/10 bg-white/[0.035] text-slate-300 shadow-none hover:border-[#18D6A3]/40 hover:shadow-[0_0_12px_rgba(24,214,163,0.25)] active:border-[#18D6A3]/60 active:shadow-[0_0_14px_rgba(24,214,163,0.35)] focus-visible:border-white/10 focus-visible:ring-0 data-[state=open]:border-white/10 data-[state=open]:bg-white/[0.035]"
                >
                  <MoreVertical size={15} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-white/10 bg-[#111113] text-slate-200">
                <DropdownMenuItem
                  onSelect={() => {
                    setCopyStatus('idle')
                    setIsInviteDialogOpen(true)
                  }}
                  className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-white/5 hover:text-white active:scale-95 transition transform duration-100 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/30 lg:hidden"
                >
                  Invite
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleLeaveRoom}
                  className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-white/5 hover:text-white active:scale-95 transition transform duration-100 focus:outline-none focus:ring-2 focus:ring-[#18D6A3]/30"
                >
                  <LogOut size={14} aria-hidden="true" />
                  Leave room
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem
                    onSelect={handleDeleteRoom}
                    className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded text-red-400 hover:bg-red-900/30 hover:text-red-200 active:scale-95 transition transform duration-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Delete room
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>



        {membersError ? (
          <div className="shrink-0 border-b border-amber-300/20 bg-amber-950/20 px-4 py-2 text-xs text-amber-100">
            {membersError}
          </div>
        ) : null}

        <div className="hidden min-h-0 flex-1 overflow-hidden xl:block">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full min-h-0 w-full min-w-0 overflow-hidden"
            key={`competing-layout-${room.id}`}
            onLayoutChanged={handlePanelLayoutChanged}
          >
            <ResizablePanel
              id="competing-problem-panel"
              defaultSize="32%"
              minSize={`${PROBLEM_PANEL_EXPANDED_MIN_SIZE_PX}px`}
              maxSize="45%"
              collapsible
              collapsedSize={`${PROBLEM_PANEL_COLLAPSED_SIZE_PX}px`}
              panelRef={problemPanelRef}
              onResize={handleProblemPanelResize}
              groupResizeBehavior="preserve-pixel-size"
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <div className="h-full min-h-0 min-w-0 overflow-hidden">
                <CompetingProblemPanel
                  problems={assignedProblems}
                  isLoadingProblems={isLoadingProblems}
                  problemLoadError={problemLoadError}
                  activeTab={problemPanelTab}
                  onActiveTabChange={setProblemPanelTab}
                  isCollapsed={isProblemPanelCollapsed}
                  onExpandRequest={handleProblemPanelExpand}
                  selectedProblemId={selectedProblem?.id ?? null}
                  onSelectedProblemIdChange={setSelectedProblemId}
                  submissions={submissions}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="z-20 w-1.5 border-x border-white/5 bg-[#1a1a1c] transition hover:bg-[#2a2a2e] active:bg-[#303033] focus-visible:ring-1 focus-visible:ring-white/15 focus-visible:ring-offset-0"
            />
            <ResizablePanel
              id="competing-editor-panel"
              defaultSize="44%"
              minSize="30%"
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <CompetingEditorPanel competingProblemId={selectedProblemRunId} connectionStatus={connectionStatus} room={room} />
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="z-20 w-1.5 border-x border-white/5 bg-[#1a1a1c] transition hover:bg-[#2a2a2e] active:bg-[#303033] focus-visible:ring-1 focus-visible:ring-white/15 focus-visible:ring-offset-0"
            />
            <ResizablePanel
              id="competing-session-panel"
              defaultSize="24%"
              minSize={`${SESSION_PANEL_EXPANDED_MIN_SIZE_PX}px`}
              maxSize="38%"
              collapsible
              collapsedSize={`${SESSION_PANEL_COLLAPSED_SIZE_PX}px`}
              panelRef={sessionPanelRef}
              onResize={handleSessionPanelResize}
              groupResizeBehavior="preserve-pixel-size"
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <div className="h-full min-h-0 min-w-0 overflow-hidden">
                <CompetingMembersAndChatPanel
                  connectionStatus={connectionStatus}
                  hasMoreMessages={hasMoreMessages}
                  isLoadingHistory={isLoadingHistory}
                  isLoadingOlder={isLoadingOlder}
                  loadOlderMessages={loadOlderMessages}
                  members={members}
                  messages={messages}
                  onlineUsers={onlineUsers}
                  retryMessage={retryMessage}
                  room={room}
                  sendMessage={sendMessage}
                  sendStopTyping={sendStopTyping}
                  sendTyping={sendTyping}
                  typingUsers={typingUsers}
                  activeTab={sessionPanelTab}
                  onActiveTabChange={setSessionPanelTab}
                  isCollapsed={isSessionPanelCollapsed}
                  onExpandRequest={handleSessionPanelExpand}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <Modal
          isOpen={showEndedModal}
          onClose={() => setShowEndedModal(false)}
          title=""
          hideHeader
          size="sm"
          className="rounded-3xl p-0 bg-transparent"
        >
          <div className="relative w-full overflow-hidden rounded-2xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="relative rounded-[14px] bg-[#18181B]/78 p-0 backdrop-blur-2xl text-center overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-linear-to-b from-white/6 to-transparent px-4 py-3">
                <h3 className="text-lg font-bold text-[#F7F7F8]">Contest Ended<span className="ml-2 text-white">!</span></h3>
                <button
                  type="button"
                  onClick={() => setShowEndedModal(false)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-lg border border-white/15 bg-linear-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#D6FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] mx-auto">
                <Trophy size={26} />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-[#F7F7F8]">The contest has ended</h3>
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEndedModal(false)}
                    className="inline-flex min-w-32 items-center justify-center cursor-pointer rounded-full border-2 border-white/10 bg-[#18181B]/90 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:border-white/20 active:bg-[#0A0A0A]"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <Tabs defaultValue="problem" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3 xl:hidden">
          <TabsList variant="competing" className="grid h-9 w-full shrink-0 grid-cols-3">
            <TabsTrigger
              value="problem"
              className="px-2 text-xs sm:text-sm border border-transparent data-[state=active]:!border-blue-500/40 data-[state=active]:!bg-blue-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-150"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="px-2 text-xs sm:text-sm border border-transparent data-[state=active]:!border-blue-500/40 data-[state=active]:!bg-blue-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-150"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="px-2 text-xs sm:text-sm border border-transparent data-[state=active]:!border-emerald-500/40 data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-150"
            >
              Chat
            </TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-hidden">
          <TabsContent value="problem" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <CompetingProblemPanel
              problems={assignedProblems}
              isLoadingProblems={isLoadingProblems}
              problemLoadError={problemLoadError}
              selectedProblemId={selectedProblem?.id ?? null}
              onSelectedProblemIdChange={setSelectedProblemId}
              submissions={submissions}
            />
          </TabsContent>

          <TabsContent value="editor" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <CompetingEditorPanel competingProblemId={selectedProblemRunId} connectionStatus={connectionStatus} room={room} onSubmitSuccess={fetchSubmissions} />
          </TabsContent>

          <TabsContent value="chat" className="m-0 h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <CompetingMembersAndChatPanel
              connectionStatus={connectionStatus}
              hasMoreMessages={hasMoreMessages}
              isLoadingHistory={isLoadingHistory}
              isLoadingOlder={isLoadingOlder}
              loadOlderMessages={loadOlderMessages}
              members={members}
              messages={messages}
              onlineUsers={onlineUsers}
              retryMessage={retryMessage}
              room={room}
              sendMessage={sendMessage}
              sendStopTyping={sendStopTyping}
              sendTyping={sendTyping}
              typingUsers={typingUsers}
            />
          </TabsContent>
          </div>
        </Tabs>

        <Dialog
          open={isInviteDialogOpen}
          onOpenChange={(isOpen) => {
            setIsInviteDialogOpen(isOpen)
            if (isOpen) {
              setCopyStatus('idle')
            }
          }}
        >
          <DialogContent
            overlayClassName="bg-black/35 backdrop-blur-md data-[state=open]:backdrop-blur-md"
            className="!border-none !bg-transparent !shadow-none !p-0 max-w-sm"
            showCloseButton={false}
          >
            <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl shadow-black/50">
              <div className="relative w-full overflow-hidden rounded-2xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
                <div className="relative rounded-[14px] bg-[#18181B]/78 p-0 backdrop-blur-2xl text-center overflow-hidden">
                  <div className="flex items-center justify-between gap-3 bg-linear-to-b from-white/6 to-transparent px-4 py-3">
                    <h3 className="text-lg font-bold text-[#F7F7F8]">Invite Teammates</h3>
                    <button
                      type="button"
                      onClick={() => setIsInviteDialogOpen(false)}
                      aria-label="Close"
                      className="grid size-9 place-items-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-6 text-center space-y-4">
                    <p className="text-xs text-slate-400">
                      Share this code with teammates
                    </p>

                    <div className="mx-auto w-48 h-16 flex flex-col items-center justify-center rounded-lg border border-white/15 bg-linear-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#D6FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                      <p className="text-[9px] uppercase tracking-[0.28em] text-slate-400">Room code</p>
                      <p className="mt-0.5 break-all font-mono text-base font-bold tracking-widest text-[#D6FFF6]">
                        {room.joinCode ?? 'Room code unavailable'}
                      </p>
                    </div>

                    {copyStatus === 'unavailable' ? (
                      <p className="text-sm text-amber-200">Room code could not be copied automatically.</p>
                    ) : null}

                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={handleCopyRoomCode}
                        disabled={!room.joinCode}
                        className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-full border-2 border-white/10 bg-[#18181B]/90 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:border-white/20 active:bg-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {copyStatus === 'copied' ? (
                          <Check size={14} aria-hidden="true" />
                        ) : (
                          <Copy size={14} aria-hidden="true" />
                        )}
                        {copyStatus === 'copied' ? 'Copied' : 'Copy code'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  )
}
