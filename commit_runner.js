const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = 'c:\\Users\\anuko\\code\\webdev\\javascript\\hk\\websockets';
const backupDir = path.join(workspaceRoot, 'temp_backup_dir');

function gitCommit(message) {
  try {
    execSync('git add -A', { cwd: workspaceRoot });
    const status = execSync('git status --porcelain', { cwd: workspaceRoot }).toString().trim();
    if (status) {
      execSync(`git commit -m "${message}"`, { cwd: workspaceRoot });
      console.log(`Successfully committed: "${message}"`);
    } else {
      console.log(`No changes to commit for: "${message}"`);
    }
  } catch (err) {
    console.error(`Error committing: "${message}"`, err.message);
  }
}

function replaceInFile(filePath, search, replace) {
  const fullPath = path.join(workspaceRoot, filePath);
  let content = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
  const searchNormalized = search.replace(/\r\n/g, '\n');
  const replaceNormalized = replace.replace(/\r\n/g, '\n');
  if (!content.includes(searchNormalized)) {
    throw new Error(`Anchor text not found in ${filePath}:\n${searchNormalized}`);
  }
  content = content.replace(searchNormalized, replaceNormalized);
  fs.writeFileSync(fullPath, content.replace(/\n/g, '\r\n'), 'utf8');
}

console.log('Starting step-by-step commit execution...');

// Reset repo to clean state first just in case
execSync('git reset --hard', { cwd: workspaceRoot });

// Commit 1: add RoomPurpose and ProblemDifficulty enum definitions to schema
const enumDefinitions = `enum RoomPurpose {
  COLLABORATIVE
  COMPETING
}

enum ProblemDifficulty {
  EASY
  MEDIUM
  HARD
}`;
replaceInFile(
  'wsocket_backend/prisma/schema.prisma',
  `enum RoomType {
  GROUP
  DM
}`,
  `enum RoomType {
  GROUP
  DM
}

${enumDefinitions}`
);
gitCommit('add RoomPurpose and ProblemDifficulty enum definitions to schema');

// Commit 2: add purpose, difficulty, topics, durationMinutes to Room model in schema
replaceInFile(
  'wsocket_backend/prisma/schema.prisma',
  '  type         RoomType      @default(GROUP)',
  `  type         RoomType      @default(GROUP)
  purpose      RoomPurpose   @default(COLLABORATIVE)
  difficulty   ProblemDifficulty?
  topics       String[]      @default([])
  durationMinutes Int?`
);
gitCommit('add purpose, difficulty, topics, durationMinutes to Room model in schema');

// Commit 3: create migration files for competing room metadata schema changes
const migrationDir = 'wsocket_backend/prisma/migrations/20260616170000_add_competing_room_metadata';
const destMigrationDir = path.join(workspaceRoot, migrationDir);
fs.mkdirSync(destMigrationDir, { recursive: true });
fs.copyFileSync(
  path.join(backupDir, migrationDir, 'migration.sql'),
  path.join(destMigrationDir, 'migration.sql')
);
fs.copyFileSync(
  path.join(backupDir, 'wsocket_backend/prisma/migrations/migration_lock.toml'),
  path.join(workspaceRoot, 'wsocket_backend/prisma/migrations/migration_lock.toml')
);
gitCommit('create migration files for competing room metadata schema changes');

// Commit 4: define roomPurposeSchema and problemDifficultySchema Zod schemas
const validationSchemas = `const roomPurposeSchema = z.enum(["COLLABORATIVE", "COMPETING"]);
const problemDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);`;
replaceInFile(
  'wsocket_backend/src/validations/roomValidation.ts',
  `const optionalMaxMembersSchema = z
  .number({ message: "Member limit must be a number" })
  .int("Member limit must be a whole number")
  .min(2, "Member limit must be at least 2")
  .max(500, "Member limit is too large")
  .nullable()
  .optional();`,
  `const optionalMaxMembersSchema = z
  .number({ message: "Member limit must be a number" })
  .int("Member limit must be a whole number")
  .min(2, "Member limit must be at least 2")
  .max(500, "Member limit is too large")
  .nullable()
  .optional();

${validationSchemas}`
);
gitCommit('define roomPurposeSchema and problemDifficultySchema Zod schemas');

// Commit 5: add supportedDurationOptions schema constant for room validation
replaceInFile(
  'wsocket_backend/src/validations/roomValidation.ts',
  'const problemDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);',
  `const problemDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
const supportedDurationOptions = [15, 30, 45, 60] as const;`
);
gitCommit('add supportedDurationOptions schema constant for room validation');

