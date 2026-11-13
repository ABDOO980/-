export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerTimes = {
  timings: Record<PrayerName, string>;
  date: string;
  city: string;
  source: 'live' | 'cached' | 'fallback';
};

export type SakeenaSettings = {
  city: string;
  country: string;
  method: string;
  notifications: boolean;
};

export const STORAGE_KEYS = {
  tasbeeh: 'sakeena.tasbeeh.v2',
  reading: 'sakeena.reading',
  wird: 'sakeena.wird',
  theme: 'sakeena.theme.v2',
  settings: 'sakeena.settings',
  prayer: 'sakeena.prayer-cache',
  hawqala: 'sakeena.hawqala.v2',
  fridaySalawat: 'sakeena.friday-salawat.v1',
  prayerNotifications: 'sakeena.prayer-notifications.v1',
} as const;

export const DEFAULT_SETTINGS: SakeenaSettings = {
  city: 'Cairo',
  country: 'Egypt',
  method: '5',
  notifications: false,
};

export const surahs = [
  { id: 1, name: 'الفاتحة', latin: 'Al-Fatihah', verses: 7, place: 'مكية', audio: '001.mp3' },
  { id: 2, name: 'البقرة', latin: 'Al-Baqarah', verses: 286, place: 'مدنية', audio: '002.mp3' },
  { id: 3, name: 'آل عمران', latin: 'Aal-E-Imran', verses: 200, place: 'مدنية', audio: '003.mp3' },
  { id: 4, name: 'النساء', latin: 'An-Nisa', verses: 176, place: 'مدنية', audio: '004.mp3' },
  { id: 18, name: 'الكهف', latin: 'Al-Kahf', verses: 110, place: 'مكية', audio: '018.mp3' },
  { id: 36, name: 'يس', latin: 'Ya-Sin', verses: 83, place: 'مكية', audio: '036.mp3' },
  { id: 55, name: 'الرحمن', latin: 'Ar-Rahman', verses: 78, place: 'مدنية', audio: '055.mp3' },
  { id: 67, name: 'الملك', latin: 'Al-Mulk', verses: 30, place: 'مكية', audio: '067.mp3' },
  { id: 112, name: 'الإخلاص', latin: 'Al-Ikhlas', verses: 4, place: 'مكية', audio: '112.mp3' },
];

