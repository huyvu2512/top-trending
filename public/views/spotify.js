/**
 * View: Spotify
 * Bảng Xếp Hạng & Phân Tích Xu Hướng Spotify • Việt Nam
 * Thiết kế chuẩn UI cao cấp Spotify Web Dark Mode (#121212, xanh Spotify #1ed760):
 * - Banner tiêu đề ở trên cùng: "Bảng Xếp Hạng Xu Hướng Spotify • Việt Nam"
 * - Bộ lọc danh mục Tabs ("Tổng hợp", "Charts", "Songs", "Artists", "Playlists", "Radio Stations") ở NGAY DƯỚI tiêu đề
 * - Main 2 Cột: Cột trái (Thịnh Hành Nhất) + Cột phải (Nghệ Sĩ Phổ Biến, Nghệ Sĩ Đang Lên, Từ Khóa Phổ Biến)
 * - Tích hợp Audio Preview 30s nghe thử nhạc trực tiếp
 * - Kỷ Lục Spotify: 6 thẻ kỷ lục đối xứng ở trang Tổng hợp
 */

let _lastSpotifyItems = null;
let _cachedSpotifyRecords = null;
let _currentAudio = null;
let _currentPlayingId = null;

// 6 Chuyên mục Spotify chuẩn (1 Tổng hợp + 5 danh mục tiếng Việt chuẩn)
export const SPOTIFY_CATEGORIES = [
    { id: 'all', name: 'Tổng hợp' },
    { id: 'charts', name: 'Bảng xếp hạng' },
    { id: 'songs', name: 'Bài hát thịnh hành' },
    { id: 'artists', name: 'Nghệ sĩ nổi bật' },
    { id: 'playlists', name: 'Danh sách phát' },
    { id: 'radio', name: 'Trạm phát sóng' }
];