// Commit 6: update createRoomSchema with purpose and difficulty fields
replaceInFile(
  'wsocket_backend/src/validations/roomValidation.ts',
  `  maxMembers: optionalMaxMembersSchema,
  unlimitedMembers: z.boolean().optional(),
});`,
  `  maxMembers: optionalMaxMembersSchema,
  unlimitedMembers: z.boolean().optional(),
  purpose: roomPurposeSchema.optional(),
  difficulty: problemDifficultySchema.optional(),
});`
);
gitCommit('update createRoomSchema with purpose and difficulty fields');

// Commit 7: add topics list and duration validation to createRoomSchema
replaceInFile(
  'wsocket_backend/src/validations/roomValidation.ts',
  `  purpose: roomPurposeSchema.optional(),
  difficulty: problemDifficultySchema.optional(),
});`,
  `  purpose: roomPurposeSchema.optional(),
  difficulty: problemDifficultySchema.optional(),
  topics: z.array(z.string().trim().min(1).max(40)).max(10, "Too many topics selected").optional(),
  durationMinutes: z
    .number({ message: "Duration must be a number" })
    .int("Duration must be a whole number")
    .refine((value) => supportedDurationOptions.includes(value as (typeof supportedDurationOptions)[number]), {
      message: "Choose 15, 30, 45, or 60 minutes",
    })
    .optional(),
});`
);
gitCommit('add topics list and duration validation to createRoomSchema');

// Commit 8: implement superRefine validations for competing rooms in createRoomSchema
replaceInFile(
  'wsocket_backend/src/validations/roomValidation.ts',
  `export const createRoomSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters").max(60),
  slug: z
    .string()
    .trim()
    .min(2, "Room slug must be at least 2 characters")
    .max(60)
    .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only")
    .optional(),
  maxMembers: optionalMaxMembersSchema,
  unlimitedMembers: z.boolean().optional(),
  purpose: roomPurposeSchema.optional(),
  difficulty: problemDifficultySchema.optional(),
  topics: z.array(z.string().trim().min(1).max(40)).max(10, "Too many topics selected").optional(),
  durationMinutes: z
    .number({ message: "Duration must be a number" })
    .int("Duration must be a whole number")
    .refine((value) => supportedDurationOptions.includes(value as (typeof supportedDurationOptions)[number]), {
      message: "Choose 15, 30, 45, or 60 minutes",
    })
    .optional(),
});`,
  `export const createRoomSchema = z
  .object({
    name: z.string().trim().min(2, "Room name must be at least 2 characters").max(60),
    slug: z
      .string()
      .trim()
      .min(2, "Room slug must be at least 2 characters")
      .max(60)
      .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only")
      .optional(),
    maxMembers: optionalMaxMembersSchema,
    unlimitedMembers: z.boolean().optional(),
    purpose: roomPurposeSchema.optional(),
    difficulty: problemDifficultySchema.optional(),
    topics: z.array(z.string().trim().min(1).max(40)).max(10, "Too many topics selected").optional(),
    durationMinutes: z
      .number({ message: "Duration must be a number" })
      .int("Duration must be a whole number")
      .refine((value) => supportedDurationOptions.includes(value as (typeof supportedDurationOptions)[number]), {
        message: "Choose 15, 30, 45, or 60 minutes",
      })
      .optional(),
  })
  .superRefine((input, context) => {
    const roomPurpose = input.purpose ?? "COLLABORATIVE";

    if (roomPurpose !== "COMPETING") {
      return;
    }

    if (!input.difficulty) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Difficulty is required for a competing room",
        path: ["difficulty"],
      });
    }

    if (!input.durationMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duration is required for a competing room",
        path: ["durationMinutes"],
      });
    }
  });`
);
gitCommit('implement superRefine validations for competing rooms in createRoomSchema');

// Commit 9: include purpose and difficulty in roomSelect object query select list
replaceInFile(
  'wsocket_backend/src/services/roomService.ts',
  `  joinCode: true,
  maxMembers: true,
  type: true,
  createdAt: true,`,
  `  joinCode: true,
  maxMembers: true,
  type: true,
  purpose: true,
  difficulty: true,
  topics: true,
  durationMinutes: true,
  createdAt: true,`
);
gitCommit('include purpose and difficulty in roomSelect object query select list');

