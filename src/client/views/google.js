/**
 * View: Google Trends
 * Bảng Xếp Hạng & Phân Tích Xu Hướng Tìm Kiếm Google • Việt Nam
 * 100% Khung sườn & Component Design kế thừa chuẩn xác từ Spotify (#121212 Dark Mode)
 * - Banner tiêu đề ở trên cùng: "Bảng Xếp Hạng Xu Hướng Google • Việt Nam"
 * - Bộ lọc danh mục Tabs ("Tổng hợp", "Thể thao", "Giải trí", "Tin tức & Xã hội", "Công nghệ & Đời sống", "Khám phá Google")
 * - Bố cục Main 2 Cột:
 *     + Cột trái (70%): Danh sách xu hướng tìm kiếm hàng ngang gọn gàng, đồng bộ 100% với khung Spotify (.sp-pop-item)
 *     + Cột phải (30%): 3 Cards (Cụm từ đột biến, Nguồn tin tức dẫn đầu, Đám mây từ khóa)
 * - 6 Thẻ Kỷ Lục đối xứng ở trang Tổng hợp (.sp-records-container)
 * - Tab Khám phá (Explore): Bảng so sánh 2 cột chuẩn Google
 */

let _exploreCache = null;
let _lastGoogleItems = null;
let _cachedGoogleRecords = null;

export const GOOGLE_CATEGORIES = [
    { id: 'all', name: 'Tổng hợp' },
    { id: 'sports', name: 'Thể thao' },
    { id: 'entertainment', name: 'Giải trí' },
    { id: 'news', name: 'Tin tức & Xã hội' },
    { id: 'tech_life', name: 'Công nghệ & Đời sống' },
    { id: 'explore', name: 'Khám phá Google' }
];

async function ensureExploreData() {
    if (_exploreCache) return _exploreCache;
    try {
        const res = await fetch('/data/google_explore.json');
        if (res.ok) {
            _exploreCache = await res.json();
            return _exploreCache;
        }
    } catch (e) {
        console.warn('Lỗi nạp google_explore.json:', e);
    }
    return { top: [], rising: [] };
}

const GOOGLE_ICON_SVG = `<svg class="sp-spotify-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>`;

const SEARCH_ICON_SVG = `<svg class="sp-spotify-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

const EXT_ICON_SVG = `<svg class="sp-spotify-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

const GOOGLE_G_SVG = `<div class="gg-g-badge" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg></div>`;

const GOOGLE_G_REC_SVG = `<div class="gg-g-badge gg-g-rec-badge" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg></div>`;

