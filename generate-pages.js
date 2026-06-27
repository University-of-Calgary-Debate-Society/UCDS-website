import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routes = [
  'events',
  'events/hosted-tournaments',
  'help',
  'help/thanks',
  'events/calgary-summer-cup',
  'events/calgary-summer-cup/registration',
  'events/calgary-summer-cup/registration/success',
  'blog',
  'resources',
  'resources/internal',
  'resources/practice',
  'resources/external',
  'resources/matter',
  'resources/internal/constitution',
  'resources/internal/consitution',
  'connect',
  'socials',
  'calendar',
  'connect/unsubscribe',
  'join',
  'join/welcome',
  'void',
  'void/discord',
  'void/discord/terms-and-privacy',
  'executive',
  'executive/roster',
  'executive/ledger',
  'executive/email',
  'executive/blog',
  'executive/access',
  'members'
];

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found! Run npm run build first.');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('Generating subfolder index.html pages for GitHub Pages...');

routes.forEach((route) => {
  const targetDir = path.join(distPath, route);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, indexContent, 'utf8');
  console.log(`- Created ${route}/index.html`);
});

console.log('All subfolder index.html pages generated successfully!');
