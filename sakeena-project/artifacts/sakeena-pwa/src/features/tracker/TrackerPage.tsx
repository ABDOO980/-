import { BarChart3, CalendarClock, Check, ChevronLeft, Circle, Flame, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { readStorage, writeStorage } from '@/lib/sakeena';

type HabitState = Record<string, boolean>;
const trackerKey = 'sakeena.tracker.v1';
const habits = [
  { id: 'fajr', label: 'صلاة الفجر', detail: 'في وقتها' },
  { id: 'dhuhr', label: 'صلاة الظهر', detail: 'في وقتها' },
  { id: 'asr', label: 'صلاة العصر', detail: 'في وقتها' },
  { id: 'maghrib', label: 'صلاة المغرب', detail: 'في وقتها' },
  { id: 'isha', label: 'صلاة العشاء', detail: 'في وقتها' },
  { id: 'jamaah', label: 'صلاة الجماعة', detail: 'إن تيسرت' },
  { id: 'sunnah', label: 'السنن الرواتب', detail: 'ركعتان أو أكثر' },
  { id: 'morning', label: 'أذكار الصباح', detail: 'ورد اليوم' },
  { id: 'evening', label: 'أذكار المساء', detail: 'ورد المساء' },
  { id: 'quran', label: 'قراءة القرآن', detail: 'صفحة على الأقل' },
];

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const arabicDay = (date: Date) => new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);

export default function TrackerPage() {
  const today = isoDate(new Date());
  const [allDays, setAllDays] = useState<Record<string, HabitState>>(() => readStorage(trackerKey, {}));
  const [targetDate, setTargetDate] = useState(() => readStorage('sakeena.khatmah.target.v1', isoDate(new Date(Date.now() + 30 * 86400000))));
  const [pagesRead, setPagesRead] = useState(() => readStorage('sakeena.khatmah.pages.v1', 0));
  const current = allDays[today] ?? {};
  const completed = habits.filter((habit) => current[habit.id]).length;
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 86400000);
    const key = isoDate(date);
    return { day: new Intl.DateTimeFormat('ar-EG', { weekday: 'short' }).format(date), value: Object.values(allDays[key] ?? {}).filter(Boolean).length };
  }), [allDays]);
  const daysLeft = Math.max(1, Math.ceil((new Date(`${targetDate}T23:59:59`).getTime() - Date.now()) / 86400000));
  const dailyPages = Math.max(1, Math.ceil(Math.max(0, 604 - pagesRead) / daysLeft));
  const toggle = (id: string) => setAllDays((days) => {
    const next = { ...days, [today]: { ...(days[today] ?? {}), [id]: !days[today]?.[id] } };
    writeStorage(trackerKey, next);
    return next;
  });
  const updateTarget = (value: string) => { setTargetDate(value); writeStorage('sakeena.khatmah.target.v1', value); };
  const updatePages = (value: number) => { setPagesRead(value); writeStorage('sakeena.khatmah.pages.v1', value); };
  return (
    <div className="rise-in">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">{arabicDay(new Date())} · متابعة بلا ضغط</p><h1 className="font-arabic text-3xl font-bold">متتبع عبادتك</h1></header>
      <section className="mb-5 rounded-[1.7rem] bg-primary p-6 text-primary-foreground">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-accent">ورد اليوم</p><h2 className="mt-2 font-arabic text-3xl">خطوة صغيرة، أثر مستمر</h2><p className="mt-2 text-xs opacity-70">أنجز ما تستطيع، وسيُحفظ تقدمك على جهازك.</p></div><div className="grid size-16 place-items-center rounded-full border-4 border-accent font-mono-app text-sm">{completed}/{habits.length}</div></div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(completed / habits.length) * 100}%` }} /></div>
      </section>
      <section className="rounded-[1.7rem] border border-card-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-xs text-accent">قائمة اليوم</p><h2 className="mt-1 text-xl font-semibold">{new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date())}</h2></div><Flame size={21} className="text-accent" /></div>
        <div className="space-y-2">{habits.map((habit) => <button key={habit.id} onClick={() => toggle(habit.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-right transition ${current[habit.id] ? 'bg-secondary' : 'bg-secondary/40 hover:bg-secondary/70'}`}><span className={`grid size-7 place-items-center rounded-full border ${current[habit.id] ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{current[habit.id] ? <Check size={14} /> : <Circle size={11} />}</span><span className="flex-1"><strong className={`block text-sm ${current[habit.id] ? 'text-muted-foreground line-through' : ''}`}>{habit.label}</strong><small className="text-[0.625rem] text-muted-foreground">{habit.detail}</small></span><ChevronLeft size={14} className="text-muted-foreground" /></button>)}</div>
      </section>
      <section className="mt-5 rounded-[1.7rem] border border-card-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-accent"><BarChart3 size={19} /></span><div><p className="text-xs text-accent">آخر سبعة أيام</p><h2 className="text-lg font-semibold">استمرارية هادئة</h2></div></div>
        <div className="h-48" dir="ltr"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} domain={[0, habits.length]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, direction: 'rtl' }} /><Bar dataKey="value" name="الإنجازات" fill="hsl(var(--accent))" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </section>
      <section className="mt-5 rounded-[1.7rem] border border-accent/35 bg-secondary/50 p-5">
        <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-card text-accent"><Target size={19} /></span><div><p className="text-xs text-accent">خطة الختمة</p><h2 className="text-lg font-semibold">ختمة على مهل</h2></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-muted-foreground">تاريخ الإتمام<input type="date" value={targetDate} onChange={(event) => updateTarget(event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" /></label><label className="text-xs text-muted-foreground">الصفحات المقروءة<input type="number" min="0" max="604" value={pagesRead} onChange={(event) => updatePages(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" /></label></div>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-card p-3"><CalendarClock size={18} className="text-accent" /><p className="text-xs leading-6">باقي {daysLeft} يومًا · هدفك اليومي المقترح <strong className="text-accent">{dailyPages} صفحات</strong> من أصل ٦٠٤.</p></div>
      </section>
      <Link href="/quran" className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm"><span>افتح المصحف وأكمل وردك</span><ChevronLeft size={17} className="text-accent" /></Link>
    </div>
  );
}