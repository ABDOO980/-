import { ArrowRight, Check, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useStoredState } from '@/app/common';
import { allahNames } from './names-data';

export default function NamesOfAllahPage() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const [learned, setLearned] = useStoredState<number[]>('sakeena.names.learned.v1', []);
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const todayIndex = dayOfYear % allahNames.length;
  const [todayName, todayMeaning] = allahNames[todayIndex];
  const list = allahNames.map((entry, index) => ({ entry, index })).filter(({ entry }) => !query.trim() || entry[0].includes(query.trim()) || entry[1].includes(query.trim()));
  const toggle = (index: number) => setLearned((current) => current.includes(index) ? current.filter((i) => i !== index) : [...current, index]);

  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <div className="text-center"><p className="mb-1 text-[0.6875rem] text-muted-foreground">تأمّل اسمًا، واعمل بمعناه</p><h1 className="font-arabic text-[1.75rem] font-bold leading-tight">أسماء الله الحسنى</h1></div>
      </header>

      <section className="mb-4 rounded-[1.5rem] bg-primary p-6 text-center text-primary-foreground" data-testid="card-name-of-day">
        <p className="text-xs font-semibold tracking-[.16em] text-accent">اسم اليوم · {todayIndex + 1} من {allahNames.length}</p>
        <h2 className="my-3 font-arabic text-5xl">{todayName}</h2>
        <p className="text-sm leading-7 opacity-85">{todayMeaning}</p>
      </section>

      <div className="mb-4 rounded-2xl border border-card-border bg-card p-4">
        <div className="mb-2 flex justify-between text-sm"><span>حفظتُ</span><strong>{learned.length} من {allahNames.length}</strong></div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(learned.length / allahNames.length) * 100}%` }} /></div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card px-4 py-3">
        <Search size={18} className="text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن اسم أو معنى..." aria-label="بحث في الأسماء" className="w-full bg-transparent text-sm outline-none" data-testid="input-names-search" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {list.map(({ entry: [name, meaning], index }) => {
          const isOpen = open === index; const isLearned = learned.includes(index);
          return (
            <div key={name} className={`rounded-2xl border p-3 transition ${isOpen ? 'col-span-2 border-accent bg-secondary sm:col-span-3' : isLearned ? 'border-accent/50 bg-accent/10' : 'border-card-border bg-card'}`}>
              <button type="button" onClick={() => setOpen(isOpen ? null : index)} className="flex w-full items-center justify-between gap-2 text-right" data-testid={`button-name-${index + 1}`}>
                <span className="flex items-center gap-2"><small className="font-mono-app text-[0.625rem] text-muted-foreground">{index + 1}</small><strong className="font-arabic text-lg">{name}</strong></span>
                {isLearned && <Check size={16} className="shrink-0 text-accent" />}
              </button>
              {isOpen && (
                <div className="mt-2 border-t border-border/50 pt-2">
                  <p className="text-sm leading-7">{meaning}</p>
                  <button type="button" onClick={() => toggle(index)} className={`mt-3 rounded-full px-4 py-2 text-xs font-bold ${isLearned ? 'border border-border' : 'bg-primary text-primary-foreground'}`} data-testid={`button-name-learned-${index + 1}`}>{isLearned ? 'إلغاء الحفظ' : 'حفظتُ هذا الاسم'}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {list.length === 0 && <p className="mt-4 rounded-xl bg-secondary p-4 text-center text-sm">لا توجد نتائج.</p>}
      <p className="mt-5 text-center text-[0.6875rem] leading-5 text-muted-foreground">الشروح مختصرة للتقريب، وللتوسع راجع كتب شروح أسماء الله الحسنى.</p>
    </div>
  );
}