export function buildSpotifyContentHtml(items, isOverview, currentCategory, state = {}) {
    const categories = SPOTIFY_CATEGORIES;

    const categoryTitles = {
        'all': 'Thịnh Hành Nhất Trên Spotify Tại Việt Nam',
        'charts': 'Top 50 - Vietnam • Bảng Xếp Hạng Spotify Hàng Ngày',
        'songs': 'Nhạc Thịnh Hành 2026 • Tuyển Tập Ca Khúc Hot Nhất',
        'artists': 'V-Pop Không Thể Thiếu • Ca Khúc Của Các Nghệ Sĩ Đỉnh Nhất',
        'playlists': 'Hot Hits Vietnam • Playlist Thịnh Hành Số 1 Spotify VN',
        'radio': 'Thiên Hạ Nghe Gì • Trạm Phát Xu Hướng Giới Trẻ'
    };

    // Helper: Định dạng số rút gọn
    const formatCompact = (num) => {
        if (!num || isNaN(num)) return '0';
        if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
        return num.toLocaleString();
    };

    // Pre-load artist avatars cache
    if (typeof window !== 'undefined' && !window._spotifyArtistsCache) {
        fetch('/data/spotify_artists.json')
            .then(res => res.json())
            .then(data => { window._spotifyArtistsCache = data; })
            .catch(() => { });
    }

    // Helper: Avatar nghệ sĩ
    const getArtistAvatar = (name) => {
        if (typeof window !== 'undefined' && window._spotifyArtistsCache && window._spotifyArtistsCache[name]?.avatar) {
            return window._spotifyArtistsCache[name].avatar;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Artist')}&background=1db954&color=fff&size=128&bold=true`;
    };

    // Dữ liệu toàn hệ thống
    const fullItems = state.data?.rankings?.spotify || items || [];

    // Helper: Trích xuất danh sách từ khóa có nghĩa từ tiêu đề bài hát (loại bỏ stop words)
    const extractKeywordsList = (list, limit = 18) => {
        if (!list || list.length === 0) return [];
        const stopWords = new Set([
            'feat', 'ft', 'official', 'audio', 'remix', 'version', 'ver', 'video', 'mv', 'prod',
            'intro', 'outro', 'acoustic', 'live', 'lyrics', 'lyric', 'bản', 'các', 'cho', 'với',
            'trong', 'của', 'là', 'và', 'tại', 'những', 'một', 'được', 'này', 'đến', 'lại', 'rồi',
            'theo', 'khi', 'như', 'vào', 'hay', 'ngày', 'mỗi', 'cùng', 'nhiều', 'trên', 'qua',
            'thì', 'sẽ', 'bị', 'về', 'ra', 'ở', 'tôi', 'bạn', 'có', 'đã', 'làm', 'mà', 'gì',
            'ai', 'nào', 'đây', 'đó', 'chỉ', 'lên', 'xuống', 'thế', 'rất', 'quá', 'đang', 'từ',
            'không', 'em', 'anh', 'yêu', 'người', 'nhớ'
        ]);

        const phraseDocFreq = {};
        const singleDocFreq = {};

        list.forEach(item => {
            const title = item.title || '';
            const segments = title.split(/[|\-–—\[\]():,!?#"'/\\+&•]/);
            const itemPhrases = new Set();
            const itemSingles = new Set();

            segments.forEach(seg => {
                const words = seg.trim().toLowerCase()
                    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                    .split(/\s+/)
                    .filter(w => w.length > 0);

                const len = words.length;
                if (len === 0) return;

                // N-grams (2 đến 4 từ)
                for (let n = Math.min(4, len); n >= 2; n--) {
                    for (let i = 0; i <= len - n; i++) {
                        const slice = words.slice(i, i + n);
                        if (stopWords.has(slice[0]) || stopWords.has(slice[slice.length - 1])) continue;
                        if (slice.some(w => /^\d+$/.test(w) || w.length < 2)) continue;
                        itemPhrases.add(slice.join(' '));
                    }
                }

                // Từ đơn có nghĩa
                words.forEach(w => {
                    if (w.length >= 3 && !stopWords.has(w) && !/^\d+$/.test(w)) {
                        itemSingles.add(w);
                    }
                });
            });

            itemPhrases.forEach(p => phraseDocFreq[p] = (phraseDocFreq[p] || 0) + 1);
            itemSingles.forEach(s => singleDocFreq[s] = (singleDocFreq[s] || 0) + 1);
        });

        const candidatePhrases = Object.entries(phraseDocFreq)
            .map(([text, count]) => ({ text, count, words: text.split(' ') }))
            .sort((a, b) => b.count !== a.count ? b.count - a.count : b.words.length - a.words.length);

        const selectedPhrases = [];
        for (const cand of candidatePhrases) {
            const isRedundant = selectedPhrases.some(sel => {
                if (sel.text.includes(cand.text) || cand.text.includes(sel.text)) return true;
                const shared = cand.words.filter(w => sel.words.includes(w));
                return shared.length >= 2;
            });
            if (!isRedundant) {
                selectedPhrases.push(cand);
            }
        }

        const skipSingles = new Set(['nhạc', 'bài', 'hát', 'hay', 'mới', 'hot', 'vietnam', 'nhất']);
        const selectedSingles = [];
        const candidateSingles = Object.entries(singleDocFreq).sort((a, b) => b[1] - a[1]);

        for (const [w, count] of candidateSingles) {
            if (skipSingles.has(w)) continue;
            const covered = selectedPhrases.some(p => p.words.includes(w));
            if (!covered) {
                selectedSingles.push({ text: w, count, words: [w] });
            }
        }

        const prominentPhrases = selectedPhrases.filter(p => p.count >= 2);
        const resultPhrases = prominentPhrases.length >= 6 ? prominentPhrases : selectedPhrases;

        return [...resultPhrases, ...selectedSingles]
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    };

    // Helper: Render các thẻ tag từ khóa (kích thước theo tần suất, xáo trộn vị trí ngẫu nhiên)
    const renderKeywordTags = (keywordsList) => {
        if (!keywordsList || keywordsList.length === 0) return '<div class="yt-kw-empty">Đang cập nhật...</div>';
        const maxCount = keywordsList[0].count;
        const lowestCount = keywordsList[keywordsList.length - 1].count;
        const total = keywordsList.length;

        const styledTags = keywordsList.map(({ text, count }, index) => {
            const countProgress = maxCount === lowestCount ? 0.5 : (count - lowestCount) / Math.max(1, maxCount - lowestCount);
            const rankProgress = 1 - (index / Math.max(1, total - 1));
            const progress = (countProgress * 0.65 + rankProgress * 0.35);

            const size = (12 + progress * 10).toFixed(1);
            const weight = progress >= 0.7 ? 800 : (progress >= 0.4 ? 700 : (progress >= 0.2 ? 600 : 500));
            const opacity = (0.62 + progress * 0.38).toFixed(2);

            return { text, count, size, weight, opacity };
        });

        // Xáo trộn vị trí ngẫu nhiên
        const shuffled = [...styledTags];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.map(({ text, count, size, weight, opacity }) => {
            return `<span class="sp-kw-tag" style="font-size: ${size}px; font-weight: ${weight}; opacity: ${opacity};" title="Xuất hiện trong ${count} bài hát thịnh hành">${text}</span>`;
        }).join(' ');
    };

    // Tính toán thống kê Nghệ sĩ
    const computeArtistStats = (trackList) => {
        const artistMap = {};
        trackList.forEach(t => {
            const raw = t.mainArtist || t.creator || 'Nghệ sĩ Spotify';
            const main = raw.split(/[,&•]/)[0].trim();
            if (!artistMap[main]) {
                const avatar = t.artistAvatar || t.thumbnail || getArtistAvatar(main);
                artistMap[main] = {
                    name: main,
                    avatar: avatar,
                    trackCount: 0,
                    totalStreams: 0,
                    url: `https://open.spotify.com/search/${encodeURIComponent(main)}`
                };
            }
            artistMap[main].trackCount += 1;
            artistMap[main].totalStreams += (t.rawStreams || 0);
        });

        const sorted = Object.values(artistMap).sort((a, b) => {
            if (b.trackCount !== a.trackCount) return b.trackCount - a.trackCount;
            return b.totalStreams - a.totalStreams;
        });

        const popular = sorted.slice(0, 10);
        const rising = [...sorted]
            .sort((a, b) => b.totalStreams - a.totalStreams)
            .slice(0, 10);

        return { popular, rising };
    };

    let popularArtists = [];
    let risingArtists = [];
    let keywordsHtml = '';

    if (isOverview) {
        // TRANG TỔNG QUÁT: Lấy 15 bài đầu tiên của Charts
        const overviewKeywords = extractKeywordsList(fullItems, 18);
        keywordsHtml = `<div class="sp-keywords-cloud">${renderKeywordTags(overviewKeywords)}</div>`;

        const stats = computeArtistStats(fullItems);
        popularArtists = stats.popular;
        risingArtists = stats.rising;
    } else {
        // CHUYÊN MỤC RIÊNG
        const catTracks = items || [];
        const catKeywords = extractKeywordsList(catTracks, 16);
        keywordsHtml = `<div class="sp-keywords-cloud">${renderKeywordTags(catKeywords)}</div>`;

        const stats = computeArtistStats(catTracks);
        popularArtists = stats.popular;
        risingArtists = stats.rising;
    }

    // Helper lọc trùng bài hát theo Tên bài + Nghệ sĩ
    const dedupeTracks = (list) => {
        if (!list || !Array.isArray(list)) return [];
        const seen = new Set();
        return list.filter(t => {
            const cleanTitle = (t.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const cleanArtist = (t.mainArtist || t.creator || '').split(/[,&•]/)[0].toLowerCase().trim();
            const key = cleanTitle + '::' + cleanArtist;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    // Tính toán Kỷ Lục Spotify từ fullItems (đã lọc trùng lặp)
    if (_lastSpotifyItems !== fullItems && fullItems.length > 0) {
        const uniqueFull = dedupeTracks(fullItems);
        const byCat = (catId) => dedupeTracks(fullItems.filter(t => t.categoryId === catId));
        const chartsList = byCat('charts');
        const vpopList = byCat('artists');
        const hitsList = byCat('playlists');
        const radioList = byCat('radio');

        _cachedSpotifyRecords = {
            topCharts: chartsList.length >= 3 ? chartsList.slice(0, 5) : uniqueFull.slice(0, 5),
            topVpop: vpopList.length >= 3 ? vpopList.slice(0, 5) : uniqueFull.slice(5, 10),
            longestTracks: [...uniqueFull].sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0)).slice(0, 5),
            topHits: hitsList.length >= 3 ? hitsList.slice(0, 5) : uniqueFull.slice(10, 15),
            shortestTracks: [...uniqueFull].filter(t => (t.durationMs || 0) > 60000).sort((a, b) => (a.durationMs || 0) - (b.durationMs || 0)).slice(0, 5),
            viralRadio: radioList.length >= 3 ? radioList.slice(0, 5) : uniqueFull.slice(15, 20)
        };
        _lastSpotifyItems = fullItems;
    }

    const records = _cachedSpotifyRecords || {
        topCharts: [], topVpop: [], longestTracks: [],
        topHits: [], shortestTracks: [], viralRadio: []
    };

    // Danh sách hiển thị chính (Tổng hợp: 20 bài, Chuyên mục: 50 bài, đã lọc trùng)
    const displayItems = isOverview ? dedupeTracks(fullItems).slice(0, 20) : dedupeTracks(items);

    // Helper render 1 hàng bài hát trong Kỷ Lục Spotify
    const renderRecordItem = (item, idx, type) => {
        const rank = idx + 1;
        let metricBadge = '';
        if (type === 'duration') {
            metricBadge = `<span class="sp-rec-val accent-blue">${item.duration || ''}</span>`;
        } else {
            metricBadge = `<span class="sp-rec-val accent-purple">${item.category || ''}</span>`;
        }

        return `
            <div class="sp-rec-item" data-url="${item.url}" data-preview="${item.previewUrl || ''}" data-id="${item.id}" title="${item.title} — ${item.creator}">
                <span class="sp-rec-rank ${rank <= 3 ? 'rank-' + rank + ' top-' + rank : ''}">${rank}</span>
                <div class="sp-rec-thumb-box">
                    <img src="${item.thumbnail}" alt="${item.title}" class="sp-rec-thumb" loading="lazy">
                    ${item.previewUrl ? `
                        <button class="sp-rec-play-btn" data-preview-btn="${item.id}" title="Nghe thử 30s">
                            <svg class="sp-btn-svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="sp-rec-info">
                    <div class="sp-rec-title">${item.title}</div>
                    <div class="sp-rec-artist">${item.creator}</div>
                </div>
                <div class="sp-rec-meta">
                    ${metricBadge}
                </div>
            </div>
        `;
    };

    let mainContentHtml = '';

    if (!displayItems || displayItems.length === 0) {
        mainContentHtml = `
            <div class="empty-state">
                <h3 class="empty-state-title">Chưa có dữ liệu hiển thị</h3>
                <p class="empty-state-desc">Hệ thống đang cập nhật dữ liệu xu hướng Spotify mới nhất.</p>
            </div>
        `;
    } else {
        mainContentHtml = `
            <!-- 1. BẢNG XẾP HẠNG CHÍNH (2 CỘT) -->
            <div class="sp-main-two-col ${isOverview ? 'sp-is-overview' : 'sp-is-category'}">
                <!-- Cột trái: Danh sách bài hát thịnh hành -->
                <div class="sp-popular-section">
                    <div class="sp-popular-head">
                        <h3 class="sp-popular-title">${categoryTitles[currentCategory] || 'Bảng Xếp Hạng Spotify'}</h3>
                    </div>

                    <div class="sp-popular-list">
                        ${displayItems.map((item, idx) => {
            const rank = item.rank || (idx + 1);
            const isTop3 = rank <= 3;
            const catMap = {
                'charts': 'Top 50 VN',
                'songs': 'Thịnh hành',
                'artists': 'V-Pop Hàng đầu',
                'playlists': 'Hot Hits VN',
                'radio': 'Viral Giới trẻ'
            };
            const catName = catMap[item.categoryId] || item.playlistName || item.category || 'Spotify';
            return `
                                <div class="sp-pop-item ${isTop3 ? 'is-top-rank' : ''}" data-url="${item.url}" data-preview="${item.previewUrl || ''}" data-id="${item.id}">
                                    <!-- Số thứ hạng (chỉ giữ số thuần túy) -->
                                    <div class="sp-pop-rank-col">
                                        <span class="sp-rank-num ${isTop3 ? 'rank-' + rank : ''}">${rank}</span>
                                    </div>

                                    <!-- Ảnh bìa Album có nút Play nghe thử -->
                                    <div class="sp-pop-thumb-box">
                                        <img src="${item.thumbnail}" alt="${item.title}" class="sp-pop-thumb" loading="lazy">
                                        ${item.previewUrl ? `
                                            <button class="sp-preview-play-btn" data-player-btn="${item.id}" title="Nghe thử đoạn 30s">
                                                <svg class="sp-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                            </button>
                                        ` : ''}
                                    </div>

                                    <!-- Thông tin bài hát & Nghệ sĩ -->
                                    <div class="sp-pop-details">
                                        <div class="sp-pop-title" title="${item.title}">${item.title}</div>
                                        <div class="sp-pop-artist-row">
                                            <span class="sp-artist-label">${item.creator}</span>
                                            <span class="sp-pop-bullet">•</span>
                                            <span class="sp-category-pill">${catName}</span>
                                        </div>
                                    </div>

                                    <!-- Thanh thời gian nghe thử một đoạn -->
                                    <div class="sp-audio-player-col" data-track-id="${item.id}">
                                        ${item.previewUrl ? `
                                            <button class="sp-inline-play-btn" data-player-btn="${item.id}" title="Bấm để nghe thử đoạn 30s">
                                                <svg class="sp-player-play-svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                                            </button>
                                            <div class="sp-progress-container" data-progress-bar="${item.id}" title="Bấm hoặc kéo trên thanh để tua nghe">
                                                <div class="sp-progress-track">
                                                    <div class="sp-progress-fill" style="width: 0%;"></div>
                                                    <div class="sp-progress-thumb" style="left: 0%;"></div>
                                                </div>
                                            </div>
                                            <span class="sp-time-display" data-time-display="${item.id}">0:30</span>
                                        ` : `
                                            <span class="sp-duration-fallback">${item.duration || ''}</span>
                                        `}
                                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="sp-open-link-btn" title="Mở trọn vẹn trên Spotify">
                                            <svg class="sp-spotify-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.307a.748.748 0 0 1-1.029.248c-2.817-1.722-6.363-2.112-10.54-1.157a.75.75 0 1 1-.334-1.462c4.568-1.044 8.497-.6 11.655 1.342.36.22.47.69.248 1.029zm1.47-3.266a.936.936 0 0 1-1.288.308c-3.225-1.982-8.14-2.557-11.954-1.398a.937.937 0 1 1-.546-1.792c4.358-1.323 9.774-.683 13.48 1.594a.937.937 0 0 1 .308 1.288zm.126-3.41c-3.868-2.296-10.25-2.508-13.94-1.388a1.124 1.124 0 1 1-.652-2.152c4.24-1.287 11.29-1.041 15.742 1.602a1.124 1.124 0 1 1-1.15 1.938z"/></svg>
                                        </a>
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>

                <!-- Cột phải: 3 Widgets (Nghệ Sĩ Phổ Biến, Nghệ Sĩ Đang Lên, Từ Khóa Phổ Biến) -->
                <div class="sp-sidebar-stack">
                    <!-- Widget 1: Nghệ Sĩ Phổ Biến (Top 10) -->
                    <div class="sp-side-card">
                        <div class="sp-side-head">
                            <h4 class="sp-side-title">Nghệ Sĩ Phổ Biến</h4>
                        </div>
                        <div class="sp-side-list">
                            ${popularArtists.map((artist, idx) => `
                                <div class="sp-artist-row-item" data-url="${artist.url}">
                                    <span class="sp-artist-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <img src="${artist.avatar}" alt="${artist.name}" class="sp-side-artist-avatar" loading="lazy">
                                    <div class="sp-side-artist-info">
                                        <div class="sp-side-artist-name">${artist.name}</div>
                                        <div class="sp-side-artist-stats">${artist.trackCount} bài trong BXH</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Widget 2: Nghệ Sĩ Đang Lên (Top 10) -->
                    <div class="sp-side-card">
                        <div class="sp-side-head">
                            <h4 class="sp-side-title">Nghệ Sĩ Đang Lên</h4>
                        </div>
                        <div class="sp-side-list">
                            ${risingArtists.map((artist, idx) => `
                                <div class="sp-artist-row-item" data-url="${artist.url}">
                                    <span class="sp-artist-rank-num ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</span>
                                    <img src="${artist.avatar}" alt="${artist.name}" class="sp-side-artist-avatar" loading="lazy">
                                    <div class="sp-side-artist-info">
                                        <div class="sp-side-artist-name">${artist.name}</div>
                                        <div class="sp-side-artist-stats">
                                            <span class="sp-rising-growth">${artist.trackCount} ca khúc</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Widget 3: Từ Khóa Phổ Biến (Randomized Word Cloud) -->
                    <div class="sp-side-card sp-kw-card">
                        <div class="sp-side-head">
                            <h4 class="sp-side-title">Từ Khóa Phổ Biến</h4>
                        </div>
                        ${keywordsHtml}
                    </div>
                </div>
            </div>

            ${isOverview ? `
                <!-- 2. KỶ LỤC SPOTIFY (2 CỘT ĐỐI XỨNG) -->
                <div class="sp-records-container">
                    <div class="sp-records-main-head">
                        <div class="sp-records-title-group">
                            <h3 class="sp-records-main-title">Nổi Bật Spotify Trending</h3>
                            <span class="sp-records-date-badge">
                                <span>Tháng ${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}</span>
                            </span>
                        </div>
                    </div>
                    <div class="sp-records-2col-grid">
                        <!-- Card 1: Top Bảng Xếp Hạng -->
                        <div class="sp-record-card">
                            <div class="sp-record-card-head">
                                <h4 class="sp-record-card-title">Top Bảng Xếp Hạng</h4>
                            </div>
                            <div class="sp-record-list">
                                ${records.topCharts.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
                            </div>
                        </div>

                        <!-- Card 2: V-Pop Không Thể Thiếu -->
                        <div class="sp-record-card">
                            <div class="sp-record-card-head">
                                <h4 class="sp-record-card-title">V-Pop Nổi Bật</h4>
                            </div>
                            <div class="sp-record-list">
                                ${records.topVpop.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
                            </div>
                        </div>

                        <!-- Card 3: Thời Lượng Dài Nhất -->
                        <div class="sp-record-card">
                            <div class="sp-record-card-head">
                                <h4 class="sp-record-card-title">Thời Lượng Dài Nhất</h4>
                            </div>
                            <div class="sp-record-list">
                                ${records.longestTracks.map((item, idx) => renderRecordItem(item, idx, 'duration')).join('')}
                            </div>
                        </div>

                        <!-- Card 4: Bản Hit Hot Hits Vietnam -->
                        <div class="sp-record-card">
                            <div class="sp-record-card-head">
                                <h4 class="sp-record-card-title">Bản Hit Hot Hits</h4>
                            </div>
                            <div class="sp-record-list">
                                ${records.topHits.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
                            </div>
                        </div>

                        <!-- Card 5: Giai Điệu Ngắn & Gây Nghiện -->
                        <div class="sp-record-card">
                            <div class="sp-record-card-head">
                                <h4 class="sp-record-card-title">Giai Điệu Gây Nghiện</h4>
                            </div>
                            <div class="sp-record-list">
                                ${records.shortestTracks.map((item, idx) => renderRecordItem(item, idx, 'duration')).join('')}
                            </div>
                        </div>

                        <!-- Card 6: Thịnh Hành Thiên Hạ Nghe Gì -->
                        <div class="sp-record-card">
                            <div class="sp-record-card-head">
                                <h4 class="sp-record-card-title">Viral Thiên Hạ Nghe Gì</h4>
                            </div>
                            <div class="sp-record-list">
                                ${records.viralRadio.map((item, idx) => renderRecordItem(item, idx, 'default')).join('')}
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
 * Gắn các sự kiện tương tác trong khu vực nội dung Spotify
 */
export function bindSpotifyContentEvents(container, onPlayMedia) {
    if (!container) return;

    // Helper đặt lại trạng thái UI cho một track
    const resetPlayerUI = (trackId) => {
        const row = container.querySelector(`[data-id="${trackId}"]`);
        if (!row) return;
        const inlineBtn = row.querySelector('.sp-inline-play-btn');
        if (inlineBtn) {
            inlineBtn.classList.remove('is-playing');
            inlineBtn.innerHTML = `<svg class="sp-player-play-svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
        }
        const thumbBtn = row.querySelector('.sp-preview-play-btn');
        if (thumbBtn) {
            thumbBtn.innerHTML = `<svg class="sp-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        }
        const playerCol = row.querySelector('.sp-audio-player-col');
        if (playerCol) playerCol.classList.remove('is-playing');
        const fill = row.querySelector('.sp-progress-fill');
        if (fill) fill.style.width = '0%';
        const thumb = row.querySelector('.sp-progress-thumb');
        if (thumb) thumb.style.left = '0%';
        const timeDisplay = row.querySelector('.sp-time-display');
        if (timeDisplay) timeDisplay.textContent = '0:30';
    };

    // Helper cập nhật trạng thái UI đang phát / tạm dừng
    const setPlayerPlayingUI = (trackId, isPlaying) => {
        const row = container.querySelector(`[data-id="${trackId}"]`);
        if (!row) return;
        const inlineBtn = row.querySelector('.sp-inline-play-btn');
        if (inlineBtn) {
            inlineBtn.classList.toggle('is-playing', isPlaying);
            inlineBtn.innerHTML = isPlaying
                ? `<svg class="sp-player-play-svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
                : `<svg class="sp-player-play-svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
        }
        const thumbBtn = row.querySelector('.sp-preview-play-btn');
        if (thumbBtn) {
            thumbBtn.innerHTML = isPlaying
                ? `<svg class="sp-play-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
                : `<svg class="sp-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        }
        const playerCol = row.querySelector('.sp-audio-player-col');
        if (playerCol) playerCol.classList.toggle('is-playing', isPlaying);
    };

    // Hàm điều khiển phát/dừng và tua thanh tiến trình
    const togglePlayTrack = (trackId, previewUrl, startAtRatio = null) => {
        if (!previewUrl) return;

        if (_currentPlayingId === trackId && _currentAudio) {
            if (startAtRatio !== null) {
                // Đang phát bài này -> người dùng click vào thanh để tua đoạn nghe
                const dur = _currentAudio.duration || 30;
                _currentAudio.currentTime = Math.max(0, Math.min(dur, startAtRatio * dur));
                return;
            }
            // Bấm vào nút play -> tạm dừng
            _currentAudio.pause();
            setPlayerPlayingUI(trackId, false);
            _currentAudio = null;
            _currentPlayingId = null;
        } else {
            // Dừng bài cũ nếu đang phát
            if (_currentAudio && _currentPlayingId) {
                _currentAudio.pause();
                resetPlayerUI(_currentPlayingId);
                _currentAudio = null;
                _currentPlayingId = null;
            }

            const audio = new Audio(previewUrl);
            _currentAudio = audio;
            _currentPlayingId = trackId;
            setPlayerPlayingUI(trackId, true);

            if (startAtRatio !== null) {
                audio.addEventListener('loadedmetadata', () => {
                    const dur = audio.duration || 30;
                    audio.currentTime = Math.max(0, Math.min(dur, startAtRatio * dur));
                }, { once: true });
            }

            audio.addEventListener('timeupdate', () => {
                if (_currentPlayingId !== trackId) return;
                const cur = audio.currentTime || 0;
                const dur = audio.duration || 30;
                const pct = Math.min(100, Math.max(0, (cur / dur) * 100));

                const row = container.querySelector(`[data-id="${trackId}"]`);
                if (row) {
                    const fill = row.querySelector('.sp-progress-fill');
                    if (fill) fill.style.width = `${pct}%`;
                    const thumb = row.querySelector('.sp-progress-thumb');
                    if (thumb) thumb.style.left = `${pct}%`;
                    const timeDisplay = row.querySelector('.sp-time-display');
                    if (timeDisplay) {
                        const s = Math.floor(cur);
                        timeDisplay.textContent = `0:${s.toString().padStart(2, '0')}`;
                    }
                }
            });

            audio.play().catch(err => {
                console.warn('Audio play error:', err);
                resetPlayerUI(trackId);
                _currentAudio = null;
                _currentPlayingId = null;
            });

            audio.onended = () => {
                resetPlayerUI(trackId);
                _currentAudio = null;
                _currentPlayingId = null;
            };
        }
    };

    // Sự kiện click nút Play ở hàng bài hát hoặc thumbnail
    container.querySelectorAll('[data-player-btn]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const trackId = btn.getAttribute('data-player-btn');
            const parent = btn.closest('[data-preview]');
            const previewUrl = parent ? parent.getAttribute('data-preview') : null;
            togglePlayTrack(trackId, previewUrl);
        });
    });

    // Sự kiện click trên thanh thời gian để tua đoạn nghe
    container.querySelectorAll('[data-progress-bar]').forEach(bar => {
        bar.addEventListener('click', (e) => {
            e.stopPropagation();
            const trackId = bar.getAttribute('data-progress-bar');
            const parent = bar.closest('[data-preview]');
            const previewUrl = parent ? parent.getAttribute('data-preview') : null;
            const rect = bar.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            togglePlayTrack(trackId, previewUrl, ratio);
        });
    });

    // Sự kiện click mở link Spotify
    container.querySelectorAll('.sp-pop-item, .sp-rec-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('[data-player-btn]') || e.target.closest('[data-progress-bar]') || e.target.closest('.sp-open-link-btn')) return;
            const url = el.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // Sự kiện click nghệ sĩ
    container.querySelectorAll('.sp-artist-row-item').forEach(el => {
        el.addEventListener('click', () => {
            const url = el.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // Sự kiện click từ khóa
    container.querySelectorAll('.sp-kw-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const kw = tag.textContent.trim();
            if (kw) {
                window.open(`https://open.spotify.com/search/${encodeURIComponent(kw)}`, '_blank');
            }
        });
    });
}

/**
 * Hiệu ứng Skeleton Loading cho nội dung chính của Spotify (không phá hủy banner & tabs)
 */
export function renderSpotifyContentSkeleton(isOverview = true) {
    return `
        <!-- 1. Main 2-Col Skeleton -->
        <div class="sp-main-two-col ${isOverview ? 'sp-is-overview' : 'sp-is-category'} skeleton-layout" aria-busy="true">
            <div class="sp-popular-section">
                <div class="sp-popular-head" style="margin-bottom: 16px;">
                    <div class="skeleton-shimmer" style="width: 300px; height: 20px; border-radius: 4px;"></div>
                </div>
                <div class="sp-popular-list">
                    ${Array.from({ length: isOverview ? 12 : 8 }).map(() => `
                        <div class="sp-pop-item" style="pointer-events: none; border-bottom: 1px solid var(--border-subtle); padding: 12px 10px;">
                            <span class="skeleton-shimmer" style="width: 20px; height: 16px; border-radius: 3px; flex-shrink: 0;"></span>
                            <div class="skeleton-shimmer" style="width: 48px; height: 48px; border-radius: 6px; flex-shrink: 0;"></div>
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                                <div class="skeleton-shimmer" style="width: 70%; height: 14px; border-radius: 3px;"></div>
                                <div class="skeleton-shimmer" style="width: 45%; height: 12px; border-radius: 3px;"></div>
                            </div>
                            <div class="skeleton-shimmer" style="width: 80px; height: 14px; border-radius: 3px;"></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="sp-sidebar-stack">
                <div class="sp-side-card">
                    <div class="sp-side-head">
                        <div class="skeleton-shimmer" style="width: 130px; height: 16px; border-radius: 3px;"></div>
                    </div>
                    <div class="sp-side-list" style="gap: 8px;">
                        ${Array.from({ length: 5 }).map(() => `
                            <div style="display: flex; align-items: center; gap: 10px; padding: 6px 8px;">
                                <span class="skeleton-shimmer" style="width: 14px; height: 14px; border-radius: 2px;"></span>
                                <div class="skeleton-shimmer" style="width: 32px; height: 32px; border-radius: 50%;"></div>
                                <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                                    <div class="skeleton-shimmer" style="width: 110px; height: 12px; border-radius: 2px;"></div>
                                    <div class="skeleton-shimmer" style="width: 140px; height: 10px; border-radius: 2px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sp-side-card">
                    <div class="sp-side-head">
                        <div class="skeleton-shimmer" style="width: 130px; height: 16px; border-radius: 3px;"></div>
                    </div>
                    <div class="sp-side-list" style="gap: 8px;">
                        ${Array.from({ length: 5 }).map(() => `
                            <div style="display: flex; align-items: center; gap: 10px; padding: 6px 8px;">
                                <span class="skeleton-shimmer" style="width: 14px; height: 14px; border-radius: 2px;"></span>
                                <div class="skeleton-shimmer" style="width: 32px; height: 32px; border-radius: 50%;"></div>
                                <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                                    <div class="skeleton-shimmer" style="width: 110px; height: 12px; border-radius: 2px;"></div>
                                    <div class="skeleton-shimmer" style="width: 140px; height: 10px; border-radius: 2px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sp-side-card">
                    <div class="sp-side-head">
                        <div class="skeleton-shimmer" style="width: 140px; height: 16px; border-radius: 3px;"></div>
                    </div>
                    <div class="sp-keywords-cloud" style="gap: 10px 12px; padding: 12px 0;">
                        ${[85, 95, 65, 110, 75, 120, 85, 90, 70, 105, 60, 95, 115, 70, 85].map(w => `
                            <div class="skeleton-shimmer" style="width: ${w}px; height: 22px; border-radius: 4px;"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        ${isOverview ? `
            <div class="sp-records-container skeleton-layout" style="margin-top: 24px;" aria-busy="true">
                <div class="skeleton-shimmer" style="width: 240px; height: 28px; border-radius: 4px; margin-bottom: 16px;"></div>
                <div class="sp-records-2col-grid">
                    ${Array.from({ length: 6 }).map(() => `
                        <div class="sp-record-card" style="padding: 16px;">
                            <div class="skeleton-shimmer" style="width: 150px; height: 18px; border-radius: 3px; margin-bottom: 12px;"></div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${Array.from({ length: 3 }).map(() => `
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <div class="skeleton-shimmer" style="width: 44px; height: 44px; border-radius: 4px; flex-shrink: 0;"></div>
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
 * Cập nhật nội dung Spotify mượt mà khi chuyển category tab (không re-render toàn bộ DOM)
 */
export function updateSpotifyContent(container, items, onPlayMedia, state = {}) {
    const mainContent = container.querySelector('.sp-main-content');
    if (!mainContent) return;
    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';

    mainContent.innerHTML = buildSpotifyContentHtml(items, isOverview, currentCategory, state);
    mainContent.classList.remove('content-fade-in');
    void mainContent.offsetWidth; // trigger reflow
    mainContent.classList.add('content-fade-in');

    bindSpotifyContentEvents(mainContent, onPlayMedia);
}

/**
 * Render toàn bộ Dashboard Spotify (dùng khi mới vào trang hoặc chuyển nền tảng)
 */
export function renderSpotify(container, items, onPlayMedia, state = {}, onSelectCategory) {
    const currentCategory = state.activeCategory || 'all';
    const isOverview = currentCategory === 'all';
    const mainContentHtml = buildSpotifyContentHtml(items, isOverview, currentCategory, state);

    container.innerHTML = `
        <div class="sp-dashboard-layout view-fade-in">
            <!-- 1. TIÊU ĐỀ BANNER Ở TRÊN CÙNG -->
            <div class="sp-header-banner">
                <div class="sp-brand-lead">
                    <h2 class="sp-heading">Bảng Xếp Hạng Xu Hướng Spotify • Việt Nam</h2>
                </div>
            </div>

            <!-- 2. BỘ LỌC CÁC MỤC TAB (NGAY DƯỚI TIÊU ĐỀ) -->
            <nav class="chart-navigation" aria-label="Bộ lọc chuyên mục Spotify">
                <div class="categories-strip" role="tablist">
                    ${SPOTIFY_CATEGORIES.map(c => `
                        <button class="cat-pill ${c.id === currentCategory ? 'active' : ''}" data-cat="${c.id}">
                            ${c.name}
                        </button>
                    `).join('')}
                </div>
            </nav>

            <!-- 3. NỘI DUNG CHÍNH -->
            <div class="sp-main-content">
                ${mainContentHtml}
            </div>
        </div>
    `;

    // Sự kiện chuyển tab danh mục
    container.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cat = btn.getAttribute('data-cat');
            if (onSelectCategory) {
                onSelectCategory(cat);
            }
        });
    });

    bindSpotifyContentEvents(container, onPlayMedia);
}

/**
 * Hiệu ứng Skeleton Loading cho toàn bộ Spotify view (dùng khi chuyển giữa các nền tảng)
 */
export function renderSpotifySkeleton(container, isOverview = true) {
    if (!container) return;
    container.innerHTML = `
        <div class="sp-dashboard-layout skeleton-layout" aria-busy="true">
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
                ${renderSpotifyContentSkeleton(isOverview)}
            </div>
        </div>
    `;
}
