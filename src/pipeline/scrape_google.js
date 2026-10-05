import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchGoogleTrends } from './collectors/google_trends.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GOOGLE_DATA_PATH = path.resolve(__dirname, '../../data/google.json');
const EXPLORE_DATA_PATH = path.resolve(__dirname, '../../data/google_explore.json');
const PLATFORMS_FILE_PATH = path.resolve(__dirname, '../../data/platforms.json');

export async function scrapeAllGoogle() {
    console.log('=== [GOOGLE TRENDS SCRAPER] BẮT ĐẦU CÀO DỮ LIỆU GOOGLE TRENDS (7 NGÀY & KHÁM PHÁ) ===');

    try {
        const result = await fetchGoogleTrends('VN');
        const trendingList = result.trending || [];
        const exploreData = result.explore || { top: [], rising: [] };

        // 1. Lưu data/google.json (135 xu hướng thịnh hành 7 ngày)
        if (trendingList.length > 0) {
            await fs.writeFile(GOOGLE_DATA_PATH, JSON.stringify(trendingList, null, 2), 'utf-8');
            console.log(`✅ [Google Scraper]: Đã lưu ${trendingList.length} xu hướng vào data/google.json`);
        }

        // 2. Lưu data/google_explore.json (50 từ khóa hàng đầu & 50 từ khóa đột biến)
        if (exploreData.top && exploreData.top.length > 0) {
            await fs.writeFile(EXPLORE_DATA_PATH, JSON.stringify(exploreData, null, 2), 'utf-8');
            console.log(`✅ [Google Scraper]: Đã lưu ${exploreData.top.length} từ khóa hàng đầu & ${exploreData.rising.length} từ khóa đột biến vào data/google_explore.json`);
        }

        // 3. Cập nhật data/platforms.json
        try {
            const rawPlatforms = await fs.readFile(PLATFORMS_FILE_PATH, 'utf-8');
            const platformsData = JSON.parse(rawPlatforms);
            if (!platformsData.rankings) platformsData.rankings = {};
            platformsData.rankings['google'] = trendingList;
            platformsData.last_updated = new Date().toISOString();
            await fs.writeFile(PLATFORMS_FILE_PATH, JSON.stringify(platformsData, null, 2), 'utf-8');
            console.log(`✅ [Google Scraper]: Đã đồng bộ vào data/platforms.json`);
        } catch (e) {
            console.warn('[Google Scraper]: Lỗi cập nhật platforms.json:', e.message);
        }

        console.log('=== [GOOGLE TRENDS SCRAPER] HOÀN TẤT THÀNH CÔNG ===');
        return { trending: trendingList, explore: exploreData };
    } catch (err) {
        console.error('❌ [Google Scraper Lỗi]:', err);
        throw err;
    }
}

// Nếu gọi trực tiếp từ dòng lệnh: node src/pipeline/scrape_google.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    scrapeAllGoogle().then(() => {
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
}