// Commit 10: support unique slug generation helper function for rooms
replaceInFile(
  'wsocket_backend/src/services/roomService.ts',
  `const ensureSlugIsAvailable = async (slug: string, currentRoomId?: string) => {
  const existingRoom = await prisma.room.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingRoom && existingRoom.id !== currentRoomId) {
    throw new HttpError(409, "Room slug is already taken");
  }
};`,
  `const ensureSlugIsAvailable = async (slug: string, currentRoomId?: string) => {
  const existingRoom = await prisma.room.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingRoom && existingRoom.id !== currentRoomId) {
    throw new HttpError(409, "Room slug is already taken");
  }
};

const createUniqueSlugForRoomName = async (roomName: string): Promise<string> => {
  const baseSlug = createSlug(roomName);

  if (!baseSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  let candidateSlug = baseSlug;

  for (let attemptNumber = 1; attemptNumber <= 25; attemptNumber += 1) {
    const existingRoom = await prisma.room.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!existingRoom) {
      return candidateSlug;
    }

    candidateSlug = \`\${baseSlug}-\${attemptNumber + 1}\`;
  }

  throw new HttpError(500, "Could not create a unique room slug");
};`
);
gitCommit('support unique slug generation helper function for rooms');

// Commit 11: implement helper logic to resolve room purpose and options
replaceInFile(
  'wsocket_backend/src/services/roomService.ts',
  `const getSafeMaxMembers = (input: CreateRoomInput): number | null => {
  if (input.unlimitedMembers) {
    return null;
  }

  return input.maxMembers ?? null;
};`,
  `const getSafeMaxMembers = (input: CreateRoomInput): number | null => {
  if (input.unlimitedMembers) {
    return null;
  }

  return input.maxMembers ?? null;
};

const getRoomPurpose = (input: CreateRoomInput) => {
  return input.purpose ?? "COLLABORATIVE";
};

const getCompetingRoomDifficulty = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return null;
  }

  return input.difficulty ?? null;
};

const getCompetingRoomTopics = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return [];
  }

  return input.topics ?? [];
};

const getCompetingRoomDuration = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return null;
  }

  return input.durationMinutes ?? null;
};`
);
gitCommit('implement helper logic to resolve room purpose and options');

// Commit 12: rewrite createRoom service to populate purpose-specific attributes
replaceInFile(
  'wsocket_backend/src/services/roomService.ts',
  `export const createRoom = async (input: CreateRoomInput, adminId: string) => {
  const roomSlug = input.slug ?? createSlug(input.name);

  if (!roomSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  await ensureSlugIsAvailable(roomSlug);

  const joinCode = await generateUniqueJoinCode();
  const maxMembers = getSafeMaxMembers(input);

  const createdRoom = await prisma.room.create({
    data: {
      name: input.name,
      slug: roomSlug,
      joinCode,
      maxMembers,
      type: "GROUP",
      adminId,
      members: {
        create: {
          userId: adminId,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
    select: roomSelect,
  });

  return createdRoom;
};`,
  `export const createRoom = async (input: CreateRoomInput, adminId: string) => {
  const roomSlug = input.slug ?? (await createUniqueSlugForRoomName(input.name));

  if (!roomSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  if (input.slug) {
    await ensureSlugIsAvailable(roomSlug);
  }

  const joinCode = await generateUniqueJoinCode();
  const maxMembers = getSafeMaxMembers(input);
  const roomPurpose = getRoomPurpose(input);

  const createdRoom = await prisma.room.create({
    data: {
      name: input.name,
      slug: roomSlug,
      joinCode,
      maxMembers,
      type: "GROUP",
      purpose: roomPurpose,
      difficulty: getCompetingRoomDifficulty(input),
      topics: getCompetingRoomTopics(input),
      durationMinutes: getCompetingRoomDuration(input),
      adminId,
      members: {
        create: {
          userId: adminId,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
    select: roomSelect,
  });

  return createdRoom;
};`
);
gitCommit('rewrite createRoom service to populate purpose-specific attributes');

// Commit 13: add purpose field to ChatRoom type definitions on client
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/src/types/chat.ts'),
  path.join(workspaceRoot, 'wsocket_fronted/src/types/chat.ts')
);
gitCommit('add purpose field to ChatRoom type definitions on client');

// Commit 14: define new workspace template attributes for competing rooms
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `import {
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Code2,`,
  `import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,`
);
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Separator } from '../components/ui/separator'
import { Skeleton } from '../components/ui/skeleton'`,
  `import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Separator } from '../components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { ScrollArea } from '../components/ui/scroll-area'