export const readingVerses = [
  { id: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
  { id: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: '[All] praise is [due] to Allah, Lord of the worlds.' },
  { id: 3, arabic: 'الرَّحْمَنِ الرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful.' },
  { id: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovereign of the Day of Recompense.' },
  { id: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.' },
  { id: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path.' },
  { id: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have earned Your anger or of those who are astray.' },
];

export type QuranVerse = {
  id: number;
  arabic: string;
  translation?: string;
};

export async function fetchSurahVerses(surahId: number): Promise<QuranVerse[]> {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
  if (!response.ok) throw new Error('Quran request failed');
  const json = await response.json();
  const ayahs = Array.isArray(json?.data?.ayahs) ? json.data.ayahs : [];
  if (!ayahs.length) throw new Error('Quran response was empty');
  return ayahs.map((ayah: { numberInSurah?: number; text?: string }) => ({
    id: ayah.numberInSurah ?? 0,
    arabic: ayah.text ?? '',
  })).filter((verse: QuranVerse) => verse.id > 0 && verse.arabic);
}

const baseAdhkarGroups = [
  { id: 'situations', title: 'أدعية المواقف', subtitle: 'دعاء كل حالة تمر بها', count: 3, icon: 'hands' },
  { id: 'quranic-duas', title: 'أدعية قرآنية', subtitle: 'دعوات من كتاب الله', count: 3, icon: 'book' },
  { id: 'morning', title: 'أذكار الصباح', subtitle: 'ابدأ يومك بذكر الله', count: 3, icon: 'sunrise' },
  { id: 'evening', title: 'أذكار المساء', subtitle: 'اختم يومك بسكينة', count: 3, icon: 'moon' },
  { id: 'wake', title: 'أذكار الاستيقاظ من النوم', subtitle: 'ابدأ صباحك بحمد الله', count: 1, icon: 'sunrise' },
  { id: 'after-prayer', title: 'بعد الصلاة', subtitle: 'أذكار لا تنقطع', count: 2, icon: 'hands' },
  { id: 'sleep', title: 'أذكار النوم', subtitle: 'طمأنينة قبل الغفوة', count: 2, icon: 'star' },
  { id: 'prophet', title: 'الصلاة على النبي', subtitle: 'نور وبركة في يومك', count: 1, icon: 'star' },
];

export const dhikrItems = [
  { id: 1, text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ', note: 'من أحب الكلام إلى الله', target: 33 },
  { id: 2, text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ', note: 'الصلاة على النبي', target: 10 },
  { id: 3, text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', note: 'استغفار اليوم', target: 100 },
];

export type { DhikrEntry } from './adhkar-data';
import type { DhikrEntry } from './adhkar-data';
import { extraAdhkarGroups, extraDhikrByGroup } from './adhkar-data';

const baseDhikrByGroup: Record<string, DhikrEntry[]> = {
  situations: [
    { id: 1, text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', note: 'دعاء العافية', target: 1 },
    { id: 2, text: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', note: 'عند الهم والكرب', target: 7 },
    { id: 3, text: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', note: 'طلب الرزق', target: 1 },
  ],
  'quranic-duas': [
    { id: 1, text: 'رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي', note: 'طه · ٢٥–٢٦', target: 1 },
    { id: 2, text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', note: 'البقرة · ٢٠١', target: 3 },
    { id: 3, text: 'رَبِّ زِدْنِي عِلْمًا', note: 'طه · ١١٤', target: 3 },
  ],
  morning: [
    { id: 1, text: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', note: 'آية الكرسي', target: 1 },
    { id: 2, text: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا', note: 'ذكر الرضا بالله', target: 3 },
    { id: 3, text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', note: 'ذكر الحفظ', target: 3 },
  ],
  evening: [
    { id: 1, text: 'آمَنْتُ بِاللَّهِ وَحْدَهُ، وَكَفَرْتُ بِمَا سِوَاهُ', note: 'تجديد الإيمان', target: 1 },
    { id: 2, text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', note: 'ذكر الحفظ', target: 3 },
    { id: 3, text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', note: 'من أحب الكلام إلى الله', target: 100 },
  ],
  wake: [
    { id: 1, text: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', note: 'ذكر الاستيقاظ', target: 1 },
  ],
  'after-prayer': [
    { id: 1, text: 'أَسْتَغْفِرُ اللَّهَ', note: 'بعد الصلاة', target: 3 },
    { id: 2, text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالإِكْرَامِ', note: 'ذكر بعد الصلاة', target: 1 },
  ],
  sleep: [
    { id: 1, text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', note: 'ذكر النوم', target: 1 },
    { id: 2, text: 'سُبْحَانَ اللَّهِ', note: 'تسبيح قبل النوم', target: 33 },
  ],
  prophet: [
    { id: 1, text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ', note: 'الصلاة على النبي', target: 10 },
  ],
};

export const dhikrItemsByGroup: Record<string, DhikrEntry[]> = { ...baseDhikrByGroup, ...extraDhikrByGroup };

export const adhkarGroups = [
  ...baseAdhkarGroups,
  ...extraAdhkarGroups,
].map((group) => ({ ...group, count: dhikrItemsByGroup[group.id]?.length ?? 0 }));

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

const DEVICE_ID_KEY = 'sakeena.device-id';

// The one persistent anonymous identity for this device/browser — reused by
// dua-wall's visitor system and by every call to the backend API (sent as
// the `x-device-id` header the server's resolveUser middleware expects).
export function getDeviceId() {
  const stored = readStorage<string | null>(DEVICE_ID_KEY, null);
  if (stored) return stored;
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  writeStorage(DEVICE_ID_KEY, generated);
  return generated;
}

export function timeToMinutes(time: string) {
  const [hour, minute] = time.split(' ')[0].split(':').map(Number);
  const hasMeridiem = /(?:am|pm|ص|م)/i.test(time);
  if (!hasMeridiem) return hour * 60 + minute;
  const isPm = /(?:pm|م)/i.test(time);
  return ((hour % 12) + (isPm ? 12 : 0)) * 60 + minute;
}

export function getCairoMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

export function formatTime(time: string) {
  const [hourString, minute] = time.split(' ')[0].split(':');
  const hour = Number(hourString);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'م' : 'ص'}`;
}

export function getFallbackPrayerTimes(city: string): PrayerTimes {
  return {
    timings: { Fajr: '04:25', Sunrise: '05:58', Dhuhr: '12:56', Asr: '16:32', Maghrib: '19:54', Isha: '21:22' },
    date: new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date()),
    city,
    source: 'fallback',
  };
}

export function getNextPrayer(timings: Record<PrayerName, string>, date = new Date()) {
  const current = getCairoMinutes(date);
  const ordered: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const next = ordered.find((name) => timeToMinutes(timings[name]) > current) ?? 'Fajr';
  const minutes = timeToMinutes(timings[next]);
  const delta = minutes > current ? minutes - current : (24 * 60 - current) + minutes;
  return { name: next, minutes: delta };
}

export function getPrayerNameArabic(name: PrayerName) {
  return name === 'Fajr' ? 'الفجر'
    : name === 'Sunrise' ? 'الشروق'
      : name === 'Dhuhr' ? 'الظهر'
        : name === 'Asr' ? 'العصر'
          : name === 'Maghrib' ? 'المغرب'
            : 'العشاء';
}

export function getPrayerBenefit(name: PrayerName) {
  const benefits: Record<PrayerName, string> = {
    Fajr: 'من صلى الصبح في جماعة فهو في ذمة الله» (رواه مسلم',
    Sunrise: 'صلاة الضحى صدقة عن كل مفصل من مفاصل الجسد» (رواه مسلم',
    Dhuhr: 'رحم الله امرأً صلى قبل الظهر أربعًا وبعدها أربعًا» (رواه الترمذي',
    Asr: 'من صلى البردين دخل الجنة» (متفق عليه',
    Maghrib: 'الصلاة على وقتها من أحب الأعمال إلى الله» (متفق عليه',
    Isha: 'من صلى العشاء في جماعة فكأنما قام نصف الليل» (رواه مسلم',
  };
  return `«${benefits[name]})`;
}

export function isFridayWindow(maghribTime: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return weekday === 'Friday' || (weekday === 'Thursday' && hour * 60 + minute >= timeToMinutes(maghribTime));
}

function normalizeTimings(timings: Record<string, string>): Record<PrayerName, string> {
  return {
    Fajr: timings.Fajr,
    Sunrise: timings.Sunrise,
    Dhuhr: timings.Dhuhr,
    Asr: timings.Asr,
    Maghrib: timings.Maghrib,
    Isha: timings.Isha,
  };
}

export async function fetchPrayerTimes(settings: SakeenaSettings, coords?: GeolocationCoordinates): Promise<PrayerTimes> {
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const url = coords
    ? `https://api.aladhan.com/v1/timings/${date}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${settings.method}`
    : `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}&method=${settings.method}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Prayer timing request failed');
    const json = await response.json();
    const result: PrayerTimes = {
      timings: normalizeTimings(json.data.timings),
      date: json.data.date.readable,
      city: coords ? 'موقعي الحالي' : settings.city,
      source: 'live',
    };
    writeStorage(STORAGE_KEYS.prayer, result);
    return result;
  } catch {
    const cached = readStorage<PrayerTimes | null>(STORAGE_KEYS.prayer, null);
    if (cached) return { ...cached, source: 'cached' };
    return getFallbackPrayerTimes(settings.city);
  }
}

export function calculateQiblaBearing(latitude: number, longitude: number) {
  const kaabaLat = 21.422487 * Math.PI / 180;
  const kaabaLon = 39.826206 * Math.PI / 180;
  const userLat = latitude * Math.PI / 180;
  const deltaLon = kaabaLon - longitude * Math.PI / 180;
  const y = Math.sin(deltaLon);
  const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(deltaLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function registerSakeenaServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  }
}

export function speakArabic(text: string) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
  return true;
}

export async function shareOrCopy(data: { title?: string; text?: string; url?: string }) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return 'shared' as const;
    } catch {
      return 'cancelled' as const;
    }
  }
  const value = [data.title, data.text, data.url].filter(Boolean).join('\n');
  if (navigator.clipboard && value) {
    try {
      await navigator.clipboard.writeText(value);
      return 'copied' as const;
    } catch {
      return 'unsupported' as const;
    }
  }
  return 'unsupported' as const;
}