/**
 * View: Netflix
 * Bảng Xếp Hạng & Phân Tích Xu Hướng Netflix • Việt Nam
 * 100% Khung sườn & Component Design kế thừa chuẩn xác từ Spotify/Google (#121212 Dark Mode)
 * - Banner tiêu đề ở trên cùng: "Bảng Xếp Hạng Xu Hướng Netflix • Việt Nam"
 * - Bộ lọc danh mục Tabs: "Tổng hợp", "Phim điện ảnh", "Phim truyền hình"
 * - Bố cục Main 2 Cột:
 *     + Cột trái (70%): Danh sách tác phẩm thịnh hành (.sp-pop-item)
 *     + Cột phải (30%): 3 Cards (Trụ Hạng Đỉnh Nhất, Mới Lên Xu Hướng, Từ Khóa Phổ Biến)
 * - Thẻ Kỷ Lục đối xứng ở trang Tổng hợp (.sp-records-container)
 * - Dữ liệu thực tế 100% từ bảng xếp hạng Netflix Tudum Top 10 tại Việt Nam
 */

import { formatUpdateTime } from '../app.js';

let _lastNetflixItems = null;
let _cachedNetflixRecords = null;

export const NETFLIX_CATEGORIES = [
    { id: 'all', name: 'Tổng hợp' },
    { id: 'films', name: 'Phim điện ảnh' },
    { id: 'tv', name: 'Phim truyền hình' }
];