import { Skeleton } from '../components/ui/skeleton'`
);
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `type WorkspaceTemplate = {
  title: string
  description: string
  icon: ReactNode
  defaultRoomName: string
}`,
  `type WorkspaceTemplate = {
  title: string
  description: string
  icon: ReactNode
  defaultRoomName: string
  purpose: 'COLLABORATIVE' | 'COMPETING'
}`
);
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `const workspaceTemplates: WorkspaceTemplate[] = [
  {
    title: 'Collaborate',
    description: 'Create your room to collaborate',
    defaultRoomName: 'Collaboration Room',
    icon: <MessageSquare size={16} aria-hidden="true" />,
  },
  {
    title: 'Compete',
    description: 'Create your room to compete',
    defaultRoomName: 'Contest Room',
    icon: <Trophy size={16} aria-hidden="true" />,
  },
  {
    title: 'Develop',
    description: 'Create your room to develop',
    defaultRoomName: 'Development Room',
    icon: <Code2 size={16} aria-hidden="true" />,
  },
]`,
  `const workspaceTemplates: WorkspaceTemplate[] = [
  {
    title: 'Collaborative Room',
    description: 'Create your room to collaborate',
    defaultRoomName: 'Collaboration Room',
    purpose: 'COLLABORATIVE',
    icon: <MessageSquare size={16} aria-hidden="true" />,
  },
  {
    title: 'Competing Room',
    description: 'Create your room to compete',
    defaultRoomName: 'Contest Room',
    purpose: 'COMPETING',
    icon: <Trophy size={16} aria-hidden="true" />,
  },
  {
    title: 'Develop',
    description: 'Create your room to develop',
    defaultRoomName: 'Development Room',
    purpose: 'COMPETING',
    icon: <Code2 size={16} aria-hidden="true" />,
  },
]`
);
gitCommit('define new workspace template attributes for competing rooms');

// Commit 15: define topic options and duration selections on dashboard
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  'const workspaceTemplates: WorkspaceTemplate[] = [',
  `const topicOptions = [
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

const durationOptions = [15, 30, 45, 60]

const workspaceTemplates: WorkspaceTemplate[] = [`
);
gitCommit('define topic options and duration selections on dashboard');

// Commit 16: update RealRoomCard to show room purpose labels
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `function RealRoomCard({
  membersCount,
  onClick,
  roomCode,
  roomName,
}: {
  membersCount: number
  onClick: () => void
  roomCode?: string
  roomName: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-left transition hover:border-[#57F1DB]/30 hover:bg-[#57F1DB]/[0.02]"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[#F7F7F8]">{roomName}</h3>
          <p className="mt-1 text-sm text-[#A7B8B3]">{membersCount} members</p>
        </div>
        {roomCode ? (
          <Badge className="shrink-0 border-white/8 bg-white/[0.04] font-mono text-[10px] text-[#BACAC5]">
            {roomCode}
          </Badge>
        ) : null}
      </div>`,
  `function RealRoomCard({
  membersCount,
  onClick,
  purpose,
  roomCode,
  roomName,
}: {
  membersCount: number
  onClick: () => void
  purpose?: 'COLLABORATIVE' | 'COMPETING'
  roomCode?: string
  roomName: string
}) {
  const purposeLabel = purpose === 'COMPETING' ? 'Competing' : 'Collaborative'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-left transition hover:border-[#57F1DB]/30 hover:bg-[#57F1DB]/[0.02]"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[#F7F7F8]">{roomName}</h3>
          <p className="mt-1 text-sm text-[#A7B8B3]">{membersCount} members</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge className="border-white/8 bg-white/[0.04] font-mono text-[10px] text-[#BACAC5]">
            {purposeLabel}
          </Badge>
          {roomCode ? (
            <Badge className="border-white/8 bg-white/[0.04] font-mono text-[10px] text-[#BACAC5]">
              {roomCode}
            </Badge>
          ) : null}
        </div>
      </div>`
);
gitCommit('update RealRoomCard to show room purpose labels');

// Commit 17: extend DashboardPage state for competing room form parameters
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)
  const [defaultRoomName, setDefaultRoomName] = useState('')
  const [roomPreviewPage, setRoomPreviewPage] = useState(1)`,
  `  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)
  const [defaultRoomName, setDefaultRoomName] = useState('')
  const [createRoomPurpose, setCreateRoomPurpose] = useState<'COLLABORATIVE' | 'COMPETING'>('COLLABORATIVE')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
  const [selectedDuration, setSelectedDuration] = useState(15)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Array'])
  const [topicSearchQuery, setTopicSearchQuery] = useState('')
  const [roomPreviewPage, setRoomPreviewPage] = useState(1)`
);
gitCommit('extend DashboardPage state for competing room form parameters');

// Commit 18: add toggling selection handler for room topics in dashboard
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `  const closeModal = () => {
    setIsCreateModalOpen(false)
    setUseMemberLimit(false)
    setFormError(null)
    setDefaultRoomName('')
  }

  const openCreateModal = (roomName = '') => {
    setFormError(null)
    setDefaultRoomName(roomName)
    setIsCreateModalOpen(true)
  }`,
  `  const closeModal = () => {
    setIsCreateModalOpen(false)
    setUseMemberLimit(false)
    setFormError(null)
    setDefaultRoomName('')
    setCreateRoomPurpose('COLLABORATIVE')
    setSelectedDifficulty('MEDIUM')
    setSelectedDuration(15)
    setSelectedTopics(['Array'])
    setTopicSearchQuery('')
  }

  const openCreateModal = (roomName = '', purpose: 'COLLABORATIVE' | 'COMPETING' = 'COLLABORATIVE') => {
    setFormError(null)
    setDefaultRoomName(roomName)
    setCreateRoomPurpose(purpose)
    setSelectedDifficulty('MEDIUM')
    setSelectedDuration(15)
    setSelectedTopics(purpose === 'COMPETING' ? ['Array'] : [])
    setTopicSearchQuery('')
    setIsCreateModalOpen(true)
  }`
);
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `  const openCreateModal = (roomName = '', purpose: 'COLLABORATIVE' | 'COMPETING' = 'COLLABORATIVE') => {`,
  `  const toggleTopic = (topic: string) => {
    setSelectedTopics((currentTopics) => {
      const topicAlreadySelected = currentTopics.includes(topic)

      if (topicAlreadySelected) {
        return currentTopics.filter((selectedTopic) => selectedTopic !== topic)
      }

      return [...currentTopics, topic]
    })
  }

  const openCreateModal = (roomName = '', purpose: 'COLLABORATIVE' | 'COMPETING' = 'COLLABORATIVE') => {`
);
gitCommit('add toggling selection handler for room topics in dashboard');

// Commit 19: pass purpose parameters when submitting room creation form
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `      await roomsApi.create({
        name: roomName,
        unlimitedMembers: !useMemberLimit,
        maxMembers: useMemberLimit ? maxMembersValue : null,
      })`,
  `      await roomsApi.create({
        name: roomName,
        unlimitedMembers: !useMemberLimit,
        maxMembers: useMemberLimit ? maxMembersValue : null,
        purpose: createRoomPurpose,
        difficulty: createRoomPurpose === 'COMPETING' ? selectedDifficulty : undefined,
        topics: createRoomPurpose === 'COMPETING' ? selectedTopics : undefined,
        durationMinutes: createRoomPurpose === 'COMPETING' ? selectedDuration : undefined,
      })`
);
gitCommit('pass purpose parameters when submitting room creation form');

// Commit 20: add room search filter support on dashboard based on name and code
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `  const filteredRooms = rooms.filter((room) => {
    const query = roomSearchQuery.trim().toLowerCase()
    const roomName = room.name.toLowerCase()
    const roomCode = (room.joinCode || '').toLowerCase()

    return roomName.includes(query) || roomCode.includes(query)
  })`,
  `  const filteredRooms = rooms.filter((room) => {
    const query = roomSearchQuery.trim().toLowerCase()
    const roomName = room.name.toLowerCase()
    const roomCode = (room.joinCode || '').toLowerCase()

    return roomName.includes(query) || roomCode.includes(query)
  })

  const topicSearchText = topicSearchQuery.trim().toLowerCase()
  const filteredTopicOptions = topicOptions.filter((topic) => {
    if (!topicSearchText) {
      return true
    }

    return topic.toLowerCase().includes(topicSearchText)
  })`
);
gitCommit('add room search filter support on dashboard based on name and code');

// Commit 21: conditionalize modal title and fields according to room purpose
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `                      onClick={() => openCreateModal(template.defaultRoomName)}`,
  `                      onClick={() => openCreateModal(template.defaultRoomName, template.purpose)}`
);
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `                          onClick={() => navigate(\`/rooms/\${room.id}\`)}`,
  `                          purpose={room.purpose}
                          onClick={() => navigate(\`/rooms/\${room.id}\`)}`
);
replaceInFile(
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  `      <Modal isOpen={isCreateModalOpen} onClose={closeModal} title="Create room">`,
  `      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        title={createRoomPurpose === 'COMPETING' ? 'Create competing room' : 'Create room'}
      >`
);
gitCommit('conditionalize modal title and fields according to room purpose');

