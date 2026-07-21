import type { ChatRoom } from '../../types/chat'
import { CompetingRoomView } from './CompetingRoomView'
import { useCompetingRoomWorkspaceState } from './useCompetingRoomWorkspaceState'

type CompetingRoomWorkspaceProps = { room: ChatRoom }

export function CompetingRoomWorkspace({ room }: CompetingRoomWorkspaceProps) {
  const state = useCompetingRoomWorkspaceState(room)
  return <CompetingRoomView room={room} state={state} />
}
