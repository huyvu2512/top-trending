import 'dotenv/config';
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const API_URL = 'https://www.googleapis.com/youtube/v3/videos';

export const YOUTUBE_CATEGORIES = {
    'all': undefined,
    'music': '10',
    'gaming': '20',
    'entertainment': '24',
    'news': '25',
    'tech': '28',
    'sports': '17',
    'film': '1'
};

const CATEGORY_NAMES = {
    '1': 'Phim & Hoạt hình',
    '2': 'Xe cộ',
    '10': 'Âm nhạc',
    '15': 'Thú cưng',
    '17': 'Thể thao',
    '19': 'Du lịch',
    '20': 'Trò chơi',
    '22': 'Đời sống',
    '23': 'Hài hước',
    '24': 'Giải trí',
    '25': 'Tin tức',
    '26': 'Phong cách',
    '27': 'Giáo dục',
    '28': 'Công nghệ'
};

/**
 * Chuyển đổi định dạng thời lượng ISO 8601 (PT5M38S -> 5:38)
 */
function parseDuration(isoDuration) {
    if (!isoDuration) return '';
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    if (hours > 0) {
        const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
        return `${hours}:${minStr}:${secStr}`;
    }
    return `${minutes}:${secStr}`;
}

/**
 * Thu thập danh sách thịnh hành YouTube theo Quốc gia và Danh mục
 * @param {string} regionCode - Mã quốc gia: 'VN'
 * @param {string} categoryKey - 'all', 'music', 'gaming', 'entertainment'...
 * @param {Array} previousList - Dữ liệu chu kỳ trước để tính rank change & views/giờ
 */
