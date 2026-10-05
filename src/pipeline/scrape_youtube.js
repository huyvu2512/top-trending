import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchYouTubeTrends } from './collectors/youtube.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const YOUTUBE_FILE_PATH = path.resolve(__dirname, '../../data/youtube.json');

async function scrape() {
    console.log('=== [YOUTUBE SCRAPER] BẮT ĐẦU CÀO DỮ LIỆU THỰC TẾ ===');
    
    if (!process.env.YOUTUBE_API_KEY) {
        console.error('❌ Chưa tìm thấy YOUTUBE_API_KEY trong file .env');
        console.log('👉 Vui lòng mở file .env và điền: YOUTUBE_API_KEY=AIzaSy...');
        process.exit(1);
    }

    try {
        console.log('📡 Đang kết nối YouTube Data API v3 (Region: VN)...');
        
        // 1. Cào danh mục Tổng hợp (50 video thịnh hành nhất)
        const allItems = await fetchYouTubeTrends('VN', 'all');
        console.log(`✅ [Tổng hợp]: Đã lấy ${allItems.length} video.`);

        // 2. Cào bổ sung các chuyên mục để khi bấm tab lọc có đầy đủ dữ liệu
        const categories = ['music', 'gaming', 'entertainment', 'news', 'tech'];
        const additionalItems = [];

        for (const cat of categories) {
            try {
                const catItems = await fetchYouTubeTrends('VN', cat);
                console.log(`✅ [${cat}]: Đã lấy ${catItems.length} video.`);
                additionalItems.push(...catItems);
            } catch (e) {
                console.warn(`⚠️ Bỏ qua danh mục ${cat}:`, e.message);
            }
        }

        // Hợp nhất dữ liệu, loại bỏ trùng lặp id nhưng giữ video của allItems ở đầu theo đúng rank
        const seen = new Set();
        const mergedList = [];

        for (const item of allItems) {
            seen.add(item.id);
            mergedList.push(item);
        }

        for (const item of additionalItems) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                mergedList.push(item);
            }
        }

        await fs.writeFile(YOUTUBE_FILE_PATH, JSON.stringify(mergedList, null, 2), 'utf-8');
        console.log(`\n🎉 THÀNH CÔNG RỰC RỠ! Đã cào và lưu tổng cộng ${mergedList.length} video thực tế vào data/youtube.json`);
    } catch (err) {
        console.error('❌ Lỗi khi cào dữ liệu YouTube:', err.message);
    }
}

scrape();
