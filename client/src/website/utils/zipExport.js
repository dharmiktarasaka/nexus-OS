// client/src/utils/zipExport.js
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function exportProjectToZip(project) {
  if (!project) return;

  const zip = new JSZip();

  // 1. index.html
  zip.file('index.html', project.html || '<!DOCTYPE html><html><body></body></html>');

  // 2. styles.css
  zip.file('styles.css', project.css || '/* styles */');

  // 3. script.js
  zip.file('script.js', project.js || '// script');

  // 4. README.md
  const readmeContent = `# ${project.name || 'Exported Website'}

${project.tagline || 'Crafted with PulseStudio AI'}

## Project Summary
- **Category:** ${project.category || 'General'}
- **Generated On:** ${project.createdAt || new Date().toISOString()}
- **Synthesis Engine:** ${project.provider || 'AI Website Builder'}

## Instant Local Launch
You can run this project locally without any build tool:
\`\`\`bash
# Using python
python -m http.server 8080

# Or using npx serve
npx serve .
\`\`\`

## Production Deployment
Upload this directory directly to:
- **Vercel / Netlify / Cloudflare Pages:** Drag and drop the folder or push to GitHub.
- **AWS S3 / CloudFront:** Upload files directly to your bucket with public read or OAI.

Enjoy your bespoke, responsive web experience!
`;
  zip.file('README.md', readmeContent);

  // Generate zip binary and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `${(project.name || 'website').toLowerCase().replace(/[^a-z0-9]/g, '-')}-production.zip`;
  saveAs(blob, filename);
}
