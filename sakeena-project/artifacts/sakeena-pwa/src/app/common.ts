import { Home as HomeIcon, BookOpen, Sparkles, Trophy, Users, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { readStorage, writeStorage, type SakeenaSettings, STORAGE_KEYS, DEFAULT_SETTINGS, type PrayerTimes, getFallbackPrayerTimes, fetchPrayerTimes } from '@/lib/sakeena';

export const navItems = [
  { href: '/', label: 'الرئيسية', icon: HomeIcon },
  { href: '/quran', label: 'المصحف', icon: BookOpen },
  { href: '/adhkar', label: 'الأذكار', icon: Sparkles },
  { href: '/quiz', label: 'مسابقة', icon: Trophy },
  { href: '/ambassadors', label: 'السفراء', icon: Users },
  { href: '/more', label: 'المزيد', icon: MoreHorizontal },
];

export function isNavActive(href: string, location: string) {
  if (href === '/') return location === '/';
  if (href === '/more') {
    // Every route reached only through the "More" hub (tool details, hadith,
    // fatwas, settings, weekly-challenge, group-khatmah, ...) doesn't share
    // the /more prefix, so without this the tab would go dark on all of
    // them. Anything not claimed by another top-level tab belongs to More.
    const otherPrefixes = navItems.filter((item) => item.href !== '/' && item.href !== '/more').map((item) => item.href);
    return location !== '/' && !otherPrefixes.some((prefix) => location.startsWith(prefix));
  }
  return location.startsWith(href);
}

export function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState(() => readStorage(key, fallback));
  useEffect(() => writeStorage(key, value), [key, value]);
  return [value, setValue] as const;
}

export function usePrayerTimes() {
  const [settings] = useStoredState<SakeenaSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [prayer, setPrayer] = useState<PrayerTimes>(() => readStorage<PrayerTimes | null>(STORAGE_KEYS.prayer, null) ?? getFallbackPrayerTimes(settings.city));
  const [loading, setLoading] = useState(true);
  const [usingLocation, setUsingLocation] = useState(false);
  const load = async (coords?: GeolocationCoordinates) => {
    setLoading(true);
    const result = await fetchPrayerTimes(settings, coords);
    setPrayer(result);
    setLoading(false);
  };
  useEffect(() => {
    let cancelled = false;
    let settled = false;
    let fallbackTimer: number | undefined;
    setLoading(true);
    const loadCityFallback = async () => {
      const result = await fetchPrayerTimes(settings);
      if (!cancelled && !settled) {
        settled = true;
        setPrayer(result);
        setLoading(false);
      }
    };
    fallbackTimer = window.setTimeout(() => {
      void loadCityFallback();
    }, 1200);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          window.clearTimeout(fallbackTimer);
          if (!cancelled) {
            settled = true;
            setUsingLocation(true);
            setPrayer(await fetchPrayerTimes(settings, position.coords));
            setLoading(false);
          }
        },
        () => {
          window.clearTimeout(fallbackTimer);
          void loadCityFallback();
        },
        { timeout: 7000, maximumAge: 1000 * 60 * 60 * 6 },
      );
    } else {
      window.clearTimeout(fallbackTimer);
      void loadCityFallback();
    }
    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [settings]);
  return { prayer, loading, reload: load, usingLocation };
}