export function buildGoogleContentHtml(items, isOverview, currentCategory, state = {}) {
    const categoryTitles = {
        'all': 'Xu Hướng Tìm Kiếm Thịnh Hành Nhất 7 Ngày Qua Tại Việt Nam',
        'sports': 'Xu Hướng Thể Thao Nóng Nhất 7 Ngày Qua Tại Việt Nam',
        'entertainment': 'Xu Hướng Giải Trí & Truyền Thông 7 Ngày Qua',
        'news': 'Xu Hướng Tin Tức & Thời Sự Xã Hội 7 Ngày Qua',
        'tech_life': 'Xu Hướng Công Nghệ & Tiện Ích Đời Sống 7 Ngày Qua',
        'explore': 'Bảng So Sánh Khám Phá Xu Hướng Tìm Kiếm Google'
    };

    // 1. CHẾ ĐỘ XEM: KHÁM PHÁ (EXPLORE)
    if (currentCategory === 'explore') {
        const expData = _exploreCache || state.data?.googleExplore || { top: [], rising: [] };
        const topList = expData.top || [];
        const risingList = expData.rising || [];

        return `
            <div class="sp-popular-section" style="width: 100%; box-sizing: border-box;">
                <div class="sp-popular-head">
                    <div class="sp-head-lead">
                        <h3 class="sp-popular-title">${categoryTitles.explore}</h3>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px;">
                    <!-- Bảng 1: Cụm từ tìm kiếm hàng đầu -->
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
                            <h4 style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0;">Cụm từ tìm kiếm hàng đầu</h4>
                            <span style="font-size: 11px; font-weight: 600; color: #4285F4; background: rgba(66,133,244,0.12); padding: 2px 7px; border-radius: 4px;">Top phổ biến</span>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            ${topList.map((item, idx) => {
                                const rank = item.rank || (idx + 1);
                                const isTop3 = rank <= 3;
                                const isPositive = !(item.change || '').startsWith('-');
                                return `
                                    <div class="sp-pop-item" data-url="${item.url}" title="Tra cứu: ${item.query}" style="padding: 9px 8px;">
                                        <div class="sp-pop-rank-col" style="width: 24px;">
                                            <span class="sp-rank-num ${isTop3 ? 'rank-' + rank : ''}" style="font-size: 14px;">${rank}</span>
                                        </div>
                                        <div class="sp-pop-details">
                                            <div class="sp-pop-title" style="font-size: 13.5px;">${item.query}</div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="width: 80px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                                                <div style="width: ${item.score || 100}%; height: 100%; background: #4285F4; border-radius: 10px;"></div>
                                            </div>
                                            <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); width: 24px; text-align: right;">${item.score || 100}</span>
                                            <span style="font-size: 11.5px; font-weight: 700; color: ${isPositive ? '#34A853' : '#EA4335'}; width: 45px; text-align: right;">${item.change || '0%'}</span>
                                            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="sp-open-link-btn" title="Tra cứu trên Google">
                                                ${EXT_ICON_SVG}
                                            </a>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Bảng 2: Cụm từ tìm kiếm đột biến -->
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
                            <h4 style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0;">Cụm từ tìm kiếm đột biến</h4>
                            <span style="font-size: 11px; font-weight: 700; color: #8b5cf6; background: rgba(139,92,246,0.12); padding: 2px 7px; border-radius: 4px;">Gia tăng đột biến</span>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            ${risingList.map((item, idx) => {
                                const rank = item.rank || (idx + 1);
                                const isTop3 = rank <= 3;
                                return `
                                    <div class="sp-pop-item" data-url="${item.url}" title="Tra cứu: ${item.query}" style="padding: 9px 8px;">
                                        <div class="sp-pop-rank-col" style="width: 24px;">
                                            <span class="sp-rank-num ${isTop3 ? 'rank-' + rank : ''}" style="font-size: 14px;">${rank}</span>
                                        </div>
                                        <div class="sp-pop-details">
                                            <div class="sp-pop-title" style="font-size: 13.5px;">${item.query}</div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 11.5px; font-weight: 700; color: #8b5cf6; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); padding: 2px 8px; border-radius: 4px;">${item.growth}</span>
                                            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="sp-open-link-btn" title="Tra cứu trên Google">
                                                ${EXT_ICON_SVG}
                                            </a>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 2. CHẾ ĐỘ XEM: THỊNH HÀNH (7 NGÀY QUA)
    const fullItems = state.data?.rankings?.google || items || [];

    // Helper: Trích xuất danh sách từ khóa tìm kiếm 100% động từ dữ liệu Google Explore và Rankings (không hardcode)
    const extractKeywordsList = (list, limit = 35) => {
        if (!list || list.length === 0) return [];

        const candidateMap = new Map();

        // 1. Lấy trực tiếp từ dữ liệu Explore Rising & Top của Google
        const expData = _exploreCache || state.data?.googleExplore || {};
        const expList = [...(expData.rising || []), ...(expData.top || [])];
        expList.forEach((it, idx) => {
            if (it.query && it.query.trim().length >= 3) {
                const q = it.query.trim();
                candidateMap.set(q, (candidateMap.get(q) || 0) + (100 - idx) * 10);
            }
        });

        // 2. Lấy trực tiếp từ các tiêu đề và truy vấn liên quan trong dữ liệu xu hướng thực tế
        list.forEach((it, idx) => {
            if (it.title && it.title.trim().length >= 3) {
                const t = it.title.trim();
                candidateMap.set(t, (candidateMap.get(t) || 0) + (it.trafficNum ? it.trafficNum / 1000 : (100 - idx)));
            }
            if (Array.isArray(it.relatedQueries)) {
                it.relatedQueries.forEach(rq => {
                    if (rq && rq.trim().length >= 3) {
                        const q = rq.trim();
                        candidateMap.set(q, (candidateMap.get(q) || 0) + 50);
                    }
                });
            }
        });

        // 3. Sắp xếp theo trọng số
        const sorted = [...candidateMap.entries()].sort((a, b) => b[1] - a[1]);

        // 4. Lọc trùng lặp thuần túy bằng thuật toán chuẩn hóa xâu (Deduplication)
        const normalizeKey = (str) => {
            return str.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
        };

        const cleanList = [];
        const seenRoots = [];

        for (const [text, count] of sorted) {
            const raw = text.trim();
            if (raw.length < 3 || /^\d+$/.test(raw)) continue;
            if (['hôm nay', 'ngày mai', 'tin mới', 'trực tiếp', 'kết quả', 'thời gian'].includes(raw.toLowerCase())) continue;

            const norm = normalizeKey(raw);
            if (norm.length < 3) continue;

            let isDupe = false;
            for (const prev of seenRoots) {
                if (prev === norm || prev.includes(norm) || norm.includes(prev)) {
                    isDupe = true;
                    break;
                }
            }

            if (!isDupe) {
                seenRoots.push(norm);
                // Viết hoa chữ cái đầu cho chuẩn form
                const formatted = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                cleanList.push({ text: formatted, count });
            }

            if (cleanList.length >= limit) break;
        }

        return cleanList;
    };

    // Helper: Render Dynamic Word Cloud (đồng bộ Spotify)
    const renderKeywordTags = (keywordsList) => {
        if (!keywordsList || keywordsList.length === 0) return '<div class="yt-kw-empty">Đang cập nhật...</div>';
        const maxCount = keywordsList[0].count;
        const lowestCount = keywordsList[keywordsList.length - 1].count;
        const total = keywordsList.length;

        const styledTags = keywordsList.map(({ text, count }, index) => {
            const countProgress = maxCount === lowestCount ? 0.5 : (count - lowestCount) / Math.max(1, maxCount - lowestCount);
            const rankProgress = 1 - (index / Math.max(1, total - 1));
            const progress = (countProgress * 0.65 + rankProgress * 0.35);

            const size = (12.5 + progress * 5.5).toFixed(1); // 12.5px - 18px hài hòa
            const weight = progress >= 0.7 ? 800 : (progress >= 0.4 ? 700 : (progress >= 0.2 ? 600 : 500));
            const opacity = (0.72 + progress * 0.28).toFixed(2);

            return { text, count, size, weight, opacity };
        });

        const shuffled = [...styledTags];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.map(({ text, count, size, weight, opacity }) => {
            return `<span class="sp-kw-tag" style="font-size: ${size}px; font-weight: ${weight}; opacity: ${opacity};" title="Tra cứu Google: ${text}">${text}</span>`;
        }).join(' ');
    };

    // Thống kê Nguồn báo chí dẫn đầu (Top Publishers)
    const publisherCounts = {};
    fullItems.forEach(it => {
        const src = it.newsSource || 'Google Search';
        if (src !== 'Google Search') {
            publisherCounts[src] = (publisherCounts[src] || 0) + 1;
        }
    });
    const topPublishers = Object.entries(publisherCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Tính toán Kỷ Lục Google Trends (6 thẻ đối xứng)
    if (_lastGoogleItems !== fullItems && fullItems.length > 0) {
        _cachedGoogleRecords = {
            topTraffic: [...fullItems].sort((a, b) => (b.trafficNum || 0) - (a.trafficNum || 0)).slice(0, 5),
            topGrowth: [...fullItems].sort((a, b) => (b.growthPct || 0) - (a.growthPct || 0)).slice(0, 5),
            topSports: fullItems.filter(i => i.categoryId === 'sports').slice(0, 5),
            topEntertainment: fullItems.filter(i => i.categoryId === 'entertainment').slice(0, 5),
            topNews: fullItems.filter(i => i.categoryId === 'news').slice(0, 5),
            topTechLife: fullItems.filter(i => i.categoryId === 'tech_life').slice(0, 5)
        };
        _lastGoogleItems = fullItems;
    }

    const records = _cachedGoogleRecords || {
        topTraffic: [], topGrowth: [], topSports: [],
        topEntertainment: [], topNews: [], topTechLife: []
    };

    const displayItems = isOverview ? fullItems.slice(0, 20) : items;

    // Helper render 1 hàng kỷ lục theo chuẩn .sp-rec-item
    const renderRecordItem = (item, idx, type) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const trafficShort = (item.primaryMetric || '').replace(/\s*lượt tìm kiếm/i, '').trim() || (item.trafficNum ? `${item.trafficNum} N+` : '');
        let metricBadge = '';
        if (type === 'growth') {
            metricBadge = `<span class="sp-rec-val" style="color: #34A853; font-weight: 700;">${item.growthFormatted || ''}</span>`;
        } else {
            metricBadge = `<span class="sp-rec-val" style="color: #4285F4; font-weight: 700;">${trafficShort}</span>`;
        }

        const thumbHtml = item.thumbnail
            ? `<img src="${item.thumbnail}" alt="" class="sp-rec-thumb" loading="lazy" onerror="this.outerHTML=GOOGLE_G_REC_SVG;">`
            : GOOGLE_G_REC_SVG;

        return `
            <div class="sp-rec-item" data-url="${item.url}" title="Tra cứu: ${item.title}">
                <span class="sp-rec-rank ${isTop3 ? 'rank-' + rank + ' top-' + rank : ''}">${rank}</span>
                <div class="sp-rec-thumb-box">
                    ${thumbHtml}
                </div>
                <div class="sp-rec-info">
                    <div class="sp-rec-title" title="${item.title}">${item.title}</div>
                    <div class="sp-rec-artist">${item.newsSource || 'Google Trends'} • ${item.startedAgo || ''}</div>
                </div>
                <div class="sp-rec-meta">
                    ${metricBadge}
                </div>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="sp-open-link-btn" title="Tra cứu trên Google">
                    ${EXT_ICON_SVG}
                </a>
            </div>
        `;
    };

    const expRisingTop10 = (_exploreCache?.rising || []).slice(0, 10);
    const keywords = extractKeywordsList(fullItems, 35);

    return `
        <!-- 1. BẢNG XẾP HẠNG CHÍNH (KHUNG SƯỜN SPOTIFY 2 CỘT) -->
        <div class="sp-main-two-col ${isOverview ? 'sp-is-overview' : 'sp-is-category'}">
            <!-- Cột trái (70%): Danh sách xu hướng tìm kiếm -->
            <div class="sp-popular-section">
                <div class="sp-popular-head">
                    <div class="sp-head-lead">
                        <h3 class="sp-popular-title">${categoryTitles[currentCategory] || 'Bảng Xếp Hạng Xu Hướng Google'}</h3>
                    </div>
                </div>

                <div class="sp-popular-list">
                    ${displayItems.map((item, idx) => {
                        const rank = idx + 1;
                        const isTop3 = rank <= 3;
                        const thumbHtml = item.thumbnail
                            ? `<img src="${item.thumbnail}" alt="" class="sp-pop-thumb" loading="lazy" onerror="this.outerHTML=GOOGLE_G_SVG;">`
                            : GOOGLE_G_SVG;
                        const subtitle = item.newsTitle ? `${item.newsSource}: ${item.newsTitle}` : (item.creator || 'Xu hướng tìm kiếm Google');

                        return `
                            <div class="sp-pop-item ${isTop3 ? 'is-top-rank' : ''}" data-url="${item.url}">
                                <!-- Số thứ hạng -->
                                <div class="sp-pop-rank-col">
                                    <span class="sp-rank-num ${isTop3 ? 'rank-' + rank : ''}">${rank}</span>
                                </div>

                                <!-- Ảnh bìa thumbnail vuông bo nhẹ chuẩn Spotify hoặc Google G Badge khi không có ảnh -->
                                <div class="sp-pop-thumb-box">
                                    ${thumbHtml}
                                </div>

                                <!-- Chi tiết: Từ khóa & Nguồn tin tức -->
                                <div class="sp-pop-details">
                                    <div class="sp-pop-title" title="${item.title}">${item.title}</div>
                                    <div class="sp-pop-artist-row">
                                        <span class="sp-artist-label" title="${subtitle}">${subtitle}</span>
                                        <span class="sp-pop-bullet">•</span>
                                        <span class="sp-category-pill">${item.category || 'Google'}</span>
                                    </div>
                                </div>

                                <!-- Cột số liệu bên phải (Chuẩn Spotify .sp-audio-player-col) -->
                                <div class="sp-audio-player-col">
                                    <span class="sp-duration-fallback" style="font-weight: 700; color: #4285F4; font-size: 13px;">${item.primaryMetric}</span>
                                    <span class="sp-rising-growth" style="font-size: 11px; padding: 2px 7px; background: rgba(52, 168, 83, 0.12); color: #34A853; border-radius: 4px; font-weight: 700;">${item.growthFormatted}</span>
                                    <span class="sp-duration-fallback" style="font-size: 11px; min-width: 65px; text-align: right;">${item.startedAgo}</span>
                                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="sp-open-link-btn" title="Tra cứu trên Google">
                                        ${EXT_ICON_SVG}
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Cột phải (30%): 3 Widgets chuẩn Spotify .sp-sidebar-stack -->
            <div class="sp-sidebar-stack">
                <!-- Widget 1: Cụm Từ Đột Biến (Explore Top Rising) -->
                <div class="sp-side-card">
                    <div class="sp-side-head">
                        <h4 class="sp-side-title" style="margin: 0;">Cụm Từ Đột Biến</h4>
                    </div>
                    <div class="sp-side-list">
                        ${expRisingTop10.map((r, idx) => `
                            <div class="sp-artist-row-item" data-url="${r.url}" title="Tra cứu: ${r.query}">
                                <span class="sp-artist-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                <div class="sp-side-artist-info">
                                    <div class="sp-side-artist-name">${r.query}</div>
                                    <div class="sp-side-artist-stats">
                                        <span class="sp-rising-growth" style="color: #8b5cf6;">tăng ${r.growth}</span>
                                    </div>
                                </div>
                                <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="sp-open-link-btn" title="Tra cứu trên Google">
                                    ${EXT_ICON_SVG}
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Widget 2: Nguồn Báo Chí Dẫn Đầu -->
                <div class="sp-side-card">
                    <div class="sp-side-head">
                        <h4 class="sp-side-title">Nguồn Tin Tức Dẫn Đầu</h4>
                    </div>
                    <div class="sp-side-list">
                        ${topPublishers.map((pub, idx) => {
                            const pubSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(pub.name + ' tin tức')}`;
                            return `
                                <div class="sp-artist-row-item" data-url="${pubSearchUrl}" title="Tra cứu: ${pub.name}">
                                    <span class="sp-artist-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <div class="sp-side-artist-info">
                                        <div class="sp-side-artist-name">${pub.name}</div>
                                        <div class="sp-side-artist-stats">${pub.count} bài viết xu hướng</div>
                                    </div>
                                    <a href="${pubSearchUrl}" target="_blank" rel="noopener noreferrer" class="sp-open-link-btn" title="Tìm bài viết từ ${pub.name}">
                                        ${EXT_ICON_SVG}
                                    </a>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Widget 3: Từ Khóa Phổ Biến (Dynamic Word Cloud) -->
                <div class="sp-side-card sp-kw-card">
                    <div class="sp-side-head">
                        <h4 class="sp-side-title">Từ Khóa Phổ Biến</h4>
                    </div>
                    <div class="sp-keywords-cloud">
                        ${renderKeywordTags(keywords)}
                    </div>
                </div>
            </div>
        </div>

        ${isOverview ? `
            <!-- 2. KỶ LỤC SPOTIFY FRAME - 6 THẺ ĐỐI XỨNG (.sp-records-container) -->
            <div class="sp-records-container">
                <div class="sp-records-main-head">
                    <div class="sp-records-title-group" style="display: flex; align-items: center; gap: 12px;">
                        <h3 class="sp-records-main-title">Nổi Bật Xu Hướng Google</h3>
                        <span class="yt-records-date-badge">
                            <svg class="yt-stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>7 ngày qua</span>
                        </span>
                    </div>
                </div>

                <div class="sp-records-2col-grid">
                    <!-- Card 1: Lượng Tìm Kiếm Cao Nhất -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Lượng Tìm Kiếm Khủng Nhất</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topTraffic.map((item, idx) => renderRecordItem(item, idx, 'traffic')).join('')}
                        </div>
                    </div>

                    <!-- Card 2: Tốc Độ Bứt Phá Nhanh Nhất -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Tăng Trưởng Bứt Phá Nhất</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topGrowth.map((item, idx) => renderRecordItem(item, idx, 'growth')).join('')}
                        </div>
                    </div>

                    <!-- Card 3: Thể Thao Tâm Điểm -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Thể Thao Nổi Bật</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topSports.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
                        </div>
                    </div>

                    <!-- Card 4: Giải Trí & Showbiz -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Giải Trí & Truyền Thông</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topEntertainment.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
                        </div>
                    </div>

                    <!-- Card 5: Tin Tức & Sự Kiện Nóng -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Thời Sự & Xã Hội</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topNews.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
                        </div>
                    </div>

                    <!-- Card 6: Đột Biến Công Nghệ & Tiện Ích -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Công Nghệ & Đời Sống</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topTechLife.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}

export function bindGoogleContentEvents(container, onPlayMedia, handleCategorySelect) {
    if (!container) return;

    // Click mở từ khóa Google Search
    container.querySelectorAll('.sp-pop-item, .sp-rec-item, .sp-artist-row-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.sp-open-link-btn')) return;
            const url = el.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // Click từ khóa trong word cloud
    container.querySelectorAll('.sp-kw-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const kw = tag.textContent.trim();
            if (kw) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(kw)}`, '_blank');
            }
        });
    });

    // Click nút chuyển tab danh mục
    container.querySelectorAll('[data-cat]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cat = btn.getAttribute('data-cat');
            if (cat && typeof handleCategorySelect === 'function') {
                handleCategorySelect(cat);
            }
        });
    });
}

