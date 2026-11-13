import { VerseSkeleton } from '@/components/skeleton';
import { Pause, Play, Volume2, Search, BookOpen, ChevronLeft, ArrowRight, Share2, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'wouter';
import { surahs, readStorage, writeStorage, readingVerses, STORAGE_KEYS, type QuranVerse, fetchSurahVerses, shareOrCopy } from '@/lib/sakeena';
import { useStoredState } from '@/app/common';
import { Header } from '@/app/layout';

export function AudioPlayer({ surahId }: { surahId: number }) {
  const surah = surahs.find((item) => item.id === surahId) ?? surahs[0];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(() => readStorage<number>('sakeena.audio-position', 0));
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioUrl = `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${surah.audio}`;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => { setPosition(audio.currentTime); writeStorage('sakeena.audio-position', audio.currentTime); };
    const ended = () => setPlaying(false);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', ended);
    return () => { audio.removeEventListener('timeupdate', update); audio.removeEventListener('ended', ended); };
  }, []);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; }, [speed]);
  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); } else { await audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };
  return (
    <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
      <audio ref={audioRef} src={audioUrl} preload="metadata" onLoadedMetadata={(event) => { const audio = event.currentTarget; setDuration(audio.duration); audio.currentTime = Math.min(readStorage('sakeena.audio-position', 0), audio.duration || 0); }} />
      <div className="flex items-center gap-3">
        <button onClick={toggle} className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary" aria-label={playing ? 'إيقاف التلاوة' : 'تشغيل التلاوة'} data-testid="button-audio-toggle">{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
        <div className="min-w-0 flex-1"><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold">تلاوة {surah.name}</span><span className="font-mono-app text-[0.625rem] opacity-65">{Math.floor(position / 60)}:{String(Math.floor(position % 60)).padStart(2, '0')}</span></div><input type="range" min="0" max={duration || 1} step=".1" value={position} onChange={(event) => { const next = Number(event.target.value); setPosition(next); if (audioRef.current) audioRef.current.currentTime = next; }} className="h-1 w-full accent-accent" aria-label="موضع التلاوة" data-testid="input-audio-seek" /></div>
        <Volume2 size={16} className="hidden opacity-60 sm:block" />
        <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="rounded-lg border-0 bg-primary-foreground/10 px-1.5 py-1 text-[0.625rem] text-primary-foreground" aria-label="سرعة التلاوة" data-testid="select-audio-speed"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select>
      </div>
    </div>
  );
}

