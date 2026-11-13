import { Pause, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type AudioRequest = { src: string; title: string; subtitle?: string; loop?: boolean; fallbacks?: string[]; refresh?: () => Promise<string[]> };

export function requestSakeenaAudio(request: AudioRequest) {
  window.dispatchEvent(new CustomEvent<AudioRequest>('sakeena:audio-request', { detail: request }));
}

export default function FloatingAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [request, setRequest] = useState<AudioRequest | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const queueRef = useRef<string[]>([]);
  const triedRef = useRef<Set<string>>(new Set());
  const refreshedRef = useRef(false);
  const requestRef = useRef<AudioRequest | null>(null);

  // Plays the next untried address; when none are left, asks for a fresh list once.
  const playNext = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    let url = queueRef.current.shift();
    while (url && triedRef.current.has(url)) url = queueRef.current.shift();
    if (!url && requestRef.current?.refresh && !refreshedRef.current) {
      refreshedRef.current = true;
      try { queueRef.current = (await requestRef.current.refresh()).filter((item) => !triedRef.current.has(item)); } catch { /* keep going */ }
      url = queueRef.current.shift();
    }
    if (!url) { setPlaying(false); setError('تعذّر تشغيل هذه التلاوة الآن. جرّب قارئًا آخر أو أعد المحاولة لاحقًا.'); return; }
    triedRef.current.add(url);
    audio.src = url;
    audio.loop = Boolean(requestRef.current?.loop);
    audio.play().then(() => setPlaying(true)).catch((reason: unknown) => { if ((reason as { name?: string })?.name === 'NotAllowedError') setPlaying(false); });
  };

  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<AudioRequest>).detail;
      setRequest(detail);
      setProgress(0);
      setError('');
      requestRef.current = detail;
      queueRef.current = [detail.src, ...(detail.fallbacks ?? [])];
      triedRef.current = new Set();
      refreshedRef.current = false;
      window.setTimeout(() => {
        const audio = audioRef.current;
        if (!audio) return;
        void playNext();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: detail.title,
            artist: detail.subtitle ?? 'مشغل سَكينة',
            album: 'سَكينة',
            artwork: [{ src: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' }],
          });
        }
      }, 0);
    };
    window.addEventListener('sakeena:audio-request', onRequest);
    return () => window.removeEventListener('sakeena:audio-request', onRequest);
  }, []);

  // Lock-screen / notification-shade transport controls (play, pause, seek)
  // stay wired to this same <audio> element for as long as the player is
  // mounted, regardless of which track is currently loaded.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const audio = audioRef.current;
    const setPlayPause = (isPlaying: boolean) => {
      if (!audio) return;
      if (isPlaying) void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      else { audio.pause(); setPlaying(false); }
    };
    navigator.mediaSession.setActionHandler('play', () => setPlayPause(true));
    navigator.mediaSession.setActionHandler('pause', () => setPlayPause(false));
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audio) audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audio && details.seekTime != null) audio.currentTime = details.seekTime;
    });
    navigator.mediaSession.setActionHandler('stop', () => { setPlayPause(false); setRequest(null); });
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('stop', null);
    };
  }, [request]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    if (duration > 0 && Number.isFinite(duration) && 'setPositionState' in navigator.mediaSession) {
      try { navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(progress, duration) }); } catch { /* not seekable yet */ }
    }
  }, [playing, duration, progress]);

  if (!request) return null;
  const audio = audioRef.current;
  const toggle = () => {
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };
  return (
    <div className="fixed inset-x-3 bottom-[76px] z-40 mx-auto max-w-xl rounded-2xl border border-accent/40 bg-primary p-3 text-primary-foreground shadow-2xl md:bottom-5" data-testid="floating-audio-player">
      <audio
        ref={audioRef}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => {
          const current = event.currentTarget.currentTime;
          setProgress(current);
          window.dispatchEvent(new CustomEvent('sakeena:audio-progress', { detail: { progress: current, duration: event.currentTarget.duration } }));
        }}
        onEnded={() => setPlaying(false)}
        onError={() => { if (audioRef.current?.getAttribute('src')) void playNext(); }}
        onPlaying={() => setError('')}
      />
      <div className="flex items-center gap-3">
        <button onClick={toggle} className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground" aria-label={playing ? 'إيقاف التلاوة' : 'تشغيل التلاوة'}>
          {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{request.title}</p>
          <p className="truncate text-[0.625rem] opacity-65">{request.subtitle ?? 'مشغل سَكينة'}</p>
          {error && <p className="mt-1 text-[0.6875rem] leading-4 text-accent" role="alert" data-testid="text-audio-error">{error}</p>}
          <input className="mt-1 h-1 w-full accent-accent" type="range" min="0" max={duration || 1} step=".1" value={progress} onChange={(event) => { const next = Number(event.target.value); setProgress(next); if (audioRef.current) audioRef.current.currentTime = next; }} aria-label="موضع الصوت" />
        </div>
        <button onClick={() => { audio?.pause(); setRequest(null); setPlaying(false); }} className="rounded-lg p-2 opacity-70 hover:opacity-100" aria-label="إغلاق مشغل الصوت"><X size={16} /></button>
      </div>
    </div>
  );
}