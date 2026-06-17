const fs = require('fs');
const path = require('path');

const workspaceRoot = 'c:/Users/anuko/code/webdev/javascript/hk/websockets';
const backupDir = path.join(workspaceRoot, 'temp_backup_dir');

const filesToBackup = [
  'wsocket_backend/prisma/schema.prisma',
  'wsocket_backend/prisma/migrations/20260616170000_add_competing_room_metadata/migration.sql',
  'wsocket_backend/prisma/migrations/migration_lock.toml',
  'wsocket_backend/src/validations/roomValidation.ts',
  'wsocket_backend/src/services/roomService.ts',
  'wsocket_fronted/src/types/chat.ts',
  'wsocket_fronted/src/services/roomService.ts',
  'wsocket_fronted/src/pages/RoomPage.tsx',
  'wsocket_fronted/src/pages/DashboardPage.tsx',
  'wsocket_fronted/src/components/competing/CompetingRoomWorkspace.tsx',
  'wsocket_fronted/public/dashboard-bg.png',
  'wsocket_backend/dist/index.js',
  // Shadcn and packages files
  'wsocket_fronted/package.json',
  'wsocket_fronted/package-lock.json',
  'wsocket_fronted/tsconfig.json',
  'wsocket_fronted/tsconfig.app.json',
  'wsocket_fronted/vite.config.ts',
  'wsocket_fronted/src/components/ui/Avatar.tsx',
  'wsocket_fronted/src/components/ui/Button.tsx',
  'wsocket_fronted/src/components/ui/Input.tsx',
  'wsocket_fronted/src/components/ui/badge.tsx',
  'wsocket_fronted/src/components/ui/card.tsx',
  'wsocket_fronted/src/components/ui/resizable.tsx',
  'wsocket_fronted/src/components/ui/separator.tsx',
  'wsocket_fronted/src/components/ui/skeleton.tsx'
];

console.log('Starting backup of all files (including shadcn/package)...');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

for (const file of filesToBackup) {
  const src = path.join(workspaceRoot, file);
  const dest = path.join(backupDir, file);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`Backed up: ${file}`);
  } else {
    console.log(`Warning: File does not exist, cannot backup: ${file}`);
  }
}

console.log('Backup of all files completed successfully.');
