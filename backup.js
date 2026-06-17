const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = 'c:\\Users\\anuko\\code\\webdev\\javascript\\hk\\websockets';
const backupDir = path.join(workspaceRoot, 'temp_backup_dir');

// Files to backup
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
  'wsocket_backend/dist/index.js'
];

console.log('Starting backup of current files...');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Copy each file to backup directory
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

console.log('Backup completed successfully.');
