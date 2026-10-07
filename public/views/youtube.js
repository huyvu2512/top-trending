/**
 * View: YouTube
 * Phân tích & Xếp Hạng Thịnh Hành Đa Chiều (YouTube Charts Vietnam)
 * Thiết kế chuẩn xác theo hệ thống Playboard / YouTube Analytics Reference
 * - Tiêu đề Banner ở trên cùng: "Bảng Xếp Hạng Xu Hướng YouTube • Việt Nam"
 * - Danh mục Tabs ("Tổng hợp", "Âm nhạc", "Trò chơi", "Giải trí", "Tin tức", "Công nghệ") ở NGAY DƯỚI tiêu đề
 * - Main 2 Cột: Left (Most Popular on YouTube in Vietnam) + Right (Popular Channels, Rising Channels, Popular Keywords)
 * - Khung Video Records in Vietnam: 2 cột đối xứng (Most Engaging, Most Liked, Most Commented, Most Viewed, Newest Videos, Oldest Videos)
 */

import { formatUpdateTime } from '../utils.js';

// Module-level Memoization Cache for records
let _lastBaseItems = null;
let _cachedRecords = null;

// Danh mục YouTube theo yêu cầu
export const YOUTUBE_CATEGORIES = [
    { id: 'all', name: 'Tổng hợp' },
    { id: 'velocity', name: 'Xem/giờ' },
    { id: 'music', name: 'Âm nhạc' },
    { id: 'entertainment', name: 'Giải trí' },
    { id: 'shorts', name: 'Shorts' },
    { id: 'gaming', name: 'Trò chơi' },
    { id: 'news', name: 'Tin tức' }
];

