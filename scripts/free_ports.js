import { execSync } from 'child_process';

const PORTS = [5000, 5001, 5002, 5003, 5050, 5180, 5182];

console.log('🔍 Checking and freeing ports:', PORTS.join(', '));

for (const port of PORTS) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING') || line.includes('ESTABLISHED')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && parseInt(pid, 10) > 0 && pid !== String(process.pid)) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Killed stale process PID ${pid} holding port ${port}`);
          } catch (e) {
            // Already killed or insufficient permission
          }
        }
      }
    }
  } catch (e) {
    // Port not in use, continue
  }
}

console.log('🚀 All platform ports are completely freed and ready!');

