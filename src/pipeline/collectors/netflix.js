import axios from 'axios';

/**
 * Thu thập dữ liệu thực tế 100% từ bảng xếp hạng Netflix Tudum Top 10 tại Việt Nam
 * Hỗ trợ:
 * 1. Top 10 Phim Điện Ảnh (Films) tại Việt Nam
 * 2. Top 10 Phim Truyền Hình & Series (TV Shows) tại Việt Nam
 */

function parseNetflixTableRows(html, categoryId, categoryName) {
    const items = [];
    const rowMatches = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];

    for (const rm of rowMatches) {
        const row = rm[1];
        const rankMatch = row.match(/<span[^>]*class="[^"]*rank[^"]*"[^>]*>(\d+)<\/span>/i);
        const titleMatch = row.match(/<button[^>]*>([\s\S]*?)<\/button>/i) || row.match(/<td[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<img[^>]*>([^<]+)<\/td>/i);
        const imgMatch = row.match(/<img[^>]*src="([^"]+)"/i);
        const weeksMatch = row.match(/data-uia="top10-table-row-weeks"[^>]*>(\d+)<\/td>/i);

        if (rankMatch && titleMatch) {
            const rank = parseInt(rankMatch[1], 10);
            const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
            const thumb = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : '';
            const weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 1;

            items.push({
                id: `nf_${categoryId}_${rank}`,
                platform: 'netflix',
                rank: rank,
                rankChange: 0,
                title: title,
                creator: categoryName,
                thumbnail: thumb,
                url: `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
                primaryMetric: `${weeks} tuần trong Top 10`,
                weeksInTop10: weeks,
                velocity: rank === 1 ? 'Top 1 Xu Hướng' : (rank <= 3 ? 'Top Thịnh Hành' : 'Xu hướng'),
                category: categoryName,
                categoryId: categoryId,
                publishedAt: new Date().toISOString()
            });
        }
    }
    return items;
}

export async function fetchNetflixTrends() {
    console.log('[Netflix]: Đang cào bảng xếp hạng Top 10 Việt Nam (Phim & TV)...');

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    let films = [];
    let tvShows = [];

    // 1. Cào Top 10 Phim điện ảnh
    try {
        const filmRes = await axios.get('https://www.netflix.com/tudum/top10/vietnam', {
            headers,
            timeout: 12000
        });
        films = parseNetflixTableRows(filmRes.data, 'films', 'Phim điện ảnh');
        console.log(`[Netflix]: Đã lấy ${films.length} phim điện ảnh Top 10.`);
    } catch (e) {
        console.warn('[Netflix]: Lỗi cào Top 10 Phim:', e.message);
    }

    // 2. Cào Top 10 Phim truyền hình (TV Shows)
    try {
        const tvRes = await axios.get('https://www.netflix.com/tudum/top10/vietnam/tv', {
            headers,
            timeout: 12000
        });
        tvShows = parseNetflixTableRows(tvRes.data, 'tv', 'Phim truyền hình');
        console.log(`[Netflix]: Đã lấy ${tvShows.length} series truyền hình Top 10.`);
    } catch (e) {
        console.warn('[Netflix]: Lỗi cào Top 10 TV Shows:', e.message);
    }

    const allItems = [...films, ...tvShows];
    console.log(`[Netflix]: Hoàn tất thu thập tổng cộng ${allItems.length} tác phẩm thịnh hành.`);
    return allItems;
}
