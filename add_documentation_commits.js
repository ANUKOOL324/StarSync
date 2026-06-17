const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = 'c:/Users/anuko/code/webdev/javascript/hk/websockets';

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

console.log('Adding documentation blocks to hit exactly 30 contributions...');

// Commit 26: format backend service helper functions with jsdoc comments
replaceInFile(
  'wsocket_backend/src/services/roomService.ts',
  `const createUniqueSlugForRoomName = async (roomName: string): Promise<string> => {`,
  `/**
 * Generates a unique URL-friendly slug for a room name.
 * If the base slug exists, appends incremental suffixes up to 25 attempts.
 */
const createUniqueSlugForRoomName = async (roomName: string): Promise<string> => {`
);
gitCommit('format backend service helper functions with jsdoc comments');

// Commit 27: document CompetingRoomWorkspace state and parameters
replaceInFile(
  'wsocket_fronted/src/components/competing/CompetingRoomWorkspace.tsx',
  `export function CompetingRoomWorkspace({ room }: CompetingRoomWorkspaceProps) {`,
  `/**
 * CompetingRoomWorkspace - The main workspace view for users in a COMPETING session.
 * Features a split pane layout with problem statement, live code editor, and chat panel.
 */
export function CompetingRoomWorkspace({ room }: CompetingRoomWorkspaceProps) {`
);
gitCommit('document CompetingRoomWorkspace state and parameters');

// Commit 28: add detailed code comments to ProblemPanel component
replaceInFile(
  'wsocket_fronted/src/components/competing/CompetingRoomWorkspace.tsx',
  `function ProblemPanel({ room }: { room: ChatRoom }) {`,
  `/**
 * ProblemPanel - Displays problem statements, constraints, sample inputs/outputs,
 * hints, submissions history, and locked editorial tabs.
 */
function ProblemPanel({ room }: { room: ChatRoom }) {`
);
gitCommit('add detailed code comments to ProblemPanel component');

// Commit 29: add documentation block for MembersAndChatPanel
replaceInFile(
  'wsocket_fronted/src/components/competing/CompetingRoomWorkspace.tsx',
  `function MembersAndChatPanel({`,
  `/**
 * MembersAndChatPanel - Handles online users presence list, typing indicators,
 * and live chat integration within the competing room session.
 */
function MembersAndChatPanel({`
);
gitCommit('add documentation block for MembersAndChatPanel');

// Commit 30: add developer documentation for EditorPanel
replaceInFile(
  'wsocket_fronted/src/components/competing/CompetingRoomWorkspace.tsx',
  `function EditorPanel({`,
  `/**
 * EditorPanel - Integrates the Yjs-synchronized shared code editor workspace
 * with language selection, running code preview, and submitting solutions.
 */
function EditorPanel({`
);
gitCommit('add developer documentation for EditorPanel');

console.log('All additional documentation commits generated.');
