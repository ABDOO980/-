import { ArrowRight, Check, Gift, Heart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { readStorage, writeStorage } from '@/lib/sakeena';

const provisionItems = [
  { id: 'quran', label: 'آية اليوم', title: 'اقرأ صفحة واحدة بتدبر', detail: 'ابدأ بما تستطيع، ثم توقف لحظة عند معنى آية لامست قلبك.', icon: Sparkles, href: '/quran/1' },
  { id: 'dhikr', label: 'ذكر اليوم', title: 'سبّح الله ٣٣ مرة', detail: 'اجعل الذكر وقفة قصيرة تعيد قلبك إلى الحضور.', icon: Heart, href: '/adhkar' },
  { id: 'good-deed', label: 'عمل اليوم', title: 'اصنع خيرًا لا يراه أحد', detail: 'رسالة طيبة، مساعدة بسيطة، أو دعاء بظهر الغيب.', icon: Gift, href: '/dua-wall' },
];

export default function DailyProvisionPage() {
  const storageKey = `sakeena.daily-provision.${new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())}`;
  const [completed, setCompleted] = useState<string[]>(() => readStorage(storageKey, []));
  const toggle = (id: string) => setCompleted((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    writeStorage(storageKey, next);
    return next;
  });

  return (
    <div className="rise-in mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/more" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"><ArrowRight size={17} />كل الأدوات</Link>
        <span className="rounded-full border border-accent/35 px-3 py-1.5 text-[0.625rem] text-accent">عبادتك اليوم</span>
      </div>
      <header className="mb-6 text-center">
        <p className="mb-1 text-xs text-muted-foreground">ثلاث خطوات خفيفة تحفظ أثر يومك</p>
        <h1 className="font-arabic text-4xl font-bold">زاد اليوم</h1>
      </header>
      <section className="mb-5 rounded-[2rem] bg-primary p-6 text-primary-foreground">
        <p className="text-xs text-accent">وردك المقترح</p>
        <h2 className="mt-3 font-arabic text-3xl">خذ من الخير ما تقدر عليه</h2>
        <p className="mt-2 text-sm leading-7 opacity-75">لا يشترط أن تنجز كل شيء. خطوة واحدة بحضور خير من قائمة طويلة بلا قلب.</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(completed.length / provisionItems.length) * 100}%` }} /></div>
        <p className="mt-2 text-[0.6875rem] text-primary-foreground/70">{completed.length} من {provisionItems.length} خطوات مكتملة</p>
      </section>
      <div className="space-y-3">
        {provisionItems.map(({ id, label, title, detail, icon: Icon, href }) => {
          const done = completed.includes(id);
          return (
            <article key={id} className={`rounded-[1.5rem] border p-5 transition ${done ? 'border-accent/60 bg-secondary/60' : 'border-card-border bg-card'}`}>
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-accent"><Icon size={19} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.625rem] font-semibold text-accent">{label}</p>
                  <h2 className={`mt-1 text-lg font-semibold ${done ? 'text-muted-foreground line-through' : ''}`}>{title}</h2>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">{detail}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={href} className="rounded-xl bg-primary px-3 py-2 text-[0.625rem] font-bold text-primary-foreground">ابدأ الآن</Link>
                    <button onClick={() => toggle(id)} className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-[0.625rem] font-semibold ${done ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}><Check size={13} />{done ? 'تم الإنجاز' : 'علّمتها كمكتملة'}</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}