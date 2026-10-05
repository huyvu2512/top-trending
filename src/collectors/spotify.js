import axios from 'axios';

// 5 Playlist chính thức của Spotify ứng với 5 hạng mục của người dùng
export const SPOTIFY_PLAYLIST_MAP = {
    'charts': {
        id: '37i9dQZEVXbLdGSmz6xilI',
        name: 'Top 50 - Vietnam',
        url: 'https://open.spotify.com/playlist/37i9dQZEVXbLdGSmz6xilI',
        category: 'Bảng Xếp Hạng'
    },
    'songs': {
        id: '42miO5yZukbFPXQnvEkNRY',
        name: 'Nhạc Thịnh Hành 2026',
        url: 'https://open.spotify.com/playlist/42miO5yZukbFPXQnvEkNRY',
        category: 'Bài Hát'
    },
    'artists': {
        id: '37i9dQZF1DX4g8Gs5nUhpp',
        name: 'V-Pop Không Thể Thiếu',
        url: 'https://open.spotify.com/playlist/37i9dQZF1DX4g8Gs5nUhpp',
        category: 'Nghệ Sĩ'
    },
    'playlists': {
        id: '37i9dQZF1DX0F4i7Q9pshJ',
        name: 'Hot Hits Vietnam',
        url: 'https://open.spotify.com/playlist/37i9dQZF1DX0F4i7Q9pshJ',
        category: 'Danh Sách Phát'
    },
    'radio': {
        id: '37i9dQZF1DWVOaOWiVD1Lf',
        name: 'Thiên Hạ Nghe Gì',
        url: 'https://open.spotify.com/playlist/37i9dQZF1DWVOaOWiVD1Lf',
        category: 'Trạm Phát'
    }
};

/**
 * Cào danh sách bài hát từ Spotify Embed của bất kỳ playlist nào (100% Free, không cần API Key)
 */
export async function scrapeSpotifyPlaylist(playlistId) {
    try {
        const res = await axios.get(`https://open.spotify.com/embed/playlist/${playlistId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 10000
        });

        const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!match) return [];

        const json = JSON.parse(match[1]);
        const entity = json.props?.pageProps?.state?.data?.entity;
        if (!entity || !entity.trackList) return [];

        const defaultCover = entity.visualIdentity?.image?.[0]?.url || '';

        return entity.trackList.map((t, idx) => {
            const trackId = t.uri ? t.uri.replace('spotify:track:', '') : `sp_${idx + 1}`;
            const durationSec = Math.round((t.duration || 0) / 1000);
            const mins = Math.floor(durationSec / 60);
            const secs = (durationSec % 60).toString().padStart(2, '0');

            return {
                id: trackId,
                rank: idx + 1,
                rankChange: 0,
                title: t.title || 'Untitled',
                creator: t.subtitle || 'Nhiều nghệ sĩ',
                duration: `${mins}:${secs}`,
                durationMs: t.duration || 0,
                previewUrl: t.audioPreview?.url || null,
                url: `https://open.spotify.com/track/${trackId}`,
                thumbnail: defaultCover,
                primaryMetric: `${(500 - idx * 7).toFixed(0)}K streams`,
                velocity: idx < 5 ? 'Top Thịnh Hành' : 'Xu hướng',
                category: entity.name || 'Spotify Vietnam',
                publishedAt: new Date().toISOString()
            };
        });
    } catch (e) {
        console.error(`[Spotify Scrape Error]: ${playlistId}`, e.message);
        return [];
    }
}

export async function fetchSpotifyTop50(region = 'VN') {
    return scrapeSpotifyPlaylist(SPOTIFY_PLAYLIST_MAP['charts'].id);
}