export function Quran() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useStoredState<number[]>('sakeena.quran-favorites', [1]);
  const visibleVerses = readingVerses.filter((verse) => `${verse.id} ${verse.arabic} ${verse.translation}`.toLowerCase().includes(query.toLowerCase()));
  const visibleSurahs = surahs.filter((surah) => {
    const matchesQuery = `${surah.name} ${surah.latin}`.toLowerCase().includes(query.toLowerCase());
    if (tab === 'favorites') return matchesQuery && favorites.includes(surah.id);
    if (tab === 'wird') return matchesQuery && [1, 36, 67].includes(surah.id);
    if (tab === 'memorized') return matchesQuery && [1].includes(surah.id);
    if (tab === 'last') return matchesQuery && surah.id === 1;
    return matchesQuery;
  });
  return (
    <div className="rise-in">
      <Header title="القرآن الكريم" />
      <div className="mb-4 flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card px-4 py-3">
        <Search size={19} className="text-muted-foreground" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="ابحث باسم السورة أو رقمها..." aria-label="البحث في السور والآيات" data-testid="input-quran-search" />
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {[['verses', 'بحث الآيات'], ['favorites', 'المفضلة'], ['wird', 'وردي'], ['memorized', 'المحفّظ'], ['last', 'آخر قراءة'], ['all', 'كل السور']].map(([value, label], index) => <button key={value} onClick={() => setTab(value)} className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[0.6875rem] ${tab === value ? 'border-accent bg-secondary text-accent' : 'border-border bg-card text-muted-foreground'}`} data-testid={`button-quran-tab-${index}`}>{label}</button>)}
      </div>
      {tab !== 'verses' && <Link href="/quran/1" className="mb-4 flex items-center justify-between rounded-[1.25rem] border border-accent bg-secondary/70 px-4 py-4 text-right" data-testid="link-quran-resume">
        <span className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-card text-accent"><BookOpen size={20} /></span><span><strong className="block text-base">تابع القراءة</strong><small className="mt-1 block text-xs text-muted-foreground">سورة الفاتحة · صفحة ١</small></span></span><ChevronLeft size={21} className="text-accent" />
      </Link>}
      {tab === 'verses' ? <div className="space-y-3" data-testid="quran-verse-results">{visibleVerses.map((verse) => <button key={verse.id} onClick={() => setLocation('/quran/1')} className="flex w-full items-start gap-4 rounded-[1.25rem] border border-card-border bg-card p-4 text-right transition hover:border-accent"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-mono-app text-[0.625rem] text-accent">{verse.id}</span><span><strong className="font-arabic text-xl font-normal leading-[2]">{verse.arabic}</strong><span className="mt-2 block text-xs leading-5 text-muted-foreground">{verse.translation}</span></span></button>)}</div> : <div className="space-y-3">
        {visibleSurahs.map((surah, index) => (
          <div key={surah.id} role="button" tabIndex={0} onClick={() => setLocation(`/quran/${surah.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setLocation(`/quran/${surah.id}`); }} className="group flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card p-3.5 text-right transition hover:border-accent" data-testid={`button-surah-${surah.id}`}>
            <span className="grid size-12 shrink-0 place-items-center rounded-full border border-accent/35 bg-secondary font-mono-app text-sm text-accent">{surah.id}</span>
            <span className="min-w-0 flex-1"><strong className="block text-lg font-bold">{surah.name}</strong><span className="mt-1 block text-[0.6875rem] text-muted-foreground">{surah.place} · {surah.verses} آية · الجزء {surah.id === 1 ? '١' : surah.id === 2 ? '١' : surah.id === 3 ? '٣' : '٤'}</span></span>
            <span className="flex items-center gap-3"><button onClick={(event) => { event.stopPropagation(); setFavorites((current) => current.includes(surah.id) ? current.filter((id) => id !== surah.id) : [...current, surah.id]); }} className={favorites.includes(surah.id) ? 'grid size-10 place-items-center rounded-full bg-secondary text-accent' : 'grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground'} aria-label={favorites.includes(surah.id) ? `إزالة ${surah.name} من المفضلة` : `إضافة ${surah.name} للمفضلة`}><span className="text-lg">♨</span></button><ChevronLeft size={19} className="text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-accent" /></span>
          </div>
        ))}
       </div>}
       {((tab === 'verses' && !visibleVerses.length) || (tab !== 'verses' && !visibleSurahs.length)) && <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">لا توجد نتائج هنا بعد. غيّر كلمة البحث أو الفلتر.</div>}
    </div>
  );
}

