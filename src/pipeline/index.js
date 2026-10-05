import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { fetchGoogleTrends } from './collectors/google_trends.js';
import { fetchYouTubeTrends } from './collectors/youtube.js';
import { fetchSpotifyTop50 } from './collectors/spotify.js';
import { fetchNetflixTrends } from './collectors/netflix.js';
import { saveRankingToFirestore } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLATFORMS_FILE_PATH = path.resolve(__dirname, '../../data/platforms.json');

async function main() {
    console.log('=== [TOP TRENDING DATA PIPELINE] BẮT ĐẦU CÀO DỮ LIỆU ===');
    const startTime = Date.now();

    // 1. Đọc metadata từ data/platforms.json
    const defaultData = {
        last_updated: null,
        region: { code: "VN", name: "Việt Nam", flag: "🇻🇳" },
        platforms: [
            { id: "all", name: "Tất cả", icon: "grid" },
            { id: "youtube", name: "YouTube", icon: "youtube" },
            { id: "spotify", name: "Spotify", icon: "spotify" },
            { id: "google", name: "Google Trends", icon: "google" },
            { id: "netflix", name: "Netflix", icon: "netflix" }
        ],
        categories_by_platform: {
            all: [{ id: "all", name: "Mọi danh mục" }],
            youtube: [
                { id: "all", name: "Tổng hợp" },
                { id: "music", name: "Âm nhạc" },
                { id: "gaming", name: "Trò chơi" },
                { id: "entertainment", name: "Giải trí" },
                { id: "news", name: "Tin tức" },
                { id: "tech", name: "Công nghệ" }
            ],
            spotify: [{ id: "all", name: "Top 50 Ca khúc" }],
            google: [
                { id: "all", name: "Tổng hợp" },
                { id: "sports", name: "Thể thao" },
                { id: "entertainment", name: "Giải trí & Truyền thông" },
                { id: "news", name: "Tin tức & Xã hội" },
                { id: "tech_life", name: "Công nghệ & Tiện ích" },
                { id: "explore", name: "Khám phá" }
            ],
            netflix: [
                { id: "all", name: "Tổng hợp" },
                { id: "films", name: "Phim điện ảnh" },
                { id: "tv", name: "Phim truyền hình" }
            ]
        },
        rankings: {}
    };

    let currentData = { ...defaultData };

    try {
        const fileContent = await fs.readFile(PLATFORMS_FILE_PATH, 'utf-8');
        currentData = JSON.parse(fileContent);
    } catch (e) {
        console.log('[Pipeline]: Khởi tạo mới data/platforms.json từ template.');
    }

    // Luôn khởi tạo rankings mới tinh, KHÔNG giữ lại bất kỳ dữ liệu cũ nào
    currentData.rankings = {};

    // Hàm lưu file vào data/{platform}.json
    async function saveDataFile(platform, items) {
        if (!items || items.length === 0) return;
        try {
            const filePath = path.resolve(__dirname, `../../data/${platform}.json`);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
            console.log(`[Pipeline]: Đã lưu dữ liệu vào data/${platform}.json`);
        } catch (e) {
            console.warn(`[Save Error ${platform}]:`, e.message);
        }
    }

    // 2. Thu thập Google Trends (Việt Nam) - 100% Free
    try {
        const ggResult = await fetchGoogleTrends('VN');
        const ggTrending = Array.isArray(ggResult) ? ggResult : (ggResult.trending || []);
        const ggExplore = ggResult.explore || { top: [], rising: [] };

        if (ggTrending.length > 0) {
            currentData.rankings['google'] = ggTrending;
            await saveRankingToFirestore('google', ggTrending, { platform: 'google', region: 'VN' });
            await saveDataFile('google', ggTrending);
        }
        if (ggExplore.top && ggExplore.top.length > 0) {
            const explorePath = path.resolve(__dirname, '../../data/google_explore.json');
            await fs.writeFile(explorePath, JSON.stringify(ggExplore, null, 2), 'utf-8');
            console.log('[Pipeline]: Đã lưu dữ liệu vào data/google_explore.json');
        }
    } catch (err) {
        console.error('[Google Trends Pipe Error]:', err.message);
    }

    // 3. Thu thập YouTube (Việt Nam)
    try {
        const ytVn = await fetchYouTubeTrends('VN', 'all', []);
        if (ytVn.length > 0) {
            currentData.rankings['youtube'] = ytVn;
            await saveRankingToFirestore('youtube', ytVn, { platform: 'youtube', region: 'VN' });
            await saveDataFile('youtube', ytVn);
        }
    } catch (err) {
        console.error('[YouTube Pipe Error]:', err.message);
    }

    // 4. Thu thập Spotify (Việt Nam)
    try {
        const spVn = await fetchSpotifyTop50('VN');
        if (spVn.length > 0) {
            currentData.rankings['spotify'] = spVn;
            await saveRankingToFirestore('spotify', spVn, { platform: 'spotify', region: 'VN' });
            await saveDataFile('spotify', spVn);
        }
    } catch (err) {
        console.error('[Spotify Pipe Error]:', err.message);
    }

    // 5. Thu thập Netflix (Việt Nam)
    try {
        const nfVn = await fetchNetflixTrends();
        if (nfVn.length > 0) {
            currentData.rankings['netflix'] = nfVn;
            await saveRankingToFirestore('netflix', nfVn, { platform: 'netflix', region: 'VN' });
            await saveDataFile('netflix', nfVn);
        }
    } catch (err) {
        console.error('[Netflix Pipe Error]:', err.message);
    }



    // Cập nhật timestamp và dữ liệu mới tinh vào platforms.json
    try {
        const platformsPath = path.resolve(__dirname, '../../data/platforms.json');
        await fs.mkdir(path.dirname(platformsPath), { recursive: true });
        let pContent = currentData;
        try {
            pContent = JSON.parse(await fs.readFile(platformsPath, 'utf-8'));
        } catch (_) {}
        const nowIso = new Date().toISOString();
        pContent.last_updated = nowIso;
        pContent.rankings = currentData.rankings;
        await fs.writeFile(platformsPath, JSON.stringify(pContent, null, 2), 'utf-8');
        console.log(`[Pipeline]: Đã cập nhật mốc thời gian hoàn tất: ${nowIso} và lưu dữ liệu mới.`);
    } catch (err) {
        console.warn('[Pipeline platforms.json error]:', err.message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`=== [TOP TRENDING DATA PIPELINE] HOÀN TẤT TRONG ${duration}s ===`);
}

main().catch(console.error);
