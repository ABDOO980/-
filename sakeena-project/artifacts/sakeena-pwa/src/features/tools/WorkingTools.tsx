import { Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useStoredState } from '@/app/common';
import { Accordion, PageFrame } from '@/features/knowledge/PageFrame';
import { surahIndex } from './surah-index';
import { tajweed } from './tajweed-data';

/* ---------------- التجويد ---------------- */
export function TajweedLessonsPage() {
  return <PageFrame title="دروس التجويد" intro="دروس مختصرة بالقواعد الأساسية، لكل درس آيات من القرآن تطبّق القاعدة. للإتقان اقرأ على معلم متقن."><Accordion items={tajweed} testId="button-tajweed" /></PageFrame>;
}

/* ---------------- الحفظ والمراجعة ---------------- */
type Portion = { id: string; surahId: number; from: number; to: number; stage: number; last: string };
const INTERVALS = [1, 3, 7, 14, 30, 60]; // days until next review for each stage
const STORE = 'sakeena.memorization.v1';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (iso: string, days: number) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + days); return isoDay(d); };
const nextReview = (p: Portion) => addDays(p.last, INTERVALS[Math.min(p.stage, INTERVALS.length - 1)]);
const surahName = (id: number) => surahIndex[id - 1]?.name ?? '';

export function MemorizationPage() {
  const [items, setItems] = useStoredState<Portion[]>(STORE, []);
  const [surahId, setSurahId] = useState(1);
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('7');
  const [error, setError] = useState('');
  const surah = surahIndex[surahId - 1];

  const add = () => {
    const a = parseInt(from, 10); const b = parseInt(to, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1 || b < a || b > surah.verses) { setError(`اكتب آيات صحيحة من 1 إلى ${surah.verses}.`); return; }
    setError('');
    setItems((current) => [{ id: `${Date.now()}`, surahId, from: a, to: b, stage: 0, last: isoDay(new Date()) }, ...current]);
  };
  return (
    <PageFrame title="المحفظ" intro="سجّل ما حفظته، وسيذكّرك التطبيق بمراجعته في الوقت المناسب (بعد يوم، ثم ٣ أيام، ثم أسبوع...).">
      <section className="mb-5 rounded-[1.25rem] border border-card-border bg-card p-4">
        <label className="mb-3 block text-sm font-semibold">السورة
          <select value={surahId} onChange={(e) => { const id = Number(e.target.value); setSurahId(id); setFrom('1'); setTo(String(surahIndex[id - 1].verses)); }} className="mt-1 w-full rounded-xl border border-card-border bg-background px-3 py-3" data-testid="select-memorization-surah">
            {surahIndex.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}
          </select>
        </label>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">من آية<input inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-xl border border-card-border bg-background px-3 py-3" data-testid="input-memorization-from" /></label>
          <label className="text-sm font-semibold">إلى آية<input inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-xl border border-card-border bg-background px-3 py-3" data-testid="input-memorization-to" /></label>
        </div>
        {error && <p className="mb-3 text-xs text-destructive" role="alert">{error}</p>}
        <button type="button" onClick={add} className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground" data-testid="button-memorization-add">أضف إلى حفظي</button>
      </section>
      <h2 className="mb-3 text-base font-bold">محفوظاتي ({items.length})</h2>
      {items.length === 0 && <p className="rounded-xl bg-secondary p-4 text-center text-sm">لم تضف شيئًا بعد. اختر سورة وآيات ثم اضغط "أضف إلى حفظي".</p>}
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-[1.1rem] border border-card-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <strong className="block">سورة {surahName(p.surahId)} · {p.from}–{p.to}</strong>
              <small className="text-xs text-muted-foreground">المرحلة {Math.min(p.stage + 1, INTERVALS.length)} من {INTERVALS.length} · المراجعة القادمة {nextReview(p)}</small>
            </div>
            <Link href={`/quran/${p.surahId}`} className="rounded-lg border border-border px-3 py-2 text-xs">افتح</Link>
            <button type="button" onClick={() => setItems((current) => current.filter((x) => x.id !== p.id))} className="grid size-9 place-items-center rounded-lg border border-border text-destructive" aria-label="حذف"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}

export function ReviewPage() {
  const [items, setItems] = useStoredState<Portion[]>(STORE, []);
  const today = isoDay(new Date());
  const due = items.filter((p) => nextReview(p) <= today);
  const upcoming = items.filter((p) => nextReview(p) > today);
  const mark = (id: string, remembered: boolean) => setItems((current) => current.map((p) => p.id === id ? { ...p, stage: remembered ? p.stage + 1 : 0, last: today } : p));
  return (
    <PageFrame title="مراجعة الحفظ" intro="اقرأ من الذاكرة أولًا، ثم افتح المصحف وصحّح، وسجّل هل أتقنت الورد أم يحتاج إعادة.">
      <div className="mb-4 rounded-[1.25rem] bg-primary p-4 text-primary-foreground"><div className="flex justify-between text-sm"><span>مراجعات اليوم</span><strong>{due.length}</strong></div></div>
      {items.length === 0 && <p className="rounded-xl bg-secondary p-4 text-center text-sm">لا يوجد محفوظ بعد. أضف ما حفظته من صفحة <Link href="/tools/memorization" className="font-bold text-accent">المحفظ</Link>.</p>}
      {items.length > 0 && due.length === 0 && <p className="rounded-xl bg-secondary p-4 text-center text-sm">أحسنت! لا مراجعات مستحقة اليوم.</p>}
      <div className="space-y-3">
        {due.map((p) => (
          <div key={p.id} className="rounded-[1.1rem] border border-accent bg-card p-4" data-testid={`card-review-${p.id}`}>
            <strong className="mb-3 block">سورة {surahName(p.surahId)} · {p.from}–{p.to}</strong>
            <div className="flex gap-2">
              <Link href={`/quran/${p.surahId}`} className="rounded-xl border border-border px-3 py-2.5 text-xs">افتح المصحف</Link>
              <button type="button" onClick={() => mark(p.id, true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground"><Check size={14} />أتقنتها</button>
              <button type="button" onClick={() => mark(p.id, false)} className="flex-1 rounded-xl border border-border px-3 py-2.5 text-xs">أحتاج إعادة</button>
            </div>
          </div>
        ))}
      </div>
      {upcoming.length > 0 && (
        <>
          <h2 className="mb-3 mt-6 text-base font-bold">القادمة</h2>
          <div className="space-y-2">{upcoming.map((p) => <div key={p.id} className="flex justify-between rounded-xl border border-card-border bg-card px-4 py-3 text-sm"><span>سورة {surahName(p.surahId)} · {p.from}–{p.to}</span><span className="text-xs text-muted-foreground">{nextReview(p)}</span></div>)}</div>
        </>
      )}
    </PageFrame>
  );
}

/* ---------------- تدبراتي ---------------- */
type Reflection = { id: string; ref: string; text: string; date: string };

export function ReflectionsPage() {
  const [list, setList] = useStoredState<Reflection[]>('sakeena.reflections.v1', []);
  const [ref, setRef] = useState('');
  const [text, setText] = useState('');
  const save = () => {
    if (!text.trim()) return;
    setList((current) => [{ id: `${Date.now()}`, ref: ref.trim(), text: text.trim(), date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) }, ...current]);
    setText(''); setRef('');
  };
  return (
    <PageFrame title="تدبراتي" intro="دوّن ما لامس قلبك من آية، وحوّله إلى عمل. تُحفظ على جهازك.">
      <section className="mb-5 rounded-[1.25rem] border border-card-border bg-card p-4">
        <label className="mb-3 block text-sm font-semibold">الآية أو السورة (اختياري)<input value={ref} onChange={(e) => setRef(e.target.value)} className="mt-1 w-full rounded-xl border border-card-border bg-background px-3 py-3" placeholder="مثال: الرعد ٢٨" data-testid="input-reflection-ref" /></label>
        <label className="mb-3 block text-sm font-semibold">تدبّري<textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-1 min-h-28 w-full resize-y rounded-xl border border-card-border bg-background p-3 leading-7" placeholder="ما الذي فهمته؟ وما الخطوة التي سأعمل بها؟" data-testid="input-reflection-text" /></label>
        <button type="button" onClick={save} disabled={!text.trim()} className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50" data-testid="button-reflection-save">احفظ التدبر</button>
      </section>
      <h2 className="mb-3 text-base font-bold">تدبراتي ({list.length})</h2>
      {list.length === 0 && <p className="rounded-xl bg-secondary p-4 text-center text-sm">لا توجد تدبرات محفوظة بعد.</p>}
      <div className="space-y-3">
        {list.map((r) => (
          <article key={r.id} className="rounded-[1.1rem] border border-card-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span className="font-semibold text-accent">{r.ref || 'تدبر'}</span><span>{r.date}</span></div>
            <p className="leading-8">{r.text}</p>
            <button type="button" onClick={() => setList((current) => current.filter((x) => x.id !== r.id))} className="mt-3 flex items-center gap-1.5 text-xs text-destructive"><Trash2 size={14} />حذف</button>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}
