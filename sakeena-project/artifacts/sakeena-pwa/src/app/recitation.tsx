import { ArrowRight, Eye, EyeOff, Mic, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { fetchSurahVerses, type QuranVerse } from '@/lib/sakeena';
import { surahIndex } from '@/features/tools/surah-index';

export type RecitationRecognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type RecognitionCtor = new () => RecitationRecognition;

const MAX_VERSES = 30;
const normalize = (text: string) => text
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^\u0621-\u064A\s]/g, ' ').replace(/\s+/g, ' ').trim();
const words = (text: string) => normalize(text).split(' ').filter(Boolean);

// Tolerates one wrong/missing letter in longer words (speech recognition is imperfect).
function sameWord(a: string, b: string) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0; let j = 0; let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    edits += 1; if (edits > 1) return false;
    if (a.length > b.length) i += 1; else if (a.length < b.length) j += 1; else { i += 1; j += 1; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// Longest-common-subsequence alignment → which expected words were heard.
function align(expected: string[], heard: string[]) {
  const n = expected.length; const m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) {
    dp[i][j] = sameWord(expected[i], heard[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const matched = new Array<boolean>(n).fill(false);
  let i = 0; let j = 0;
  while (i < n && j < m) {
    if (sameWord(expected[i], heard[j])) { matched[i] = true; i += 1; j += 1; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1; else j += 1;
  }
  return matched;
}

export function RecitationPage() {
  const [surahId, setSurahId] = useState(1);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(7);
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const recognition = useRef<RecitationRecognition | null>(null);
  const wantListening = useRef(false);
  const baseText = useRef('');
  const Recognition = useMemo(() => {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);
  const surah = surahIndex[surahId - 1];

  useEffect(() => {
    let cancelled = false;
    setVerses([]); setLoadError(false);
    fetchSurahVerses(surahId).then((list) => { if (!cancelled) setVerses(list); }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [surahId]);
  useEffect(() => () => { wantListening.current = false; recognition.current?.stop(); }, []);

  const selected = verses.filter((v) => v.id >= from && v.id <= to);
  const expectedWords = useMemo(() => selected.flatMap((v) => v.arabic.split(/\s+/).filter(Boolean).map((raw) => ({ raw, norm: normalize(raw), verse: v.id }))).filter((w) => w.norm), [selected]);
  const matched = useMemo(() => finished && expectedWords.length ? align(expectedWords.map((w) => w.norm), words(transcript)) : [], [finished, expectedWords, transcript]);
  const accuracy = expectedWords.length ? Math.round((matched.filter(Boolean).length / expectedWords.length) * 100) : 0;
  const missed = expectedWords.filter((_, i) => finished && !matched[i]);

  const pickSurah = (id: number) => { stop(); setSurahId(id); setFrom(1); setTo(Math.min(surahIndex[id - 1].verses, 7)); setTranscript(''); setFinished(false); };
  const setRange = (a: number, b: number) => {
    const start = Math.min(Math.max(1, a), surah.verses);
    const end = Math.min(Math.max(start, b), surah.verses, start + MAX_VERSES - 1);
    setFrom(start); setTo(end); setTranscript(''); setFinished(false);
  };

  const start = () => {
    if (!Recognition) { setError('متصفحك لا يدعم التعرف على الصوت. جرّب Chrome على أندرويد أو Safari حديث.'); return; }
    setError(''); setFinished(false); setTranscript(''); baseText.current = '';
    const rec = new Recognition();
    rec.lang = 'ar-SA'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (event) => {
      const session = (Array.from(event.results) as ArrayLike<{ transcript: string }>[]).map((r) => r[0]?.transcript ?? '').join(' ');
      setTranscript(`${baseText.current} ${session}`.trim());
    };
    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') { wantListening.current = false; setListening(false); setError('لم يُسمح باستخدام الميكروفون. فعّل الإذن من إعدادات المتصفح.'); }
      else if (event.error && event.error !== 'no-speech' && event.error !== 'aborted') setError('تعذّر التعرف على الصوت. تأكد من الاتصال بالإنترنت.');
    };
    rec.onend = () => {
      if (wantListening.current) { // keep going through the browser's automatic stops
        setTranscript((current) => { baseText.current = current; return current; });
        try { rec.start(); return; } catch { /* fall through */ }
      }
      setListening(false);
    };
    recognition.current = rec; wantListening.current = true;
    try { rec.start(); setListening(true); } catch { setError('تعذّر تشغيل الميكروفون.'); wantListening.current = false; }
  };
  const stop = () => {
    wantListening.current = false;
    recognition.current?.stop();
    if (listening) setFinished(true);
    setListening(false);
  };

  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <div className="text-center"><p className="mb-1 text-[0.6875rem] text-muted-foreground">رتّل من حفظك وصحّح نفسك</p><h1 className="font-arabic text-[1.75rem] font-bold leading-tight">التسميع</h1></div>
      </header>

      <section className="mb-4 rounded-[1.25rem] border border-card-border bg-card p-4">
        <label className="mb-3 block text-xs font-semibold text-muted-foreground">السورة
          <select value={surahId} onChange={(e) => pickSurah(Number(e.target.value))} disabled={listening} className="mt-1 w-full rounded-xl border border-card-border bg-background px-3 py-3 text-base text-foreground" data-testid="select-recitation-surah">
            {surahIndex.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.name} ({s.verses} آية)</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-muted-foreground">من آية<input type="number" inputMode="numeric" min={1} max={surah.verses} value={from} disabled={listening} onChange={(e) => setRange(Number(e.target.value) || 1, to)} className="mt-1 w-full rounded-xl border border-card-border bg-background px-3 py-3 text-base text-foreground" data-testid="input-recitation-from" /></label>
          <label className="text-xs font-semibold text-muted-foreground">إلى آية<input type="number" inputMode="numeric" min={from} max={surah.verses} value={to} disabled={listening} onChange={(e) => setRange(from, Number(e.target.value) || from)} className="mt-1 w-full rounded-xl border border-card-border bg-background px-3 py-3 text-base text-foreground" data-testid="input-recitation-to" /></label>
        </div>
        <p className="mt-2 text-[0.6875rem] text-muted-foreground">حتى {MAX_VERSES} آية في المرة الواحدة.</p>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold">سورة {surah.name} · {from}–{to}</h2>
        <button type="button" onClick={() => setHidden((h) => !h)} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs" data-testid="button-recitation-toggle-text">{hidden ? <><Eye size={14} />أظهر الآيات</> : <><EyeOff size={14} />أخفِ للتسميع</>}</button>
      </div>

      <section className="mb-5 min-h-32 rounded-[1.5rem] border border-card-border bg-card p-5" data-testid="card-recitation-text">
        {loadError ? <p className="text-center text-sm text-destructive">تعذّر تحميل الآيات، تأكد من الاتصال بالإنترنت.</p>
          : verses.length === 0 ? <p className="text-center text-sm text-muted-foreground">جارٍ تحميل الآيات...</p>
          : finished ? (
            <p className="font-arabic text-[1.5rem] leading-[2.3]">
              {expectedWords.map((w, i) => <span key={i} className={matched[i] ? 'text-accent' : 'text-destructive underline decoration-dotted underline-offset-8'}>{w.raw} </span>)}
            </p>
          ) : hidden ? (
            <p className="py-6 text-center text-sm leading-7 text-muted-foreground">الآيات مخفية. اضغط الميكروفون وابدأ التلاوة من حفظك، وسنقارنها بالنص.</p>
          ) : (
            <p className="font-arabic text-[1.5rem] leading-[2.3]">{selected.map((v) => <span key={v.id}>{v.arabic} <span className="text-accent">﴿{v.id}﴾</span> </span>)}</p>
          )}
      </section>

      {finished ? (
        <section className="mb-5 rounded-[1.5rem] bg-primary p-5 text-primary-foreground" data-testid="card-recitation-result">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-xs opacity-75">نسبة الإتقان</p><strong className="text-4xl">{accuracy}%</strong></div><p className="max-w-[55%] text-sm leading-6 opacity-90">{accuracy >= 90 ? 'ما شاء الله، تلاوة متقنة!' : accuracy >= 60 ? 'جيد، راجع الكلمات الملوّنة بالأحمر.' : 'أعد المحاولة بعد مراجعة الآيات.'}</p></div>
          <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${accuracy}%` }} /></div>
          {missed.length > 0 && <p className="mt-3 text-xs leading-6 opacity-85">كلمات تحتاج مراجعة: {missed.slice(0, 12).map((w) => w.raw).join('، ')}{missed.length > 12 ? '…' : ''}</p>}
        </section>
      ) : transcript && (
        <section className="mb-5 rounded-[1.25rem] border border-card-border bg-card p-4" aria-live="polite" data-testid="text-recitation-transcript"><p className="mb-1 text-[0.6875rem] text-muted-foreground">ما سمعناه</p><p className="font-arabic text-lg leading-8">{transcript}</p></section>
      )}

      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-center text-xs leading-6 text-destructive" role="alert">{error}</p>}

      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={listening ? stop : start} disabled={verses.length === 0} className={`relative grid size-24 place-items-center rounded-full text-primary-foreground shadow-lg transition active:scale-95 disabled:opacity-50 ${listening ? 'bg-destructive' : 'bg-primary'}`} aria-label={listening ? 'إيقاف التسجيل' : 'ابدأ التسميع'} data-testid="button-recitation-mic">
          {listening && <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />}
          <span className="relative">{listening ? <Square size={30} fill="currentColor" /> : <Mic size={34} />}</span>
        </button>
        <p className="text-sm text-muted-foreground">{listening ? 'جارٍ الاستماع... اضغط للإنهاء وعرض النتيجة' : finished ? 'اضغط للمحاولة من جديد' : 'اضغط الميكروفون وابدأ'}</p>
      </div>
    </div>
  );
}
