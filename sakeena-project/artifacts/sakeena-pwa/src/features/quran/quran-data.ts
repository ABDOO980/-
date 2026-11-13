import { readStorage, surahs as fallbackSurahs, writeStorage, type QuranVerse } from '@/lib/sakeena';

export type QuranSurah = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type QuranVerseDetail = QuranVerse & {
  translation?: string;
  tafsir?: string;
  surah?: number;
};

const CATALOG_KEY = 'sakeena.quran.catalog.v1';
const CACHE_PREFIX = 'sakeena.quran.content.v1.';

// Streaming source: mp3quran.net (public API v3, Hafs 'an 'Asim riwayah).
// Every server URL below was read directly from
// https://www.mp3quran.net/api/v3/reciters and confirmed to cover all 114
// surahs (no silent fallback needed for any of the five).
export type Reciter = { id: string; label: string; server: string; match?: string[]; alts?: string[] };

export const reciters: Reciter[] = [
  { id: 'mishary', label: 'مشاري راشد العفاسي', server: 'https://server8.mp3quran.net/afs/' },
  { id: 'maher', label: 'ماهر المعيقلي', server: 'https://server12.mp3quran.net/maher/' },
  { id: 'basit', label: 'عبد الباسط عبد الصمد', server: 'https://server7.mp3quran.net/basit/' },
  { id: 'sudais', label: 'عبد الرحمن السديس (إمام الحرم المكي)', server: 'https://server11.mp3quran.net/sds/' },
  { id: 'budair', label: 'صلاح البدير (إمام الحرم النبوي)', server: 'https://server6.mp3quran.net/s_bud/' },
  // The five below use a best-known server URL as a fallback; the real server
  // is resolved from the public mp3quran.net API at runtime (see
  // refreshReciterServers), so a wrong fallback is corrected automatically.
  { id: 'dosari', label: 'ياسر الدوسري', server: 'https://server11.mp3quran.net/yasser/', match: ['ياسر', 'الدوسري'], alts: ['https://cdn.mp3quran.net/download/audio/yasser-dosari/r1/'] },
  { id: 'shuraim', label: 'سعود الشريم (إمام الحرم المكي)', server: 'https://server7.mp3quran.net/shur/', match: ['سعود', 'الشريم'] },
  { id: 'husary', label: 'محمود خليل الحصري', server: 'https://server13.mp3quran.net/husr/', match: ['الحصري'] },
  { id: 'minshawi', label: 'محمد صديق المنشاوي', server: 'https://server10.mp3quran.net/minsh/', match: ['المنشاوي'] },
  { id: 'ghamdi', label: 'سعد الغامدي', server: 'https://server7.mp3quran.net/s_gmd/', match: ['سعد', 'الغامدي'] },
];

const SERVERS_KEY = 'sakeena.quran.reciter-servers.v1';
type ServersCache = { at: number; servers: Record<string, string> };
const plain = (text: string) => text.replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

export async function refreshReciterServers(force = false) {
  const cache = readStorage<ServersCache | null>(SERVERS_KEY, null);
  if (!force && cache && Date.now() - cache.at < 7 * 86_400_000) return;
  try {
    let response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar').catch(() => null);
    if (!response?.ok) response = await fetch('https://mp3quran.net/api/v3/reciters?language=ar').catch(() => null);
    if (!response?.ok) return;
    const json = (await response.json()) as { reciters?: { name: string; moshaf?: { name: string; server: string; surah_total: number }[] }[] };
    const servers: Record<string, string> = {};
    for (const reciter of reciters) {
      if (!reciter.match) continue;
      for (const entry of json.reciters ?? []) {
        const name = plain(entry.name);
        if (!reciter.match.every((token) => name.includes(plain(token)))) continue;
        const full = (entry.moshaf ?? []).filter((m) => m.surah_total === 114 && m.server);
        const pick = full.find((m) => m.name.includes('مرتل')) ?? full[0];
        if (pick) { servers[reciter.id] = pick.server.endsWith('/') ? pick.server : `${pick.server}/`; break; }
      }
    }
    writeStorage(SERVERS_KEY, { at: Date.now(), servers } satisfies ServersCache);
  } catch { /* offline — fallback URLs stay in use */ }
}
if (typeof window !== 'undefined') void refreshReciterServers();

// Every address worth trying for a surah, best first (the server reported by
// mp3quran.net, then our built-in one, then any alternates).
export function recitationUrls(surahId: number, reciterId: string): string[] {
  const reciter = reciters.find((item) => item.id === reciterId) ?? reciters[0];
  const override = readStorage<ServersCache | null>(SERVERS_KEY, null)?.servers[reciter.id];
  const file = `${String(surahId).padStart(3, '0')}.mp3`;
  return [...new Set([override, reciter.server, ...(reciter.alts ?? [])].filter((base): base is string => !!base))].map((base) => `${base}${file}`);
}

export function recitationUrl(surahId: number, reciterId: string) {
  return recitationUrls(surahId, reciterId)[0];
}