const EXT_ICON_SVG = `<svg class="sp-spotify-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

const NETFLIX_N_SVG = `<div class="nf-n-badge" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="#E50914" d="M5.398 0v24c1.873-.225 2.81-.312 4.715-.398V0H5.398z"/><path fill="#E50914" d="M13.887 0v24c1.873.086 2.842.173 4.715.398V0h-4.715z"/><path fill="#B81D24" d="M5.398 0l8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398z"/></svg></div>`;

const NETFLIX_N_REC_SVG = `<div class="nf-n-badge nf-n-rec-badge" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="#E50914" d="M5.398 0v24c1.873-.225 2.81-.312 4.715-.398V0H5.398z"/><path fill="#E50914" d="M13.887 0v24c1.873.086 2.842.173 4.715.398V0h-4.715z"/><path fill="#B81D24" d="M5.398 0l8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398z"/></svg></div>`;

export function buildNetflixContentHtml(items, isOverview, currentCategory, state = {}) {
    const fullItems = state.data?.rankings?.netflix || items || [];

    if (!fullItems || fullItems.length === 0) {
        return `
            <div class="empty-state">
                <h3 class="empty-state-title">Chưa có dữ liệu hiển thị</h3>
                <p class="empty-state-desc">Hệ thống đang tải dữ liệu xu hướng Netflix mới nhất.</p>
            </div>
        `;
    }

    const categoryTitles = {
        'all': 'Bảng Xếp Hạng Netflix Top 10 Phim Truyền Hình Thịnh Hành Nhất Tại Việt Nam',
        'films': 'Top 10 Phim Điện Ảnh Được Xem Nhiều Nhất Trong Tuần',
        'tv': 'Top 10 Phim Truyền Hình & Series Nổi Bật Nhất Trong Tuần'
    };

    // Tính toán Kỷ Lục Netflix từ fullItems
    if (_lastNetflixItems !== fullItems && fullItems.length > 0) {
        _cachedNetflixRecords = {
            topFilms: fullItems.filter(i => i.categoryId === 'films').slice(0, 5),
            topTv: fullItems.filter(i => i.categoryId === 'tv').slice(0, 5),
            longestInTop10: [...fullItems].sort((a, b) => (b.weeksInTop10 || 0) - (a.weeksInTop10 || 0)).slice(0, 5),
            newArrivals: [...fullItems].filter(i => (i.weeksInTop10 || 0) <= 2).sort((a, b) => (a.weeksInTop10 || 0) - (b.weeksInTop10 || 0)).slice(0, 5)
        };
        _lastNetflixItems = fullItems;
    }

    const records = _cachedNetflixRecords || {
        topFilms: [], topTv: [], longestInTop10: [], newArrivals: []
    };

    // Danh sách hiển thị cột trái: Ở trang Tổng hợp chỉ hiển thị Top 10 Phim truyền hình cho gọn
    let displayItems = fullItems.filter(i => i.categoryId === 'tv');
    if (currentCategory === 'films') {
        displayItems = fullItems.filter(i => i.categoryId === 'films');
    } else if (currentCategory === 'tv') {
        displayItems = fullItems.filter(i => i.categoryId === 'tv');
    }

    // Helper render 1 hàng kỷ lục theo chuẩn .sp-rec-item
    const renderRecordItem = (item, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const weeksText = item.primaryMetric || `${item.weeksInTop10 || 1} tuần Top 10`;

        const thumbHtml = item.thumbnail
            ? `<img src="${item.thumbnail}" alt="" class="sp-rec-thumb nf-rec-thumb" loading="lazy" onerror="this.outerHTML=NETFLIX_N_REC_SVG;">`
            : NETFLIX_N_REC_SVG;

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.title + ' phim netflix')}`;
        return `
            <div class="sp-rec-item" data-url="${searchUrl}" title="Xem thông tin phim: ${item.title}">
                <span class="sp-rec-rank ${isTop3 ? 'rank-' + rank + ' top-' + rank : ''}">${rank}</span>
                <div class="sp-rec-thumb-box nf-rec-thumb-box">
                    ${thumbHtml}
                </div>
                <div class="sp-rec-info">
                    <div class="sp-rec-title" title="${item.title}">${item.title}</div>
                    <div class="sp-rec-artist">${item.category || 'Netflix'} • ${item.velocity || 'Xu hướng'}</div>
                </div>
                <div class="sp-rec-meta">
                    <span class="sp-rec-val" style="color: var(--text-secondary); font-weight: 600;">${weeksText}</span>
                </div>
            </div>
        `;
    };

    const longestTop5 = [...fullItems].sort((a, b) => (b.weeksInTop10 || 0) - (a.weeksInTop10 || 0)).slice(0, 5);
    const newArrivalsTop5 = [...fullItems].filter(i => (i.weeksInTop10 || 0) <= 2).slice(0, 5);

    return `
        <!-- 1. BẢNG XẾP HẠNG CHÍNH (KHUNG SƯỜN SPOTIFY 2 CỘT) -->
        <div class="sp-main-two-col ${isOverview ? 'sp-is-overview' : 'sp-is-category'}">
            <!-- Cột trái (70%): Danh sách tác phẩm thịnh hành -->
            <div class="sp-popular-section">
                <div class="sp-popular-head">
                    <div class="sp-head-lead">
                        <h3 class="sp-popular-title">${categoryTitles[currentCategory] || 'Bảng Xếp Hạng Xu Hướng Netflix'}</h3>
                    </div>
                </div>

                <div class="sp-popular-list">
                    ${displayItems.map((item, idx) => {
                        const rank = item.rank || (idx + 1);
                        const isTop3 = rank <= 3;
                        const thumbHtml = item.thumbnail
                            ? `<img src="${item.thumbnail}" alt="" class="sp-pop-thumb nf-pop-thumb" loading="lazy" onerror="this.outerHTML=NETFLIX_N_SVG;">`
                            : NETFLIX_N_SVG;
                        const weeksText = item.primaryMetric || `${item.weeksInTop10 || 1} tuần Top 10`;

                        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.title + ' phim netflix')}`;
                        return `
                            <div class="sp-pop-item ${isTop3 ? 'is-top-rank' : ''}" data-url="${searchUrl}" title="Xem thông tin phim: ${item.title}">
                                <!-- Số thứ hạng -->
                                <div class="sp-pop-rank-col">
                                    <span class="sp-rank-num ${isTop3 ? 'rank-' + rank : ''}">${rank}</span>
                                </div>

                                <!-- Ảnh bìa thumbnail 16:9 bo nhẹ chuẩn Netflix -->
                                <div class="sp-pop-thumb-box nf-thumb-frame">
                                    ${thumbHtml}
                                </div>

                                <!-- Chi tiết: Tên phim & Danh mục -->
                                <div class="sp-pop-details">
                                    <div class="sp-pop-title" title="${item.title}">${item.title}</div>
                                    <div class="sp-pop-artist-row">
                                        <span class="sp-artist-label">${item.creator || item.category || 'Netflix Tudum'}</span>
                                        <span class="sp-pop-bullet">•</span>
                                        <span class="sp-category-pill">${item.category || 'Netflix'}</span>
                                    </div>
                                </div>

                                <!-- Cột số liệu bên phải -->
                                <div class="sp-audio-player-col">
                                    <span class="sp-duration-fallback" style="font-weight: 600; color: var(--text-secondary); font-size: 13px;">${weeksText}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Cột phải (30%): 3 Widgets chuẩn Spotify .sp-sidebar-stack -->
            <div class="sp-sidebar-stack">
                <!-- Widget 1: Trụ Hạng Lâu Nhất -->
                <div class="sp-side-card">
                    <div class="sp-side-head">
                        <h4 class="sp-side-title" style="margin: 0;">Trụ Hạng Đỉnh Nhất</h4>
                    </div>
                    <div class="sp-side-list">
                        ${longestTop5.map((m, idx) => {
                            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(m.title + ' phim netflix')}`;
                            return `
                                <div class="sp-artist-row-item" data-url="${searchUrl}" title="Xem thông tin phim: ${m.title}">
                                    <span class="sp-artist-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <div class="sp-side-artist-info">
                                        <div class="sp-side-artist-name">${m.title}</div>
                                        <div class="sp-side-artist-stats">
                                            <span style="color: var(--text-secondary); font-size: 12px; font-weight: 600;">${m.weeksInTop10} tuần liên tiếp</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Widget 2: Mới Lên Xu Hướng -->
                <div class="sp-side-card">
                    <div class="sp-side-head">
                        <h4 class="sp-side-title">Mới Lên Xu Hướng</h4>
                    </div>
                    <div class="sp-side-list">
                        ${newArrivalsTop5.map((m, idx) => {
                            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(m.title + ' phim netflix')}`;
                            return `
                                <div class="sp-artist-row-item" data-url="${searchUrl}" title="Xem thông tin phim: ${m.title}">
                                    <span class="sp-artist-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <div class="sp-side-artist-info">
                                        <div class="sp-side-artist-name">${m.title}</div>
                                        <div class="sp-side-artist-stats">${m.category || 'Mới ra mắt'} • Tuần ${m.weeksInTop10}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>

        ${isOverview ? `
            <!-- 2. KỶ LỤC SPOTIFY FRAME - 4 THẺ ĐỐI XỨNG (.sp-records-container) -->
            <div class="sp-records-container">
                <div class="sp-records-main-head">
                    <div class="sp-records-title-group" style="display: flex; align-items: center; gap: 12px;">
                        <h3 class="sp-records-main-title">Nổi Bật Xu Hướng Netflix</h3>
                    </div>
                </div>

                <div class="sp-records-2col-grid">
                    <!-- Card 1: Top Phim Điện Ảnh -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Top Phim Điện Ảnh Nổi Bật</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topFilms.map((item, idx) => renderRecordItem(item, idx)).join('')}
                        </div>
                    </div>

                    <!-- Card 2: Top Phim Truyền Hình & Series -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Top Series & Phim Truyền Hình</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.topTv.map((item, idx) => renderRecordItem(item, idx)).join('')}
                        </div>
                    </div>

                    <!-- Card 3: Trụ Hạng Bền Bỉ Nhất -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Trụ Hạng Top 10 Bền Bỉ Nhất</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.longestInTop10.map((item, idx) => renderRecordItem(item, idx)).join('')}
                        </div>
                    </div>

                    <!-- Card 4: Tác Phẩm Mới Ra Mắt -->
                    <div class="sp-record-card">
                        <div class="sp-record-card-head">
                            <h4 class="sp-record-card-title">Tác Phẩm Mới Gia Nhập Top 10</h4>
                        </div>
                        <div class="sp-record-list">
                            ${records.newArrivals.map((item, idx) => renderRecordItem(item, idx)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}

export function bindNetflixContentEvents(container, onPlayMedia, handleCategorySelect) {
    if (!container) return;

    // Click mở thông tin chi tiết phim
    container.querySelectorAll('.sp-pop-item, .sp-rec-item, .sp-artist-row-item').forEach(el => {
        el.addEventListener('click', () => {
            const url = el.getAttribute('data-url');
            if (url && url !== '#') {
                window.open(url, '_blank');
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

export function renderNetflixContentSkeleton(isOverview = true) {
    return `
        <div class="sp-main-two-col ${isOverview ? 'sp-is-overview' : 'sp-is-category'} skeleton-layout" aria-busy="true">
            <div class="sp-popular-section">
                <div class="sp-popular-head" style="margin-bottom: 16px;">
                    <div class="skeleton-shimmer" style="width: 320px; height: 20px; border-radius: 4px;"></div>
                </div>
                <div class="sp-popular-list">
                    ${Array.from({ length: isOverview ? 10 : 8 }).map(() => `
                        <div class="sp-pop-item" style="pointer-events: none; border-bottom: 1px solid var(--border-subtle); padding: 12px 10px;">
                            <span class="skeleton-shimmer" style="width: 20px; height: 16px; border-radius: 3px; flex-shrink: 0;"></span>
                            <div class="skeleton-shimmer" style="width: 74px; height: 42px; border-radius: 6px; flex-shrink: 0;"></div>
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

export function renderNetflixSkeleton(container, isOverview = true) {
    container.innerHTML = `
        <div class="sp-dashboard-layout nf-platform-view skeleton-layout" aria-busy="true">
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
                </div>
            </nav>

            <!-- 3. Main Content Skeleton -->
            <div class="sp-main-content">
                ${renderNetflixContentSkeleton(isOverview)}
            </div>
        </div>
    `;
}

export function updateNetflixContent(container, items, onPlayMedia, state) {
    const mainContent = container.querySelector('.sp-main-content');
    if (!mainContent) return;

    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';

    mainContent.innerHTML = buildNetflixContentHtml(items, isOverview, currentCategory, state);
    bindNetflixContentEvents(mainContent, onPlayMedia, state.handleCategorySelect);
}

export function renderNetflix(container, items, onPlayMedia, state = {}, handleCategorySelect) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3 class="empty-state-title">Chưa có dữ liệu hiển thị</h3>
                <p class="empty-state-desc">Hệ thống đang tải dữ liệu xu hướng Netflix mới nhất.</p>
            </div>
        `;
        return;
    }

    state.handleCategorySelect = handleCategorySelect;
    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';
    const categories = NETFLIX_CATEGORIES;
    const updatedTimeStr = formatUpdateTime(state.data?.platforms_updated?.netflix || state.data?.last_updated);

    container.innerHTML = `
        <div class="sp-dashboard-layout nf-platform-view view-fade-in">
            <!-- 1. TIÊU ĐỀ BANNER Ở TRÊN CÙNG (100% chuẩn Spotify) -->
            <div class="sp-header-banner">
                <div class="sp-brand-lead">
                    <div class="platform-title-row">
                        <h2 class="sp-heading">Bảng Xếp Hạng Xu Hướng Netflix • Việt Nam</h2>
                        <div class="platform-time-badge" title="Thời gian thu thập bảng xếp hạng Netflix">
                            <svg class="badge-clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>Cập nhật: <strong>${updatedTimeStr || '<span class="header-time-skeleton skeleton-shimmer"></span>'}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. BỘ LỌC CÁC MỤC TAB (NGAY DƯỚI TIÊU ĐỀ - 100% chuẩn Spotify) -->
            <nav class="chart-navigation" aria-label="Bộ lọc chuyên mục Netflix">
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
                ${buildNetflixContentHtml(items, isOverview, currentCategory, state)}
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

    bindNetflixContentEvents(container, onPlayMedia, handleCategorySelect);
}
