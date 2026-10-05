import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const clientDir = path.join(rootDir, 'src/client');

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(distDir, { recursive: true });

// 1. Copy toàn bộ assets & file tĩnh từ public/ sang dist/
await fs.cp(publicDir, distDir, { recursive: true });

// 2. Copy toàn bộ mã nguồn frontend (HTML, CSS, JS, Views) từ src/client/ sang dist/
await fs.cp(clientDir, distDir, { recursive: true });

console.log('[Build]: Đã xuất bản giao diện ra dist/ hoàn tất chuẩn CDN Vercel!');
