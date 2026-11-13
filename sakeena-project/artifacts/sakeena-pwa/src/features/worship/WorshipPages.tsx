import { ArrowRight, Check, ChevronLeft, ChevronRight, Flame, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useStoredState } from '@/app/common';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

const tabs = [['/worship', 'اليوم'], ['/worship/fasting', 'الصيام'], ['/worship/khatmah', 'الختمة'], ['/worship/plan', 'خطتي']] as const;

function Frame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-4 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <div className="text-center"><p className="mb-1 text-[0.6875rem] text-muted-foreground">{subtitle}</p><h1 className="font-arabic text-[1.75rem] font-bold leading-tight">{title}</h1></div>
      </header>
      <nav className="mb-5 grid grid-cols-4 gap-1 rounded-full bg-secondary p-1" aria-label="أقسام العبادات">
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} className={`rounded-full py-2 text-center text-xs font-semibold transition ${location === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} data-testid={`tab-worship-${href.split('/').pop()}`}>{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

/* ---------------- اليوم ---------------- */
const prayers = [['fajr', 'الفجر'], ['dhuhr', 'الظهر'], ['asr', 'العصر'], ['maghrib', 'المغرب'], ['isha', 'العشاء']] as const;
const extras = [
  ['jamaah', 'صلاة الجماعة', 'إن تيسرت'], ['sunnah', 'السنن الرواتب', 'ركعتان أو أكثر'], ['duha', 'صلاة الضحى', 'ركعتان فأكثر'], ['witr', 'الوتر', 'قبل النوم أو آخر الليل'],
  ['morning', 'أذكار الصباح', 'ورد اليوم'], ['evening', 'أذكار المساء', 'ورد المساء'], ['quran', 'قراءة القرآن', 'صفحة على الأقل'], ['sadaqa', 'صدقة', 'ولو يسيرة'],
] as const;
type DayLog = Record<string, boolean>;
const TRACKER_KEY = 'sakeena.tracker.v1';

export function WorshipTodayPage() {
  const [days, setDays] = useStoredState<Record<string, DayLog>>(TRACKER_KEY, {});
  const todayKey = isoDay(new Date());
  const today = days[todayKey] ?? {};
  const toggle = (id: string) => setDays((current) => ({ ...current, [todayKey]: { ...(current[todayKey] ?? {}), [id]: !current[todayKey]?.[id] } }));
  const total = prayers.length + extras.length;
  const doneCount = [...prayers.map((p) => p[0]), ...extras.map((e) => e[0])].filter((id) => today[id]).length;
  const allPrayers = (log?: DayLog) => !!log && prayers.every(([id]) => log[id]);

  let streak = 0;
  for (let i = allPrayers(days[todayKey]) ? 0 : 1; i < 400; i += 1) {
    if (allPrayers(days[isoDay(addDays(new Date(), -i))])) streak += 1; else break;
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6);
    const log = days[isoDay(d)] ?? {};
    const count = [...prayers.map((p) => p[0]), ...extras.map((e) => e[0])].filter((id) => log[id]).length;
    return { label: new Intl.DateTimeFormat('ar-EG', { weekday: 'short' }).format(d), count };
  });
  const weekAvg = Math.round((week.reduce((s, w) => s + w.count, 0) / (7 * total)) * 100);
  const circumference = 2 * Math.PI * 34;

  return (
    <Frame title="عبادتك اليوم" subtitle={new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}>
      <section className="mb-4 flex items-center gap-4 rounded-[1.5rem] bg-primary p-5 text-primary-foreground" data-testid="card-worship-summary">
        <svg viewBox="0 0 80 80" className="size-20 shrink-0 -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="7" />
          <circle cx="40" cy="40" r="34" fill="none" className="text-accent" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - doneCount / total)} style={{ transition: 'stroke-dashoffset .4s' }} />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold">{doneCount} <span className="text-sm font-normal opacity-75">من {total}</span></p>
          <p className="mt-1 flex items-center gap-1.5 text-xs opacity-85"><Flame size={14} className="text-accent" />{streak > 0 ? `${streak} ${streak === 1 ? 'يوم' : 'أيام'} متتالية بالصلوات الخمس` : 'ابدأ سلسلة الصلوات الخمس اليوم'}</p>
        </div>
      </section>

      <h2 className="mb-2 text-sm font-bold text-accent">الصلوات الخمس</h2>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {prayers.map(([id, label]) => (
          <button key={id} type="button" onClick={() => toggle(id)} className={`flex flex-col items-center gap-2 rounded-2xl border py-3 transition active:scale-95 ${today[id] ? 'border-accent bg-accent text-accent-foreground' : 'border-card-border bg-card'}`} data-testid={`button-habit-${id}`} aria-pressed={!!today[id]}>
            <span className={`grid size-6 place-items-center rounded-full border ${today[id] ? 'border-current' : 'border-border'}`}>{today[id] && <Check size={14} />}</span>
            <span className="text-[0.6875rem] font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-bold text-accent">النوافل والأذكار</h2>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {extras.map(([id, label, detail]) => (
          <button key={id} type="button" onClick={() => toggle(id)} className={`flex items-center gap-2.5 rounded-2xl border p-3 text-right transition active:scale-95 ${today[id] ? 'border-accent/60 bg-accent/15' : 'border-card-border bg-card'}`} data-testid={`button-habit-${id}`} aria-pressed={!!today[id]}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${today[id] ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}>{today[id] && <Check size={13} />}</span>
            <span className="min-w-0"><strong className="block text-sm">{label}</strong><small className="text-[0.6875rem] text-muted-foreground">{detail}</small></span>
          </button>
        ))}
      </div>

      <section className="rounded-[1.5rem] border border-card-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold">آخر ٧ أيام</h2><span className="text-xs text-muted-foreground">المعدل {weekAvg}%</span></div>
        <div className="flex h-28 items-end gap-2" dir="ltr">
          {week.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-20 w-full items-end rounded-lg bg-secondary"><div className="w-full rounded-lg bg-accent transition-all" style={{ height: `${(w.count / total) * 100}%` }} /></div>
              <span className="text-[0.625rem] text-muted-foreground">{w.label}</span>
            </div>
          ))}
        </div>
      </section>
    </Frame>
  );
}

/* ---------------- الصيام ---------------- */
type FastType = 'ramadan' | 'voluntary' | 'qada';
const fastTypes: [FastType, string, string][] = [['ramadan', 'رمضان', 'bg-primary text-primary-foreground'], ['voluntary', 'نافلة', 'bg-accent text-accent-foreground'], ['qada', 'قضاء', 'bg-destructive text-destructive-foreground']];
const hijriDay = (d: Date) => { try { return Number(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric' }).format(d)); } catch { return 0; } };

export function FastingTrackerPage() {
  const [log, setLog] = useStoredState<Record<string, FastType>>('sakeena.fasting.v1', {});
  const [type, setType] = useState<FastType>('voluntary');
  const [cursor, setCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const todayKey = isoDay(new Date());
  const year = cursor.getFullYear(); const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 1) % 7; // week starts Saturday
  const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const keyOf = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const tap = (day: number) => {
    const key = keyOf(day);
    if (key > todayKey) return;
    setLog((current) => { const next = { ...current }; if (next[key] === type) delete next[key]; else next[key] = type; return next; });
  };
  const monthCount = Object.keys(log).filter((k) => k.startsWith(`${year}-${pad(month + 1)}`)).length;
  const yearEntries = Object.entries(log).filter(([k]) => k.startsWith(`${new Date().getFullYear()}-`));
  const count = (t: FastType) => yearEntries.filter(([, v]) => v === t).length;
  const monthTitle = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(cursor);

  return (
    <Frame title="متتبع الصيام" subtitle="سجّل أيام صيامك">
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {fastTypes.map(([id, label]) => <div key={id} className="rounded-2xl border border-card-border bg-card p-3"><strong className="block text-2xl text-accent">{count(id).toLocaleString('ar-EG')}</strong><small className="text-[0.6875rem] text-muted-foreground">{label} هذا العام</small></div>)}
      </div>

      <p className="mb-2 text-xs font-semibold text-muted-foreground">اختر النوع ثم اضغط على اليوم:</p>
      <div className="mb-4 flex gap-2">
        {fastTypes.map(([id, label, cls]) => <button key={id} type="button" onClick={() => setType(id)} className={`flex-1 rounded-full py-2 text-sm font-semibold ${type === id ? cls : 'border border-card-border bg-card'}`} data-testid={`button-fast-type-${id}`}>{label}</button>)}
      </div>

      <section className="rounded-[1.5rem] border border-card-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} className="grid size-9 place-items-center rounded-xl border border-border" aria-label="الشهر السابق"><ChevronRight size={18} /></button>
          <div className="text-center"><strong>{monthTitle}</strong><p className="text-[0.6875rem] text-muted-foreground">{monthCount} يوم صيام</p></div>
          <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} className="grid size-9 place-items-center rounded-xl border border-border" aria-label="الشهر التالي"><ChevronLeft size={18} /></button>
        </div>
        <div className="mb-1 grid grid-cols-7 text-center text-[0.625rem] text-muted-foreground">{['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <span key={`b${i}`} />;
            const key = keyOf(day); const date = new Date(year, month, day);
            const kind = log[key]; const cls = kind ? fastTypes.find((f) => f[0] === kind)![2] : 'bg-secondary/60';
            const sunnah = date.getDay() === 1 || date.getDay() === 4 || [13, 14, 15].includes(hijriDay(date));
            const future = key > todayKey;
            return (
              <button key={key} type="button" disabled={future} onClick={() => tap(day)} className={`relative grid aspect-square place-items-center rounded-xl text-sm font-semibold transition active:scale-95 ${cls} ${future ? 'opacity-35' : ''} ${key === todayKey ? 'ring-2 ring-accent' : ''}`} data-testid={`button-fast-day-${day}`}>
                {day}{sunnah && !kind && <span className="absolute bottom-1 size-1 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[0.6875rem] text-muted-foreground"><span className="size-1.5 rounded-full bg-accent" />أيام يُستحب صيامها: الاثنين والخميس والأيام البيض (١٣ و١٤ و١٥ هجريًا)</p>
      </section>
    </Frame>
  );
}

/* ---------------- الختمة ---------------- */
const TOTAL_PAGES = 604;
export function KhatmahPlanPage() {
  const [target, setTarget] = useStoredState<string>('sakeena.khatmah.target.v1', isoDay(addDays(new Date(), 30)));
  const [pages, setPages] = useStoredState<number>('sakeena.khatmah.pages.v1', 0);
  const [done, setDone] = useStoredState<number>('sakeena.khatmah.count.v1', 0);
  const [log, setLog] = useStoredState<Record<string, number>>('sakeena.khatmah.log.v1', {});
  const todayKey = isoDay(new Date());
  const readToday = log[todayKey] ?? 0;
  const daysLeft = Math.max(1, Math.ceil((new Date(`${target}T23:59:59`).getTime() - Date.now()) / 86_400_000));
  const dailyGoal = Math.max(1, Math.ceil(Math.max(0, TOTAL_PAGES - pages) / daysLeft));
  const finished = pages >= TOTAL_PAGES;
  const add = (n: number) => {
    const next = Math.min(TOTAL_PAGES, Math.max(0, pages + n));
    const delta = next - pages;
    if (!delta) return;
    navigator.vibrate?.(15);
    setPages(next);
    setLog((current) => ({ ...current, [todayKey]: Math.max(0, (current[todayKey] ?? 0) + delta) }));
  };
  const restart = () => { setDone((c) => c + 1); setPages(0); setTarget(isoDay(addDays(new Date(), 30))); };
  const circumference = 2 * Math.PI * 52;
  const percent = Math.round((pages / TOTAL_PAGES) * 100);
  const juz = Math.min(30, Math.floor(pages / 20) + (pages % 20 ? 1 : 0));

  return (
    <Frame title="ختمة القرآن" subtitle="أكمل ورد اليوم بهدوء">
      <section className="mb-4 rounded-[1.5rem] bg-primary p-6 text-center text-primary-foreground" data-testid="card-khatmah-progress">
        <div className="relative mx-auto size-36">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="9" />
            <circle cx="60" cy="60" r="52" fill="none" className="text-accent" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pages / TOTAL_PAGES)} style={{ transition: 'stroke-dashoffset .4s' }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center"><div><strong className="block text-3xl">{percent}%</strong><small className="text-[0.6875rem] opacity-75">{pages} من {TOTAL_PAGES} صفحة</small></div></div>
        </div>
        <p className="mt-3 text-sm opacity-85">{finished ? 'أتممت الختمة، تقبّل الله منك' : `أنت الآن في الجزء ${juz || 1} · باقي ${daysLeft} يوم`}</p>
        {done > 0 && <p className="mt-1 text-xs text-accent">ختمات مكتملة: {done}</p>}
      </section>

      {finished ? (
        <button type="button" onClick={restart} className="mb-4 w-full rounded-full bg-accent py-3.5 font-bold text-accent-foreground" data-testid="button-khatmah-restart">ابدأ ختمة جديدة</button>
      ) : (
        <section className="mb-4 rounded-[1.5rem] border border-accent bg-card p-5">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">هدف اليوم</p><strong className="text-xl">{dailyGoal} صفحة</strong></div><div className="text-left"><p className="text-xs text-muted-foreground">قرأت اليوم</p><strong className="text-xl text-accent">{readToday}</strong></div></div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (readToday / dailyGoal) * 100)}%` }} /></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10].map((n) => <button key={n} type="button" onClick={() => add(n)} className="rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-95" data-testid={`button-khatmah-add-${n}`}>+{n}</button>)}
            <button type="button" onClick={() => add(-1)} className="rounded-xl border border-border py-3 text-sm active:scale-95" aria-label="تراجع صفحة" data-testid="button-khatmah-undo">−1</button>
          </div>
        </section>
      )}

      <label className="mb-4 block rounded-[1.25rem] border border-card-border bg-card p-4 text-sm font-semibold">موعد إتمام الختمة
        <input type="date" value={target} min={todayKey} onChange={(e) => e.target.value && setTarget(e.target.value)} className="mt-2 w-full rounded-xl border border-card-border bg-background px-3 py-3" data-testid="input-khatmah-target" />
      </label>
      <Link href="/quran" className="flex items-center justify-between rounded-[1.25rem] border border-card-border bg-card p-4 text-sm font-semibold">افتح المصحف وأكمل وردك<ChevronLeft size={18} className="text-accent" /></Link>
    </Frame>
  );
}

