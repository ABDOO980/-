import { Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readStorage, writeStorage } from '@/lib/sakeena';
import { ADHAN_KEY, adhanVoices, getAdhanPrefs, isAdhanPlaying, playAdhan, stopAdhan, voiceForPrayer, type AdhanPrefs } from '@/lib/adhan';
import { useStoredState, usePrayerTimes } from '@/app/common';

const PLAYED_KEY = 'sakeena.adhan.played.v1';
const toMinutes = (time: string) => { const [h, m] = time.split(':'); return parseInt(h, 10) * 60 + parseInt(m, 10); };

// Plays the chosen adhan when a prayer time begins. Works while the app is open
// (browsers do not allow web apps to play audio in the background).
export function AdhanScheduler() {
  const { prayer } = usePrayerTimes();
  useEffect(() => {
    const check = () => {
      const prefs = getAdhanPrefs();
      if (!prefs.enabled) return;
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const played = readStorage<Record<string, boolean>>(PLAYED_KEY, {});
      for (const [name, time] of Object.entries(prayer.timings)) {
        if (name === 'Sunrise' || typeof time !== 'string' || !/^\d{1,2}:\d{2}/.test(time)) continue;
        const key = `${day}-${name}`;
        if (toMinutes(time) === minutes && !played[key]) {
          writeStorage(PLAYED_KEY, { [key]: true, ...Object.fromEntries(Object.entries(played).filter(([k]) => k.startsWith(day))) });
          void playAdhan(voiceForPrayer(prefs.voice, name).file, prefs.volume);
          break;
        }
      }
    };
    check();
    const timer = window.setInterval(check, 15_000);
    return () => window.clearInterval(timer);
  }, [prayer]);
  return null;
}

export function AdhanSettings() {
  const [prefs, setPrefs] = useStoredState<AdhanPrefs>(ADHAN_KEY, getAdhanPrefs());
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  // undefined = still checking. A missing file would otherwise be answered with
  // the app's HTML page, so we also check that the response really is audio.
  const [available, setAvailable] = useState<Record<string, boolean | undefined>>({});
  useEffect(() => () => stopAdhan(), []);
  useEffect(() => {
    let cancelled = false;
    adhanVoices.forEach((voice) => {
      fetch(voice.file, { method: 'HEAD' })
        .then((r) => r.ok && (r.headers.get('content-type') ?? '').includes('audio'))
        .catch(() => false)
        .then((ok) => { if (!cancelled) setAvailable((current) => ({ ...current, [voice.id]: ok })); });
    });
    return () => { cancelled = true; };
  }, []);
  const anyAvailable = Object.values(available).some(Boolean);

  const preview = async (id: string) => {
    if (previewing === id && isAdhanPlaying()) { stopAdhan(); setPreviewing(null); return; }
    const voice = adhanVoices.find((v) => v.id === id) ?? adhanVoices[0];
    setMessage(''); setPreviewing(id);
    const result = await playAdhan(voice.file, prefs.volume, () => setPreviewing(null));
    if (result === 'missing') { setPreviewing(null); setMessage('ملف هذا الصوت غير موجود بعد. أضفه في مجلد public/adhan ثم أعد المحاولة.'); }
    if (result === 'blocked') { setPreviewing(null); setMessage('منع المتصفح تشغيل الصوت. اضغط مرة أخرى.'); }
  };

  return (
    <section className="mt-5 rounded-[2rem] border border-card-border bg-card p-6 md:p-8" data-testid="section-adhan-settings">
      <h2 className="mb-5 text-lg font-semibold">صوت الأذان</h2>
      <label className="mb-5 flex items-center justify-between rounded-xl bg-secondary/60 p-4 text-sm">
        <span><strong className="block">تشغيل الأذان عند دخول الوقت</strong><small className="mt-1 block text-xs leading-5 text-muted-foreground">يعمل أثناء فتح التطبيق، فالمتصفح لا يسمح بتشغيل الصوت في الخلفية.</small></span>
        <input type="checkbox" checked={prefs.enabled} onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })} className="size-4 accent-primary" data-testid="input-adhan-enabled" />
      </label>
      <p className="mb-2 text-xs text-muted-foreground">اختر المؤذن (أذان الفجر الخاص يُشغَّل في الفجر فقط، وباقي الصلوات بالمؤذن الذي تختاره):</p>
      <div className="space-y-2" role="radiogroup" aria-label="اختيار المؤذن">
        {adhanVoices.map((voice) => {
          const selected = prefs.voice === voice.id;
          return (
            <div key={voice.id} className={`flex items-center gap-3 rounded-xl border p-3 ${selected ? 'border-accent bg-accent/10' : 'border-card-border'}`}>
              <button type="button" role="radio" aria-checked={selected} onClick={() => setPrefs({ ...prefs, voice: voice.id })} className="flex flex-1 items-center gap-3 text-right" data-testid={`radio-adhan-${voice.id}`}>
                <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${selected ? 'border-accent' : 'border-border'}`}>{selected && <span className="size-2.5 rounded-full bg-accent" />}</span>
                <span className="text-sm font-semibold">{voice.name}</span>
                {voice.fajrOnly && <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.625rem] text-muted-foreground">الفجر فقط</span>}
                {available[voice.id] === false && <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.625rem] text-muted-foreground">الملف غير مضاف</span>}
              </button>
              <button type="button" onClick={() => void preview(voice.id)} className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-30" aria-label={previewing === voice.id ? 'إيقاف' : 'استماع'} disabled={available[voice.id] === false} data-testid={`button-adhan-preview-${voice.id}`}>{previewing === voice.id ? <Pause size={16} /> : <Play size={16} />}</button>
            </div>
          );
        })}
      </div>
      <label className="mt-4 block text-xs text-muted-foreground">مستوى الصوت
        <input type="range" min="0.1" max="1" step="0.05" value={prefs.volume} onChange={(e) => setPrefs({ ...prefs, volume: Number(e.target.value) })} className="mt-2 w-full accent-primary" data-testid="input-adhan-volume" />
      </label>
      {Object.keys(available).length === adhanVoices.length && !anyAvailable && (
        <p className="mt-3 rounded-xl border border-accent/50 p-3 text-xs leading-6" role="note">ملفات الأذان غير موجودة في المجلد <code dir="ltr">public/adhan</code>. أضف ملفات mp3 وسجّلها في <code dir="ltr">src/lib/adhan.ts</code>.</p>
      )}
      {message && <p className="mt-3 rounded-xl bg-secondary p-3 text-xs leading-6" role="status">{message}</p>}
    </section>
  );
}
