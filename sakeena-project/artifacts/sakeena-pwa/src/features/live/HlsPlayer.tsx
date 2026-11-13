import { useEffect, useRef, useState } from 'react';

type HlsInstance = { loadSource: (url: string) => void; attachMedia: (video: HTMLVideoElement) => void; on: (event: string, handler: (event: string, data: { fatal?: boolean }) => void) => void; destroy: () => void };
type HlsStatic = { new (config?: Record<string, unknown>): HlsInstance; isSupported: () => boolean; Events: { ERROR: string } };

const HLS_JS = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
let loader: Promise<HlsStatic> | null = null;
function loadHls(): Promise<HlsStatic> {
  loader ??= new Promise<HlsStatic>((resolve, reject) => {
    const existing = (window as unknown as { Hls?: HlsStatic }).Hls;
    if (existing) { resolve(existing); return; }
    const script = document.createElement('script');
    script.src = HLS_JS; script.async = true;
    script.onload = () => { const lib = (window as unknown as { Hls?: HlsStatic }).Hls; if (lib) resolve(lib); else { loader = null; reject(new Error('hls')); } };
    script.onerror = () => { loader = null; reject(new Error('hls')); };
    document.head.appendChild(script);
  });
  return loader;
}

// Plays the first working HLS source inside the page; calls onFail when none works.
export function HlsPlayer({ sources, title, onFail }: { sources: readonly string[]; title: string; onFail: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const failRef = useRef(onFail); // keep the latest callback without restarting the stream
  failRef.current = onFail;

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    if (index >= sources.length) { failRef.current(); return undefined; }
    let cancelled = false; let hls: HlsInstance | null = null;
    const next = () => { if (!cancelled) setIndex((i) => i + 1); };
    const timer = window.setTimeout(next, 15_000);
    const onPlaying = () => { window.clearTimeout(timer); setPlaying(true); };
    setPlaying(false);
    video.muted = true; // browsers only autoplay muted video; the viewer can unmute
    video.addEventListener('playing', onPlaying);
    const url = sources[index];
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url; video.addEventListener('error', next, { once: true }); void video.play().catch(() => undefined);
    } else {
      loadHls().then((Hls) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { next(); return; }
        hls = new Hls({ lowLatencyMode: true });
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) next(); });
        hls.loadSource(url); hls.attachMedia(video);
        void video.play().catch(() => undefined);
      }).catch(next);
    }
    return () => {
      cancelled = true; window.clearTimeout(timer);
      video.removeEventListener('playing', onPlaying);
      hls?.destroy(); video.removeAttribute('src'); video.load();
    };
  }, [index, sources]);

  return (
    <div className="relative aspect-video w-full bg-black">
      <video ref={ref} className="size-full" controls playsInline muted title={title} aria-label={title} data-testid="video-live" />
      {!playing && <p className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-white/80">جارٍ الاتصال بالبث...</p>}
    </div>
  );
}