export async function fetchYouTubeTrends(regionCode = 'VN', categoryKey = 'all', previousList = []) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn(`[YouTube]: Bỏ qua quét thực tế do chưa có YOUTUBE_API_KEY trong .env.`);
        return [];
    }

    const categoryId = YOUTUBE_CATEGORIES[categoryKey];

    try {
        console.log(`[YouTube]: Đang quét ${regionCode} - Danh mục: ${categoryKey}...`);
        
        // 1. Lấy danh sách thịnh hành kèm snippet, statistics, contentDetails (1 đơn vị quota)
        const response = await axios.get(API_URL, {
            params: {
                part: 'snippet,statistics,contentDetails',
                chart: 'mostPopular',
                regionCode: regionCode,
                maxResults: 50,
                key: apiKey,
                videoCategoryId: categoryId
            },
            timeout: 15000
        });

        const rawItems = response.data.items || [];
        if (rawItems.length === 0) return [];

        // 2. Lấy thông tin kênh (Avatar, Subscribers, Tổng video) (1 đơn vị quota)
        const channelIds = [...new Set(rawItems.map(i => i.snippet?.channelId).filter(Boolean))];
        const channelMap = {};

        if (channelIds.length > 0) {
            try {
                const chanRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                    params: {
                        part: 'snippet,statistics',
                        id: channelIds.slice(0, 50).join(','),
                        key: apiKey
                    },
                    timeout: 10000
                });

                (chanRes.data.items || []).forEach(ch => {
                    channelMap[ch.id] = {
                        avatar: ch.snippet?.thumbnails?.default?.url || ch.snippet?.thumbnails?.medium?.url,
                        subscribers: parseInt(ch.statistics?.subscriberCount || '0', 10),
                        videoCount: parseInt(ch.statistics?.videoCount || '0', 10),
                        totalViews: parseInt(ch.statistics?.viewCount || '0', 10)
                    };
                });
            } catch (chanErr) {
                console.warn('[YouTube Channels Warning]: Không nạp được thông tin kênh phụ trợ:', chanErr.message);
            }
        }

        // 3. Xử lý chuẩn hóa 50 video kèm đầy đủ chỉ số phân tích thực tế
        const items = rawItems.map((item, index) => {
            const currentRank = index + 1;
            const videoId = item.id;
            const channelId = item.snippet?.channelId;
            const channelInfo = channelMap[channelId] || {};

            const views = parseInt(item.statistics?.viewCount || '0', 10);
            const likes = parseInt(item.statistics?.likeCount || '0', 10);
            const comments = parseInt(item.statistics?.commentCount || '0', 10);
            
            // Tìm video cũ trong chu kỳ trước để tính biến động rank
            const oldVideo = previousList.find(v => v.id === `yt_${regionCode.toLowerCase()}_${videoId}` || v.embedId === videoId);
            let rankChange = null;
            let velocityStr = '';

            if (oldVideo && oldVideo.rank) {
                rankChange = oldVideo.rank - currentRank;
            }

            // Định dạng lượt xem
            let formattedViews = `${views.toLocaleString('vi-VN')} lượt xem`;
            if (views >= 1_000_000) {
                formattedViews = `${(views / 1_000_000).toFixed(1)}M lượt xem`;
            } else if (views >= 1_000) {
                formattedViews = `${(views / 1_000).toFixed(0)}K lượt xem`;
            }

            if (oldVideo && oldVideo.rawViews) {
                const diff = views - oldVideo.rawViews;
                if (diff > 0) {
                    velocityStr = `+${Math.round(diff).toLocaleString('vi-VN')}/giờ`;
                }
            }
            if (!velocityStr && views > 0 && item.snippet?.publishedAt) {
                const pubTime = new Date(item.snippet.publishedAt).getTime();
                const nowTime = Date.now();
                const hoursSincePublish = Math.max(1, (nowTime - pubTime) / (1000 * 60 * 60));
                const realPerHour = Math.round(views / hoursSincePublish);
                if (realPerHour >= 1_000_000) {
                    velocityStr = `+${(realPerHour / 1_000_000).toFixed(1)}M/giờ`;
                } else if (realPerHour >= 1_000) {
                    velocityStr = `+${(realPerHour / 1_000).toFixed(1)}K/giờ`;
                } else {
                    velocityStr = `+${realPerHour}/giờ`;
                }
            }

            // Tỷ lệ tương tác & like
            const engagementRate = views > 0 ? (((likes + comments) / views) * 100).toFixed(1) : '0.0';
            const likeRate = views > 0 ? ((likes / views) * 100).toFixed(1) : '0.0';
            const catId = item.snippet?.categoryId;
            const catName = CATEGORY_NAMES[catId] || (categoryKey === 'music' ? 'Âm nhạc' : (categoryKey === 'gaming' ? 'Trò chơi' : (categoryKey === 'news' ? 'Tin tức' : (categoryKey === 'entertainment' ? 'Giải trí' : 'Tổng hợp'))));

            return {
                id: `yt_${regionCode.toLowerCase()}_${videoId}`,
                embedId: videoId,
                platform: 'youtube',
                rank: currentRank,
                rankChange: rankChange,
                title: item.snippet?.title || 'Không có tiêu đề',
                creator: item.snippet?.channelTitle || 'Kênh YouTube',
                channelId: channelId,
                channelAvatar: channelInfo.avatar || item.snippet?.thumbnails?.default?.url,
                channelSubscribers: channelInfo.subscribers || 0,
                channelVideoCount: channelInfo.videoCount || 0,
                channelTotalViews: channelInfo.totalViews || 0,
                thumbnail: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
                duration: parseDuration(item.contentDetails?.duration),
                url: `https://www.youtube.com/watch?v=${videoId}`,
                primaryMetric: formattedViews,
                rawViews: views,
                rawLikes: likes,
                rawComments: comments,
                engagementRate: parseFloat(engagementRate),
                likeRate: parseFloat(likeRate),
                velocity: velocityStr || 'Thịnh hành',
                category: catName,
                categoryId: catId,
                publishedAt: item.snippet?.publishedAt || new Date().toISOString()
            };
        });

        console.log(`[YouTube ${regionCode} - ${categoryKey}]: Hoàn tất ${items.length} videos kèm metrics chi tiết.`);
        return items;
    } catch (error) {
        console.error(`[YouTube Lỗi ${regionCode} - ${categoryKey}]:`, error.response?.data?.error?.message || error.message);
        return [];
    }
}
