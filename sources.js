/**
 * Nexus / Flex PWA - Silent Waterfall Stream Resolver & Track Bundler
 * File: sources.js
 */

// 1. Waterfall Provider Hierarchy
const WATERFALL_PROVIDERS = [
  {
    id: 'vidsrc-pro',
    name: 'VidSrc Pro',
    referrer: 'https://vidsrc.me/',
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
    buildUrl(id, isTv, season, episode) {
      return isTv
        ? `https://player.smashystream.com/tv/${id}?s=${season}&e=${episode}`
        : `https://player.smashystream.com/movie/${id}`;
    }
  }
];

// 2. Native Bridge Fetch Proxy with Browser Fallback
export async function secureFetch(url, customHeaders = {}) {
  if (typeof window !== 'undefined' && window.NativeAppBridge?.fetch) {
    try {
      const response = await window.NativeAppBridge.fetch(url, {
        method: 'GET',
        headers: {
          'Referer': customHeaders.Referer || 'https://vidsrc.me/',
          'User-Agent': navigator.userAgent || 'Mozilla/5.0 (Linux; Android 14) Flux/1.0',
          ...customHeaders
        }
      });
      return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    } catch (err) {
      console.warn('[sources.js] Native bridge fetch failed, using browser fetch fallback:', err);
    }
  }

  const res = await fetch(url, { headers: customHeaders });
  return res.json();
}

// 3. Subtitle & Audio Track Sourcing
export async function getMediaTracks({ tmdbId, season = 1, episode = 1 }) {
  const subtitles = [
    { language: 'English', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/en.vtt` },
    { language: 'Spanish', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/es.vtt` },
    { language: 'Bengali', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/bn.vtt` },
    { language: 'Hindi', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/hi.vtt` },
    { language: 'French', url: `https://subtitles.wyzie.ru/vtt/${tmdbId}/${season}/${episode}/fr.vtt` }
  ];

  const audioTracks = ['Original Audio', 'English Dub', 'Hindi Dub', 'Spanish Dub'];

  return { subtitles, audioTracks };
}

// 4. Silent Waterfall Source Resolver
export async function getWaterfallStream({ tmdbId, mediaType = 'movie', season = 1, episode = 1, sourceIndex = 0 }) {
  if (!tmdbId) throw new Error('Missing tmdbId for stream resolution');

  const isTv = (mediaType || '').toLowerCase() === 'tv' || (mediaType || '').toLowerCase() === 'series';
  const index = Math.max(0, Math.min(sourceIndex, WATERFALL_PROVIDERS.length - 1));
  const provider = WATERFALL_PROVIDERS[index];

  const streamUrl = provider.buildUrl(tmdbId, isTv, season, episode);
  const { subtitles, audioTracks } = await getMediaTracks({ tmdbId, season, episode });

  return {
    providerId: provider.id,
    providerName: provider.name,
    streamUrl,
    referrerUrl: provider.referrer,
    subtitles,
    audioTracks,
    currentIndex: index,
    nextIndex: index + 1,
    hasMore: index + 1 < WATERFALL_PROVIDERS.length
  };
}

// Universal Global Attachment for compatibility
if (typeof window !== 'undefined') {
  window.NexusSources = {
    WATERFALL_PROVIDERS,
    secureFetch,
    getMediaTracks,
    getWaterfallStream
  };
}