export function buildYouTubeContentHtml(items, isOverview, currentCategory, state = {}) {
    const categories = YOUTUBE_CATEGORIES;

    // SVG Icons chuẩn xác không dùng emoji
    const ICONS = {
        eye: `<svg class="yt-stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        like: `<svg class="yt-stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
        comment: `<svg class="yt-stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        lightning: `<svg class="yt-stat-svg icon-lightning" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    };

    // Helper: Định dạng số rút gọn (K, M, B)
    const formatCompact = (num) => {
        if (!num || isNaN(num)) return '0';
        if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
        return num.toLocaleString();
    };

    // Helper: Avatar fallback
    const getAvatar = (item) => {
        if (item.channelAvatar) return item.channelAvatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.creator || 'YT')}&background=2b2d31&color=fff&size=128`;
    };

    // Helper: Thời gian tương đối chuẩn tiếng Việt theo thời gian thực
    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        if (diffMs <= 0) return 'Vừa xong';

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;

        const diffWeeks = Math.floor(diffDays / 7);
        if (diffDays < 30) return `${diffWeeks} tuần trước`;

        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${Math.max(1, diffMonths)} tháng trước`;

        const diffYears = Math.floor(diffDays / 365);
        return `${Math.max(1, diffYears)} năm trước`;
    };

    // Helper: Định dạng tốc độ xem/giờ chuẩn (K, M) - tự động chuyển đổi >= 1000K thành M
    const formatVelocity = (velStr) => {
        if (!velStr) return '0/giờ';
        let str = velStr.replace('/hr', '/giờ');
        const match = str.match(/\+?([0-9.]+)\s*([KM]?)\/giờ/i);
        if (match) {
            let val = parseFloat(match[1]);
            const unit = match[2]?.toUpperCase();
            if (unit === 'K') {
                if (val >= 1000) return `+${(val / 1000).toFixed(1)}M/giờ`;
                return `+${val.toFixed(1)}K/giờ`;
            } else if (unit === 'M') {
                return `+${val.toFixed(1)}M/giờ`;
            } else if (val >= 1_000_000) {
                return `+${(val / 1_000_000).toFixed(1)}M/giờ`;
            } else if (val >= 1_000) {
                return `+${(val / 1_000).toFixed(1)}K/giờ`;
            }
        }
        return str;
    };

    // Helper: Trích xuất đám mây từ khóa 100% từ tiêu đề video trending thực tế (ưu tiên cụm từ N-gram, count >= 2)
    // Helper: Trích xuất danh sách từ khóa & cụm từ có nghĩa từ danh sách video
    const extractKeywordsList = (list, limit = 8) => {
        if (!list || list.length === 0) return [];
        const stopWords = new Set([
            'video', 'official', 'music', 'live', 'album', 'trailer', 'performance', 'mv', 'hd', '4k',
            'full', 'teaser', 'remix', 'lyric', 'lyrics', 'audio', 'tập', 'bản', 'các', 'cho', 'với',
            'trong', 'của', 'là', 'và', 'tại', 'những', 'một', 'được', 'này', 'đến', 'lại', 'rồi',
            'theo', 'khi', 'như', 'vào', 'hay', 'ngày', 'mỗi', 'cùng', 'nhiều', 'trên', 'qua',
            'thì', 'sẽ', 'bị', 'về', 'ra', 'ở', 'tôi', 'bạn', 'có', 'đã', 'làm', 'mà', 'gì',
            'ai', 'nào', 'đây', 'đó', 'chỉ', 'lên', 'xuống', 'thế', 'rất', 'quá', 'đang', 'từ',
            'gần', 'nữa', 'luôn', 'bởi', 'do', 'vì', 'nên', 'nếu', 'tuy', 'nhưng', 'cũng', 'đều',
            'hơn', 'nhất', 'mới', 'đầu', 'cuối', 'sau', 'trước', 'tất', 'cả', 'clip', 'phần',
            'mùa', 'season', 'vol', 'chap', 'ep', 'tap', 'không'
        ]);

        const phraseDocFreq = {};
        const singleDocFreq = {};

        list.forEach(item => {
            const title = item.title || '';
            const segments = title.split(/[|\-–—\[\]():,!?#"'/\\+&•]/);
            const videoPhrases = new Set();
            const videoSingles = new Set();

            segments.forEach(seg => {
                const words = seg.trim().toLowerCase()
                    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                    .split(/\s+/)
                    .filter(w => w.length > 0);

                const len = words.length;
                if (len === 0) return;

                // 1. Trích xuất cụm từ (N-grams từ 5 từ xuống 2 từ)
                for (let n = Math.min(5, len); n >= 2; n--) {
                    for (let i = 0; i <= len - n; i++) {
                        const slice = words.slice(i, i + n);
                        if (stopWords.has(slice[0]) || stopWords.has(slice[slice.length - 1])) continue;
                        if (slice.some(w => /^\d+$/.test(w) || w.length < 2)) continue;
                        videoPhrases.add(slice.join(' '));
                    }
                }

                // 2. Trích xuất từ đơn độc lập có nghĩa
                words.forEach(w => {
                    if (w.length >= 3 && !stopWords.has(w) && !/^\d+$/.test(w)) {
                        videoSingles.add(w);
                    }
                });
            });

            videoPhrases.forEach(p => {
                phraseDocFreq[p] = (phraseDocFreq[p] || 0) + 1;
            });
            videoSingles.forEach(s => {
                singleDocFreq[s] = (singleDocFreq[s] || 0) + 1;
            });
        });

        const candidatePhrases = Object.entries(phraseDocFreq)
            .map(([text, count]) => ({ text, count, words: text.split(' ') }))
            .sort((a, b) => b.count !== a.count ? b.count - a.count : b.words.length - a.words.length);

        const selectedPhrases = [];
        for (const cand of candidatePhrases) {
            // Loại bỏ cụm từ trùng lặp, lồng nhau hoặc chia sẻ từ 2 từ khóa trở lên
            const isRedundant = selectedPhrases.some(sel => {
                if (sel.text.includes(cand.text) || cand.text.includes(sel.text)) return true;
                const sharedWords = cand.words.filter(w => sel.words.includes(w));
                return sharedWords.length >= 2;
            });
            if (!isRedundant) {
                selectedPhrases.push(cand);
            }
        }

        const skipSingles = new Set(['không', 'mới', 'nhất', 'người', 'nhiều', 'đang', 'tổng', 'bản', 'mỗi', 'theo', 'siêu', 'quốc', 'xem', 'sao', 'top', 'tin', 'nhạc', 'hay', 'ngày', 'năm', 'việt', 'nam']);
        const selectedSingles = [];
        const candidateSingles = Object.entries(singleDocFreq)
            .sort((a, b) => b[1] - a[1]);

        for (const [w, count] of candidateSingles) {
            if (skipSingles.has(w)) continue;
            const covered = selectedPhrases.some(p => p.words.includes(w));
            if (!covered) {
                selectedSingles.push({ text: w, count, words: [w] });
            }
        }

        // Ưu tiên các cụm từ nổi bật có tần suất lặp lại (count >= 2)
        const prominentPhrases = selectedPhrases.filter(p => p.count >= 2);
        const resultPhrases = prominentPhrases.length >= 6 ? prominentPhrases : selectedPhrases;

        return [...resultPhrases, ...selectedSingles]
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    };

    // Helper: Render các thẻ tag từ khóa - tính độ lớn theo tần suất sử dụng, sau đó random xáo trộn vị trí
    const renderKeywordTags = (keywordsList) => {
        if (!keywordsList || keywordsList.length === 0) return '<div class="yt-kw-empty">Đang cập nhật...</div>';
        const maxCount = keywordsList[0].count;
        const lowestCount = keywordsList[keywordsList.length - 1].count;
        const total = keywordsList.length;

        // 1. Tính toán style (kích thước to/nhỏ phân cấp rõ rệt theo tần suất sử dụng)
        const styledTags = keywordsList.map(({ text, count }, index) => {
            const countProgress = maxCount === lowestCount ? 0.5 : (count - lowestCount) / Math.max(1, maxCount - lowestCount);
            const rankProgress = 1 - (index / Math.max(1, total - 1));
            // Kết hợp tần suất thực tế và thứ hạng để phân cấp kích thước
            const progress = (countProgress * 0.65 + rankProgress * 0.35);

            // Kích thước từ 12px đến 22px
            const size = (12 + progress * 10).toFixed(1);
            // Độ đậm từ 500 đến 800
            const weight = progress >= 0.7 ? 800 : (progress >= 0.4 ? 700 : (progress >= 0.2 ? 600 : 500));
            // Độ tương phản từ 0.62 đến 1.0
            const opacity = (0.62 + progress * 0.38).toFixed(2);

            return { text, count, size, weight, opacity };
        });

        // 2. Random xáo trộn vị trí (shuffle) để các từ to và nhỏ đan xen ngẫu nhiên tự nhiên
        const shuffled = [...styledTags];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.map(({ text, count, size, weight, opacity }) => {
            return `<span class="yt-kw-tag" style="font-size: ${size}px; font-weight: ${weight}; opacity: ${opacity};" title="Xuất hiện trong ${count} video thịnh hành">${text}</span>`;
        }).join(' ');
    };

    // Dữ liệu video nguồn toàn hệ thống
    const fullItems = state.data?.rankings?.youtube || items || [];

    // Helper lọc trùng video theo embedId hoặc id
    const dedupeVideos = (list) => {
        if (!list || !Array.isArray(list)) return [];
        const seen = new Set();
        return list.filter(v => {
            const key = (v.embedId || v.id || v.title || '').trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    // Tính toán Nổi Bật Trending một lần từ fullItems (dùng ở trang Tổng hợp, đã lọc trùng)
    if (_lastBaseItems !== fullItems && fullItems.length > 0) {
        const uniqueVideos = dedupeVideos(fullItems);
        _cachedRecords = {
            mostEngaging: [...uniqueVideos].sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0)).slice(0, 5),
            mostLiked: [...uniqueVideos].sort((a, b) => (b.rawLikes || 0) - (a.rawLikes || 0)).slice(0, 5),
            mostCommented: [...uniqueVideos].sort((a, b) => (b.rawComments || 0) - (a.rawComments || 0)).slice(0, 5),
            mostViewed: [...uniqueVideos].sort((a, b) => (b.rawViews || 0) - (a.rawViews || 0)).slice(0, 5),
            newestVideos: [...uniqueVideos].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)).slice(0, 5),
            oldestVideos: [...uniqueVideos].sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0)).slice(0, 5)
        };
        _lastBaseItems = fullItems;
    }

    let popularChannels = [];
    let risingChannels = [];
    let keywordsHtml = '';

    if (isOverview) {
        // TRANG TỔNG QUÁT: Chỉ hiển thị các cụm từ nổi bật nhất từ toàn bộ video
        const overviewKws = extractKeywordsList(fullItems, 18);
        keywordsHtml = `<div class="yt-keywords-cloud">${renderKeywordTags(overviewKws)}</div>`;

        const sectionMap = {
            'Tổng hợp': fullItems.filter(v => !v.isShort).slice(0, 50),
            'Shorts': fullItems.filter(v => {
                if (v.isShort || v.categoryId === 'shorts' || v.category === 'Shorts') return true;
                const t = (v.title || '').toLowerCase();
                const d = v.duration || '';
                return t.includes('#shorts') || t.includes('shorts') || d.startsWith('0:') || d === '1:00';
            }).slice(0, 50)
        };

        const allCategories = [...new Set(fullItems.map(v => v.category).filter(Boolean))];
        allCategories.forEach(cat => {
            sectionMap[cat] = fullItems.filter(v => v.category === cat).slice(0, 50);
        });

        const channelStatsMap = {};

        Object.entries(sectionMap).forEach(([secName, secVideos]) => {
            secVideos.forEach(v => {
                const chName = v.creator || 'Kênh YouTube';
                if (!channelStatsMap[chName]) {
                    const channelUrl = v.channelId
                        ? `https://www.youtube.com/channel/${v.channelId}`
                        : `https://www.youtube.com/results?search_query=${encodeURIComponent(chName)}`;
                    channelStatsMap[chName] = {
                        name: chName,
                        channelId: v.channelId || '',
                        url: channelUrl,
                        avatar: getAvatar(v),
                        subscribers: v.channelSubscribers || 0,
                        videoIds: new Set(),
                        categories: new Set(),
                        totalTrendingViews: 0
                    };
                }
                if (!channelStatsMap[chName].videoIds.has(v.id)) {
                    channelStatsMap[chName].videoIds.add(v.id);
                    channelStatsMap[chName].totalTrendingViews += (v.rawViews || 0);
                }
                channelStatsMap[chName].categories.add(secName);
            });
        });

        const channelsList = Object.values(channelStatsMap).map(ch => ({
            ...ch,
            trendingVideosCount: ch.videoIds.size
        }));

        popularChannels = [...channelsList].sort((a, b) => {
            if (b.trendingVideosCount !== a.trendingVideosCount) {
                return b.trendingVideosCount - a.trendingVideosCount;
            }
            return (b.totalTrendingViews || 0) - (a.totalTrendingViews || 0);
        }).slice(0, 10);

        risingChannels = [...channelsList]
            .filter(ch => (ch.subscribers || 0) <= 2_000_000 && (ch.totalTrendingViews || 0) >= 50_000)
            .map(ch => {
                const subs = Math.max(100, ch.subscribers || 1000);
                const growthPercent = Math.round(ch.totalTrendingViews / subs);
                return { ...ch, growthPercent };
            })
            .sort((a, b) => b.growthPercent - a.growthPercent)
            .slice(0, 10);

        if (risingChannels.length < 5 && channelsList.length > 0) {
            risingChannels = [...channelsList]
                .map(ch => {
                    const subs = Math.max(100, ch.subscribers || 1000);
                    const growthPercent = Math.round(ch.totalTrendingViews / subs);
                    return { ...ch, growthPercent };
                })
                .sort((a, b) => b.growthPercent - a.growthPercent)
                .slice(0, 10);
        }

    } else {
        // CHUYÊN MỤC RIÊNG (Xem/giờ, Âm nhạc, Giải trí, Shorts, Trò chơi, Tin tức):
        // 100% tính toán độc lập của riêng chuyên mục đó
        const catVideos = items || [];
        const catKws = extractKeywordsList(catVideos, 16);
        keywordsHtml = `<div class="yt-keywords-cloud">${renderKeywordTags(catKws)}</div>`;

        const channelStatsMap = {};
        catVideos.forEach(v => {
            const chName = v.creator || 'Kênh YouTube';
            if (!channelStatsMap[chName]) {
                const channelUrl = v.channelId
                    ? `https://www.youtube.com/channel/${v.channelId}`
                    : `https://www.youtube.com/results?search_query=${encodeURIComponent(chName)}`;
                channelStatsMap[chName] = {
                    name: chName,
                    channelId: v.channelId || '',
                    url: channelUrl,
                    avatar: getAvatar(v),
                    subscribers: v.channelSubscribers || 0,
                    trendingVideosCount: 0,
                    totalTrendingViews: 0
                };
            }
            channelStatsMap[chName].trendingVideosCount += 1;
            channelStatsMap[chName].totalTrendingViews += (v.rawViews || 0);
        });

        const channelsList = Object.values(channelStatsMap);

        popularChannels = [...channelsList].sort((a, b) => {
            if (b.trendingVideosCount !== a.trendingVideosCount) {
                return b.trendingVideosCount - a.trendingVideosCount;
            }
            return (b.totalTrendingViews || 0) - (a.totalTrendingViews || 0);
        }).slice(0, 10);

        risingChannels = [...channelsList]
            .filter(ch => (ch.subscribers || 0) <= 2_000_000 && (ch.totalTrendingViews || 0) > 0)
            .map(ch => {
                const subs = Math.max(100, ch.subscribers || 1000);
                const growthPercent = Math.round(ch.totalTrendingViews / subs);
                return { ...ch, growthPercent };
            })
            .sort((a, b) => b.growthPercent - a.growthPercent)
            .slice(0, 10);

        if (risingChannels.length < 5 && channelsList.length > 0) {
            risingChannels = [...channelsList]
                .map(ch => {
                    const subs = Math.max(100, ch.subscribers || 1000);
                    const growthPercent = Math.round(ch.totalTrendingViews / subs);
                    return { ...ch, growthPercent };
                })
                .sort((a, b) => b.growthPercent - a.growthPercent)
                .slice(0, 10);
        }
    }

    const records = _cachedRecords || {
        mostEngaging: [], mostLiked: [], mostCommented: [],
        mostViewed: [], newestVideos: [], oldestVideos: []
    };

    let mainContentHtml = '';

    if (!items || items.length === 0) {
        let emptyDesc = 'Hệ thống đang cập nhật dữ liệu xu hướng mới nhất.';
        if (currentCategory === 'shorts') {
            emptyDesc = 'Hiện tại trong Top 50 Video Xu hướng YouTube Việt Nam không có video dạng Shorts (thời lượng ≤ 60s).';
        } else if (currentCategory && currentCategory !== 'all') {
            emptyDesc = 'Chưa có video thịnh hành thuộc danh mục này trong chu kỳ quét hiện tại.';
        }

        mainContentHtml = `
            <div class="empty-state">
                <h3 class="empty-state-title">Chưa có dữ liệu hiển thị</h3>
                <p class="empty-state-desc">${emptyDesc}</p>
            </div>
        `;
    } else {
        // Helper render 1 hàng video trong Kỷ Lục Video
        const renderRecordItem = (item, idx, type) => {
            let extraPrefix = '';
            if (type === 'newest' || type === 'oldest') {
                extraPrefix = `<span class="yt-time-text">${formatTimeAgo(item.publishedAt)}</span>`;
            }
            const videoUrl = item.url || (item.embedId ? `https://www.youtube.com/watch?v=${item.embedId}` : '#');

                const recRank = idx + 1;
                const isRecTop3 = recRank <= 3;
                return `
                <div class="yt-rec-item" data-id="${item.id}" data-url="${videoUrl}" title="Mở video trên YouTube">
                    <span class="yt-rec-rank ${isRecTop3 ? 'rank-' + recRank : ''}">${recRank}</span>
                    <div class="yt-rec-thumb-wrap">
                        <img src="${item.thumbnail}" alt="${item.title}" class="yt-rec-thumb-img" loading="lazy">
                    </div>
                    <div class="yt-rec-info">
                        <div class="yt-rec-title" title="${item.title}">${item.title}</div>
                        <div class="yt-rec-stats-row">
                            ${extraPrefix}
                            <span class="yt-rec-stat ${type === 'viewed' ? 'yt-stat-highlight' : ''}">${ICONS.eye} ${formatCompact(item.rawViews)}</span>
                            <span class="yt-rec-stat ${type === 'liked' ? 'yt-stat-highlight' : ''}">${ICONS.like} ${formatCompact(item.rawLikes)}</span>
                            <span class="yt-rec-stat ${type === 'commented' ? 'yt-stat-highlight' : ''}">${ICONS.comment} ${formatCompact(item.rawComments)}</span>
                            <span class="yt-rec-stat ${type === 'engaging' ? 'yt-rate-highlight' : ''}">${item.engagementRate || 0}%</span>
                        </div>
                    </div>
                </div>
            `;
        };

        const sectionTitles = {
            'all': 'Thịnh Hành Nhất Trên YouTube Tại Việt Nam',
            'velocity': 'Video Tăng Trưởng Nhanh Nhất Tại Việt Nam',
            'music': 'Video Âm Nhạc Thịnh Hành Tại Việt Nam',
            'entertainment': 'Video Giải Trí Thịnh Hành Tại Việt Nam',
            'shorts': 'YouTube Shorts Thịnh Hành Tại Việt Nam',
            'gaming': 'Trò Chơi Thịnh Hành Tại Việt Nam',
            'news': 'Tin Tức Thịnh Hành Tại Việt Nam'
        };
        const currentSectionTitle = sectionTitles[currentCategory] || 'Thịnh Hành Nhất Trên YouTube Tại Việt Nam';

        const displayLimit = isOverview ? 15 : 50;

        mainContentHtml = `
            <!-- 1. PHẦN CHÍNH 2 CỘT (THỊNH HÀNH NHẤT + WIDGETS BÊN PHẢI) -->
            <div class="yt-main-two-col ${isOverview ? 'yt-is-overview' : 'yt-is-category'}">
                <!-- Cột trái: Thịnh Hành Nhất Trên YouTube Tại Việt Nam -->
                <div class="yt-popular-section">
                    <div class="yt-popular-head">
                        <h3 class="yt-popular-title">${currentSectionTitle}</h3>
                    </div>
                    <div class="yt-popular-list">
                        ${items.slice(0, displayLimit).map((item, idx) => {
                            const videoUrl = item.url || (item.embedId ? `https://www.youtube.com/watch?v=${item.embedId}` : '#');
                            const channelUrl = item.channelId
                                ? `https://www.youtube.com/channel/${item.channelId}`
                                : `https://www.youtube.com/results?search_query=${encodeURIComponent(item.creator || '')}`;

                            const rank = idx + 1;
                            const isTop3 = rank <= 3;

                            return `
                                <div class="yt-pop-item" data-id="${item.id}" data-url="${videoUrl}" title="Mở video trên YouTube">
                                    <span class="yt-pop-rank ${isTop3 ? 'rank-' + rank : ''}">${rank}</span>
                                    <div class="yt-pop-thumb-box">
                                        <img src="${item.thumbnail}" alt="${item.title}" class="yt-pop-thumb" loading="lazy">
                                        ${item.duration ? `<span class="yt-pop-duration">${item.duration}</span>` : ''}
                                    </div>
                                    <div class="yt-pop-details">
                                        <h4 class="yt-pop-title" title="${item.title}">${item.title}</h4>
                                        <div class="yt-pop-channel-row">
                                            ${item.channelAvatar ? `<img src="${item.channelAvatar}" class="yt-pop-avatar" data-channel-url="${channelUrl}" title="Mở kênh ${item.creator}" loading="lazy">` : ''}
                                            <span class="yt-pop-channel-name" data-channel-url="${channelUrl}" title="Mở kênh ${item.creator}">${item.creator}</span>
                                            <span class="yt-pop-time-badge">${formatTimeAgo(item.publishedAt)}</span>
                                        </div>
                                        <div class="yt-pop-metrics-row">
                                            <span class="yt-pop-stat">${ICONS.eye} ${formatCompact(item.rawViews)}</span>
                                            <span class="yt-pop-stat">${ICONS.like} ${formatCompact(item.rawLikes)}</span>
                                            <span class="yt-pop-stat">${ICONS.comment} ${formatCompact(item.rawComments)}</span>
                                            <span class="yt-pop-stat yt-pop-velocity">${formatVelocity(item.velocity)}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Cột phải: Các widget thống kê bên lề -->
                <div class="yt-sidebar-stack">
                    <!-- Widget 1: Kênh Phổ Biến -->
                    <div class="yt-side-card">
                        <div class="yt-side-head">
                            <h4 class="yt-side-title">Kênh Phổ Biến</h4>
                        </div>
                        <div class="yt-side-list">
                            ${popularChannels.map((ch, idx) => `
                                <div class="yt-channel-row-item" data-url="${ch.url}" title="Mở kênh ${ch.name} trên YouTube">
                                    <span class="yt-channel-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <img src="${ch.avatar}" alt="${ch.name}" class="yt-side-channel-avatar" loading="lazy">
                                    <div class="yt-side-channel-info">
                                        <div class="yt-side-channel-name">${ch.name}</div>
                                        <div class="yt-side-channel-stats" title="${ch.trendingVideosCount} video lọt Top Trending (${Array.from(ch.categories || []).join(', ')}) • ${formatCompact(ch.totalTrendingViews)} lượt xem • ${formatCompact(ch.subscribers)} người đăng ký">
                                            <span class="yt-ch-stat-highlight">${ch.trendingVideosCount} trending</span>
                                            <span class="yt-ch-stat-sep">•</span>
                                            <span>${formatCompact(ch.totalTrendingViews)} view</span>
                                            <span class="yt-ch-stat-sep">•</span>
                                            <span>${formatCompact(ch.subscribers)} sub</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Widget 2: Kênh Đang Lên -->
                    <div class="yt-side-card">
                        <div class="yt-side-head">
                            <h4 class="yt-side-title">Kênh Đang Lên</h4>
                        </div>
                        <div class="yt-side-list">
                            ${risingChannels.map((ch, idx) => `
                                <div class="yt-channel-row-item" data-url="${ch.url}" title="Mở kênh ${ch.name} trên YouTube">
                                    <span class="yt-channel-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <img src="${ch.avatar}" alt="${ch.name}" class="yt-side-channel-avatar" loading="lazy">
                                    <div class="yt-side-channel-info">
                                        <div class="yt-side-channel-name">${ch.name}</div>
                                        <div class="yt-side-channel-stats" title="Tăng trưởng ${ch.growthPercent}% so với quy mô đăng ký (${formatCompact(ch.totalTrendingViews)} view / ${formatCompact(ch.subscribers)} sub)">
                                            <span class="yt-rising-growth">tăng +${ch.growthPercent}%</span>
                                            <span class="yt-ch-stat-sep">•</span>
                                            <span>${formatCompact(ch.subscribers)} sub</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Widget 3: Từ Khóa Phổ Biến -->
                    <div class="yt-side-card">
                        <div class="yt-side-head">
                            <h4 class="yt-side-title">Từ Khóa Phổ Biến</h4>
                        </div>
                        ${keywordsHtml}
                    </div>
                </div>
            </div>

            ${isOverview ? `
                <!-- 2. KỶ LỤC TRENDING (2 CỘT ĐỐI XỨNG CHUẨN XÁC) -->
                <div class="yt-records-container">
                    <div class="yt-records-main-head">
                        <div class="yt-records-title-group">
                            <h3 class="yt-records-main-title">Nổi Bật YouTube Trending</h3>
                            <span class="yt-records-date-badge">
                                <svg class="yt-stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <span>Tháng ${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}</span>
                            </span>
                        </div>
                    </div>
                    <div class="yt-records-2col-grid">
                        <!-- Card 1: Tương Tác Cao Nhất -->
                        <div class="yt-record-card">
                            <div class="yt-record-card-head">
                                <h4 class="yt-record-card-title">Tương Tác Cao Nhất</h4>
                            </div>
                            <div class="yt-record-list">
                                ${records.mostEngaging.map((item, idx) => renderRecordItem(item, idx, 'engaging')).join('')}
                            </div>
                        </div>

                        <!-- Card 2: Nhiều Lượt Thích Nhất -->
                        <div class="yt-record-card">
                            <div class="yt-record-card-head">
                                <h4 class="yt-record-card-title">Nhiều Lượt Thích Nhất</h4>
                            </div>
                            <div class="yt-record-list">
                                ${records.mostLiked.map((item, idx) => renderRecordItem(item, idx, 'liked')).join('')}
                            </div>
                        </div>

                        <!-- Card 3: Nhiều Bình Luận Nhất -->
                        <div class="yt-record-card">
                            <div class="yt-record-card-head">
                                <h4 class="yt-record-card-title">Nhiều Bình Luận Nhất</h4>
                            </div>
                            <div class="yt-record-list">
                                ${records.mostCommented.map((item, idx) => renderRecordItem(item, idx, 'commented')).join('')}
                            </div>
                        </div>

                        <!-- Card 4: Nhiều Lượt Xem Nhất -->
                        <div class="yt-record-card">
                            <div class="yt-record-card-head">
                                <h4 class="yt-record-card-title">Nhiều Lượt Xem Nhất</h4>
                            </div>
                            <div class="yt-record-list">
                                ${records.mostViewed.map((item, idx) => renderRecordItem(item, idx, 'viewed')).join('')}
                            </div>
                        </div>

                        <!-- Card 5: Video Mới Nhất -->
                        <div class="yt-record-card">
                            <div class="yt-record-card-head">
                                <h4 class="yt-record-card-title">Video Mới Nhất</h4>
                            </div>
                            <div class="yt-record-list">
                                ${records.newestVideos.map((item, idx) => renderRecordItem(item, idx, 'newest')).join('')}
                            </div>
                        </div>

                        <!-- Card 6: Video Lâu Nhất -->
                        <div class="yt-record-card">
                            <div class="yt-record-card-head">
                                <h4 class="yt-record-card-title">Video Lâu Nhất</h4>
                            </div>
                            <div class="yt-record-list">
                                ${records.oldestVideos.map((item, idx) => renderRecordItem(item, idx, 'oldest')).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }

    return mainContentHtml;
}

/**
 * Gắn các sự kiện tương tác trong khu vực nội dung YouTube
 */
export function bindYouTubeContentEvents(container, onPlayMedia) {
    if (!container) return;

    // Gắn sự kiện click mở video trên YouTube (tab mới)
    container.querySelectorAll('.yt-pop-item, .yt-rec-item').forEach(el => {
        el.addEventListener('click', (e) => {
            // Nếu người dùng bấm trúng avatar kênh hoặc tên kênh -> mở trang kênh
            const chTarget = e.target.closest('[data-channel-url]');
            if (chTarget) {
                e.stopPropagation();
                const chUrl = chTarget.getAttribute('data-channel-url');
                if (chUrl) {
                    window.open(chUrl, '_blank');
                    return;
                }
            }
            const url = el.getAttribute('data-url');
            if (url && url !== '#') {
                window.open(url, '_blank');
            }
        });
    });

    // Gắn sự kiện click mở kênh cho Kênh Phổ Biến & Kênh Đang Lên (tab mới)
    container.querySelectorAll('.yt-channel-row-item').forEach(el => {
        el.addEventListener('click', () => {
            const url = el.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // Gắn sự kiện click từ khóa tìm kiếm (tab mới)
    container.querySelectorAll('.yt-kw-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const kw = tag.textContent.trim();
            if (kw) {
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`, '_blank');
            }
        });
    });

    // Gắn sự kiện lọc từ khóa theo danh mục (chip filter)
    const kwChips = container.querySelectorAll('.yt-kw-chip');
    const kwGroups = container.querySelectorAll('.yt-kw-group-box');
    kwChips.forEach(chip => {
        chip.addEventListener('click', () => {
            kwChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const target = chip.getAttribute('data-kw-target');
            kwGroups.forEach(group => {
                if (target === 'all' || group.getAttribute('data-kw-group') === target) {
                    group.style.display = '';
                } else {
                    group.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Hiệu ứng Skeleton Loading cho nội dung chính của YouTube (không phá hủy tiêu đề & tabs)
 */
export function renderYouTubeContentSkeleton(isOverview = true) {
    return `
        <!-- 1. Main 2-Col Skeleton -->
        <div class="yt-main-two-col ${isOverview ? 'yt-is-overview' : 'yt-is-category'} skeleton-layout" aria-busy="true">
            <!-- Cột trái: Popular video rows skeleton -->
            <div class="yt-popular-section">
                <div class="yt-popular-head" style="margin-bottom: 16px;">
                    <div class="skeleton-shimmer" style="width: 280px; height: 20px; border-radius: 4px;"></div>
                </div>
                <div class="yt-popular-list">
                    ${Array.from({ length: 8 }).map(() => `
                        <div class="yt-pop-item" style="pointer-events: none; border-bottom: 1px solid var(--border-subtle);">
                            <span class="skeleton-shimmer" style="width: 16px; height: 16px; border-radius: 3px; flex-shrink: 0;"></span>
                            <div class="yt-pop-thumb-box skeleton-shimmer" style="border: none;"></div>
                            <div class="yt-pop-details" style="gap: 8px;">
                                <div class="skeleton-shimmer" style="width: 85%; height: 14px; border-radius: 3px;"></div>
                                <div class="skeleton-shimmer" style="width: 55%; height: 12px; border-radius: 3px;"></div>
                                <div class="yt-pop-channel-row" style="gap: 8px;">
                                    <div class="skeleton-shimmer" style="width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;"></div>
                                    <div class="skeleton-shimmer" style="width: 110px; height: 12px; border-radius: 3px;"></div>
                                    <div class="skeleton-shimmer" style="width: 65px; height: 12px; border-radius: 3px;"></div>
                                </div>
                                <div class="yt-pop-metrics-row" style="gap: 12px;">
                                    <div class="skeleton-shimmer" style="width: 52px; height: 11px; border-radius: 2px;"></div>
                                    <div class="skeleton-shimmer" style="width: 48px; height: 11px; border-radius: 2px;"></div>
                                    <div class="skeleton-shimmer" style="width: 48px; height: 11px; border-radius: 2px;"></div>
                                    <div class="skeleton-shimmer" style="width: 62px; height: 11px; border-radius: 2px;"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Cột phải: 3 Widgets Skeleton -->
            <div class="yt-sidebar-stack">
                <div class="yt-side-card">
                    <div class="yt-side-head">
                        <div class="skeleton-shimmer" style="width: 130px; height: 16px; border-radius: 3px;"></div>
                    </div>
                    <div class="yt-side-list" style="gap: 8px;">
                        ${Array.from({ length: 5 }).map(() => `
                            <div class="yt-channel-row-item" style="pointer-events: none; border-bottom: 1px solid var(--border-subtle); padding: 7px 8px;">
                                <span class="skeleton-shimmer" style="width: 14px; height: 14px; border-radius: 2px; flex-shrink: 0;"></span>
                                <div class="skeleton-shimmer" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;"></div>
                                <div class="yt-side-channel-info" style="gap: 6px;">
                                    <div class="skeleton-shimmer" style="width: 120px; height: 13px; border-radius: 3px;"></div>
                                    <div class="skeleton-shimmer" style="width: 170px; height: 10px; border-radius: 2px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="yt-side-card">
                    <div class="yt-side-head">
                        <div class="skeleton-shimmer" style="width: 120px; height: 16px; border-radius: 3px;"></div>
                    </div>
                    <div class="yt-side-list" style="gap: 8px;">
                        ${Array.from({ length: 6 }).map(() => `
                            <div class="yt-channel-row-item" style="pointer-events: none; border-bottom: 1px solid var(--border-subtle); padding: 7px 8px;">
                                <span class="skeleton-shimmer" style="width: 14px; height: 14px; border-radius: 2px; flex-shrink: 0;"></span>
                                <div class="skeleton-shimmer" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;"></div>
                                <div class="yt-side-channel-info" style="gap: 6px;">
                                    <div class="skeleton-shimmer" style="width: 110px; height: 13px; border-radius: 3px;"></div>
                                    <div class="skeleton-shimmer" style="width: 140px; height: 10px; border-radius: 2px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="yt-side-card">
                    <div class="yt-side-head">
                        <div class="skeleton-shimmer" style="width: 140px; height: 16px; border-radius: 3px;"></div>
                    </div>
                    <div class="yt-keywords-cloud" style="gap: 10px 12px; padding: 12px 0;">
                        ${[85, 95, 65, 110, 75, 120, 85, 90, 70, 105, 60, 95, 115, 70, 85].map(w => `
                            <div class="skeleton-shimmer" style="width: ${w}px; height: 22px; border-radius: 4px;"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        ${isOverview ? `
            <div class="yt-records-container skeleton-layout" style="margin-top: 24px;" aria-busy="true">
                <div class="skeleton-shimmer" style="width: 240px; height: 28px; border-radius: 4px; margin-bottom: 16px;"></div>
                <div class="yt-records-2col-grid">
                    ${Array.from({ length: 6 }).map(() => `
                        <div class="yt-record-card" style="padding: 16px;">
                            <div class="skeleton-shimmer" style="width: 150px; height: 18px; border-radius: 3px; margin-bottom: 12px;"></div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${Array.from({ length: 3 }).map(() => `
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <div class="skeleton-shimmer" style="width: 80px; height: 46px; border-radius: 4px; flex-shrink: 0;"></div>
                                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                                            <div class="skeleton-shimmer" style="width: 88%; height: 13px; border-radius: 2px;"></div>
                                            <div class="skeleton-shimmer" style="width: 50%; height: 11px; border-radius: 2px;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

/**
 * Cập nhật nội dung YouTube mượt mà khi đổi tab danh mục (không re-render toàn bộ DOM)
 */
export function updateYouTubeContent(container, items, onPlayMedia, state = {}) {
    const mainContent = container.querySelector('.yt-main-content');
    if (!mainContent) return;
    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';

    mainContent.innerHTML = buildYouTubeContentHtml(items, isOverview, currentCategory, state);
    mainContent.classList.remove('content-fade-in');
    void mainContent.offsetWidth; // trigger reflow
    mainContent.classList.add('content-fade-in');

    bindYouTubeContentEvents(mainContent, onPlayMedia);
}

/**
 * Render toàn bộ Dashboard YouTube (dùng khi mới vào trang hoặc chuyển nền tảng)
 */
export function renderYouTube(container, items, onPlayMedia, state = {}, onSelectCategory) {
    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';
    const mainContentHtml = buildYouTubeContentHtml(items, isOverview, currentCategory, state);
    const updatedTimeStr = formatUpdateTime(state.data?.platforms_updated?.youtube || state.data?.last_updated);

    container.innerHTML = `
        <div class="yt-dashboard-layout view-fade-in">
            <!-- 1. BẢNG XẾP HẠNG XU HƯỚNG YOUTUBE • VIỆT NAM (Ở TRÊN CÙNG) -->
            <div class="yt-header-banner">
                <div class="yt-brand-lead">
                    <div class="platform-title-row">
                        <h2 class="yt-heading">Bảng Xếp Hạng Xu Hướng YouTube • Việt Nam</h2>
                        <div class="platform-time-badge" title="Thời gian thu thập bảng xếp hạng YouTube">
                            <svg class="badge-clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>Cập nhật: <strong>${updatedTimeStr || '<span class="header-time-skeleton skeleton-shimmer"></span>'}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. CÁC MỤC TAB DANH MỤC (NẰM Ở DƯỚI TIÊU ĐỀ) -->
            <nav class="chart-navigation" aria-label="Bộ lọc chuyên mục YouTube">
                <div class="categories-strip" role="tablist">
                    ${YOUTUBE_CATEGORIES.map(c => `
                        <button class="cat-pill ${c.id === currentCategory ? 'active' : ''}" data-cat="${c.id}">
                            ${c.name}
                        </button>
                    `).join('')}
                </div>
            </nav>

            <!-- 3. NỘI DUNG CHÍNH (Ở DƯỚI CÙNG) -->
            <div class="yt-main-content">
                ${mainContentHtml}
            </div>
        </div>
    `;

    // Gắn sự kiện chuyển tab danh mục
    container.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cat = btn.getAttribute('data-cat');
            if (onSelectCategory) {
                onSelectCategory(cat);
            }
        });
    });

    bindYouTubeContentEvents(container, onPlayMedia);
}

/**
 * Hiệu ứng Skeleton Loading cho toàn bộ YouTube view (dùng khi chuyển giữa các nền tảng)
 */
export function renderYouTubeSkeleton(container, isOverview = true) {
    if (!container) return;
    container.innerHTML = `
        <div class="yt-dashboard-layout skeleton-layout" aria-busy="true">
            <!-- 1. Banner Skeleton -->
            <div class="yt-header-banner">
                <div class="yt-brand-lead">
                    <div class="skeleton-shimmer" style="width: 420px; height: 32px; border-radius: 6px;"></div>
                </div>
            </div>

            <!-- 2. Tabs Skeleton -->
            <nav class="chart-navigation">
                <div class="categories-strip">
                    <div class="skeleton-shimmer" style="width: 84px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 78px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 76px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 72px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 66px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 78px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 70px; height: 34px; border-radius: 999px;"></div>
                </div>
            </nav>

            <!-- 3. Main Content Skeleton -->
            <div class="yt-main-content">
                ${renderYouTubeContentSkeleton(isOverview)}
            </div>
        </div>
    `;
}
