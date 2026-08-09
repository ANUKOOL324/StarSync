import { Users } from 'lucide-react'
import { useState } from 'react'
import { useChatSocket } from '../../hooks/useChatSocket'
import type { ChatRoom, RoomMember } from '../../types/chat'
import { MessageInput } from '../chat/MessageInput'
import { MessageList } from '../chat/MessageList'
import { TypingIndicator } from '../chat/TypingIndicator'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { SessionPanelRail } from './CompetingPanelRails'
import type { SessionPanelTab } from './competingTypes'
import { getOnlineMemberIds } from './competingUtils'

export function CompetingMembersAndChatPanel({
  connectionStatus,
  hasMoreMessages,
  isLoadingHistory,
  isLoadingOlder,
  loadOlderMessages,
  members,
  messages,
  onlineUsers,
  retryMessage,
  room,
  sendMessage,
  sendStopTyping,
  sendTyping,
  typingUsers,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  isCollapsed = false,
  onExpandRequest,
}: {
  connectionStatus: 'connecting' | 'online' | 'offline'
  hasMoreMessages: boolean
  isLoadingHistory: boolean
  isLoadingOlder: boolean
  loadOlderMessages: () => Promise<void> | void
  members: RoomMember[]
  messages: ReturnType<typeof useChatSocket>['messages']
  onlineUsers: ReturnType<typeof useChatSocket>['onlineUsers']
  retryMessage: ReturnType<typeof useChatSocket>['retryMessage']
  room: ChatRoom
  sendMessage: ReturnType<typeof useChatSocket>['sendMessage']
  sendStopTyping: ReturnType<typeof useChatSocket>['sendStopTyping']
  sendTyping: ReturnType<typeof useChatSocket>['sendTyping']
  typingUsers: ReturnType<typeof useChatSocket>['typingUsers']
  activeTab?: SessionPanelTab
  onActiveTabChange?: (tab: SessionPanelTab) => void
  isCollapsed?: boolean
  onExpandRequest?: (tab: SessionPanelTab) => void
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<SessionPanelTab>('chat')
  const activeTab = controlledActiveTab ?? internalActiveTab

  const setActiveTab = (nextTab: SessionPanelTab) => {
    if (onActiveTabChange) {
      onActiveTabChange(nextTab)
      return
    }

    setInternalActiveTab(nextTab)
  }

  const handleRailSelect = (tab: SessionPanelTab) => {
    setActiveTab(tab)
    onExpandRequest?.(tab)
  }

  const onlineMemberIds = getOnlineMemberIds(onlineUsers)
  const onlineCount = members.filter((member) => onlineMemberIds.has(member.id)).length
  const totalCount = members.length || 1

  const panelTabs = (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as SessionPanelTab)}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <div className="min-w-0 shrink-0 overflow-hidden border-b border-white/10 bg-black/20 px-3 py-2">
        <div className="flex min-w-0 items-center justify-between gap-2 overflow-hidden">
          <TabsList variant="competing" className="flex h-9 min-w-0 overflow-hidden">
            <TabsTrigger
              value="chat"
              className="room-font-display px-3 data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="room-font-display px-3 data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white"
            >
              Players
            </TabsTrigger>
          </TabsList>
          <Badge className="room-font-body shrink-0 border border-white/10 bg-white/[0.04] !text-slate-300 shadow-none">
            <Users size={13} aria-hidden="true" />
            {onlineCount} online
          </Badge>
        </div>
      </div>

      <TabsContent
        value="chat"
        className="m-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=active]:flex"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <MessageList
              connectionStatus={connectionStatus}
              hasMoreMessages={hasMoreMessages}
              isLoadingHistory={isLoadingHistory}
              isLoadingOlder={isLoadingOlder}
              messages={messages}
              onLoadOlderMessages={loadOlderMessages}
              onRetryMessage={retryMessage}
              variant="sidebar"
            />
          </div>
          <TypingIndicator typingUsers={typingUsers} variant="sidebar" />
          <MessageInput
            disabled={connectionStatus !== 'online'}
            onSend={sendMessage}
            onStopTyping={sendStopTyping}
            onTyping={sendTyping}
            roomName={room.name}
            sendButtonVariant="competing"
            variant="sidebar"
          />
        </div>
      </TabsContent>

      <TabsContent
        value="players"
        className="m-0 min-h-0 min-w-0 flex-1 overflow-hidden data-[state=active]:flex"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 overflow-hidden border-b border-white/10 px-4 py-4">
            <p className="room-font-display truncate text-sm font-semibold text-white">Session players</p>
            <p className="room-font-body mt-1 truncate text-xs text-slate-500">
              Total joined · {totalCount}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="space-y-3 p-4">
              {members.length ? (
                members.map((member) => {
                  const isOnline = onlineMemberIds.has(member.id)

                  return (
                    <Card
                      key={member.id}
                      className="border-white/10 bg-white/[0.035] py-0 shadow-none"
                    >
                      <CardContent className="flex items-center justify-between gap-3 overflow-hidden p-3">
                        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                          <Avatar name={member.username} seed={member.email} size="sm" />
                          <div className="min-w-0 overflow-hidden">
                            <p className="room-font-display truncate text-sm font-semibold text-white">
                              {member.username}
                            </p>
                            <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden">
                              <Badge className="room-font-kicker shrink-0 border-white/10 bg-white/4 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                {member.role.toLowerCase()}
                              </Badge>
                              <span className="room-font-body truncate text-xs text-slate-500">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="room-font-body shrink-0 text-xs text-slate-400">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card className="border-white/10 bg-white/[0.035] py-0 shadow-none">
                  <CardContent className="room-font-body p-4 text-sm text-slate-400">
                    Player list is loading.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )

  if (isCollapsed) {
    return (
      <aside className="flex h-full min-h-0 min-w-0 overflow-hidden bg-[#080D14]/95 xl:border-l xl:border-white/10">
        <SessionPanelRail activeTab={activeTab} onSelect={handleRailSelect} />
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#080D14]/90 xl:border-l xl:border-white/10">
      {panelTabs}
    </aside>
  )
}
