import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('===============================================================');
console.log('🚀 Launching Nexus OS • All-in-One Platform Services...');
console.log('===============================================================');

const processes = [];

function startProcess(name, cmd, args, cwd, colorCode) {
  const reset = '\x1b[0m';
  const color = `\x1b[${colorCode}m`;
  const prefix = `${color}[${name}]${reset} `;

  const proc = spawn(cmd, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.log(`${prefix}${line}`));
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.error(`${prefix}${line}`));
  });

  proc.on('close', (code) => {
    console.log(`${prefix}Process exited with code ${code}`);
  });

  processes.push(proc);
  return proc;
}

// 1. Start Central Server (Port 5050)
const centralServerPath = path.join(__dirname, 'server');
startProcess('Central:5050', 'node', ['src/index.js'], centralServerPath, '34'); // Blue

// 2. Start CRM Backend Server (Port 5001)
const crmServerPath = path.join(__dirname, 'server', 'crm');
startProcess('CRM:5001', 'node', ['server.js'], crmServerPath, '32'); // Green

// 3. Start Website Builder Backend Server (Port 5002)
const websiteServerPath = path.join(__dirname, 'server', 'website');
startProcess('Website:5002', 'node', ['index.js'], websiteServerPath, '36'); // Cyan

// 4. Start Client Vite Dev Server (Port 5180)
const clientPath = path.join(__dirname, 'client');
startProcess('Client:5180', 'npm', ['run', 'dev'], clientPath, '35'); // Magenta

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all Nexus OS services...');
  processes.forEach(p => {
    try { p.kill(); } catch (e) {}
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  processes.forEach(p => {
    try { p.kill(); } catch (e) {}
  });
  process.exit(0);
});

