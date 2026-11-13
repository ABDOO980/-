import { readStorage } from '@/lib/sakeena';

// To add a muezzin: put an mp3 in public/adhan/ and add a line here.
// fajrOnly = the recording is a Fajr adhan (it includes «الصلاة خير من النوم»),
// so it is played for Fajr only and another voice is used for the other prayers.
export type AdhanVoice = { id: string; name: string; file: string; fajrOnly?: boolean };
export const adhanVoices: AdhanVoice[] = [
  { id: 'qatami', name: 'ناصر القطامي', file: '/adhan/adhan-qatami.mp3' },
  { id: 'yamani', name: 'وديع اليمني', file: '/adhan/adhan-yamani.mp3' },
  { id: 'doha-fajr', name: 'أذان الدوحة (قطر) · للفجر', file: '/adhan/adhan-doha-fajr.mp3', fajrOnly: true },
];
const regularVoices = adhanVoices.filter((voice) => !voice.fajrOnly);

// The voice to play for a given prayer, honouring the user's choice.
export function voiceForPrayer(voiceId: string, prayerName: string): AdhanVoice {
  const chosen = adhanVoices.find((voice) => voice.id === voiceId) ?? regularVoices[0];
  return chosen.fajrOnly && prayerName !== 'Fajr' ? regularVoices[0] : chosen;
}

export type AdhanPrefs = { enabled: boolean; voice: string; volume: number };
export const ADHAN_KEY = 'sakeena.adhan.v1';
export const DEFAULT_ADHAN: AdhanPrefs = { enabled: false, voice: 'qatami', volume: 0.8 };
export const getAdhanPrefs = () => ({ ...DEFAULT_ADHAN, ...readStorage<Partial<AdhanPrefs>>(ADHAN_KEY, {}) });

let current: HTMLAudioElement | null = null;
export const isAdhanPlaying = () => !!current && !current.paused;
export function stopAdhan() { if (current) { current.pause(); current.onended = null; current = null; } }

export type PlayResult = 'ok' | 'missing' | 'blocked';
export function playAdhan(file: string, volume: number, onEnd?: () => void): Promise<PlayResult> {
  stopAdhan();
  const audio = new Audio(file);
  audio.volume = Math.min(1, Math.max(0, volume));
  current = audio;
  audio.onended = () => { if (current === audio) current = null; onEnd?.(); };
  return new Promise((resolve) => {
    audio.onerror = () => { if (current === audio) current = null; resolve('missing'); };
    audio.play().then(() => resolve('ok')).catch((error: unknown) => {
      if (current === audio) current = null;
      resolve((error as { name?: string })?.name === 'NotAllowedError' ? 'blocked' : 'missing');
    });
  });
}
