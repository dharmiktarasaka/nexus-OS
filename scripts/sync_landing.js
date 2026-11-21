import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const sourceDir = path.join(rootDir, 'landing-page');
const targetPublicDir = path.join(rootDir, 'client', 'public', 'landing');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });

  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyFolderSync(sourceDir, targetPublicDir);
  console.log('✅ Synchronized landing-page into client/public/landing for unified deployment.');
} catch (err) {
  console.warn('⚠️ sync_landing notice:', err.message);
}
