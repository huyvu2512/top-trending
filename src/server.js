import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import os from 'os';
import { getFirebaseStatus, getRankingFromFirestore, getAllRankingsFromFirestore } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.resolve(__dirname, '../public');
const dataDir = path.resolve(publicDir, 'data');
const pipelineScript = path.resolve(__dirname, 'pipeline.js');

app.use(express.json());

// 1. Phục vụ toàn bộ frontend & static assets & data
app.use(express.static(publicDir));
app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.use('/images', express.static(path.join(publicDir, 'assets')));
app.use('/data', express.static(dataDir));

// 2. REST API Endpoints
app.get('/api/status', async (req, res) => {
    const dbStatus = getFirebaseStatus();
    let lastUpdated = null;
    const platforms = ['youtube', 'spotify', 'google', 'netflix'];
    const platformsUpdated = {};
    for (const p of platforms) {
        try {
            const filePath = path.join(dataDir, `${p}.json`);
            const stat = await fs.stat(filePath);
            const mtime = stat.mtime.toISOString();
            platformsUpdated[p] = mtime;
            if (!lastUpdated || mtime > lastUpdated) lastUpdated = mtime;
        } catch (_) {}
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
            type: 'firebase_firestore',
            ...dbStatus
        },
        platforms_updated: platformsUpdated,
        last_updated: lastUpdated
    });
});

app.get('/api/rankings', async (req, res) => {
    try {
        const dbData = await getAllRankingsFromFirestore();
        if (dbData && dbData.rankings && Object.keys(dbData.rankings).length > 0) {
            return res.json({
                source: 'firebase_firestore',
                last_updated: dbData.last_updated,
                platforms_updated: dbData.platforms_updated || {},
                rankings: dbData.rankings
            });
        }
    } catch (dbErr) {
        console.warn('[API /rankings]: Lỗi đọc Firestore, chuyển sang file cục bộ:', dbErr.message);
    }

    try {
        const platforms = ['youtube', 'spotify', 'google', 'netflix'];
        const rankings = {};
        const platformsUpdated = {};
        let latestUpdate = null;

        await Promise.all(platforms.map(async (p) => {
            try {
                const filePath = path.join(dataDir, `${p}.json`);
                const stat = await fs.stat(filePath);
                const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
                rankings[p] = content;
                const mtime = stat.mtime.toISOString();
                platformsUpdated[p] = mtime;
                if (!latestUpdate || mtime > latestUpdate) latestUpdate = mtime;
            } catch (_) {
                rankings[p] = [];
            }
        }));

        return res.json({
            source: 'local_files',
            last_updated: latestUpdate,
            platforms_updated: platformsUpdated,
            rankings
        });
    } catch (e) {
        return res.status(500).json({ error: 'Không thể đọc dữ liệu rankings', details: e.message });
    }
});

app.get('/api/rankings/:platform', async (req, res) => {
    const platform = req.params.platform.toLowerCase();
    const firestoreDoc = await getRankingFromFirestore(platform);
    if (firestoreDoc && firestoreDoc.items) {
        return res.json({
            source: 'firebase_firestore',
            platform,
            last_updated: firestoreDoc.lastUpdated,
            total: firestoreDoc.totalItems || firestoreDoc.items.length,
            items: firestoreDoc.items
        });
    }

    try {
        const filePath = path.join(dataDir, `${platform}.json`);
        const items = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        return res.json({
            source: 'local_file',
            platform,
            total: items.length,
            items
        });
    } catch (e) {
        return res.status(404).json({ error: `Không tìm thấy dữ liệu cho nền tảng: ${platform}` });
    }
});

const triggerFetch = (req, res) => {
    console.log('[API]: Kích hoạt pipeline cào dữ liệu mới 100%...');
    const fetchProcess = spawn('node', [pipelineScript]);
    let output = '';
    fetchProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[Fetch]: ${data}`);
    });
    fetchProcess.stderr.on('data', (data) => {
        console.error(`[Fetch Lỗi]: ${data}`);
    });
    fetchProcess.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true, message: 'Cập nhật dữ liệu mới thành công và đồng bộ DB', log: output });
        } else {
            res.status(500).json({ success: false, message: 'Cập nhật dữ liệu thất bại', code });
        }
    });
};

app.get('/api/fetch', triggerFetch);
app.post('/api/sync', triggerFetch);

// 3. Fallback SPA routing cho mọi sub-path
app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
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

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        const localIp = getLocalIp();
        console.log(`Top Trending Server đang chạy:`);
        console.log(`  - Local:    http://localhost:${PORT}`);
        console.log(`  - Network:  http://${localIp}:${PORT}`);
        console.log(`  - API:      http://localhost:${PORT}/api/status`);
    });
}

export default app;
