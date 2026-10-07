/**
 * TOP TRENDING — Multi-Platform Leaderboard Engine (Vietnam Focused)
 * Modular View Router & State Controller
 */

import { renderOverview } from './views/overview.js';
import { renderYouTube, renderYouTubeSkeleton, renderYouTubeContentSkeleton, updateYouTubeContent } from './views/youtube.js';
import { renderSpotify, renderSpotifySkeleton, renderSpotifyContentSkeleton, updateSpotifyContent } from './views/spotify.js';
import { renderGoogle, renderGoogleSkeleton, renderGoogleContentSkeleton, updateGoogleContent } from './views/google.js';
import { renderNetflix, renderNetflixSkeleton, renderNetflixContentSkeleton, updateNetflixContent } from './views/netflix.js';
import { formatUpdateTime } from './utils.js';

// Application State Store
const state = {
    data: null,
    activePlatform: 'all',
    activeRegion: 'VN',
    activeCategory: 'all',
    searchQuery: '',
    nowPlaying: null
};

// DOM References
const elements = {
    platformsBar: document.getElementById('platforms-bar'),
    viewContainer: document.getElementById('view-container'),
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),
    tickerTime: document.getElementById('ticker-time'),
    // Floating Player
    floatingPlayer: document.getElementById('floating-player'),
    playerThumb: document.getElementById('player-thumb'),
    playerRank: document.getElementById('player-rank'),
    playerTitle: document.getElementById('player-title'),
    playerCreator: document.getElementById('player-creator'),
    playerEmbedContainer: document.getElementById('player-embed-container'),
    playerExtLink: document.getElementById('player-ext-link'),
    playerCloseBtn: document.getElementById('player-close-btn')
};
// Official, Pristine Platform Vector Icons
const ICONS = {
    grid: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="3.25" y="3.25" width="7.5" height="7.5" rx="2"/><rect x="13.25" y="3.25" width="7.5" height="7.5" rx="2"/><rect x="3.25" y="13.25" width="7.5" height="7.5" rx="2"/><rect x="13.25" y="13.25" width="7.5" height="7.5" rx="2"/></svg>`,
    sparkles: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="3.25" y="3.25" width="7.5" height="7.5" rx="2"/><rect x="13.25" y="3.25" width="7.5" height="7.5" rx="2"/><rect x="3.25" y="13.25" width="7.5" height="7.5" rx="2"/><rect x="13.25" y="13.25" width="7.5" height="7.5" rx="2"/></svg>`,
    youtube: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    spotify: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.307a.748.748 0 0 1-1.029.248c-2.817-1.722-6.363-2.112-10.54-1.157a.75.75 0 1 1-.334-1.462c4.568-1.044 8.497-.6 11.655 1.342.36.22.47.69.248 1.029zm1.47-3.266a.936.936 0 0 1-1.288.308c-3.225-1.982-8.14-2.557-11.954-1.398a.937.937 0 1 1-.546-1.792c4.358-1.323 9.774-.683 13.48 1.594a.937.937 0 0 1 .308 1.288zm.126-3.41c-3.868-2.296-10.25-2.508-13.94-1.388a1.124 1.124 0 1 1-.652-2.152c4.24-1.287 11.29-1.041 15.742 1.602a1.124 1.124 0 1 1-1.15 1.938z"/></svg>`,
    google: `<svg class="platform-icon google-svg" viewBox="0 0 24 24"><path class="gg-blue" fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path class="gg-green" fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path class="gg-yellow" fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path class="gg-red" fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
    netflix: `<svg class="platform-icon netflix-svg" viewBox="5.398 0 13.204 24"><path class="nf-pillar" d="M5.398 0v24c1.873-.225 2.81-.312 4.715-.398V0H5.398z"/><path class="nf-pillar" d="M13.887 0v24c1.873.086 2.842.173 4.715.398V0h-4.715z"/><path class="nf-ribbon" d="M5.398 0l8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398z"/></svg>`
};

// Map View Functions
const VIEW_ROUTER = {
    'all': renderOverview,
    'youtube': renderYouTube,
    'spotify': renderSpotify,
    'google': renderGoogle,
    'netflix': renderNetflix
};

function getPlatformFromUrl() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!path || path === 'overview') return 'all';
    const validPlatforms = ['youtube', 'spotify', 'google', 'netflix'];
    return validPlatforms.includes(path) ? path : 'all';
}

function updateUrl(platform) {
    const targetPath = (platform === 'all' || platform === 'overview') ? '/' : `/${platform}`;
    if (window.location.pathname !== targetPath) {
        window.history.pushState({ platform }, '', targetPath);
    }
}

// Initialize App
async function init() {
    state.activePlatform = getPlatformFromUrl();
    // Render khung Skeleton Shimmer ngay tức thì (0ms) để không bị màn hình đen
    renderSkeleton();
    setupEvents();
    await loadMetadata();
}

// Preload all platforms in background so tab switching is instantaneous from RAM
const ALL_PLATFORMS = ['youtube', 'spotify', 'google', 'netflix'];

async function preloadAllPlatforms() {
    try {
        await Promise.all(ALL_PLATFORMS.map(p => loadPlatformData(p)));
    } catch (e) {
        console.warn('Preload warning:', e);
    }
}

function updateHeaderTimestamp() {
    const el = document.getElementById('header-updated-time');
    if (!el) return;
    const formatted = formatUpdateTime(state.data?.last_updated);
    if (formatted) {
        el.textContent = formatted;
    } else {
        el.innerHTML = '<span class="header-time-skeleton skeleton-shimmer"></span>';
    }
}

// Load metadata & rankings trực tiếp từ API backend (/api/rankings)
async function loadMetadata() {
    const defaultPlatforms = [
        { id: "all", name: "Tất cả", icon: "grid" },
        { id: "youtube", name: "YouTube", icon: "youtube" },
        { id: "spotify", name: "Spotify", icon: "spotify" },
        { id: "google", name: "Google Trends", icon: "google" },
        { id: "netflix", name: "Netflix", icon: "netflix" }
    ];

    state.data = {
        platforms: defaultPlatforms,
        rankings: {},
        platforms_updated: {},
        last_updated: null
    };

    renderPlatforms();

    try {
        const apiRes = await fetch('/api/rankings');
        if (apiRes.ok) {
            const json = await apiRes.json();
            if (json.rankings && Object.keys(json.rankings).length > 0) {
                state.data.rankings = json.rankings;
                state.data.last_updated = json.last_updated;
                state.data.platforms_updated = json.platforms_updated || {};
            }
        }
    } catch (e) {
        console.warn('Lỗi tải /api/rankings:', e);
    }

    updateHeaderTimestamp();
    await fetchRankingData();
}

function setupEvents() {
    // Optional Search Input
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim().toLowerCase();
            if (elements.searchClear) elements.searchClear.classList.toggle('hidden', !state.searchQuery);
            renderCurrentView();
        });

        if (elements.searchClear) {
            elements.searchClear.addEventListener('click', () => {
                elements.searchInput.value = '';
                state.searchQuery = '';
                elements.searchClear.classList.add('hidden');
                renderCurrentView();
                elements.searchInput.focus();
            });
        }
    }

    // Player close button
    if (elements.playerCloseBtn) {
        elements.playerCloseBtn.addEventListener('click', closePlayer);
    }

    // Browser navigation (Back / Forward)
    window.addEventListener('popstate', async () => {
        const platform = getPlatformFromUrl();
        if (platform !== state.activePlatform) {
            await switchPlatform(platform);
        }
    });

    // Brand logo click hard reloads and navigates to overview
    const brandLogo = document.getElementById('brand-logo');
    if (brandLogo) {
        brandLogo.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.location.pathname === '/' || window.location.pathname === '/overview') {
                window.location.reload();
            } else {
                window.location.href = '/';
            }
        });
    }

    // Theme Switcher (System Preference + Dark / Light Toggle)
    setupTheme();
}

function getPreferredTheme() {
    const saved = localStorage.getItem('top_trending_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isSystemDark ? 'dark' : 'light';
}

function setupTheme() {
    const theme = getPreferredTheme();
    applyThemeUI(theme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('top_trending_theme', nextTheme);
            applyThemeUI(nextTheme);
        });
    }

    // Tự động lắng nghe thay đổi Sáng/Tối từ cài đặt hệ thống của thiết bị/trình duyệt
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            // Nếu người dùng chưa từng tự tay bấm đổi công tắc, luôn tự động theo cài đặt hệ thống
            if (!localStorage.getItem('top_trending_theme')) {
                const systemTheme = e.matches ? 'dark' : 'light';
                applyThemeUI(systemTheme);
            }
        };
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
        }
    }
}

function applyThemeUI(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
    }

    const moonIcon = document.querySelector('.theme-icon-moon');
    const sunIcon = document.querySelector('.theme-icon-sun');
    if (moonIcon && sunIcon) {
        if (theme === 'light') {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    }
}

let platformsRendered = false;

function renderPlatforms() {
    if (!state.data?.platforms) return;
    
    const bars = [
        document.getElementById('platforms-bar'),
        document.getElementById('mobile-platforms-bar')
    ].filter(Boolean);

    if (bars.length === 0) return;

    const html = state.data.platforms.map(p => `
        <button class="platform-chip chip-${p.id} ${p.id === state.activePlatform ? 'active' : ''}" data-platform="${p.id}" title="${p.name}">
            ${ICONS[p.icon] || ICONS.grid || ICONS.sparkles}
            <span>${p.name}</span>
        </button>
    `).join('');

    bars.forEach(bar => {
        bar.innerHTML = html;
    });

    if (!platformsRendered) {
        // Universal delegated click listener for both desktop header and mobile bottom bar
        document.addEventListener('click', async (e) => {
            const chip = e.target.closest('.platform-chip');
            if (!chip) return;
            const platform = chip.getAttribute('data-platform');
            if (!platform || platform === state.activePlatform) return;

            await switchPlatform(platform);
        });

        platformsRendered = true;
    } else {
        updateActivePlatformChip(state.activePlatform);
    }
}

function updateActivePlatformChip(activePlatform) {
    document.querySelectorAll('.platform-chip').forEach(chip => {
        const pId = chip.getAttribute('data-platform');
        chip.classList.toggle('active', pId === activePlatform);
    });
}

// Load individual platform data từ backend API (/api/rankings/:platform)
async function loadPlatformData(platform) {
    if (state.data.rankings[platform] && state.data.rankings[platform].length > 0) {
        return state.data.rankings[platform];
    }

    try {
        const res = await fetch(`/api/rankings/${platform}`);
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.items) && json.items.length > 0) {
                state.data.rankings[platform] = json.items;
                if (json.last_updated) {
                    state.data.platforms_updated[platform] = json.last_updated;
                    if (!state.data.last_updated || json.last_updated > state.data.last_updated) {
                        state.data.last_updated = json.last_updated;
                        updateHeaderTimestamp();
                    }
                }
                return json.items;
            }
        }
    } catch (e) {
        console.warn(`Lỗi tải /api/rankings/${platform}:`, e);
    }

    return [];
}

function renderSkeleton() {
    if (!elements.viewContainer) return;
    if (state.activePlatform === 'youtube') {
        renderYouTubeSkeleton(elements.viewContainer, state.activeCategory === 'all');
        return;
    }
    if (state.activePlatform === 'spotify') {
        renderSpotifySkeleton(elements.viewContainer, state.activeCategory === 'all');
        return;
    }
    if (state.activePlatform === 'google') {
        renderGoogleSkeleton(elements.viewContainer, state.activeCategory === 'all');
        return;
    }
    if (state.activePlatform === 'netflix') {
        renderNetflixSkeleton(elements.viewContainer, state.activeCategory === 'all');
        return;
    }
    // Overview (All) skeleton: Hero + 3 Spotlights + 4 Leaderboard Panels
    elements.viewContainer.innerHTML = `
        <div class="skeleton-layout" style="display: flex; flex-direction: column; gap: 28px; padding-bottom: 30px;">
            <div style="display: flex; justify-content: flex-start; align-items: center; border-bottom: 1.5px solid var(--border-medium); padding-bottom: 14px;">
                <div class="skeleton-shimmer" style="width: 320px; height: 26px; border-radius: 6px;"></div>
            </div>
            <!-- Spotlight Section Skeleton -->
            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;">
                <div style="background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-xl); min-height: 330px; padding: 26px; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px;">
                    <div class="skeleton-shimmer" style="width: 140px; height: 18px; border-radius: 4px;"></div>
                    <div class="skeleton-shimmer" style="width: 80%; height: 26px; border-radius: 6px;"></div>
                    <div class="skeleton-shimmer" style="width: 40%; height: 14px; border-radius: 4px;"></div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px; justify-content: space-between;">
                    ${Array.from({ length: 3 }).map(() => `
                        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 14px 16px; display: flex; align-items: center; gap: 14px; flex: 1;">
                            <div class="skeleton-shimmer" style="width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;"></div>
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                                <div class="skeleton-shimmer" style="width: 90px; height: 12px; border-radius: 3px;"></div>
                                <div class="skeleton-shimmer" style="width: 80%; height: 16px; border-radius: 4px;"></div>
                                <div class="skeleton-shimmer" style="width: 50%; height: 12px; border-radius: 3px;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <!-- 2x2 Grid Skeleton -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 10px;">
                ${Array.from({ length: 4 }).map(() => `
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column;">
                        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
                            <div class="skeleton-shimmer" style="width: 140px; height: 18px; border-radius: 4px;"></div>
                            <div class="skeleton-shimmer" style="width: 60px; height: 16px; border-radius: 10px;"></div>
                        </div>
                        <div style="padding: 8px; display: flex; flex-direction: column; gap: 6px;">
                            ${Array.from({ length: 6 }).map(() => `
                                <div style="display: flex; align-items: center; gap: 12px; padding: 6px;">
                                    <div class="skeleton-shimmer" style="width: 16px; height: 16px; border-radius: 4px;"></div>
                                    <div class="skeleton-shimmer" style="width: 48px; height: 32px; border-radius: 4px;"></div>
                                    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                                        <div class="skeleton-shimmer" style="width: 85%; height: 13px; border-radius: 3px;"></div>
                                        <div class="skeleton-shimmer" style="width: 45%; height: 10px; border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Chuyển đổi nền tảng mượt mà với hiệu ứng Skeleton Shimmer tự nhiên (tránh chớp giật 1 frame)
async function switchPlatform(platform) {
    if (!platform) return;
    state.activePlatform = platform;
    state.activeCategory = 'all';
    updateUrl(platform);
    updateActivePlatformChip(platform);

    const mw = document.querySelector('.main-wrapper');
    if (mw) mw.scrollTop = 0;

    // Hiển thị khung Skeleton trước
    renderSkeleton();

    const start = Date.now();
    if (platform === 'all') {
        const list = ['youtube', 'spotify', 'google', 'netflix'];
        await Promise.all(list.map(p => loadPlatformData(p)));
    } else {
        await loadPlatformData(platform);
    }

    // Giữ Skeleton tối thiểu 220ms để hiệu ứng Shimmer lướt qua mượt mà, không bị flash 1-frame
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, 220 - elapsed);
    if (remaining > 0) {
        await new Promise(r => setTimeout(r, remaining));
    }

    renderCurrentView();
}

// Fetch Ranking Data per Platform (Vietnam Focus)
async function fetchRankingData() {
    renderSkeleton();
    const platform = state.activePlatform;
    if (platform === 'all') {
        const list = ['youtube', 'spotify', 'google', 'netflix'];
        await Promise.all(list.map(p => loadPlatformData(p)));
    } else {
        await loadPlatformData(platform);
    }
    renderCurrentView();
}

function getFilteredItems() {
    if (!state.data?.rankings) return [];
    let items = [];

    if (state.activePlatform === 'all') {
        const list = ['youtube', 'spotify', 'google', 'netflix'];
        for (const p of list) {
            if (state.data.rankings[p]) {
                items.push(...state.data.rankings[p]);
            }
        }
        const seen = new Set();
        items = items.filter(i => {
            if (seen.has(i.id)) return false;
            seen.add(i.id);
            return true;
        });
    } else {
        const rawItems = state.data.rankings[state.activePlatform] || [];
        if (state.activePlatform === 'youtube') {
            if (state.activeCategory === 'all') {
                items = rawItems.filter(i => !i.isShort);
            } else if (state.activeCategory === 'velocity') {
                // Sắp xếp theo tốc độ tăng trưởng Xem/giờ
                const getVelocityScore = (item) => {
                    if (item.velocity) {
                        const m = item.velocity.match(/([0-9.]+)([KM]?)/i);
                        if (m) {
                            let val = parseFloat(m[1]);
                            if (m[2]?.toUpperCase() === 'M') val *= 1000000;
                            else if (m[2]?.toUpperCase() === 'K') val *= 1000;
                            return val;
                        }
                    }
                    const pub = new Date(item.publishedAt || 0).getTime();
                    const now = Date.now();
                    const hours = Math.max(1, (now - pub) / (1000 * 60 * 60));
                    return (item.rawViews || 0) / hours;
                };
                const regularItems = rawItems.filter(i => !i.isShort);
                items = [...regularItems].sort((a, b) => getVelocityScore(b) - getVelocityScore(a));
            } else if (state.activeCategory === 'shorts') {
                // Lọc danh sách video Shorts thực tế
                items = rawItems.filter(i => {
                    if (i.isShort || i.categoryId === 'shorts' || i.category === 'Shorts') return true;
                    const title = (i.title || '').toLowerCase();
                    const isShortTitle = title.includes('#shorts') || title.includes('shorts');
                    const dur = i.duration || '';
                    const isShortDuration = dur.startsWith('0:') || dur === '1:00';
                    return isShortTitle || isShortDuration;
                });
            } else {
                const categoryMap = {
                    'music': 'Âm nhạc',
                    'entertainment': 'Giải trí',
                    'gaming': 'Trò chơi',
                    'news': 'Tin tức'
                };
                const catName = categoryMap[state.activeCategory] || state.activeCategory;
                items = rawItems.filter(i => !i.isShort && (i.category === catName || i.categoryId === state.activeCategory));
            }
        } else if (state.activePlatform === 'spotify') {
            if (state.activeCategory === 'all') {
                items = rawItems;
            } else {
                items = rawItems.filter(i => i.categoryId === state.activeCategory || (i.category && i.category.toLowerCase() === state.activeCategory.toLowerCase()));
            }
        } else if (state.activePlatform === 'google') {
            if (state.activeCategory === 'all' || state.activeCategory === 'explore') {
                items = rawItems;
            } else {
                items = rawItems.filter(i => i.categoryId === state.activeCategory);
            }
        } else if (state.activePlatform === 'netflix') {
            if (state.activeCategory === 'all') {
                items = rawItems;
            } else {
                items = rawItems.filter(i => i.categoryId === state.activeCategory);
            }
        } else {
            items = rawItems;
        }
    }

    if (state.searchQuery) {
        items = items.filter(i => 
            (i.title && i.title.toLowerCase().includes(state.searchQuery)) ||
            (i.creator && i.creator.toLowerCase().includes(state.searchQuery))
        );
    }

    return items;
}

// Router: Delegate rendering to corresponding view module
function renderCurrentView() {
    const items = getFilteredItems();
    const renderFn = VIEW_ROUTER[state.activePlatform] || renderOverview;
    renderFn(elements.viewContainer, items, playMedia, state, handleCategorySelect);
}

// Xử lý chuyển tab chuyên mục mượt mà (không phá hủy thanh tab / banner, dùng content-skeleton)
function handleCategorySelect(newCategory) {
    if (state.activeCategory === newCategory) return;
    state.activeCategory = newCategory;

    if (state.activePlatform === 'youtube') {
        const dashboard = elements.viewContainer.querySelector('.yt-dashboard-layout');
        const mainContent = elements.viewContainer.querySelector('.yt-main-content');
        if (dashboard && mainContent) {
            // 1. Cập nhật ngay lập tức active pill trên DOM hiện tại (không phá hủy thanh tab, không giật)
            dashboard.querySelectorAll('.cat-pill').forEach(pill => {
                pill.classList.toggle('active', pill.getAttribute('data-cat') === newCategory);
            });

            // 2. Chèn Skeleton Shimmer vào vùng nội dung chính
            mainContent.innerHTML = renderYouTubeContentSkeleton(newCategory === 'all');

            // 3. Chuyển mượt sang nội dung sau 200ms để hiệu ứng skeleton hiển thị tự nhiên
            setTimeout(() => {
                const newItems = getFilteredItems();
                updateYouTubeContent(elements.viewContainer, newItems, playMedia, state);
            }, 200);
            return;
        }
    } else if (state.activePlatform === 'spotify') {
        const dashboard = elements.viewContainer.querySelector('.sp-dashboard-layout');
        const mainContent = elements.viewContainer.querySelector('.sp-main-content');
        if (dashboard && mainContent) {
            // 1. Cập nhật ngay lập tức active pill trên DOM hiện tại (không phá hủy thanh tab, không giật)
            dashboard.querySelectorAll('.cat-pill').forEach(pill => {
                pill.classList.toggle('active', pill.getAttribute('data-cat') === newCategory);
            });

            // 2. Chèn Skeleton Shimmer vào vùng nội dung chính
            mainContent.innerHTML = renderSpotifyContentSkeleton(newCategory === 'all');

            // 3. Chuyển mượt sang nội dung sau 200ms để hiệu ứng skeleton hiển thị tự nhiên
            setTimeout(() => {
                const newItems = getFilteredItems();
                updateSpotifyContent(elements.viewContainer, newItems, playMedia, state);
            }, 200);
            return;
        }
    } else if (state.activePlatform === 'google') {
        const dashboard = elements.viewContainer.querySelector('.sp-dashboard-layout');
        const mainContent = elements.viewContainer.querySelector('.sp-main-content');
        if (dashboard && mainContent) {
            dashboard.querySelectorAll('.cat-pill').forEach(pill => {
                pill.classList.toggle('active', pill.getAttribute('data-cat') === newCategory);
            });

            mainContent.innerHTML = renderGoogleContentSkeleton(newCategory === 'all');

            setTimeout(() => {
                const newItems = getFilteredItems();
                updateGoogleContent(elements.viewContainer, newItems, playMedia, state);
            }, 200);
            return;
        }
    } else if (state.activePlatform === 'netflix') {
        const dashboard = elements.viewContainer.querySelector('.sp-dashboard-layout');
        const mainContent = elements.viewContainer.querySelector('.sp-main-content');
        if (dashboard && mainContent) {
            dashboard.querySelectorAll('.cat-pill').forEach(pill => {
                pill.classList.toggle('active', pill.getAttribute('data-cat') === newCategory);
            });

            mainContent.innerHTML = renderNetflixContentSkeleton(newCategory === 'all');

            setTimeout(() => {
                const newItems = getFilteredItems();
                updateNetflixContent(elements.viewContainer, newItems, playMedia, state);
            }, 200);
            return;
        }
    }

    renderCurrentView();
}

// Mở trực tiếp tab mới trên ứng dụng gốc thay vì hiển thị popup
function playMedia(item) {
    if (item && item.url) {
        window.open(item.url, '_blank');
    }
}

function closePlayer() {
    if (elements.floatingPlayer) elements.floatingPlayer.classList.add('hidden');
    if (elements.playerEmbedContainer) elements.playerEmbedContainer.innerHTML = '';
    state.nowPlaying = null;
}

// Launch
init();
