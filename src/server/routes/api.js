import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { getFirebaseStatus, getRankingFromFirestore, getAllRankingsFromFirestore } from '../../pipeline/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const dataDir = path.resolve(__dirname, '../../../data');
const pipelineScript = path.resolve(__dirname, '../../pipeline/index.js');

// ==========================================================================
// REST API ROUTER (FIRESTORE DATABASE & LOCAL FALLBACK)
// ==========================================================================

// 1. Kiểm tra trạng thái hệ thống & kết nối DB
// GET /api/status
router.get('/status', async (req, res) => {
    const dbStatus = getFirebaseStatus();
    let lastUpdated = null;
    try {
        const platformsPath = path.join(dataDir, 'platforms.json');
        const content = JSON.parse(await fs.readFile(platformsPath, 'utf-8'));
        lastUpdated = content.last_updated;
    } catch (_) {}

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
            type: 'firebase_firestore',
            ...dbStatus
        },
        last_updated: lastUpdated
    });
});

// 2. Lấy toàn bộ rankings (Ưu tiên Firestore DB -> Fallback file local)
// GET /api/rankings
router.get('/rankings', async (req, res) => {
    const dbData = await getAllRankingsFromFirestore();
    if (dbData && dbData.rankings && Object.keys(dbData.rankings).length > 0) {
        return res.json({
            source: 'firebase_firestore',
            last_updated: dbData.last_updated,
            rankings: dbData.rankings
        });
    }

    try {
        const platformsPath = path.join(dataDir, 'platforms.json');
        const content = JSON.parse(await fs.readFile(platformsPath, 'utf-8'));
        return res.json({
            source: 'local_file',
            last_updated: content.last_updated,
            rankings: content.rankings || {}
        });
    } catch (e) {
        return res.status(500).json({ error: 'Không thể đọc dữ liệu rankings', details: e.message });
    }
});

// 3. Lấy rankings từng nền tảng (/api/rankings/youtube, /api/rankings/spotify, ...)
// GET /api/rankings/:platform
router.get('/rankings/:platform', async (req, res) => {
    const platform = req.params.platform.toLowerCase();
    
    // Ưu tiên đọc từ Firestore Document
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

    // Fallback đọc file local data/{platform}.json
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

// 4. Kích hoạt thủ công pipeline cào dữ liệu qua API (hỗ trợ cả GET /api/fetch và POST /api/sync)
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

router.get('/fetch', triggerFetch);
router.post('/sync', triggerFetch);

export default router;