/* ---------------- الخطة اليومية ---------------- */
const slots = ['بعد الفجر', 'الضحى', 'بعد الظهر', 'بعد العصر', 'بعد المغرب', 'قبل النوم'];
type Task = { id: string; title: string; slot: string };
type Plan = { tasks: Task[]; done: Record<string, string[]> };
const seedTasks: Task[] = [
  { id: 's1', title: 'أذكار الصباح', slot: 'بعد الفجر' }, { id: 's2', title: 'ورد القرآن', slot: 'بعد الفجر' }, { id: 's3', title: 'ركعتا الضحى', slot: 'الضحى' },
  { id: 's4', title: 'السنن الرواتب', slot: 'بعد الظهر' }, { id: 's5', title: 'أذكار المساء', slot: 'بعد العصر' }, { id: 's6', title: 'ورد التسبيح', slot: 'بعد المغرب' },
  { id: 's7', title: 'أذكار النوم', slot: 'قبل النوم' }, { id: 's8', title: 'الوتر', slot: 'قبل النوم' },
];

export function DailyPlanPage() {
  const [plan, setPlan] = useStoredState<Plan>('sakeena.plan.v1', { tasks: seedTasks, done: {} });
  const [title, setTitle] = useState('');
  const [slot, setSlot] = useState(slots[0]);
  const todayKey = isoDay(new Date());
  const doneToday = plan.done[todayKey] ?? [];
  const toggle = (id: string) => setPlan((p) => { const cur = p.done[todayKey] ?? []; return { ...p, done: { [todayKey]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } }; });
  const add = () => { if (!title.trim()) return; setPlan((p) => ({ ...p, tasks: [...p.tasks, { id: `t${Date.now()}`, title: title.trim(), slot }] })); setTitle(''); };
  const remove = (id: string) => setPlan((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) }));
  const completed = plan.tasks.filter((t) => doneToday.includes(t.id)).length;

  return (
    <Frame title="خطتي اليومية" subtitle="رتّب يومك مع العبادة">
      <div className="mb-4 rounded-[1.25rem] bg-primary p-4 text-primary-foreground"><div className="mb-2 flex justify-between text-sm"><span>أنجزت اليوم</span><strong>{completed} / {plan.tasks.length}</strong></div><div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${plan.tasks.length ? (completed / plan.tasks.length) * 100 : 0}%` }} /></div></div>
      {slots.map((s) => {
        const list = plan.tasks.filter((t) => t.slot === s);
        if (!list.length) return null;
        return (
          <section key={s} className="mb-4">
            <h2 className="mb-2 text-sm font-bold text-accent">{s}</h2>
            <div className="space-y-2">
              {list.map((t) => {
                const on = doneToday.includes(t.id);
                return (
                  <div key={t.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${on ? 'border-accent/60 bg-accent/15' : 'border-card-border bg-card'}`}>
                    <button type="button" onClick={() => toggle(t.id)} className="flex flex-1 items-center gap-3 text-right" aria-pressed={on} data-testid={`button-plan-${t.id}`}>
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}>{on && <Check size={13} />}</span>
                      <span className={on ? 'text-muted-foreground line-through' : ''}>{t.title}</span>
                    </button>
                    <button type="button" onClick={() => remove(t.id)} className="grid size-8 place-items-center text-muted-foreground" aria-label="حذف"><Trash2 size={15} /></button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <section className="rounded-[1.25rem] border border-card-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold">أضف عملًا</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} className="mb-2 w-full rounded-xl border border-card-border bg-background px-3 py-3" placeholder="مثال: قراءة سورة الملك" data-testid="input-plan-title" />
        <div className="flex gap-2">
          <select value={slot} onChange={(e) => setSlot(e.target.value)} className="flex-1 rounded-xl border border-card-border bg-background px-3 py-3" data-testid="select-plan-slot">{slots.map((s) => <option key={s}>{s}</option>)}</select>
          <button type="button" onClick={add} disabled={!title.trim()} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 font-bold text-primary-foreground disabled:opacity-50" data-testid="button-plan-add"><Plus size={16} />أضف</button>
        </div>
      </section>
    </Frame>
  );
}