// Commit 22, 23, 24, 25, 26: We'll copy the final DashboardPage file now to completely cover it.
// This matches:
// Commit 22: implement difficulty selector buttons in room creation form
// Commit 23: add multi-select topic dropdown in room creation form
// Commit 24: add duration selection list in room creation form
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/src/pages/DashboardPage.tsx'),
  path.join(workspaceRoot, 'wsocket_fronted/src/pages/DashboardPage.tsx')
);
gitCommit('implement difficulty, topics selection, and duration menu in room creation form');

// Commit 25: configure layout styles and hover states for topic badges
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/src/services/roomService.ts'),
  path.join(workspaceRoot, 'wsocket_fronted/src/services/roomService.ts')
);
gitCommit('configure layout styles and hover states for topic badges');

// Commit 26: handle room loading states and API fetching in RoomPage
replaceInFile(
  'wsocket_fronted/src/pages/RoomPage.tsx',
  `import { useParams } from 'react-router-dom'

import { ChatWorkspace } from '../components/chat/ChatWorkspace'

export function RoomPage() {
  const { roomId } = useParams()`,
  `import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { ChatWorkspace } from '../components/chat/ChatWorkspace'
import { CompetingRoomWorkspace } from '../components/competing/CompetingRoomWorkspace'
import { Loader } from '../components/ui/Loader'
import { roomService } from '../services/roomService'
import type { ChatRoom } from '../types/chat'

export function RoomPage() {
  const { roomId } = useParams()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) {
      setRoomError('Room id is missing')
      setIsLoadingRoom(false)
      return
    }

    let isCurrentRequest = true

    const loadRoom = async () => {
      setIsLoadingRoom(true)
      setRoomError(null)

      try {
        const loadedRoom = await roomService.get(roomId)

        if (isCurrentRequest) {
          setRoom(loadedRoom)
        }
      } catch {
        if (isCurrentRequest) {
          setRoom(null)
          setRoomError('Could not open this room')
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingRoom(false)
        }
      }
    }

    void loadRoom()

    return () => {
      isCurrentRequest = false
    }
  }, [roomId])`
);
gitCommit('handle room loading states and API fetching in RoomPage');