export function renderGoogleContentSkeleton(isOverview = true) {
    return `
        <div class="sp-main-two-col ${isOverview ? 'sp-is-overview' : 'sp-is-category'} skeleton-layout" aria-busy="true">
            <div class="sp-popular-section">
                <div class="sp-popular-head" style="margin-bottom: 16px;">
                    <div class="skeleton-shimmer" style="width: 320px; height: 20px; border-radius: 4px;"></div>
                </div>
                <div class="sp-popular-list">
                    ${Array.from({ length: isOverview ? 12 : 8 }).map(() => `
                        <div class="sp-pop-item" style="pointer-events: none; border-bottom: 1px solid var(--border-subtle); padding: 12px 10px;">
                            <span class="skeleton-shimmer" style="width: 20px; height: 16px; border-radius: 3px; flex-shrink: 0;"></span>
                            <div class="skeleton-shimmer" style="width: 54px; height: 54px; border-radius: 8px; flex-shrink: 0;"></div>
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                                <div class="skeleton-shimmer" style="width: 65%; height: 14px; border-radius: 3px;"></div>
                                <div class="skeleton-shimmer" style="width: 40%; height: 12px; border-radius: 3px;"></div>
                            </div>
                            <div class="skeleton-shimmer" style="width: 90px; height: 14px; border-radius: 3px;"></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="sp-sidebar-stack">
                <div class="sp-side-card">
                    <div class="skeleton-shimmer" style="width: 140px; height: 16px; border-radius: 3px; margin-bottom: 12px;"></div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${Array.from({ length: 5 }).map(() => `
                            <div style="display: flex; gap: 10px; align-items: center; padding: 6px 0;">
                                <span class="skeleton-shimmer" style="width: 14px; height: 14px; border-radius: 2px;"></span>
                                <div class="skeleton-shimmer" style="flex: 1; height: 14px; border-radius: 3px;"></div>
                                <div class="skeleton-shimmer" style="width: 50px; height: 14px; border-radius: 3px;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sp-side-card">
                    <div class="skeleton-shimmer" style="width: 140px; height: 16px; border-radius: 3px; margin-bottom: 12px;"></div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${Array.from({ length: 5 }).map(() => `
                            <div style="display: flex; gap: 10px; align-items: center; padding: 6px 0;">
                                <span class="skeleton-shimmer" style="width: 14px; height: 14px; border-radius: 2px;"></span>
                                <div class="skeleton-shimmer" style="flex: 1; height: 14px; border-radius: 3px;"></div>
                                <div class="skeleton-shimmer" style="width: 40px; height: 14px; border-radius: 3px;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderGoogleSkeleton(container, isOverview = true) {
    container.innerHTML = `
        <div class="sp-dashboard-layout gg-platform-view skeleton-layout" aria-busy="true">
            <!-- 1. Banner Skeleton -->
            <div class="sp-header-banner">
                <div class="sp-brand-lead">
                    <div class="skeleton-shimmer" style="width: 420px; height: 32px; border-radius: 6px;"></div>
                </div>
            </div>

            <!-- 2. Tabs Skeleton -->
            <nav class="chart-navigation">
                <div class="categories-strip">
                    <div class="skeleton-shimmer" style="width: 84px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 118px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 136px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 116px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 122px; height: 34px; border-radius: 999px;"></div>
                    <div class="skeleton-shimmer" style="width: 124px; height: 34px; border-radius: 999px;"></div>
                </div>
            </nav>

            <!-- 3. Main Content Skeleton -->
            <div class="sp-main-content">
                ${renderGoogleContentSkeleton(isOverview)}
            </div>
        </div>
    `;
}

export function updateGoogleContent(container, items, onPlayMedia, state) {
    const mainContent = container.querySelector('.sp-main-content');
    if (!mainContent) return;

    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';

    mainContent.innerHTML = buildGoogleContentHtml(items, isOverview, currentCategory, state);
    bindGoogleContentEvents(mainContent, onPlayMedia, state.handleCategorySelect);
}

export async function renderGoogle(container, items, onPlayMedia, state, handleCategorySelect) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3 class="empty-state-title">Chưa có dữ liệu hiển thị</h3>
                <p class="empty-state-desc">Hệ thống đang tải dữ liệu xu hướng Google mới nhất.</p>
            </div>
        `;
        return;
    }

    if (!_exploreCache) {
        await ensureExploreData();
    }

    state.handleCategorySelect = handleCategorySelect;
    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';
    const categories = GOOGLE_CATEGORIES;

    container.innerHTML = `
        <div class="sp-dashboard-layout gg-platform-view view-fade-in">
            <!-- 1. TIÊU ĐỀ BANNER Ở TRÊN CÙNG (100% chuẩn Spotify) -->
            <div class="sp-header-banner">
                <div class="sp-brand-lead">
                    <h2 class="sp-heading">Bảng Xếp Hạng Xu Hướng Google • Việt Nam</h2>
                </div>
            </div>

            <!-- 2. BỘ LỌC CÁC MỤC TAB (NGAY DƯỚI TIÊU ĐỀ - 100% chuẩn Spotify) -->
            <nav class="chart-navigation" aria-label="Bộ lọc chuyên mục Google Trends">
                <div class="categories-strip" role="tablist">
                    ${categories.map(c => `
                        <button class="cat-pill ${c.id === currentCategory ? 'active' : ''}" data-cat="${c.id}">
                            ${c.name}
                        </button>
                    `).join('')}
                </div>
            </nav>

            <!-- 3. KHU VỰC NỘI DUNG CHÍNH (Đồng bộ Spotify Frame) -->
            <div class="sp-main-content">
                ${buildGoogleContentHtml(items, isOverview, currentCategory, state)}
            </div>
        </div>
    `;

    // Gắn sự kiện chuyển tab danh mục
    container.querySelectorAll('.cat-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const newCat = pill.getAttribute('data-cat');
            if (newCat && typeof handleCategorySelect === 'function') {
                handleCategorySelect(newCat);
            }
        });
    });

    bindGoogleContentEvents(container, onPlayMedia, handleCategorySelect);
}
