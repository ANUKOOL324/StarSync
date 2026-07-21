import { useCallback, useEffect, useRef, useState } from 'react'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { editorService } from '../../services/editorService'
import { roomMemberService } from '../../services/roomMemberService'
import { roomService } from '../../services/roomService'
import type { ChatRoom, RoomMember } from '../../types/chat'
import type { SubmissionHistoryItem } from '../../types/editor'
import { getRoomDisplayInfo } from '../../utils/roomDisplay'
import { PROBLEM_PANEL_COLLAPSED_SIZE_PX, SESSION_PANEL_COLLAPSED_SIZE_PX } from './CompetingPanelRails'
import type { CompetingProblem, CopyStatus, ProblemPanelTab, SessionPanelTab, SessionStatus } from './competingTypes'
import { mapAssignedProblemToPanelProblem, splitDurationMinutes, toSessionSeconds } from './competingUtils'

export function useCompetingRoomWorkspaceState(room: ChatRoom) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const roomDisplay = getRoomDisplayInfo(room)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [membersError, setMembersError] = useState<string | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const initialDurationMinutes = room.durationMinutes ?? 45
  const initialDraft = splitDurationMinutes(initialDurationMinutes)
  const [draftHours, setDraftHours] = useState(initialDraft.hours)
  const [draftMinutes, setDraftMinutes] = useState(initialDraft.minutes)
  const getInitialSessionStatus = (): SessionStatus => {
    const backendStatus = (room.sessionStatus?.toLowerCase() as SessionStatus | undefined) ?? 'waiting'
    const totalSeconds = toSessionSeconds(initialDraft.hours, initialDraft.minutes)

    if (backendStatus === 'running' && room.sessionStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(room.sessionStartedAt).getTime()) / 1000)
      return elapsed >= totalSeconds ? 'ended' : 'running'
    }

    return backendStatus
  }
  const initialSessionStatus = getInitialSessionStatus()
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(initialSessionStatus)
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>([])
  const [showEndedModal, setShowEndedModal] = useState(false)
  const previousSessionStatusRef = useRef<SessionStatus | null>(initialSessionStatus)
  const hasShownEndedPopupRef = useRef(false)
  const getInitialRemainingSeconds = () => {
    const totalSeconds = toSessionSeconds(initialDraft.hours, initialDraft.minutes)

    if (initialSessionStatus === 'ended') {
      return 0
    }

    if (initialSessionStatus === 'running' && room.sessionStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(room.sessionStartedAt).getTime()) / 1000)
      return Math.max(0, totalSeconds - elapsed)
    }

    return totalSeconds
  }
  const [remainingSeconds, setRemainingSeconds] = useState(getInitialRemainingSeconds)
  const [problemPanelTab, setProblemPanelTab] = useState<ProblemPanelTab>('problem')
  const [assignedProblems, setAssignedProblems] = useState<CompetingProblem[]>([])
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [isLoadingProblems, setIsLoadingProblems] = useState(true)
  const [problemLoadError, setProblemLoadError] = useState<string | null>(null)
  const [isProblemPanelCollapsed, setIsProblemPanelCollapsed] = useState(false)
  const problemPanelRef = useRef<PanelImperativeHandle | null>(null)
  const [sessionPanelTab, setSessionPanelTab] = useState<SessionPanelTab>('chat')
  const [isSessionPanelCollapsed, setIsSessionPanelCollapsed] = useState(false)
  const sessionPanelRef = useRef<PanelImperativeHandle | null>(null)

  const handleProblemPanelResize = (
    panelSize: { asPercentage: number; inPixels: number },
  ) => {
    const collapsedByPixels = panelSize.inPixels <= PROBLEM_PANEL_COLLAPSED_SIZE_PX + 10
    const collapsedByPercent = panelSize.asPercentage <= 5
    const collapsedByRef = problemPanelRef.current?.isCollapsed() === true

    setIsProblemPanelCollapsed(collapsedByPixels || collapsedByPercent || collapsedByRef)
  }

  const handleSessionPanelResize = (
    panelSize: { asPercentage: number; inPixels: number },
  ) => {
    const collapsedByPixels = panelSize.inPixels <= SESSION_PANEL_COLLAPSED_SIZE_PX + 10
    const collapsedByPercent = panelSize.asPercentage <= 5
    const collapsedByRef = sessionPanelRef.current?.isCollapsed() === true

    setIsSessionPanelCollapsed(collapsedByPixels || collapsedByPercent || collapsedByRef)
  }

  const handlePanelLayoutChanged = (layout: Record<string, number>) => {
    const problemPanelPercent = layout['competing-problem-panel']
    const sessionPanelPercent = layout['competing-session-panel']

    if (typeof problemPanelPercent === 'number') {
      setIsProblemPanelCollapsed(problemPanelPercent <= 5)
    }

    if (typeof sessionPanelPercent === 'number') {
      setIsSessionPanelCollapsed(sessionPanelPercent <= 5)
    }
  }

  const handleProblemPanelExpand = (tab: ProblemPanelTab) => {
    setProblemPanelTab(tab)
    problemPanelRef.current?.expand()
    setIsProblemPanelCollapsed(false)
  }

  const handleSessionPanelExpand = (tab: SessionPanelTab) => {
    setSessionPanelTab(tab)
    sessionPanelRef.current?.expand()
    setIsSessionPanelCollapsed(false)
  }

  const {
    connectionStatus,
    hasMoreMessages,
    isLoadingHistory,
    isLoadingOlder,
    loadOlderMessages,
    messages,
    onlineUsers,
    retryMessage,
    newSubmissionEvent,
    roomTimerEvent,
    sendMessage,
    sendStopTyping,
    sendTyping,
    typingUsers,
  } = useChatSocket(room.id, user?.id)

  const currentMember = members.find((member) => member.id === user?.id)
  const isAdmin = Boolean(user?.id && (room.adminId === user.id || currentMember?.role === 'ADMIN'))

  const fetchSubmissions = useCallback(async () => {
    if (!selectedProblemId) return
    try {
      const data = await editorService.getProblemSubmissions(room.id, selectedProblemId)
      setSubmissions(data)
    } catch (error) {
      console.error(error)
    }
  }, [room.id, selectedProblemId])

  const handleDeleteRoom = async () => {
    try {
      await roomService.delete(room.id)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error(error)
      toast.error('Room could not be deleted. Only the room admin can delete it.')
    }
  }

  const handleLeaveRoom = () => {
    navigate('/dashboard', { replace: true })
  }

  useEffect(() => {
    void fetchSubmissions()
  }, [fetchSubmissions, sessionStatus])

  useEffect(() => {
    if (
      newSubmissionEvent &&
      newSubmissionEvent.roomId === room.id &&
      newSubmissionEvent.problemId === selectedProblemId
    ) {
      void fetchSubmissions()
    }
  }, [newSubmissionEvent, fetchSubmissions, room.id, selectedProblemId])

  useEffect(() => {
    const previousStatus = previousSessionStatusRef.current

    if (
      previousStatus &&
      previousStatus !== 'ended' &&
      sessionStatus === 'ended' &&
      !hasShownEndedPopupRef.current
    ) {
      hasShownEndedPopupRef.current = true
      toast('Contest ended. Code review is now open.')
      setShowEndedModal(true)
      void fetchSubmissions()
    }

    if (sessionStatus !== 'ended') {
      hasShownEndedPopupRef.current = false
      setShowEndedModal(false)
    }

    previousSessionStatusRef.current = sessionStatus
  }, [fetchSubmissions, sessionStatus])

  useEffect(() => {
    if (!roomTimerEvent) return

    const status = roomTimerEvent.sessionStatus.toLowerCase() as SessionStatus
    const nextDurationMinutes = roomTimerEvent.durationMinutes ?? initialDurationMinutes
    const nextDraft = splitDurationMinutes(nextDurationMinutes)
    const totalSeconds = toSessionSeconds(nextDraft.hours, nextDraft.minutes)

    setDraftHours(nextDraft.hours)
    setDraftMinutes(nextDraft.minutes)
    setSessionStatus(status)

    if (status === 'running' && roomTimerEvent.sessionStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(roomTimerEvent.sessionStartedAt).getTime()) / 1000)
      setRemainingSeconds(Math.max(0, totalSeconds - elapsed))
    } else if (status === 'ended') {
      setRemainingSeconds(0)
    } else {
      setRemainingSeconds(totalSeconds)
    }
  }, [initialDurationMinutes, roomTimerEvent])

  const canManageTimer =
    room.adminId === user?.id || currentMember?.role === 'ADMIN' || (!room.adminId && members.length === 0)

  const selectedProblem = assignedProblems.find((problem) => problem.id === selectedProblemId) ?? assignedProblems[0] ?? null
  const selectedProblemRunId = selectedProblem?.id ?? null

  useEffect(() => {
    let isCurrentRequest = true

    const loadAssignedProblems = async () => {
      setIsLoadingProblems(true)
      setProblemLoadError(null)

      try {
        const roomProblems = await roomService.getProblems(room.id)

        if (!isCurrentRequest) {
          return
        }

        const mappedProblems = roomProblems.map(mapAssignedProblemToPanelProblem)
        setAssignedProblems(mappedProblems)
      } catch {
        if (!isCurrentRequest) {
          return
        }

        setAssignedProblems([])
        setProblemLoadError('Could not load assigned problems for this room.')
      } finally {
        if (isCurrentRequest) {
          setIsLoadingProblems(false)
        }
      }
    }

    void loadAssignedProblems()

    return () => {
      isCurrentRequest = false
    }
  }, [room.id])

  useEffect(() => {
    if (assignedProblems.length === 0) {
      setSelectedProblemId(null)
      return
    }

    const selectedProblemStillExists = assignedProblems.some((problem) => problem.id === selectedProblemId)

    if (!selectedProblemStillExists) {
      setSelectedProblemId(assignedProblems[0].id)
    }
  }, [assignedProblems, selectedProblemId])

  const handleCopyRoomCode = async () => {
    if (!room.joinCode || !navigator.clipboard) {
      setCopyStatus('unavailable')
      return
    }

    try {
      await navigator.clipboard.writeText(room.joinCode)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('unavailable')
    }
  }

  useEffect(() => {
    if (sessionStatus !== 'running') {
      return
    }

    const countdownInterval = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(countdownInterval)
          setSessionStatus('ended')

          if (canManageTimer) {
            void roomService.update(room.id, { sessionStatus: 'ENDED' }).catch(() => undefined)
          }

          return 0
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(countdownInterval)
    }
  }, [canManageTimer, room.id, sessionStatus])

  const handleStartTimer = async () => {
    const nextSeconds = toSessionSeconds(draftHours, draftMinutes)
    if (nextSeconds <= 0) return

    const selectedDurationMinutes = draftHours * 60 + draftMinutes
    try {
      await roomService.update(room.id, {
        sessionStatus: 'RUNNING',
        sessionStartedAt: new Date().toISOString(),
        durationMinutes: selectedDurationMinutes,
      })
      setRemainingSeconds(nextSeconds)
      setSessionStatus('running')
    } catch (error) { console.error(error) }
  }

  const handleResetTimer = async () => {
    try {
      await roomService.update(room.id, {
        sessionStatus: 'WAITING',
        sessionStartedAt: null,
      })
      hasShownEndedPopupRef.current = false
      previousSessionStatusRef.current = 'waiting'
      setShowEndedModal(false)
      setSessionStatus('waiting')
      setRemainingSeconds(toSessionSeconds(draftHours, draftMinutes))
    } catch (error) { console.error(error) }
  }

  const handleEndTimer = async () => {
    if (!canManageTimer) return

    try {
      await roomService.update(room.id, {
        sessionStatus: 'ENDED',
      })
      setRemainingSeconds(0)
      setSessionStatus('ended')
    } catch (error) { console.error(error) }
  }

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


  return {
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
  }
}
export type CompetingRoomWorkspaceState = ReturnType<typeof useCompetingRoomWorkspaceState>
