import { MessageSquare, Trophy } from 'lucide-react'

import type { StaticRoomPreview, WorkspaceTemplate } from './dashboardTypes'

export const topicOptions = [
  'Array',
  'String',
  'Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Queue',
  'Linked List',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Binary Search',
  'Sorting',
  'Math',
]

export const workspaceTemplates: WorkspaceTemplate[] = [
  {
    title: 'Collaborative Room',
    description: 'Create a full workspace with chat, editor, and whiteboard.',
    defaultRoomName: 'Collaboration Room',
    purpose: 'COLLABORATIVE',
    icon: <MessageSquare size={16} aria-hidden="true" />,
  },
  {
    title: 'Competing Room',
    description: 'Create a coding room for practice, contests, and interview-style problem solving.',
    defaultRoomName: 'Contest Room',
    purpose: 'COMPETING',
    icon: <Trophy size={16} aria-hidden="true" />,
  },
]

export const staticRoomPreviews: StaticRoomPreview[] = [
  { title: 'JavaScript Basics', roomType: 'Development Room', description: 'A focused room for learning JavaScript fundamentals with chat, code, and notes.', badge: 'Free' },
  { title: 'Python Challenge', roomType: 'Competitive Room', description: 'Practice problem solving with teammates before contests and interviews.', badge: 'Paid' },
  { title: 'Design Thinking', roomType: 'Collaborative Room', description: 'Plan flows, sketch ideas, and discuss architecture in a shared workspace.', badge: 'Free' },
  { title: 'Machine Learning 101', roomType: 'Development Room', description: 'Study ML concepts, test snippets, and keep learning sessions organized.', badge: 'Paid' },
  { title: 'Agile Workshop', roomType: 'Collaborative Room', description: 'Run sprint planning, standups, and team discussions from one room.', badge: 'Free' },
  { title: 'Coding Olympics', roomType: 'Competitive Room', description: 'Host friendly coding rounds with realtime discussion and shared context.', badge: 'Paid' },
  { title: 'React Sprint Room', roomType: 'Development Room', description: 'Build UI flows, review components, and keep frontend work focused.', badge: 'Free' },
  { title: 'System Design Lab', roomType: 'Collaborative Room', description: 'Discuss architecture, tradeoffs, scaling plans, and service boundaries.', badge: 'Paid' },
  { title: 'Backend Review Room', roomType: 'Development Room', description: 'Debug APIs, validate database flows, and review backend decisions together.', badge: 'Free' },
  { title: 'Whiteboard Jam', roomType: 'Collaborative Room', description: 'Sketch product ideas, diagrams, and planning notes before implementation.', badge: 'Free' },
  { title: 'AI Study Circle', roomType: 'Practice Room', description: 'Learn model APIs, prompts, and implementation patterns with teammates.', badge: 'Paid' },
  { title: 'Hackathon Squad', roomType: 'Collaborative Room', description: 'Coordinate ideas, code, execution, and board planning in one place.', badge: 'Free' },
]

export const roomPreviewPageSize = 6