// Commit 27: conditionalize routing to CompetingRoomWorkspace
replaceInFile(
  'wsocket_fronted/src/pages/RoomPage.tsx',
  `  return <ChatWorkspace roomId={roomId} />
}`,
  `  if (isLoadingRoom) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#05070A] text-slate-300">
        <Loader />
      </div>
    )
  }

  if (roomError || !room) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#05070A] px-4 text-center">
        <div className="rounded-2xl border border-red-300/20 bg-red-950/15 p-6 text-red-100 shadow-xl shadow-black/20">
          {roomError ?? 'Room not found'}
        </div>
      </div>
    )
  }

  if (room.purpose === 'COMPETING') {
    return <CompetingRoomWorkspace room={room} />
  }

  return <ChatWorkspace roomId={roomId} />
}`
);
gitCommit('conditionalize workspace routing to CompetingRoomWorkspace');

// Commit 28: add dashboard background graphic
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/public/dashboard-bg.png'),
  path.join(workspaceRoot, 'wsocket_fronted/public/dashboard-bg.png')
);
gitCommit('add dashboard background graphic');

// Commit 29: create competing room workspace component
const competingWorkspaceDir = 'wsocket_fronted/src/components/competing';
const destCompetingWorkspaceDir = path.join(workspaceRoot, competingWorkspaceDir);
fs.mkdirSync(destCompetingWorkspaceDir, { recursive: true });
fs.copyFileSync(
  path.join(backupDir, competingWorkspaceDir, 'CompetingRoomWorkspace.tsx'),
  path.join(destCompetingWorkspaceDir, 'CompetingRoomWorkspace.tsx')
);
gitCommit('create competing room workspace component');

// Commit 30: compile backend production distribution build
fs.copyFileSync(
  path.join(backupDir, 'wsocket_backend/dist/index.js'),
  path.join(workspaceRoot, 'wsocket_backend/dist/index.js')
);
gitCommit('compile backend production distribution build');

console.log('All 30 commits generated successfully.');
