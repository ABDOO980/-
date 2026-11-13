import { VerseSkeleton } from '@/components/skeleton';
import {
  ArrowLeft, ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Download,
  Headphones, List, LoaderCircle, Play, Search, Settings2, Sparkles, Star, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { readStorage, shareOrCopy, STORAGE_KEYS, writeStorage } from '@/lib/sakeena';
import {
  downloadSurahForOffline, fetchJuz, fetchQuranCatalog, fetchQuranContent, isSurahDownloaded,
  recitationUrl, recitationUrls, refreshReciterServers, reciters, removeDownloadedSurah, searchQuran,
  type QuranSurah, type QuranVerseDetail,
} from './quran-data';
import { requestSakeenaAudio } from './FloatingAudioPlayer';
import { Drawer, DrawerClose, DrawerContent } from '@workspace/ui';

const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toEasternArabicNumerals(value: number) {
  return String(value).split('').map((digit) => EASTERN_ARABIC_DIGITS[Number(digit)] ?? digit).join('');
}

function QuranHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 text-center">
      {subtitle && <p className="mb-1 text-xs text-muted-foreground">{subtitle}</p>}
      <h1 className="font-arabic text-3xl font-bold text-foreground">{title}</h1>
    </header>
  );
}

const revelationLabel = (value: string) => value === 'Meccan' ? 'مكية' : 'مدنية';

