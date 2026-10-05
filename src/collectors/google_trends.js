import axios from 'axios';

/**
 * Thu thập dữ liệu thực tế 100% từ Google Trends Việt Nam
 * Hỗ trợ:
 * 1. Bảng Đang thịnh hành trong 7 ngày qua (168 giờ) với đầy đủ ~135 xu hướng thực tế & danh mục
 * 2. Bảng Khám phá (Explore) với 50 cụm từ tìm kiếm nhiều nhất & 50 cụm từ đột biến
 * 3. Kênh RSS để lấy tin tức, bài báo chính thống và ảnh chất lượng cao
 * @param {string} geoCode - Mã quốc gia ('VN')
 */
export async function fetchGoogleTrends(geoCode = 'VN') {
    console.log(`[Google Trends]: Đang tải dữ liệu 7 ngày qua (168h) & Khám phá cho ${geoCode}...`);

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'vi,en;q=0.9'
    };

    // 1. Cào Đang thịnh hành 7 ngày qua (hours=168)
    let trendingRawHtml = '';
    try {
        const trendingRes = await axios.get(`https://trends.google.com/trending?geo=${geoCode}&hours=168`, {
            headers,
            timeout: 15000
        });
        trendingRawHtml = trendingRes.data;
    } catch (e) {
        console.warn('[Google Trends]: Lỗi tải trang trending 168h:', e.message);
    }

    // 2. Cào trang Khám phá (Explore)
    let exploreRawHtml = '';
    try {
        const exploreRes = await axios.get(`https://trends.google.com/explore?geo=${geoCode}`, {
            headers,
            timeout: 15000
        });
        exploreRawHtml = exploreRes.data;
    } catch (e) {
        console.warn('[Google Trends]: Lỗi tải trang explore:', e.message);
    }

    // 3. Cào RSS để lấy tin tức & ảnh bài báo chính thống
    let rssMap = new Map();
    try {
        const rssRes = await axios.get(`https://trends.google.com/trending/rss?geo=${geoCode}`, {
            headers,
            timeout: 8000
        });
        const itemMatches = [...rssRes.data.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        for (const m of itemMatches) {
            const raw = m[1];
            const titleMatch = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || raw.match(/<title>(.*?)<\/title>/);
            const picMatch = raw.match(/<ht:picture>(.*?)<\/ht:picture>/);
            const newsMatch = raw.match(/<ht:news_item_title>(.*?)<\/ht:news_item_title>/);
            const urlMatch = raw.match(/<ht:news_item_url>(.*?)<\/ht:news_item_url>/);
            const sourceMatch = raw.match(/<ht:news_item_source>(.*?)<\/ht:news_item_source>/);

            if (titleMatch) {
                const norm = titleMatch[1].trim().toLowerCase();
                rssMap.set(norm, {
                    picture: picMatch ? picMatch[1] : null,
                    newsTitle: newsMatch ? newsMatch[1] : null,
                    newsUrl: urlMatch ? urlMatch[1] : null,
                    newsSource: sourceMatch ? sourceMatch[1] : null
                });
            }
        }
    } catch (e) {
        console.warn('[Google Trends]: Lỗi tải RSS feed:', e.message);
    }

    // Bóc tách Trending items từ data ds:0
    let trendingList = [];
    const trendingMatches = [...trendingRawHtml.matchAll(/AF_initDataCallback\(({[\s\S]*?})\);/g)];
    for (const m of trendingMatches) {
        if (m[1].includes("'ds:0'")) {
            const dataMatch = m[1].match(/data:\s*(\[[\s\S]*\])(?:,\s*sideChannel|$)/);
            if (dataMatch) {
                try {
                    const parsed = JSON.parse(dataMatch[1]);
                    const rawList = parsed[1] || [];

                    trendingList = rawList.map((item, idx) => {
                        const title = (item[0] || '').trim();
                        const norm = title.toLowerCase();
                        const rssInfo = rssMap.get(norm) || {};
                        const traffic = item[6] || 0;
                        const growth = item[8] || 0;
                        const catIds = item[10] || [];
                        const ts = item[3]?.[0] ? item[3][0] * 1000 : Date.now();

                        // Phân loại danh mục chuẩn xác dựa trên Taxonomy của Google
                        let categoryId = 'other';
                        let categoryName = 'Xu hướng khác';
                        if (catIds.includes(17)) {
                            categoryId = 'sports';
                            categoryName = 'Thể thao';
                        } else if (catIds.includes(3) || catIds.includes(4) || catIds.includes(1)) {
                            categoryId = 'entertainment';
                            categoryName = 'Giải trí & Truyền thông';
                        } else if (catIds.includes(10) || catIds.includes(11)) {
                            categoryId = 'news';
                            categoryName = 'Tin tức & Xã hội';
                        } else if (catIds.includes(12)) {
                            categoryId = 'business';
                            categoryName = 'Kinh tế & Tài chính';
                        } else if (catIds.includes(18) || catIds.includes(6) || catIds.includes(20) || catIds.includes(8) || catIds.includes(19)) {
                            categoryId = 'tech_life';
                            categoryName = 'Công nghệ & Đời sống';
                        }

                        // Định dạng lượt tìm kiếm
                        let formattedTraffic = '1K+';
                        if (traffic >= 1000000) {
                            formattedTraffic = `${(traffic / 1000000).toLocaleString()} Tr+`;
                        } else if (traffic >= 1000) {
                            formattedTraffic = `${(traffic / 1000).toLocaleString()} N+`;
                        } else {
                            formattedTraffic = `${traffic}+`;
                        }

                        // Định dạng % tăng trưởng
                        const formattedGrowth = growth > 0 ? `↑${growth.toLocaleString()}%` : 'Đang hoạt động';

                        // Định dạng thời gian bắt đầu
                        const diffHours = Math.max(1, Math.round((Date.now() - ts) / (1000 * 60 * 60)));
                        const startedAgo = diffHours >= 24 ? `${Math.floor(diffHours / 24)} ngày trước` : `${diffHours} giờ trước`;

                        return {
                            id: `gg_trend_${idx + 1}`,
                            rank: idx + 1,
                            platform: 'google',
                            title: title,
                            creator: rssInfo.newsTitle || (item[9]?.[1] ? `Tìm kiếm liên quan: ${item[9][1]}` : 'Xu hướng tìm kiếm Google'),
                            newsTitle: rssInfo.newsTitle || null,
                            newsSource: rssInfo.newsSource || 'Google Search',
                            newsUrl: rssInfo.newsUrl || `https://www.google.com/search?q=${encodeURIComponent(title)}`,
                            thumbnail: rssInfo.picture || null,
                            url: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
                            trafficNum: traffic,
                            primaryMetric: `${formattedTraffic} lượt tìm kiếm`,
                            growthPct: growth,
                            growthFormatted: formattedGrowth,
                            velocity: formattedGrowth,
                            startedAgo: startedAgo,
                            publishedAt: new Date(ts).toISOString(),
                            relatedQueries: (item[9] || []).filter(q => q && q.toLowerCase() !== norm),
                            catIds: catIds,
                            categoryId: categoryId,
                            category: categoryName
                        };
                    });
                } catch (err) {
                    console.warn('[Google Trends]: Lỗi parse JSON ds:0:', err.message);
                }
            }
        }
    }

    // Bóc tách Explore items từ data ds:2
    let topSearches = [];
    let risingSearches = [];
    const exploreMatches = [...exploreRawHtml.matchAll(/AF_initDataCallback\(({[\s\S]*?})\);/g)];
    for (const m of exploreMatches) {
        if (m[1].includes("'ds:2'")) {
            const dataMatch = m[1].match(/data:\s*(\[[\s\S]*\])(?:,\s*sideChannel|$)/);
            if (dataMatch) {
                try {
                    const parsed = JSON.parse(dataMatch[1]);
                    const rawRising = parsed[0]?.[0]?.[1] || [];
                    const rawTop = parsed[0]?.[0]?.[2] || [];

                    risingSearches = rawRising.map((item, i) => ({
                        rank: i + 1,
                        query: item[0],
                        growth: `+${item[1]}%`,
                        growthNum: item[1] || 0,
                        url: `https://www.google.com/search?q=${encodeURIComponent(item[0])}`
                    }));

                    topSearches = rawTop.map((item, i) => ({
                        rank: i + 1,
                        query: item[0],
                        score: item[1],
                        change: item[2] >= 0 ? `+${item[2]}%` : `${item[2]}%`,
                        changeNum: item[2] || 0,
                        url: `https://www.google.com/search?q=${encodeURIComponent(item[0])}`
                    }));
                } catch (err) {
                    console.warn('[Google Trends]: Lỗi parse JSON ds:2:', err.message);
                }
            }
        }
    }

    console.log(`[Google Trends ${geoCode}]: Thu thập thành công ${trendingList.length} xu hướng thịnh hành (7 ngày), ${topSearches.length} từ khóa hàng đầu, ${risingSearches.length} từ khóa đột biến.`);

    return {
        trending: trendingList,
        explore: {
            top: topSearches,
            rising: risingSearches
        }
    };
}
