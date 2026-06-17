import { useParams } from 'react-router-dom'

import { ChatWorkspace } from '../components/chat/ChatWorkspace'

export function RoomPage() {
  const { roomId } = useParams()

  return <ChatWorkspace roomId={roomId} />
}
