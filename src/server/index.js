import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const clientDir = path.resolve(__dirname, '../client');
const publicDir = path.resolve(__dirname, '../../public');
const dataDir = path.resolve(__dirname, '../../data');

// Middleware parse JSON body
app.use(express.json());

// 1. Phục vụ UI client (index.html, app.js, style.css)
app.use(express.static(clientDir));

// 2. Phục vụ static assets (logo, favicon, banner, manifest)
app.use(express.static(publicDir));
app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.use('/images', express.static(path.join(publicDir, 'assets')));

// 3. Phục vụ dữ liệu tham khảo modular (/data/platforms.json, /data/youtube/...)
app.use('/data', express.static(dataDir));

// 4. Mount REST API Router (/api/status, /api/rankings, /api/fetch, ...)
app.use('/api', apiRouter);

// Sitemap & Robots SEO
app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(publicDir, 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(publicDir, 'robots.txt'));
});

// 5. Fallback SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`Top Trending Server đang chạy:`);
    console.log(`  - Local:    http://localhost:${PORT}`);
    console.log(`  - Network:  http://${localIp}:${PORT}`);
    console.log(`  - API:      http://localhost:${PORT}/api/status`);
    console.log(`Vào http://localhost:${PORT}/api/fetch để kích hoạt cào dữ liệu thủ công.`);
});