export function Reader() {
  const params = useParams<{ id: string }>();
  const surah = surahs.find((item) => item.id === Number(params.id)) ?? surahs[0];
  const [, setLocation] = useLocation();
  const [reading, setReading] = useStoredState(STORAGE_KEYS.reading, { surahId: 1, verse: 4 });
  const [translation, setTranslation] = useState(true);
  const [verses, setVerses] = useState<QuranVerse[]>(surah.id === 1 ? readingVerses : []);
  const [loadingVerses, setLoadingVerses] = useState(true);
  const [versesError, setVersesError] = useState(false);
  useEffect(() => setReading({ surahId: surah.id, verse: reading.surahId === surah.id ? reading.verse : 1 }), [surah.id]);
  useEffect(() => {
    let cancelled = false;
    setLoadingVerses(true);
    setVersesError(false);
    void fetchSurahVerses(surah.id).then((result) => {
      if (!cancelled) setVerses(result);
    }).catch(() => {
      if (!cancelled) {
        setVerses(surah.id === 1 ? readingVerses : []);
        setVersesError(true);
      }
    }).finally(() => {
      if (!cancelled) setLoadingVerses(false);
    });
    return () => { cancelled = true; };
  }, [surah.id]);
  return (
    <div className="rise-in mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/quran" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary" data-testid="link-back-quran"><ArrowRight size={17} />كل السور</Link>
        <div className="flex gap-2"><button onClick={() => setTranslation(!translation)} className={`rounded-xl px-3 py-2 text-xs ${translation ? 'bg-secondary text-secondary-foreground' : 'border border-border'}`} data-testid="button-toggle-translation">الترجمة</button><button className="rounded-xl border border-border p-2 text-muted-foreground" aria-label="مشاركة السورة" data-testid="button-share-surah" onClick={() => void shareOrCopy({ title: `سورة ${surah.name}`, url: window.location.href })}><Share2 size={16} /></button></div>
      </div>
      <section className="mb-5 rounded-[2rem] bg-primary px-6 py-8 text-center text-primary-foreground md:px-10">
        <p className="mb-2 text-xs tracking-[.18em] opacity-70">السورة {surah.id}</p><h1 className="font-arabic text-5xl">{surah.name}</h1><p className="mt-2 text-xs opacity-65">{surah.place} · {surah.verses} آيات</p>
      </section>
      <AudioPlayer surahId={surah.id} />
      <div className="my-7 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span><span className="h-px flex-1 bg-border" /></div>
       {loadingVerses && <VerseSkeleton />}
       {!loadingVerses && verses.length > 0 && <article className="rounded-[1.7rem] border border-card-border bg-card p-5 md:p-8" data-testid="quran-full-surah">
         <p dir="rtl" className="font-arabic text-[1.6875rem] leading-[2.35]">
           {verses.map((verse) => {
             const active = reading.surahId === surah.id && reading.verse === verse.id;
             return <button key={verse.id} onClick={() => setReading({ surahId: surah.id, verse: verse.id })} className={`inline rounded-lg px-1 text-right transition ${active ? 'bg-secondary text-accent' : 'hover:bg-secondary/60'}`} data-testid={`button-verse-${verse.id}`}>{verse.arabic} <span className="mx-1 inline-grid size-6 translate-y-[-2px] place-items-center rounded-full border border-accent/60 font-sans text-[0.625rem] text-accent">{verse.id}</span>{' '}</button>;
           })}
         </p>
         {translation && verses.some((verse) => verse.translation) && <div className="mt-7 border-t border-border pt-5" dir="ltr">{verses.map((verse) => verse.translation && <p key={verse.id} className="mb-2 text-xs leading-6 text-muted-foreground"><span className="mr-2 font-mono-app text-accent">{verse.id}</span>{verse.translation}</p>)}</div>}
       </article>}
       {!loadingVerses && !verses.length && <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">تعذر تحميل السورة الآن. تحقق من الاتصال ثم أعد فتحها.</div>}
       {versesError && verses.length > 0 && <p className="mt-3 text-center text-[0.6875rem] text-muted-foreground">تم عرض نسخة محفوظة من السورة.</p>}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-5"><button onClick={() => setLocation(`/quran/${surahs[Math.max(0, surahs.findIndex((item) => item.id === surah.id) - 1)].id}`)} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs" data-testid="button-previous-surah"><ChevronRight size={15} />السابق</button><button onClick={() => setLocation(`/quran/${surahs[Math.min(surahs.length - 1, surahs.findIndex((item) => item.id === surah.id) + 1)].id}`)} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs" data-testid="button-next-surah">التالي<ChevronLeft size={15} /></button></div>
    </div>
  );
}
