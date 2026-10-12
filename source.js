const SOURCE_SITES = [
  {
    id: "vidsrc",
    name: "VidSrc",
    enabled: true,
    broken: false,
    searchUrl: "https://vidsrc.to/embed/{type}/{id}",
    resultPattern: "",
    buildWatchUrl(type, id, season, episode) {
      if (type === 'tv' && season && episode) {
        return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
      }
      return `https://vidsrc.to/embed/movie/${id}`;
    }
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    enabled: true,
    broken: false,
    searchUrl: "https://multiembed.mov/?video_id={id}&tmdb=1",
    resultPattern: "",
    buildWatchUrl(type, id, season, episode) {
      if (type === 'tv' && season && episode) {
        return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
    }
  }
];
