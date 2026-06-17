import {
  ArrowLeft,
  Clock3,
  Code2,
  MoreVertical,
  Play,
  Send,
  Trophy,
  Users,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { roomMemberService } from '../../services/roomMemberService'
import type { ChatRoom, RoomMember } from '../../types/chat'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { MessageInput } from '../chat/MessageInput'
import { MessageList } from '../chat/MessageList'
import { TypingIndicator } from '../chat/TypingIndicator'
import { EditorSkeleton } from '../editor/EditorSkeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../ui/resizable'
import { ScrollArea } from '../ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'

const LazyCodeEditorWorkspace = lazy(() =>
  import('../editor/CodeEditorWorkspace').then((module) => ({
    default: module.CodeEditorWorkspace,
  })),
)

type CompetingRoomWorkspaceProps = {
  room: ChatRoom
}

type SampleSubmission = {
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error'
  language: string
  runtime: string
  memory: string
}

const sampleConstraints = [
  '1 <= test cases <= 100',
  '1 <= first array length, second array length <= 50',
  'Both input arrays are already sorted in non-decreasing order',
]

const sampleHints = [
  'Keep one pointer for each array.',
  'Always move the pointer that currently has the smaller value.',
  'After one array ends, append the remaining values from the other array.',
]

const sampleSubmissions: SampleSubmission[] = [
  {
    status: 'Accepted',
    language: 'JavaScript',
    runtime: '52 ms',
    memory: '41.8 MB',
  },
  {
    status: 'Wrong Answer',
    language: 'Python',
    runtime: '-',
    memory: '-',
  },
  {
    status: 'Compilation Error',
    language: 'C++',
    runtime: '-',
    memory: '-',
  },
]

const difficultyClassName: Record<string, string> = {
  EASY: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  MEDIUM: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  HARD: 'border-red-300/25 bg-red-400/10 text-red-200',
}

const submissionStatusClassName: Record<SampleSubmission['status'], string> = {
  Accepted: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  'Wrong Answer': 'border-red-300/25 bg-red-400/10 text-red-200',
  'Compilation Error': 'border-amber-300/25 bg-amber-400/10 text-amber-200',
}

const formatDifficulty = (difficulty?: ChatRoom['difficulty']) => {
  if (!difficulty) {
    return 'Medium'
  }

  return difficulty[0] + difficulty.slice(1).toLowerCase()
}

const getOnlineMemberIds = (onlineUsers: Array<{ id: string }>) => {
  return new Set(onlineUsers.map((onlineUser) => onlineUser.id))
}

/**
 * ProblemPanel - Displays problem statements, constraints, sample inputs/outputs,
 * hints, submissions history, and locked editorial tabs.
 */
function ProblemPanel({ room }: { room: ChatRoom }) {
  const topics = room.topics?.length ? room.topics : ['Array', 'Two Pointers']
  const difficulty = room.difficulty ?? 'MEDIUM'

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/10 bg-[#080D14]/90">
      <Tabs defaultValue="problem" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-white/10 bg-black/20 p-3">
          <TabsList className="grid w-full grid-cols-3 bg-white/[0.035]">
            <TabsTrigger value="problem">Problem</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="editorial">Editorial</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="problem" className="m-0 p-5">
            <div className="space-y-5">
              <Card className="gap-4 border-white/10 bg-white/[0.035] py-5 shadow-none">
                <CardHeader className="gap-3 px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={difficultyClassName[difficulty]}>
                      {formatDifficulty(difficulty)}
                    </Badge>
                    <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
                      Problem 1 / 2
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-xl tracking-tight text-white">
                      Merging Two Sorted Arrays
                    </CardTitle>
                    <CardDescription className="mt-3 leading-6 text-slate-400">
                      Given two sorted arrays, merge them into one sorted array. Keep the approach
                      simple enough to explain while your team is solving.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 px-5">
                  {topics.map((topic) => (
                    <Badge
                      key={topic}
                      className="border-[#57F1DB]/15 bg-[#57F1DB]/8 text-[#D6FFF6]"
                    >
                      {topic}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Constraints</h3>
                <div className="grid gap-2">
                  {sampleConstraints.map((constraint) => (
                    <div
                      key={constraint}
                      className="rounded-lg border border-white/8 bg-white/[0.035] px-3 py-2 text-sm text-slate-300"
                    >
                      {constraint}
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Sample 1</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/8 bg-black/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Input
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-slate-200">
                      {`5 2\n1 2 3 4 6\n7 8`}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Output
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-slate-200">
                      1 2 3 4 5 6 7 8
                    </pre>
                  </div>
                </div>
              </section>

              <Accordion type="single" collapsible className="rounded-xl border border-white/8 bg-white/[0.035] px-4">
                <AccordionItem value="hint" className="border-white/8">
                  <AccordionTrigger className="text-white hover:no-underline">
                    Hints
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm leading-6 text-slate-400">
                      {sampleHints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="m-0 p-5">
            <Card className="gap-4 border-white/10 bg-white/[0.035] py-5 shadow-none">
              <CardHeader className="px-5">
                <CardTitle className="text-lg text-white">Recent submissions</CardTitle>
                <CardDescription>Static examples for the Phase 1 competing room.</CardDescription>
              </CardHeader>
              <CardContent className="px-5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Language</TableHead>
                      <TableHead className="text-slate-400">Runtime</TableHead>
                      <TableHead className="text-slate-400">Memory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleSubmissions.map((submission) => (
                      <TableRow
                        key={`${submission.status}-${submission.language}`}
                        className="border-white/8 hover:bg-white/[0.035]"
                      >
                        <TableCell>
                          <Badge className={submissionStatusClassName[submission.status]}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-200">{submission.language}</TableCell>
                        <TableCell className="text-slate-400">{submission.runtime}</TableCell>
                        <TableCell className="text-slate-400">{submission.memory}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editorial" className="m-0 p-5">
            <Card className="border-white/10 bg-white/[0.035] py-8 text-center shadow-none">
              <CardHeader className="items-center px-5">
                <div className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#D6FFF6]">
                  <Trophy size={20} aria-hidden="true" />
                </div>
                <CardTitle className="text-lg text-white">Editorial locked</CardTitle>
                <CardDescription className="max-w-sm leading-6">
                  Editorial will be available after the session.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  )
}

function MembersAndChatPanel({
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
}) {
  const onlineMemberIds = getOnlineMemberIds(onlineUsers)
  const onlineCount = members.filter((member) => onlineMemberIds.has(member.id)).length

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-white/10 bg-[#080D14]/90">
      <div className="shrink-0 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Session players</p>
            <p className="mt-1 text-xs text-slate-500">{onlineCount} online</p>
          </div>
          <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
            <Users size={13} aria-hidden="true" />
            {members.length || 1}
          </Badge>
        </div>

        <ScrollArea className="mt-4 h-44 pr-3">
          <div className="space-y-2">
            {members.length ? (
              members.map((member) => {
                const isOnline = onlineMemberIds.has(member.id)

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={member.username} seed={member.email} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {member.username}
                        </p>
                        <p className="truncate text-xs text-slate-500">{member.role.toLowerCase()}</p>
                      </div>
                    </div>
                    <span
                      className={[
                        'size-2 shrink-0 rounded-full',
                        isOnline
                          ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.55)]'
                          : 'bg-slate-600',
                      ].join(' ')}
                    />
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4 text-sm text-slate-400">
                Player list is loading.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white">Room chat</p>
        </div>
        <div className="min-h-0 flex-1">
          <MessageList
            connectionStatus={connectionStatus}
            hasMoreMessages={hasMoreMessages}
            isLoadingHistory={isLoadingHistory}
            isLoadingOlder={isLoadingOlder}
            messages={messages}
            onLoadOlderMessages={loadOlderMessages}
            onRetryMessage={retryMessage}
          />
        </div>
        <TypingIndicator typingUsers={typingUsers} />
        <MessageInput
          disabled={connectionStatus !== 'online'}
          onSend={sendMessage}
          onStopTyping={sendStopTyping}
          onTyping={sendTyping}
          roomName={room.name}
        />
      </div>
    </aside>
  )
}

function EditorPanel({
  connectionStatus,
  editorPresenceUsers,
  room,
}: {
  connectionStatus: 'connecting' | 'online' | 'offline'
  editorPresenceUsers: ReturnType<typeof useChatSocket>['editorPresenceUsers']
  room: ChatRoom
}) {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050911]">
      <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Code2 size={15} className="text-[#D6FFF6]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Shared editor</p>
            <p className="truncate text-xs text-slate-500">Liveblocks Yjs sync with autosave</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                JavaScript
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#111113] text-slate-200">
              <DropdownMenuItem>JavaScript</DropdownMenuItem>
              <DropdownMenuItem>TypeScript</DropdownMenuItem>
              <DropdownMenuItem>Python</DropdownMenuItem>
              <DropdownMenuItem>C++</DropdownMenuItem>
              <DropdownMenuItem>C</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="ghost" size="sm" aria-label="Run code preview">
            <Play size={14} aria-hidden="true" />
            Run
          </Button>
          <Button type="button" size="sm" aria-label="Submit code preview">
            <Send size={14} aria-hidden="true" />
            Submit
          </Button>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Suspense fallback={<EditorSkeleton />}>
          <LazyCodeEditorWorkspace
            activeCollaborators={editorPresenceUsers}
            connectionStatus={connectionStatus}
            room={room}
          />
        </Suspense>
      </div>
    </main>
  )
}

/**
 * CompetingRoomWorkspace - The main workspace view for users in a COMPETING session.
 * Features a split pane layout with problem statement, live code editor, and chat panel.
 */
export function CompetingRoomWorkspace({ room }: CompetingRoomWorkspaceProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const roomDisplay = getRoomDisplayInfo(room)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [membersError, setMembersError] = useState<string | null>(null)

  const {
    connectionStatus,
    editorPresenceUsers,
    hasMoreMessages,
    isLoadingHistory,
    isLoadingOlder,
    loadOlderMessages,
    messages,
    onlineUsers,
    retryMessage,
    sendEditorPresence,
    sendMessage,
    sendStopTyping,
    sendTyping,
    typingUsers,
  } = useChatSocket(room.id, user?.id)

  const roomDuration = room.durationMinutes ?? 15
  const difficulty = room.difficulty ?? 'MEDIUM'
  const visibleTopics = room.topics?.length ? room.topics.slice(0, 3) : ['General']

  useEffect(() => {
    let isCurrentRequest = true

    const loadMembers = async () => {
      try {
        const roomMembers = await roomMemberService.list(room.id)

        if (isCurrentRequest) {
          setMembers(roomMembers)
          setMembersError(null)
        }
      } catch {
        if (isCurrentRequest) {
          setMembers([])
          setMembersError('Could not load members')
        }
      }
    }

    void loadMembers()

    return () => {
      isCurrentRequest = false
    }
  }, [room.id])

  useEffect(() => {
    if (connectionStatus !== 'online') {
      return
    }

    sendEditorPresence('active')

    return () => {
      sendEditorPresence('inactive')
    }
  }, [connectionStatus, sendEditorPresence])

  return (
    <TooltipProvider>
      <section className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#05070A] text-[#E5E1E4]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#060A10]/95 px-4 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur-2xl">
          <div className="flex min-w-0 items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-slate-400 transition hover:border-[#57F1DB]/30 hover:text-white"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Back to dashboard</TooltipContent>
            </Tooltip>

            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-semibold text-white">
                  {roomDisplay.displayName}
                </h1>
                <Badge className="border-[#7C8CFF]/25 bg-[#7C8CFF]/10 text-[#DDE2FF]">
                  Competing
                </Badge>
                <Badge className={difficultyClassName[difficulty]}>
                  {formatDifficulty(difficulty)}
                </Badge>
              </div>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                {visibleTopics.map((topic) => (
                  <Badge
                    key={topic}
                    className="border-white/10 bg-white/[0.035] text-slate-400"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge className="hidden border-white/10 bg-white/[0.045] text-slate-300 sm:inline-flex">
              <Users size={13} aria-hidden="true" />
              {members.length || room._count?.members || 1} players
            </Badge>
            <Badge className="border-white/10 bg-white/[0.045] text-slate-300">
              <Clock3 size={13} aria-hidden="true" />
              {roomDuration}:00
            </Badge>
            <Button type="button" variant="ghost" size="sm" className="hidden lg:inline-flex">
              Invite
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Open room menu">
                  <MoreVertical size={15} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-white/10 bg-[#111113] text-slate-200">
                <DropdownMenuItem>Copy room code</DropdownMenuItem>
                <DropdownMenuItem>View session details</DropdownMenuItem>
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
          <ResizablePanelGroup direction="horizontal" className="h-full min-h-0 w-full min-w-0 overflow-hidden">
            <ResizablePanel defaultSize={28} minSize={22} maxSize={34} className="min-h-0 min-w-0 overflow-hidden">
              <ProblemPanel room={room} />
            </ResizablePanel>
            <ResizableHandle withHandle className="z-20 w-2 border-x border-white/5 bg-white/[0.025] transition hover:bg-[#57F1DB]/12" />
            <ResizablePanel defaultSize={48} minSize={38} className="min-h-0 min-w-0 overflow-hidden">
              <EditorPanel
                connectionStatus={connectionStatus}
                editorPresenceUsers={editorPresenceUsers}
                room={room}
              />
            </ResizablePanel>
            <ResizableHandle withHandle className="z-20 w-2 border-x border-white/5 bg-white/[0.025] transition hover:bg-[#57F1DB]/12" />
            <ResizablePanel defaultSize={24} minSize={18} maxSize={30} className="min-h-0 min-w-0 overflow-hidden">
              <MembersAndChatPanel
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <Tabs defaultValue="problem" className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden p-3 xl:hidden">
          <TabsList className="grid w-full grid-cols-3 bg-white/[0.035]">
            <TabsTrigger value="problem">Problem</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="problem" className="m-0 min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <ProblemPanel room={room} />
          </TabsContent>

          <TabsContent value="editor" className="m-0 min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <EditorPanel
              connectionStatus={connectionStatus}
              editorPresenceUsers={editorPresenceUsers}
              room={room}
            />
          </TabsContent>

          <TabsContent value="chat" className="m-0 min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10">
            <MembersAndChatPanel
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
        </Tabs>
      </section>
    </TooltipProvider>
  )
}

