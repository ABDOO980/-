import { TimerReset, Minus, Plus, ArrowRight, RotateCcw, Volume2, Share2, ChevronRight, Check, ChevronLeft, Search, Sunrise, Moon, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'wouter';
import { STORAGE_KEYS, adhkarGroups, dhikrItemsByGroup, shareOrCopy } from '@/lib/sakeena';
import { useStoredState } from '@/app/common';
import { Header } from '@/app/layout';
import { cancelFollowup, scheduleFollowup } from '@/lib/notif-settings';

export function Tasbeeh() {
  const [state, setState] = useStoredState(STORAGE_KEYS.tasbeeh, { count: 17, target: 33, totalCount: 0, completedRounds: 0 });
  const [pulseKey, setPulseKey] = useState(0);
  const increment = () => {
    navigator.vibrate?.(12);
    setPulseKey((k) => k + 1);
    setState((current) => {
      const finishingRound = current.count + 1 >= current.target;
      return {
        ...current,
        count: finishingRound ? 0 : current.count + 1,
        totalCount: current.totalCount + 1,
        completedRounds: current.completedRounds + (finishingRound ? 1 : 0),
      };
    });
  };
  return (
    <section className="rounded-[2rem] border border-card-border bg-card p-6 md:p-8" data-testid="card-tasbeeh">
      <div className="mb-6 flex items-start justify-between"><div><p className="mb-2 text-xs text-muted-foreground">عداد التسبيح</p><h2 className="text-xl font-semibold">سبّح بهدوء</h2></div><button onClick={() => setState((current) => ({ ...current, count: 0 }))} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-primary" aria-label="إعادة عداد التسبيح" data-testid="button-reset-tasbeeh"><TimerReset size={18} /></button></div>
      <button onClick={increment} className="relative mx-auto grid size-56 place-items-center overflow-hidden rounded-full border-[14px] border-secondary text-center transition active:scale-95" data-testid="button-increment-tasbeeh">
        <span key={pulseKey} className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,#f4dfa4_0%,transparent_70%)]" style={{ animation: 'glow-pulse .5s ease-out' }} />
        <span className="relative"><strong className="block font-mono-app text-6xl text-primary">{state.count}</strong><small className="text-sm text-muted-foreground">من {state.target}</small></span>
      </button>
      <div className="mt-6 flex items-center justify-center gap-6 text-center">
        <div><strong className="block font-mono-app text-lg text-accent">{new Intl.NumberFormat('ar-EG').format(state.totalCount)}</strong><small className="text-[0.6875rem] text-muted-foreground">إجمالي التسبيحات</small></div>
        <div className="h-8 w-px bg-border" />
        <div><strong className="block font-mono-app text-lg text-accent">{state.completedRounds}</strong><small className="text-[0.6875rem] text-muted-foreground">دورات مكتملة</small></div>
      </div>
      <div className="mt-7 flex items-center justify-center gap-2"><button onClick={() => setState((current) => ({ ...current, target: Math.max(1, current.target - 1) }))} className="rounded-lg border border-border p-2" aria-label="تقليل الهدف" data-testid="button-decrease-target"><Minus size={14} /></button><span className="min-w-24 text-center text-xs text-muted-foreground">الهدف اليومي</span><button onClick={() => setState((current) => ({ ...current, target: current.target + 1 }))} className="rounded-lg border border-border p-2" aria-label="زيادة الهدف" data-testid="button-increase-target"><Plus size={14} /></button></div>
    </section>
  );
}

export function DhikrReader() {
  const params = useParams<{ groupId: string }>();
  const group = adhkarGroups.find((item) => item.id === params.groupId) ?? adhkarGroups[1];
  const entries = dhikrItemsByGroup[group.id] ?? dhikrItemsByGroup.morning;
  const [itemIndex, setItemIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const entry = entries[itemIndex];
  // "Finish what you started": leaving a half-read group schedules one reminder.
  const startedRef = useRef(false);
  const doneRef = useRef(false);
  useEffect(() => { startedRef.current = itemIndex > 0 || count > 0; doneRef.current = completed; }, [itemIndex, count, completed]);
  useEffect(() => {
    const tag = `adhkar-${group.id}`;
    void cancelFollowup(tag);
    return () => { if (startedRef.current && !doneRef.current) void scheduleFollowup({ tag, title: 'أكمِل ما بدأت', body: `بقي لك من «${group.title}» ما تُتمّ به أجرك.`, url: `/adhkar/${group.id}` }); };
  }, [group.id, group.title]);
  useEffect(() => { if (completed) void cancelFollowup(`adhkar-${group.id}`); }, [completed, group.id]);
  const advance = () => {
    setItemIndex((current) => {
      if (current >= entries.length - 1) {
        setCompleted(true);
        return current;
      }
      return current + 1;
    });
    setCount(0);
  };
  const increment = () => {
    if (completed) return;
    navigator.vibrate?.(12);
    if (count + 1 >= entry.target) advance();
    else setCount((current) => current + 1);
  };
  const progress = completed ? 100 : ((itemIndex + count / entry.target) / entries.length) * 100;
  return (
    <div className="rise-in">
      <div className="relative mb-5 flex items-center justify-center">
        <Link href="/adhkar" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="العودة إلى الأذكار" data-testid="link-back-adhkar"><ArrowRight size={22} /></Link>
        <h1 className="text-xl font-bold">{group.title}</h1>
      </div>
      <div className="mb-6 flex items-center gap-3">
        <span className="font-mono-app text-xs text-accent">{itemIndex + 1} / {entries.length}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, progress)}%` }} /></div>
      </div>
      <section className="quiet-grid relative overflow-hidden rounded-[1.7rem] border border-accent bg-card p-7 md:p-10" data-testid="card-dhikr-reader">
        <span className="absolute right-3 top-1 text-accent">◆</span><span className="absolute bottom-1 left-3 text-accent">◆</span>
        <p className="mb-3 text-center text-xs text-accent">{completed ? 'أتممت وردك بحمد الله' : entry.note}</p>
        <p className="font-arabic text-[1.625rem] leading-[2.15] text-center">{entry.text}</p>
      </section>
      <div className="mt-5 flex items-center justify-center gap-7 text-muted-foreground">
        <button onClick={() => setCount(0)} aria-label="إعادة الذكر" data-testid="button-reset-dhikr"><RotateCcw size={20} /></button>
         <button onClick={() => {
           const nextPlaying = !playing;
           setPlaying(nextPlaying);
           if (nextPlaying) {
             const utterance = new SpeechSynthesisUtterance(entry.text);
             utterance.lang = 'ar-SA';
             utterance.onend = () => setPlaying(false);
             window.speechSynthesis?.cancel();
             window.speechSynthesis?.speak(utterance);
           } else {
             window.speechSynthesis?.cancel();
           }
         }} aria-label="تشغيل الصوت" className={playing ? 'text-accent' : ''} data-testid="button-dhikr-audio"><Volume2 size={22} /></button>
          <button onClick={() => void shareOrCopy({ title: `سَكينة - ${group.title}`, text: entry.text })} aria-label="مشاركة الذكر" data-testid="button-share-dhikr"><Share2 size={21} /></button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">بصوت الشيخ · حصن المسلم</p>
      <div className="mt-5 flex items-center justify-center gap-8">
        <button onClick={() => { setCompleted(false); setItemIndex((current) => Math.max(0, current - 1)); setCount(0); }} className="grid size-12 place-items-center rounded-2xl border border-border text-accent" aria-label="الذكر السابق"><ChevronRight size={22} /></button>
        <button onClick={increment} className="grid size-28 place-items-center rounded-full border-[10px] border-accent/70 text-accent transition active:scale-95" data-testid="button-dhikr-counter"><span className="text-center"><Check className="mx-auto mb-1" size={26} /><small className="block text-[0.625rem] text-muted-foreground">{completed ? 'تم بحمد الله' : `${count} من ${entry.target}`}</small></span></button>
        <button onClick={() => { setCompleted(false); advance(); }} className="grid size-12 place-items-center rounded-2xl border border-border text-accent" aria-label="الذكر التالي"><ChevronLeft size={22} /></button>
      </div>
    </div>
  );
}

export function Adhkar() {
  const [query, setQuery] = useState('');
  const visibleGroups = adhkarGroups.filter((group) => `${group.title} ${group.subtitle}`.includes(query));
  const featured = visibleGroups.filter((group) => group.id === 'morning' || group.id === 'evening');
  const selected = visibleGroups.filter((group) => !['morning', 'evening', 'situations'].includes(group.id));
  return (
    <div className="rise-in">
      <Header title="الأذكار" />
      <p className="-mt-4 mb-5 text-center text-sm text-muted-foreground">من حصن المسلم</p>
      <div className="mb-4 flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card px-4 py-3"><Search size={18} className="text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="ابحث في الأذكار..." aria-label="البحث في الأذكار" data-testid="input-adhkar-search" /></div>
      <Link href="/adhkar/situations" className="mb-4 flex items-center justify-between rounded-[1.15rem] bg-primary px-4 py-3 text-primary-foreground" data-testid="button-adhkar-situations"><strong>أدعية المواقف - دعاء كل حالة تمر بها</strong><ChevronLeft size={20} /></Link>
      <div className="space-y-3">
        {featured.map((group) => <Link key={group.id} href={`/adhkar/${group.id}`} className="flex items-center justify-between rounded-[1.35rem] border border-accent bg-card p-4" data-testid={`button-adhkar-group-${group.id}`}><span className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-secondary text-accent">{group.id === 'morning' ? <Sunrise size={20} /> : <Moon size={20} />}</span><span><strong className="block text-lg text-accent">{group.title}</strong><small className="mt-1 block text-xs text-muted-foreground">{group.subtitle}</small></span></span><ChevronLeft size={21} className="text-muted-foreground" /></Link>)}
      </div>
      <h2 className="more-section-rule mb-3 mt-8 text-sm">أقسام مختارة</h2>
      <div className="space-y-3">
        {selected.map((group) => <Link key={group.id} href={`/adhkar/${group.id}`} className="flex items-center justify-between rounded-[1.25rem] border border-card-border bg-card p-4" data-testid={`button-adhkar-group-${group.id}`}><span className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-secondary text-accent"><Sparkles size={19} /></span><span><strong className="block text-base">{group.title}</strong><small className="mt-1 block text-xs text-muted-foreground">{group.count} أذكار</small></span></span><ChevronLeft size={20} className="text-muted-foreground" /></Link>)}
      </div>
      <div className="mt-6"><Tasbeeh /></div>
    </div>
  );
}
