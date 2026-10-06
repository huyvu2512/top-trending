import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { fetchGoogleTrends } from './collectors/google_trends.js';
import { fetchYouTubeTrends } from './collectors/youtube.js';
import { fetchSpotifyTop50 } from './collectors/spotify.js';
import { fetchNetflixTrends } from './collectors/netflix.js';
import { saveRankingToFirestore, saveMetadataToFirestore } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DATA_DIR = path.resolve(__dirname, '../public/data');
const ROOT_DATA_DIR = path.resolve(__dirname, '../data');

async function main() {
    console.log('=== [TOP TRENDING DATA PIPELINE] BẮT ĐẦU CÀO DỮ LIỆU ===');
    const startTime = Date.now();

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
    const platformsFilePath = path.join(PUBLIC_DATA_DIR, 'platforms.json');

    try {
        const fileContent = await fs.readFile(platformsFilePath, 'utf-8');
        currentData = JSON.parse(fileContent);
    } catch (_) {
        try {
            const rootContent = await fs.readFile(path.join(ROOT_DATA_DIR, 'platforms.json'), 'utf-8');
            currentData = JSON.parse(rootContent);
        } catch (e) {
            console.log('[Pipeline]: Khởi tạo mới platforms.json từ template.');
        }
    }

    currentData.rankings = {};

    async function saveDataFile(fileName, content) {
        if (!content) return;
        const serialized = JSON.stringify(content, null, 2);
        const targetDirs = [PUBLIC_DATA_DIR, ROOT_DATA_DIR];

        for (const dir of targetDirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(path.join(dir, fileName), serialized, 'utf-8');
            } catch (e) {
                console.warn(`[Save Error ${fileName} in ${dir}]:`, e.message);
            }
        }
        console.log(`[Pipeline]: Đã lưu dữ liệu vào ${fileName}`);
    }

    // 1. Google Trends (Việt Nam)
    try {
        const ggResult = await fetchGoogleTrends('VN');
        const ggTrending = Array.isArray(ggResult) ? ggResult : (ggResult.trending || []);
        const ggExplore = ggResult.explore || { top: [], rising: [] };

        if (ggTrending.length > 0) {
            currentData.rankings['google'] = ggTrending;
            await saveRankingToFirestore('google', ggTrending, { platform: 'google', region: 'VN' });
            await saveDataFile('google.json', ggTrending);
        }
        if (ggExplore.top && ggExplore.top.length > 0) {
            await saveDataFile('google_explore.json', ggExplore);
        }
    } catch (err) {
        console.error('[Google Trends Pipe Error]:', err.message);
    }

    // 2. YouTube (Việt Nam)
    try {
        const ytVn = await fetchYouTubeTrends('VN', 'all', []);
        if (ytVn.length > 0) {
            currentData.rankings['youtube'] = ytVn;
            await saveRankingToFirestore('youtube', ytVn, { platform: 'youtube', region: 'VN' });
            await saveDataFile('youtube.json', ytVn);
        }
    } catch (err) {
        console.error('[YouTube Pipe Error]:', err.message);
    }

    // 3. Spotify (Việt Nam)
    try {
        const spVn = await fetchSpotifyTop50('VN');
        if (spVn.length > 0) {
            currentData.rankings['spotify'] = spVn;
            await saveRankingToFirestore('spotify', spVn, { platform: 'spotify', region: 'VN' });
            await saveDataFile('spotify.json', spVn);
        }
    } catch (err) {
        console.error('[Spotify Pipe Error]:', err.message);
    }

    // 4. Netflix (Việt Nam)
    try {
        const nfVn = await fetchNetflixTrends();
        if (nfVn.length > 0) {
            currentData.rankings['netflix'] = nfVn;
            await saveRankingToFirestore('netflix', nfVn, { platform: 'netflix', region: 'VN' });
            await saveDataFile('netflix.json', nfVn);
        }
    } catch (err) {
        console.error('[Netflix Pipe Error]:', err.message);
    }

    // Cập nhật timestamp và metadata vào Firestore & file cục bộ
    try {
        const nowIso = new Date().toISOString();
        currentData.last_updated = nowIso;
        await saveMetadataToFirestore({
            last_updated: nowIso
        });
        await saveDataFile('platforms.json', currentData);
        console.log(`[Pipeline]: Đã cập nhật mốc thời gian hoàn tất tổng hợp: ${nowIso}`);
    } catch (err) {
        console.warn('[Pipeline metadata error]:', err.message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`=== [TOP TRENDING DATA PIPELINE] HOÀN TẤT TRONG ${duration}s ===`);
}

main().catch(console.error);
