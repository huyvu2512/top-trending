import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchNetflixTrends } from './collectors/netflix.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NETFLIX_DATA_PATH = path.resolve(__dirname, '../../data/netflix.json');
const PLATFORMS_FILE_PATH = path.resolve(__dirname, '../../data/platforms.json');

export async function scrapeAllNetflix() {
    console.log('=== [NETFLIX SCRAPER] BẮT ĐẦU CÀO DỮ LIỆU TOP 10 VIỆT NAM ===');

    try {
        const items = await fetchNetflixTrends();
        if (items.length === 0) {
            console.warn('⚠️ Không lấy được dữ liệu Netflix.');
            return [];
        }

        // 1. Lưu data/netflix.json
        await fs.writeFile(NETFLIX_DATA_PATH, JSON.stringify(items, null, 2), 'utf-8');
        console.log(`✅ [Netflix Scraper]: Đã lưu ${items.length} tác phẩm vào data/netflix.json`);

        // 2. Đồng bộ vào data/platforms.json
        try {
            const rawPlatforms = await fs.readFile(PLATFORMS_FILE_PATH, 'utf-8');
            const platformsData = JSON.parse(rawPlatforms);
            if (!platformsData.rankings) platformsData.rankings = {};
            platformsData.rankings['netflix'] = items;
            platformsData.last_updated = new Date().toISOString();
            await fs.writeFile(PLATFORMS_FILE_PATH, JSON.stringify(platformsData, null, 2), 'utf-8');
            console.log(`✅ [Netflix Scraper]: Đã cập nhật vào data/platforms.json`);
        } catch (e) {
            console.warn('[Netflix Scraper]: Lỗi cập nhật platforms.json:', e.message);
        }

        console.log('=== [NETFLIX SCRAPER] HOÀN TẤT THÀNH CÔNG ===');
        return items;
    } catch (err) {
        console.error('❌ [Netflix Scraper Lỗi]:', err);
        throw err;
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    scrapeAllNetflix().then(() => {
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
}