const DOWNLOADS_KEY = 'sakeena.quran.downloads.v1';

function downloadKey(surahId: number, reciterId: string) {
  return `${reciterId}-${surahId}`;
}

export function isSurahDownloaded(surahId: number, reciterId: string) {
  const downloaded = readStorage<string[]>(DOWNLOADS_KEY, []);
  return downloaded.includes(downloadKey(surahId, reciterId));
}

// Streaming playback is cached by the service worker in a cache that keeps
// ONLY the surah currently playing (see public/sw.js). A surah the user
// explicitly downloads is copied into this separate, persistent cache, which
// the service worker never evicts.
const DOWNLOADS_CACHE = 'sakeena-audio-downloads';

export async function downloadSurahForOffline(surahId: number, reciterId: string) {
  const url = recitationUrl(surahId, reciterId);
  const response = await fetch(url);
  if (!response.ok) throw new Error('تعذر تحميل التلاوة.');
  const cache = await caches.open(DOWNLOADS_CACHE);
  await cache.put(url, response.clone());
  await response.arrayBuffer();
  const downloaded = readStorage<string[]>(DOWNLOADS_KEY, []);
  const key = downloadKey(surahId, reciterId);
  if (!downloaded.includes(key)) writeStorage(DOWNLOADS_KEY, [...downloaded, key]);
}

export async function removeDownloadedSurah(surahId: number, reciterId: string) {
  const key = downloadKey(surahId, reciterId);
  const downloaded = readStorage<string[]>(DOWNLOADS_KEY, []);
  writeStorage(DOWNLOADS_KEY, downloaded.filter((item) => item !== key));
  try {
    const cache = await caches.open(DOWNLOADS_CACHE);
    await cache.delete(recitationUrl(surahId, reciterId));
  } catch { /* cache API unavailable */ }
}

// ---- Text content (alquran.cloud public API) -------------------------------
const API = 'https://api.alquran.cloud/v1';

export type QuranAyahHit = {
  number: number;
  numberInSurah: number;
  text: string;
  surah: { number: number; name: string };
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`Quran request failed (${response.status})`);
  const json = await response.json();
  if (json?.data === undefined) throw new Error('Quran response was empty');
  return json.data as T;
}

function fallbackCatalog(): QuranSurah[] {
  return fallbackSurahs.map((item) => ({
    number: item.id,
    name: item.name,
    englishName: item.latin,
    numberOfAyahs: item.verses,
    revelationType: item.place === 'مكية' ? 'Meccan' : 'Medinan',
  }));
}

// Surah list: network first, then the last saved copy, then the small built-in list.
export async function fetchQuranCatalog(): Promise<QuranSurah[]> {
  try {
    const data = await getJson<QuranSurah[]>('/surah');
    const list = data.map((s) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    }));
    if (list.length) {
      try { writeStorage(CATALOG_KEY, list); } catch { /* storage full */ }
      return list;
    }
  } catch { /* offline — fall through */ }
  const saved = readStorage<QuranSurah[]>(CATALOG_KEY, []);
  return saved.length ? saved : fallbackCatalog();
}

type EditionAyah = { numberInSurah: number; text: string };
type Edition = { ayahs: EditionAyah[] };

// One surah with Uthmani text, English translation (Sahih International) and
// Arabic tafsir (Al-Muyassar). Saved for offline reading after each success.
export async function fetchQuranContent(surahId: number): Promise<{ verses: QuranVerseDetail[]; cached: boolean }> {
  try {
    const editions = await getJson<Edition[]>(`/surah/${surahId}/editions/quran-uthmani,en.sahih,ar.muyassar`);
    const [arabic, english, tafsir] = editions;
    const verses: QuranVerseDetail[] = (arabic?.ayahs ?? []).map((ayah, index) => ({
      id: ayah.numberInSurah,
      arabic: ayah.text,
      translation: english?.ayahs?.[index]?.text,
      tafsir: tafsir?.ayahs?.[index]?.text,
      surah: surahId,
    })).filter((verse) => verse.id > 0 && verse.arabic);
    if (!verses.length) throw new Error('Quran response was empty');
    try { writeStorage(`${CACHE_PREFIX}${surahId}`, verses); } catch { /* storage full */ }
    return { verses, cached: false };
  } catch {
    const saved = readStorage<QuranVerseDetail[]>(`${CACHE_PREFIX}${surahId}`, []);
    return { verses: saved, cached: saved.length > 0 };
  }
}

export async function fetchJuz(juz: number): Promise<QuranAyahHit[]> {
  const data = await getJson<{ ayahs: QuranAyahHit[] }>(`/juz/${juz}/quran-uthmani`);
  return data.ayahs ?? [];
}

export async function searchQuran(query: string): Promise<QuranAyahHit[]> {
  const data = await getJson<{ matches?: QuranAyahHit[] }>(`/search/${encodeURIComponent(query)}/all/quran-uthmani`);
  return (data.matches ?? []).slice(0, 50);
}
