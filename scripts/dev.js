import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🚀 Starting URL Shortener full-stack application...\n');

const server = spawn(npmCmd, ['run', 'start'], {
  cwd: path.join(ROOT, 'server'),
  stdio: 'inherit',
  shell: isWindows
});

const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(ROOT, 'client'),
  stdio: 'inherit',
  shell: isWindows
});

function cleanup() {
  console.log('\nShutting down server and client processes...');
  try { server.kill(); } catch {}
  try { client.kill(); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
