/**
 * View: Overview (Tổng Quan Đa Nền Tảng)
 * Bố cục Grand Multi-Platform Showcase:
 * 1. Tâm Điểm Xu Hướng (Hero Champion Banner + 3 Spotlight Cards)
 * 2. 4 Bảng Xếp Hạng Trọng Tâm (Bố cục 2 Cột x 2 Hàng Rộng Rãi, Top 8 mỗi nền tảng)
 * 3. Dòng Chảy Xu Hướng Nổi Bật (Lưới thẻ Media đa kênh khám phá thêm)
 */

const ICONS = {
    youtube: `<svg viewBox="0 0 24 24" fill="#ff0033" width="16" height="16"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    spotify: `<svg viewBox="0 0 24 24" fill="#1db954" width="16" height="16"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.307a.748.748 0 0 1-1.029.248c-2.817-1.722-6.363-2.112-10.54-1.157a.75.75 0 1 1-.334-1.462c4.568-1.044 8.497-.6 11.655 1.342.36.22.47.69.248 1.029zm1.47-3.266a.936.936 0 0 1-1.288.308c-3.225-1.982-8.14-2.557-11.954-1.398a.937.937 0 1 1-.546-1.792c4.358-1.323 9.774-.683 13.48 1.594a.937.937 0 0 1 .308 1.288zm.126-3.41c-3.868-2.296-10.25-2.508-13.94-1.388a1.124 1.124 0 1 1-.652-2.152c4.24-1.287 11.29-1.041 15.742 1.602a1.124 1.124 0 1 1-1.15 1.938z"/></svg>`,
    google: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
    netflix: `<svg viewBox="5.398 0 13.204 24" width="12" height="16"><path fill="#E50914" d="M5.398 0v24c1.873-.225 2.81-.312 4.715-.398V0H5.398z"/><path fill="#E50914" d="M13.887 0v24c1.873.086 2.842.173 4.715.398V0h-4.715z"/><path fill="#B81D24" d="M5.398 0l8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398z"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    arrowRight: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    trendGraph: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`
};

