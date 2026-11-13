// Turns a YouTube link (video, live, short link or channel) into an embeddable URL.
const PARAMS = 'rel=0&modestbranding=1&playsinline=1';

export function toEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0] || null;
  else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    id = url.searchParams.get('v');
    if (!id) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'channel' && /^UC[\w-]{20,}$/.test(parts[1] ?? '')) return `https://www.youtube.com/embed/live_stream?channel=${parts[1]}&${PARAMS}`;
      if (['live', 'embed', 'shorts'].includes(parts[0] ?? '')) id = parts[1] ?? null;
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?${PARAMS}` : null;
}

// Official channels of the Saudi Broadcasting Authority, streaming the Haramain 24/7.
// Makkah: قناة القرآن الكريم (@SaudiQuranTv). Madinah: قناة السنة النبوية (@SaudiSunnahTv).
export const DEFAULT_CHANNELS = { makkah: 'UCos52azQNBgW63_9uDJoPDA', madinah: 'UCROKYPep-UuODNwyipe6JMw' } as const;
export const channelEmbedUrl = (channelId: string) => `https://www.youtube.com/embed/live_stream?channel=${channelId}&${PARAMS}`;

// Direct HLS streams of the same two official channels, tried before YouTube.
// These URLs are published by the community (not by the broadcaster) and can
// change; the player moves on to the next source, then to the YouTube embed.
// (The first Madinah URL follows the Makkah URL's pattern and is unverified.)
export const LIVE_SOURCES = {
  makkah: [
    'https://win.holol.com/live/quran/playlist.m3u8',
    'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8',
    'https://cdnamd-hls-globecast.akamaized.net/live/ramdisk/saudi_quran/hls1/saudi_quran.m3u8',
  ],
  madinah: [
    'https://win.holol.com/live/sunnah/playlist.m3u8',
    'https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8',
    'https://cdnamd-hls-globecast.akamaized.net/live/ramdisk/saudi_sunnah/hls1/saudi_sunnah.m3u8',
  ],
} as const;

export const searchLiveUrl = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgJAAQ%3D%3D`;
