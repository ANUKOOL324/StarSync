const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = 'c:/Users/anuko/code/webdev/javascript/hk/websockets';
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

console.log('Starting step-by-step commit execution (30 atomic commits)...');

// Re-verify clean status
execSync('git reset --hard', { cwd: workspaceRoot });

// Commit 1: add workspace configuration and dependencies
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/package.json'), path.join(workspaceRoot, 'wsocket_fronted/package.json'));
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/package-lock.json'), path.join(workspaceRoot, 'wsocket_fronted/package-lock.json'));
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/tsconfig.json'), path.join(workspaceRoot, 'wsocket_fronted/tsconfig.json'));
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/tsconfig.app.json'), path.join(workspaceRoot, 'wsocket_fronted/tsconfig.app.json'));
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/vite.config.ts'), path.join(workspaceRoot, 'wsocket_fronted/vite.config.ts'));
gitCommit('add workspace configuration and dependencies');

// Commit 2: add base badge component
fs.mkdirSync(path.join(workspaceRoot, 'wsocket_fronted/src/components/ui'), { recursive: true });
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/badge.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/badge.tsx'));
gitCommit('add base badge component');

// Commit 3: add base button component
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/Button.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/Button.tsx'));
gitCommit('add base button component');

// Commit 4: add base input component
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/Input.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/Input.tsx'));
gitCommit('add base input component');

// Commit 5: add base avatar component
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/Avatar.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/Avatar.tsx'));
gitCommit('add base avatar component');

// Commit 6: add base card component
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/card.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/card.tsx'));
gitCommit('add base card component');

// Commit 7: add base resizable component
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/resizable.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/resizable.tsx'));
gitCommit('add base resizable component');

// Commit 8: add base separator and skeleton components
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/separator.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/separator.tsx'));
fs.copyFileSync(path.join(backupDir, 'wsocket_fronted/src/components/ui/skeleton.tsx'), path.join(workspaceRoot, 'wsocket_fronted/src/components/ui/skeleton.tsx'));
gitCommit('add base separator and skeleton components');

// Commit 9: add RoomPurpose and ProblemDifficulty enum definitions to schema
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

// Commit 10: add purpose, difficulty, topics, durationMinutes to Room model in schema
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

// Commit 11: create migration files for competing room metadata schema changes
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

// Commit 12: define roomPurposeSchema and problemDifficultySchema Zod schemas
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

// Commit 13: add supportedDurationOptions schema constant for room validation
replaceInFile(
  'wsocket_backend/src/validations/roomValidation.ts',
  'const problemDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);',
  `const problemDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
const supportedDurationOptions = [15, 30, 45, 60] as const;`
);
gitCommit('add supportedDurationOptions schema constant for room validation');

// Commit 16 (split step 14): update createRoomSchema with purpose and difficulty fields
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

// Commit 15: add topics list and duration validation to createRoomSchema
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

// Commit 16: implement superRefine validations for competing rooms in createRoomSchema
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

// Commit 17: include purpose and difficulty in roomSelect object query select list
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

// Commit 18: support unique slug generation helper function for rooms
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

// Commit 19: implement helper logic to resolve room purpose and options
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

// Commit 20: rewrite createRoom service to populate purpose-specific attributes
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

// Commit 21: add purpose field to ChatRoom type definitions on client
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/src/types/chat.ts'),
  path.join(workspaceRoot, 'wsocket_fronted/src/types/chat.ts')
);
gitCommit('add purpose field to ChatRoom type definitions on client');

// Commit 22: configure layouts and metadata mapping for client room service
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/src/services/roomService.ts'),
  path.join(workspaceRoot, 'wsocket_fronted/src/services/roomService.ts')
);
gitCommit('configure layouts and metadata mapping for client room service');

// Commit 23: add dashboard background graphic
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/public/dashboard-bg.png'),
  path.join(workspaceRoot, 'wsocket_fronted/public/dashboard-bg.png')
);
gitCommit('add dashboard background graphic');

// Commit 24: define template attributes and options on dashboard
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

const workspaceTemplates: WorkspaceTemplate[] = [
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
gitCommit('define template attributes and options on dashboard');

// Commit 25: update RealRoomCard to show room purpose labels
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
      className="group rounded-2xl bg-gradient-to-b from-[#5A5A5C]/70 via-white/12 to-[#28282A]/75 p-[2px] text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5"
    >
      <Card className="flex h-full min-h-[9rem] flex-col justify-between rounded-[14px] bg-[#111316]/86 p-5 transition duration-300 group-hover:bg-[#181B1E]/92">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
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
      className="group rounded-2xl bg-gradient-to-b from-[#5A5A5C]/70 via-white/12 to-[#28282A]/75 p-[2px] text-left shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5"
    >
      <Card className="flex h-full min-h-[9rem] flex-col justify-between rounded-[14px] bg-[#111316]/86 p-5 transition duration-300 group-hover:bg-[#181B1E]/92">
        <div className="flex items-start justify-between gap-4">
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

// Commit 26: implement search filter support and room creation modal details
fs.copyFileSync(
  path.join(backupDir, 'wsocket_fronted/src/pages/DashboardPage.tsx'),
  path.join(workspaceRoot, 'wsocket_fronted/src/pages/DashboardPage.tsx')
);
gitCommit('implement search filter support and room creation modal details');

// Commit 27: handle room loading states and API fetching in RoomPage
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

// Commit 28: conditionalize routing to CompetingRoomWorkspace
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
  path.join(workspaceRoot, 'wsocket_backend/dist/index.js'));
gitCommit('compile backend production distribution build');

console.log('All 30 commits generated successfully.');