export function renderOverview(container, items, onPlayMedia, state = {}) {
    const allRankings = state.data?.rankings || {};
    const query = (state.searchQuery || '').trim().toLowerCase();

    const filterList = (list) => {
        if (!Array.isArray(list)) return [];
        if (!query) return list;
        return list.filter(i => 
            (i.title && i.title.toLowerCase().includes(query)) ||
            (i.creator && i.creator.toLowerCase().includes(query))
        );
    };

    const ytItems = filterList(allRankings.youtube || items.filter(i => i.platform === 'youtube'));
    const spItems = filterList(allRankings.spotify || items.filter(i => i.platform === 'spotify'));
    const ggItems = filterList(allRankings.google || items.filter(i => i.platform === 'google'));
    const nfItems = filterList(allRankings.netflix || items.filter(i => i.platform === 'netflix'));

    if (ytItems.length === 0 && spItems.length === 0 && ggItems.length === 0 && nfItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3 class="empty-state-title">Chưa có dữ liệu hiển thị</h3>
                <p class="empty-state-desc">Hệ thống đang đồng bộ dữ liệu xu hướng mới nhất.</p>
            </div>
        `;
        return;
    }

    // Champions
    const ytChamp = ytItems[0];
    const spChamp = spItems[0];
    const ggChamp = ggItems[0];
    const nfChamp = nfItems[0];

    // Grand Hero Item: ưu tiên YouTube Top 1 hoặc Spotify Top 1
    const grandHero = ytChamp || spChamp || items[0];

    // Tạo danh sách 16 thẻ Media Feed (trích từ hạng 3 - 10 của các nền tảng để tạo dòng chảy đa dạng)
    const feedItems = [];
    const maxLen = Math.max(ytItems.length, spItems.length, ggItems.length, nfItems.length);
    for (let i = 2; i < maxLen && feedItems.length < 16; i++) {
        if (ytItems[i] && feedItems.length < 16) feedItems.push(ytItems[i]);
        if (spItems[i] && feedItems.length < 16) feedItems.push(spItems[i]);
        if (nfItems[i] && feedItems.length < 16) feedItems.push(nfItems[i]);
        if (ggItems[i] && feedItems.length < 16) feedItems.push(ggItems[i]);
    }

    container.innerHTML = `
        <div class="ov-hub-layout">
            <!-- Header -->
            <div class="ov-header">
                <div class="ov-header-left">
                    <h2 class="ov-title">Bảng Xu Hướng Tổng Hợp Việt Nam</h2>
                    <p class="ov-subtitle">Theo dõi xu hướng nổi trội, cập nhật và phân tích dữ liệu thịnh hành tại Việt Nam</p>
                </div>
            </div>

            <!-- PHẦN 1: TÂM ĐIỂM XU HƯỚNG (Hero Banner + 3 Spotlight Cards) -->
            <div class="ov-spotlight-section">
                <!-- Left: Hero Champion Banner -->
                ${grandHero ? `
                    <div class="ov-hero-banner" data-id="${grandHero.id}" data-url="${grandHero.url || ''}">
                        <div class="ov-hero-bg">
                            <img src="${grandHero.thumbnail || ''}" alt="${grandHero.title}" class="ov-hero-img">
                            <div class="ov-hero-mask"></div>
                        </div>
                        <div class="ov-hero-content">
                            <div class="ov-hero-tags">
                                <span class="ov-badge-hero">
                                    ${ICONS[grandHero.platform] || ''}
                                    <span>Top 1 Thịnh hành</span>
                                </span>
                            </div>
                            <h3 class="ov-hero-title">${grandHero.title}</h3>
                            <p class="ov-hero-author">${grandHero.creator || ''}</p>
                            <div class="ov-hero-bottom">
                                <span class="ov-hero-stat">${grandHero.primaryMetric || ''}</span>
                                <button class="ov-hero-btn" data-url="${grandHero.url || ''}">
                                    ${ICONS.play}
                                    <span>Khám phá</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Right: 3 Spotlight Cards -->
                <div class="ov-spotlight-stack">
                    <!-- Spotlight Spotify -->
                    ${spChamp ? `
                        <div class="ov-spotlight-card ov-card-sp" data-id="${spChamp.id}" data-url="${spChamp.url}">
                            <div class="ov-spot-thumb-box sp-thumb-box">
                                <img src="${spChamp.thumbnail}" alt="${spChamp.title}">
                            </div>
                            <div class="ov-spot-info">
                                <div class="ov-spot-label">${ICONS.spotify}<span>Spotify • Top 1 Âm nhạc</span></div>
                                <h4 class="ov-spot-title" title="${spChamp.title}">${spChamp.title}</h4>
                                <p class="ov-spot-sub">${spChamp.creator || ''} • <span>${spChamp.primaryMetric || ''}</span></p>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Spotlight Google Trends -->
                    ${ggChamp ? `
                        <div class="ov-spotlight-card ov-card-gg" data-id="${ggChamp.id}" data-url="${ggChamp.url}">
                            <div class="ov-spot-thumb-box gg-thumb-box">
                                ${ICONS.google}
                            </div>
                            <div class="ov-spot-info">
                                <div class="ov-spot-label">${ICONS.google}<span>Google • Top 1 Tìm kiếm</span></div>
                                <h4 class="ov-spot-title" title="${ggChamp.title}">${ggChamp.title}</h4>
                                <p class="ov-spot-sub">${ggChamp.category || 'Tìm kiếm nóng'} • <span>${ggChamp.primaryMetric || 'Bùng nổ'}</span></p>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Spotlight Netflix -->
                    ${nfChamp ? `
                        <div class="ov-spotlight-card ov-card-nf" data-id="${nfChamp.id}" data-url="${nfChamp.url}">
                            <div class="ov-spot-thumb-box nf-thumb-box">
                                <img src="${nfChamp.thumbnail}" alt="${nfChamp.title}">
                            </div>
                            <div class="ov-spot-info">
                                <div class="ov-spot-label">${ICONS.netflix}<span>Netflix • Top 1 Phim</span></div>
                                <h4 class="ov-spot-title" title="${nfChamp.title}">${nfChamp.title}</h4>
                                <p class="ov-spot-sub">${nfChamp.category || 'Phim thịnh hành'} • <span>${nfChamp.primaryMetric || 'Top 1 VN'}</span></p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- PHẦN 2: 4 BẢNG XẾP HẠNG TRỌNG TÂM (2 CỘT RỘNG RÃI x 2 HÀNG) -->
            <div class="ov-section">
                <div class="ov-section-header">
                    <div class="ov-sec-title-wrap">
                        <h3 class="ov-section-heading">Bảng Xếp Hạng Trọng Tâm</h3>
                        <span class="ov-section-sub">Top 8 nội dung dẫn đầu xu hướng trên từng nền tảng giải trí</span>
                    </div>
                </div>
                
                <!-- Hàng 1: YouTube & Spotify -->
                <div class="ov-two-by-two-grid">
                    <!-- Bảng 1: YouTube -->
                    <div class="ov-panel-card ov-panel-yt">
                        <div class="ov-panel-head">
                            <span class="ov-panel-title">${ICONS.youtube} YouTube Trending</span>
                            <span class="ov-panel-count">Top 8 Video</span>
                        </div>
                        <div class="ov-panel-list">
                            ${ytItems.slice(0, 8).map((item, idx) => `
                                <div class="ov-panel-row" data-id="${item.id}" data-url="${item.url || ''}">
                                    <span class="ov-row-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <div class="ov-row-thumb yt-thumb-169">
                                        <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                                    </div>
                                    <div class="ov-row-info">
                                        <div class="ov-row-title" title="${item.title}">${item.title}</div>
                                        <div class="ov-row-sub">
                                            <span>${item.creator || ''}</span>
                                            <span class="ov-sub-dot">•</span>
                                            <span class="ov-sub-metric">${item.primaryMetric || ''}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="ov-panel-foot">
                            <button class="ov-btn-view-all" data-goto="youtube">
                                <span>Xem toàn bộ 50 video YouTube</span>
                                ${ICONS.arrowRight}
                            </button>
                        </div>
                    </div>

                    <!-- Bảng 2: Spotify -->
                    <div class="ov-panel-card ov-panel-sp">
                        <div class="ov-panel-head">
                            <span class="ov-panel-title">${ICONS.spotify} Spotify Top 50</span>
                            <span class="ov-panel-count">Top 8 Ca Khúc</span>
                        </div>
                        <div class="ov-panel-list">
                            ${spItems.slice(0, 8).map((item, idx) => `
                                <div class="ov-panel-row" data-id="${item.id}" data-url="${item.url || ''}" data-preview="${item.previewUrl || ''}">
                                    <span class="ov-row-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <div class="ov-row-thumb sp-thumb-square">
                                        <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                                    </div>
                                    <div class="ov-row-info">
                                        <div class="ov-row-title" title="${item.title}">${item.title}</div>
                                        <div class="ov-row-sub">
                                            <span>${item.creator || ''}</span>
                                            <span class="ov-sub-dot">•</span>
                                            <span class="ov-sub-metric">${item.primaryMetric || ''}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="ov-panel-foot">
                            <button class="ov-btn-view-all" data-goto="spotify">
                                <span>Xem toàn bộ 50 bài hát Spotify</span>
                                ${ICONS.arrowRight}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Hàng 2: Google Trends & Netflix -->
                <div class="ov-two-by-two-grid" style="margin-top: 20px;">
                    <!-- Bảng 3: Google Trends -->
                    <div class="ov-panel-card ov-panel-gg">
                        <div class="ov-panel-head">
                            <span class="ov-panel-title">${ICONS.google} Google Trends</span>
                            <span class="ov-panel-count">Top 8 Từ Khóa</span>
                        </div>
                        <div class="ov-panel-list">
                            ${ggItems.slice(0, 8).map((item, idx) => `
                                <div class="ov-panel-row" data-id="${item.id}" data-url="${item.url || ''}">
                                    <span class="ov-row-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <div class="ov-row-thumb gg-thumb-square">
                                        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">` : ''}
                                        <div class="gg-fallback-icon" style="${item.thumbnail ? 'display:none;' : 'display:flex;'} width:100%; height:100%; align-items:center; justify-content:center;">
                                            ${ICONS.google}
                                        </div>
                                    </div>
                                    <div class="ov-row-info">
                                        <div class="ov-row-title" title="${item.title}">${item.title}</div>
                                        <div class="ov-row-sub">
                                            <span>${item.category || 'Tìm kiếm nóng'}</span>
                                            <span class="ov-sub-dot">•</span>
                                            <span class="ov-sub-metric ov-stat-up">${item.primaryMetric || ''}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="ov-panel-foot">
                            <button class="ov-btn-view-all" data-goto="google">
                                <span>Khám phá Google Trends</span>
                                ${ICONS.arrowRight}
                            </button>
                        </div>
                    </div>

                    <!-- Bảng 4: Netflix Tudum -->
                    <div class="ov-panel-card ov-panel-nf">
                        <div class="ov-panel-head">
                            <span class="ov-panel-title">${ICONS.netflix} Netflix Tudum Top 10</span>
                            <span class="ov-panel-count">Top 8 Phim</span>
                        </div>
                        <div class="ov-panel-list">
                            ${nfItems.slice(0, 8).map((item, idx) => `
                                <div class="ov-panel-row" data-id="${item.id}" data-url="${item.url || ''}">
                                    <span class="ov-row-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <div class="ov-row-thumb nf-thumb-rect">
                                        <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                                    </div>
                                    <div class="ov-row-info">
                                        <div class="ov-row-title" title="${item.title}">${item.title}</div>
                                        <div class="ov-row-sub">
                                            <span>${item.category || 'Phim thịnh hành'}</span>
                                            <span class="ov-sub-dot">•</span>
                                            <span class="ov-sub-metric">${item.primaryMetric || 'Top 10'}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="ov-panel-foot">
                            <button class="ov-btn-view-all" data-goto="netflix">
                                <span>Xem toàn bộ Netflix Tudum</span>
                                ${ICONS.arrowRight}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PHẦN 3: DÒNG CHẢY XU HƯỚNG MỚI NHẤT (Lưới Thẻ Media Đa Kênh) -->
            ${feedItems.length > 0 ? `
                <div class="ov-section" style="margin-top: 10px;">
                    <div class="ov-section-header">
                        <div class="ov-sec-title-wrap">
                            <h3 class="ov-section-heading">Làn Sóng Xu Hướng Đang Lên</h3>
                            <span class="ov-section-sub">Tuyển chọn các video, ca khúc và phim ảnh đang thăng hạng nhanh nhất</span>
                        </div>
                    </div>
                    <div class="ov-feed-grid">
                        ${feedItems.map((item, idx) => {
                            const platformIcon = ICONS[item.platform] || '';
                            const isSquare = item.platform === 'spotify';
                            const platformNames = { youtube: 'YouTube', spotify: 'Spotify', google: 'Google', netflix: 'Netflix' };
                            return `
                                <div class="ov-feed-card ov-feed-${item.platform}" data-id="${item.id}" data-url="${item.url || ''}" data-preview="${item.previewUrl || ''}">
                                    <div class="ov-feed-thumb-box ${isSquare ? 'thumb-square' : ''}">
                                        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy">` : `<div class="ov-feed-thumb-placeholder">${platformIcon}</div>`}
                                        <span class="ov-feed-plat-tag ${item.platform}">${platformIcon} <span>${platformNames[item.platform] || item.platform}</span></span>
                                    </div>
                                    <div class="ov-feed-body">
                                        <h4 class="ov-feed-title" title="${item.title}">${item.title}</h4>
                                        <p class="ov-feed-author">${item.creator || item.category || ''}</p>
                                        <div class="ov-feed-stat">${item.primaryMetric || ''}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // 1. Chuyển tab nhanh qua nút "Xem trọn bộ [Platform]"
    container.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetPlatform = btn.getAttribute('data-goto');
            const chip = document.querySelector(`.platform-chip[data-platform="${targetPlatform}"]`);
            if (chip) {
                chip.click();
            }
        });
    });

    // 2. Click vào bất kỳ thẻ / hàng nào để mở link hoặc play
    container.querySelectorAll('[data-url]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('[data-goto]')) return;

            const url = el.getAttribute('data-url');
            const id = el.getAttribute('data-id');
            const preview = el.getAttribute('data-preview');

            if (preview && typeof onPlayMedia === 'function') {
                const foundItem = spItems.find(i => i.id === id);
                if (foundItem) {
                    onPlayMedia(foundItem);
                    return;
                }
            }

            if (url && url !== '#') {
                window.open(url, '_blank');
            }
        });
    });
}
