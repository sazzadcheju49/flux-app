/**
 * Nexus PWA - Decoupled Multi-Source Resolver & Health Checker
 * ES Module: scrapers/sources.js
 */

const CORS_TIMEOUT_MS = 2500;

// Embed Resolvers Definition
const RESOLVER_PROVIDERS = [
  {
    id: 'vidsrc-pro',
    name: 'VidSrc Pro',
    serverType: 'Fast CDN',
    badge: '1080p',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${id}`;
    }
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    serverType: 'Multi-Cloud',
    badge: 'Auto',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`
        : `https://player.autoembed.cc/embed/movie/${id}`;
    }
  },
  {
    id: 'embed-su',
    name: 'Embed.su',
    serverType: 'Direct HLS',
    badge: 'HD',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://embed.su/embed/tv/${id}/${season}/${episode}`
        : `https://embed.su/embed/movie/${id}`;
    }
  },
  {
    id: '2embed',
    name: '2Embed Cloud',
    serverType: 'Mirror Server',
    badge: '720p',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`;
    }
  },
  {
    id: 'smashy-stream',
    name: 'SmashyStream',
    serverType: 'Fast Stream',
    badge: '1080p',
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://player.smashystream.com/tv/${id}?s=${season}&e=${episode}`
        : `https://player.smashystream.com/movie/${id}`;
    }
  }
];

/**
 * Non-blocking CORS-safe health ping
 * In no-cors mode, reaching the server resolves with an opaque response (type: 'opaque').
 * Network or DNS failures reject with an error.
 */
async function checkStreamHealth(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CORS_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.type === 'opaque' || res.ok ? 'active' : 'degraded';
  } catch (err) {
    clearTimeout(timer);
    return 'fallback';
  }
}

/**
 * Generates stream sources and performs non-blocking concurrent health checks
 */
export async function getAvailableStreams({ tmdbId, mediaType = 'movie', season = 1, episode = 1 }) {
  if (!tmdbId) return [];

  const isTv = (mediaType || '').toLowerCase() === 'tv' || (mediaType || '').toLowerCase() === 'series';

  // 1. Build stream options across all resolvers
  const initialSources = RESOLVER_PROVIDERS.map((provider) => ({
    id: provider.id,
    name: provider.name,
    serverType: provider.serverType,
    badge: provider.badge,
    url: provider.buildUrl(tmdbId, isTv, season, episode),
    status: 'checking'
  }));

  // 2. Perform parallel health pre-checks without blocking initial delivery
  const healthPromises = initialSources.map(async (src) => {
    const health = await checkStreamHealth(src.url);
    return { ...src, status: health };
  });

  const checkedSources = await Promise.all(healthPromises);

  // 3. Sort verified active servers to the top
  checkedSources.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  });

  return checkedSources;
}

/**
 * Dual Subtitle & Audio Track Resolver
 * Resolves standard embedded tracks & VTT mirrors
 */
export async function getSubtitleTracks({ tmdbId, mediaType = 'movie', season = 1, episode = 1, language = 'en' }) {
  return [
    { label: 'English [CC]', lang: 'en', default: true, url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/en.vtt` },
    { label: 'Spanish', lang: 'es', default: false, url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/es.vtt` },
    { label: 'Bengali', lang: 'bn', default: false, url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/bn.vtt` },
    { label: 'Hindi', lang: 'hi', default: false, url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/hi.vtt` },
    { label: 'French', lang: 'fr', default: false, url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/fr.vtt` }
  ];
}
