/**
 * Flex PWA - OkHttp Native Fetch & Silent Waterfall Engine
 * File: sources.js
 */

// 1. Waterfall Stream Provider Registry
export const WATERFALL_PROVIDERS = [
  {
    id: 'vidsrc-pro',
    name: 'VidSrc Pro',
    referrer: 'https://vidsrc.me/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${id}`;
    }
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    referrer: 'https://player.autoembed.cc/',
    userAgent: 'Mozilla/5.0 (Linux; Android 14) Flex/1.0',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`
        : `https://player.autoembed.cc/embed/movie/${id}`;
    }
  },
  {
    id: 'embed-su',
    name: 'Embed.su',
    referrer: 'https://embed.su/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://embed.su/embed/tv/${id}/${season}/${episode}`
        : `https://embed.su/embed/movie/${id}`;
    }
  },
  {
    id: '2embed',
    name: '2Embed Cloud',
    referrer: 'https://www.2embed.cc/',
    userAgent: 'Mozilla/5.0 (Linux; Android 14) Flex/1.0',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`;
    }
  },
  {
    id: 'smashy-stream',
    name: 'SmashyStream',
    referrer: 'https://player.smashystream.com/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://player.smashystream.com/tv/${id}?s=${season}&e=${episode}`
        : `https://player.smashystream.com/movie/${id}`;
    }
  }
];

// 2. Native OkHttp CORS Bypass Proxy
export async function nativeFetch(url, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 14) Flex/1.0'
  };

  // Route through Native Android OkHttp worker if running inside shell
  if (typeof window !== 'undefined' && window.NativeAppBridge?.fetch) {
    try {
      const payload = JSON.stringify({ url, method, headers });
      const rawResponse = window.NativeAppBridge.fetch(payload);
      const parsed = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
      return {
        status: parsed.status || 200,
        headers: parsed.headers || {},
        body: parsed.body || ''
      };
    } catch (err) {
      console.warn('[sources.js] OkHttp native fetch error, attempting browser fallback:', err);
    }
  }

  // Standard web browser fallback
  const res = await fetch(url, options);
  const text = await res.text();
  return {
    status: res.status,
    headers: {},
    body: text
  };
}

// 3. Subtitle Tracks Bundle
export async function getSubtitleTracks({ tmdbId, season = 1, episode = 1 }) {
  const subtitles = [
    { language: 'English', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/en.vtt` },
    { language: 'Spanish', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/es.vtt` },
    { language: 'Bengali', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/bn.vtt` },
    { language: 'Hindi', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/hi.vtt` },
    { language: 'French', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/fr.vtt` }
  ];

  return {
    subtitles,
    primarySubtitleUrl: subtitles[0]?.url || ''
  };
}

// 4. Sequential Waterfall Resolver
export async function getWaterfallStream({ tmdbId, mediaType = 'movie', season = 1, episode = 1, sourceIndex = 0 }) {
  if (!tmdbId) throw new Error('Missing tmdbId for stream resolution');

  const isTv = (mediaType || '').toLowerCase() === 'tv' || (mediaType || '').toLowerCase() === 'series';
  const index = Math.max(0, Math.min(sourceIndex, WATERFALL_PROVIDERS.length - 1));
  const provider = WATERFALL_PROVIDERS[index];
  const streamUrl = provider.buildUrl(tmdbId, isTv, season, episode);

  const { subtitles, primarySubtitleUrl } = await getSubtitleTracks({ tmdbId, season, episode });

  return {
    providerId: provider.id,
    providerName: provider.name,
    streamUrl,
    referrerUrl: provider.referrer,
    userAgent: provider.userAgent,
    subtitles,
    subtitleUrl: primarySubtitleUrl,
    audioTracks: ['Original Audio', 'English Dub', 'Hindi Dub', 'Spanish Dub'],
    currentIndex: index,
    nextIndex: index + 1,
    hasMore: index + 1 < WATERFALL_PROVIDERS.length
  };
}

// Global attachment for non-module scripts
if (typeof window !== 'undefined') {
  window.FlexSources = {
    WATERFALL_PROVIDERS,
    nativeFetch,
    getSubtitleTracks,
    getWaterfallStream
  };
}