export function QuranHub() {
  const [, setLocation] = useLocation();
  const [catalog, setCatalog] = useState<QuranSurah[]>([]);
  const [mode, setMode] = useState<'surahs' | 'juz' | 'search' | 'bookmarks'>('surahs');
  const [query, setQuery] = useState('');
  const [jump, setJump] = useState('');
  const [juz, setJuz] = useState(1);
  const [juzResults, setJuzResults] = useState<Array<{ number: number; numberInSurah: number; text: string; surah: { number: number; name: string } }>>([]);
  const [searchResults, setSearchResults] = useState<Array<{ number: number; numberInSurah: number; text: string; surah: { number: number; name: string } }>>([]);
  const [searching, setSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>(() => readStorage<number[]>('sakeena.quran.surah-bookmarks.v1', []));
  const [lastRead] = useState(() => readStorage<{ surahId: number; verse: number }>(STORAGE_KEYS.reading, { surahId: 1, verse: 1 }));

  useEffect(() => { void fetchQuranCatalog().then(setCatalog); }, []);
  useEffect(() => {
    if (mode !== 'juz') return;
    let cancelled = false;
    void fetchJuz(juz).then((result) => { if (!cancelled) setJuzResults(result); }).catch(() => { if (!cancelled) setJuzResults([]); });
    return () => { cancelled = true; };
  }, [juz, mode]);
  const normalized = query.trim().toLowerCase();
  const visibleCatalog = useMemo(() => catalog.filter((surah) => {
    const matches = !normalized || `${surah.number} ${surah.name} ${surah.englishName}`.toLowerCase().includes(normalized);
    return matches && (mode !== 'bookmarks' || bookmarks.includes(surah.number));
  }), [catalog, normalized, mode, bookmarks]);
  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try { setSearchResults(await searchQuran(query.trim())); } catch { setSearchResults([]); }
    setSearching(false);
  };
  const toggleBookmark = (id: number) => {
    setBookmarks((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeStorage('sakeena.quran.surah-bookmarks.v1', next);
      return next;
    });
  };
  const jumpToSurah = () => {
    const number = Number(jump);
    if (number >= 1 && number <= 114) setLocation(`/quran/${number}`);
  };
  return (
    <div className="rise-in">
      <QuranHeader title="المصحف الشريف" subtitle="قراءة، تدبر، وحفظ بلا تشتيت" />
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-card-border bg-card px-4 py-3">
        <Search size={18} className="text-accent" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && mode === 'search') void runSearch(); }} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="ابحث باسم السورة أو في الآيات..." aria-label="البحث في القرآن" />
        {query && <button onClick={() => { setQuery(''); setSearchResults([]); }} aria-label="مسح البحث"><X size={15} /></button>}
        <button onClick={() => { const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null } }).webkitSpeechRecognition; if (!SpeechRecognition) return; const recognition = new SpeechRecognition(); recognition.lang = 'ar-SA'; recognition.onresult = (event) => setQuery(event.results[0][0].transcript); recognition.start(); }} className="rounded-lg p-1 text-muted-foreground" aria-label="البحث بالصوت"><Headphones size={16} /></button>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          ['surahs', 'السور', List],
          ['juz', 'الأجزاء', Bookmark],
          ['search', 'بحث الآيات', Search],
          ['bookmarks', 'المحفوظة', Star],
        ].map(([value, label, Icon]) => (
          <button key={String(value)} onClick={() => setMode(value as typeof mode)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[0.625rem] ${mode === value ? 'border-accent bg-secondary text-accent' : 'border-border bg-card text-muted-foreground'}`}>
            {typeof Icon === 'function' ? <Icon size={16} /> : null}<span>{String(label)}</span>
          </button>
        ))}
      </div>
      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-accent/30 bg-secondary/60 p-3">
        <span className="grid size-9 place-items-center rounded-full bg-card text-accent"><BookOpenGlyph /></span>
        <div className="min-w-0 flex-1"><p className="text-[0.625rem] text-muted-foreground">آخر قراءة</p><p className="truncate text-sm font-semibold">سورة {catalog.find((item) => item.number === lastRead.surahId)?.name ?? 'الفاتحة'} · الآية {lastRead.verse}</p></div>
        <Link href={`/quran/${lastRead.surahId}`} className="rounded-lg bg-accent px-3 py-2 text-[0.625rem] font-bold text-accent-foreground">متابعة</Link>
      </div>
      {mode === 'search' && (
        <div className="mb-5 flex gap-2">
          <button onClick={() => void runSearch()} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground">{searching ? <LoaderCircle className="animate-spin" size={15} /> : <Search size={15} />}ابحث في المصحف</button>
          <span className="self-center text-[0.6875rem] text-muted-foreground">يبحث في نص الآيات العربية</span>
        </div>
      )}
      {mode === 'juz' && (
        <section className="mb-5 rounded-2xl border border-card-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between"><strong className="text-sm">اختر الجزء</strong><span className="text-[0.625rem] text-muted-foreground">٣٠ جزءًا</span></div>
          <div className="grid grid-cols-6 gap-2">{Array.from({ length: 30 }, (_, index) => index + 1).map((item) => <button key={item} onClick={() => setJuz(item)} className={`rounded-lg border py-2 text-xs ${juz === item ? 'border-accent bg-secondary text-accent' : 'border-border'}`}>{item}</button>)}</div>
          <div className="mt-4 space-y-2">{juzResults.slice(0, 8).map((verse) => <button key={verse.number} onClick={() => setLocation(`/quran/${verse.surah.number}`)} className="flex w-full items-start gap-3 rounded-xl bg-secondary/50 p-3 text-right"><span className="font-mono-app text-[0.625rem] text-accent">{verse.numberInSurah}</span><span className="font-arabic text-lg leading-8">{verse.text}</span></button>)}</div>
        </section>
      )}
      {mode === 'search' ? (
        <div className="space-y-3">{searchResults.map((result) => <button key={result.number} onClick={() => setLocation(`/quran/${result.surah.number}`)} className="flex w-full items-start gap-3 rounded-2xl border border-card-border bg-card p-4 text-right"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-mono-app text-[0.625rem] text-accent">{result.numberInSurah}</span><span><strong className="font-arabic text-xl font-normal leading-9">{result.text}</strong><small className="mt-2 block text-muted-foreground">سورة {result.surah.name}</small></span></button>)}{!searching && query && !searchResults.length && <EmptyQuran text="لم تظهر نتائج. جرّب كلمة أخرى." />}</div>
      ) : (
        <div className="space-y-2">
          {visibleCatalog.map((surah) => <div key={surah.number} className="flex items-center gap-3 rounded-2xl border border-card-border bg-card p-3.5 transition hover:border-accent">
            <button onClick={() => setLocation(`/quran/${surah.number}`)} className="flex min-w-0 flex-1 items-center gap-3 text-right">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-accent/35 bg-secondary font-mono-app text-xs text-accent">{surah.number}</span>
              <span className="min-w-0"><strong className="block text-base">{surah.name}</strong><small className="mt-1 block text-[0.625rem] text-muted-foreground">{revelationLabel(surah.revelationType)} · {surah.numberOfAyahs} آية</small></span>
            </button>
            <button onClick={() => toggleBookmark(surah.number)} className={`grid size-9 place-items-center rounded-full ${bookmarks.includes(surah.number) ? 'bg-secondary text-accent' : 'text-muted-foreground'}`} aria-label={bookmarks.includes(surah.number) ? 'إزالة من المحفوظة' : 'حفظ السورة'}>{bookmarks.includes(surah.number) ? <Star size={16} fill="currentColor" /> : <Bookmark size={16} />}</button>
            <ChevronLeft size={17} className="text-muted-foreground" />
          </div>)}
          {!visibleCatalog.length && <EmptyQuran text={mode === 'bookmarks' ? 'لم تحفظ سورًا بعد.' : 'لا توجد نتائج.'} />}
        </div>
      )}
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-dashed border-border p-3">
        <Download size={16} className="text-accent" /><span className="flex-1 text-xs text-muted-foreground">يمكنك فتح السور مرة واحدة لحفظ نصها وقراءتها دون اتصال.</span>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <input value={jump} onChange={(event) => setJump(event.target.value.replace(/\D/g, ''))} onKeyDown={(event) => { if (event.key === 'Enter') jumpToSurah(); }} inputMode="numeric" className="w-20 rounded-lg border border-input bg-background px-2 py-2 text-center text-xs" placeholder="رقم" aria-label="رقم السورة" />
        <button onClick={jumpToSurah} className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-accent">انتقال سريع</button><span className="text-[0.625rem] text-muted-foreground">من ١ إلى ١١٤</span>
      </div>
    </div>
  );
}

function BookOpenGlyph() {
  return <span className="font-arabic text-lg">ق</span>;
}

function EmptyQuran({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

export function QuranReaderPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const surahId = Number(params.id) || 1;
  const [catalog, setCatalog] = useState<QuranSurah[]>([]);
  const [verses, setVerses] = useState<QuranVerseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [translation, setTranslation] = useState(true);
  const [tafsir, setTafsir] = useState(false);
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
  const [pageMode, setPageMode] = useState(false);
  const [fontSize, setFontSize] = useState(29);
  const [page, setPage] = useState(0);
  const [reciterId, setReciterId] = useState(() => { const saved = readStorage('sakeena.quran.reciter.v1', 'mishary'); return reciters.some((item) => item.id === saved) ? saved : 'mishary'; });
  const [repeatAyah, setRepeatAyah] = useState(false);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<string[]>(() => readStorage('sakeena.quran.verse-bookmarks.v1', []));
  const [reading, setReading] = useState(() => readStorage(STORAGE_KEYS.reading, { surahId: 1, verse: 1 }));
  const [downloaded, setDownloaded] = useState(() => isSurahDownloaded(surahId, reciterId));
  const [downloading, setDownloading] = useState(false);
  useEffect(() => { setDownloaded(isSurahDownloaded(surahId, reciterId)); }, [surahId, reciterId]);
  useEffect(() => { void fetchQuranCatalog().then(setCatalog); }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(0);
    void fetchQuranContent(surahId).then((result) => { if (!cancelled) { setVerses(result.verses); setCached(result.cached); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [surahId]);
  useEffect(() => {
    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ progress: number; duration: number }>).detail;
      if (!detail.duration || !verses.length) return;
      const index = Math.min(verses.length - 1, Math.floor((detail.progress / detail.duration) * verses.length));
      const verse = verses[index];
      if (!verse) return;
      setReading((current) => current.surahId === surahId && current.verse === verse.id ? current : { surahId, verse: verse.id });
      document.getElementById(`quran-verse-${surahId}-${verse.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    window.addEventListener('sakeena:audio-progress', onProgress);
    return () => window.removeEventListener('sakeena:audio-progress', onProgress);
  }, [surahId, verses]);
  const surah = catalog.find((item) => item.number === surahId);
  const pageSize = pageMode ? 10 : verses.length;
  const pageCount = Math.max(1, Math.ceil(verses.length / pageSize));
  const visibleVerses = pageMode ? verses.slice(page * pageSize, (page + 1) * pageSize) : verses;
  const saveBookmark = (verse: QuranVerseDetail) => {
    const key = `${surahId}:${verse.id}`;
    setBookmarkedVerses((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      writeStorage('sakeena.quran.verse-bookmarks.v1', next);
      return next;
    });
  };
  const saveReading = (verse: QuranVerseDetail) => {
    const next = { surahId, verse: verse.id };
    setReading(next);
    writeStorage(STORAGE_KEYS.reading, next);
  };
  const playSurah = () => requestSakeenaAudio({ src: recitationUrl(surahId, reciterId), fallbacks: recitationUrls(surahId, reciterId).slice(1), refresh: async () => { await refreshReciterServers(true); return recitationUrls(surahId, reciterId); }, title: `تلاوة سورة ${surah?.name ?? ''}`, subtitle: `${reciters.find((item) => item.id === reciterId)?.label}${repeatAyah ? ' · تكرار' : ''}`, loop: repeatAyah });
  const setReciter = (value: string) => { setReciterId(value); writeStorage('sakeena.quran.reciter.v1', value); };
  const toggleDownload = async () => {
    if (downloaded) { await removeDownloadedSurah(surahId, reciterId); setDownloaded(false); return; }
    setDownloading(true);
    try {
      await downloadSurahForOffline(surahId, reciterId);
      setDownloaded(true);
    } catch {
      setDownloaded(false);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="rise-in mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3"><Link href="/quran" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowRight size={17} />كل السور</Link><div className="flex gap-2"><button onClick={() => setTranslation((value) => !value)} className={`rounded-xl px-3 py-2 text-[0.6875rem] ${translation ? 'bg-secondary text-accent' : 'border border-border'}`}>الترجمة</button><button onClick={() => setTafsir((value) => !value)} className={`rounded-xl px-3 py-2 text-[0.6875rem] ${tafsir ? 'bg-secondary text-accent' : 'border border-border'}`}>التفسير</button></div></div>
      <section className="mb-4 rounded-[2rem] bg-primary p-7 text-center text-primary-foreground"><p className="mb-2 text-[0.625rem] tracking-[.18em] opacity-65">السورة {surahId}</p><h1 className="font-arabic text-5xl">{surah?.name ?? 'جاري التحميل'}</h1><p className="mt-2 text-xs opacity-65">{surah ? `${revelationLabel(surah.revelationType)} · ${surah.numberOfAyahs} آية` : ''}</p></section>
      <div className="mb-4 rounded-2xl border border-card-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2"><button onClick={playSurah} className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"><Play size={14} fill="currentColor" />تشغيل التلاوة</button><select value={reciterId} onChange={(event) => setReciter(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-2 py-2 text-[0.6875rem]" aria-label="اختيار القارئ">{reciters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button onClick={() => setRepeatAyah((value) => !value)} className={`rounded-xl border px-3 py-2 text-[0.6875rem] ${repeatAyah ? 'border-accent text-accent' : 'border-border'}`}>{repeatAyah ? 'تكرار الآية: نعم' : 'تكرار الآية'}</button><button onClick={() => void toggleDownload()} disabled={downloading} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[0.6875rem] ${downloaded ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`} data-testid="button-download-surah">{downloading ? <LoaderCircle size={13} className="animate-spin" /> : downloaded ? <Check size={13} /> : <Download size={13} />}{downloading ? 'جاري التحميل' : downloaded ? 'متاحة أوفلاين' : 'تحميل للاستماع أوفلاين'}</button></div>
        <div className="mt-3 flex items-center gap-2 text-[0.625rem] text-muted-foreground"><Settings2 size={14} className="text-accent" /><span>حجم الخط</span><input type="range" min="22" max="40" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="flex-1 accent-accent" aria-label="حجم خط القرآن" /><button onClick={() => setPageMode((value) => !value)} className="rounded-lg border border-border px-2 py-1">{pageMode ? 'نص كامل' : 'عرض صفحات'}</button></div>
      </div>
      {loading && <VerseSkeleton />}
      {!loading && <article className="rounded-[1.7rem] border border-card-border bg-card p-5 md:p-8" data-testid="quran-feature-reader">
        <div className="mb-5 flex items-center justify-between text-[0.625rem] text-muted-foreground"><span>{cached ? 'نسخة محفوظة دون اتصال' : 'نص موثق من المصحف العثماني'}</span><span>{pageMode ? `صفحة ${page + 1} من ${pageCount}` : `${verses.length} آية`}</span></div>
        <p className="font-arabic text-right leading-[2.6]" dir="rtl" style={{ fontSize: `${fontSize}px` }}>
          {visibleVerses.map((verse) => {
            const isActive = selectedVerseId === verse.id;
            return (
              <span key={verse.id} id={`quran-verse-${surahId}-${verse.id}`} onClick={() => { setSelectedVerseId(verse.id); saveReading(verse); }} className={`cursor-pointer rounded-md transition ${isActive ? 'bg-accent/25' : 'hover:bg-secondary/60'}`} data-testid={`span-verse-${verse.id}`}>
                {verse.arabic}
                <span className="mx-1 inline-grid size-8 place-items-center rounded-full border border-accent/50 align-middle font-mono-app text-[0.75rem] text-accent">{toEasternArabicNumerals(verse.id)}</span>
              </span>
            );
          })}
        </p>
      </article>}
      <Drawer open={selectedVerseId !== null} onOpenChange={(open) => { if (!open) setSelectedVerseId(null); }}>
        <DrawerContent>
          {(() => {
            const verse = visibleVerses.find((item) => item.id === selectedVerseId);
            if (!verse) return null;
            const key = `${surahId}:${verse.id}`;
            const isBookmarked = bookmarkedVerses.includes(key);
            return (
              <div className="mx-auto max-w-2xl p-5 pb-8" dir="rtl">
                <div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-accent">الآية {verse.id}</span><DrawerClose className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" aria-label="إغلاق"><X size={18} /></DrawerClose></div>
                <p className="font-arabic text-2xl leading-[2]">{verse.arabic}</p>
                {translation && verse.translation && <p dir="ltr" className="mt-4 text-left text-sm leading-6 text-muted-foreground">{verse.translation}</p>}
                {tafsir && verse.tafsir && <p className="mt-4 border-r-2 border-accent/40 pr-3 text-sm leading-7 text-accent/80">{verse.tafsir}</p>}
                <div className="mt-6 flex gap-2">
                  <button onClick={playSurah} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-bold text-accent-foreground" data-testid="button-sheet-play"><Headphones size={15} />استماع</button>
                  <button onClick={() => saveBookmark(verse)} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${isBookmarked ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`} data-testid="button-sheet-bookmark">{isBookmarked ? <Star size={15} fill="currentColor" /> : <Bookmark size={15} />}</button>
                  <button onClick={() => void shareOrCopy({ title: `آية ${verse.id} من سورة ${surah?.name ?? ''}`, text: verse.arabic })} className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-semibold text-muted-foreground" data-testid="button-sheet-share"><Sparkles size={15} /></button>
                </div>
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
      {!loading && pageMode && <div className="mt-4 flex items-center justify-between"><button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs disabled:opacity-40"><ChevronRight size={15} />السابق</button><span className="text-xs text-muted-foreground">صفحات القراءة</span><button disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs disabled:opacity-40">التالي<ChevronLeft size={15} /></button></div>}
      {cached && <p className="mt-3 text-center text-[0.625rem] text-muted-foreground">تم عرض آخر نسخة محفوظة لأن الاتصال غير متاح.</p>}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><button onClick={() => setLocation(`/quran/${Math.max(1, surahId - 1)}`)} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs"><ChevronRight size={15} />السابق</button><span className="text-[0.625rem] text-muted-foreground">آخر موضع محفوظ: {reading.surahId === surahId ? `الآية ${reading.verse}` : 'لم يبدأ بعد'}</span><button onClick={() => setLocation(`/quran/${Math.min(114, surahId + 1)}`)} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs">التالي<ChevronLeft size={15} /></button></div>
    </div>
  );
}