import { ArrowRight, CalendarDays, Check, Moon, Sun } from 'lucide-react';
import { Link } from 'wouter';

function hijriParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  return { label: formatter.format(date), day: Number(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric' }).format(date)) };
}

export default function CalendarPage() {
  const now = new Date();
  const hijri = hijriParts(now);
  const weekday = now.getDay();
  const whiteDay = hijri.day >= 13 && hijri.day <= 15;
  const mondayThursday = weekday === 1 || weekday === 4;
  const events = [
    { title: 'صيام الإثنين والخميس', detail: 'سنة أسبوعية', active: mondayThursday, icon: Sun },
    { title: 'الأيام البيض', detail: '١٣، ١٤، ١٥ من الشهر الهجري', active: whiteDay, icon: Moon },
    { title: 'بداية شهر جديد', detail: 'استعد لورد الشهر القادم', active: hijri.day >= 27, icon: CalendarDays },
  ];
  return (
    <div className="rise-in">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">التقويم الإسلامي</p><h1 className="font-arabic text-3xl font-bold">مواسم الخير</h1></header>
      <section className="mb-5 rounded-[1.7rem] bg-primary p-7 text-center text-primary-foreground"><CalendarDays className="mx-auto mb-4 text-accent" size={25} /><p className="text-xs opacity-70">اليوم بالتقويم الهجري</p><h2 className="mt-3 font-arabic text-3xl">{hijri.label}</h2><p className="mt-3 text-xs opacity-65">{new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(now)}</p></section>
      <section className="rounded-[1.7rem] border border-card-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-accent">تذكيرات السنة</p><h2 className="mt-1 text-xl font-semibold">مواعيد قريبة منك</h2></div><span className="rounded-full bg-secondary px-3 py-1 text-[0.625rem] text-accent">{events.filter((event) => event.active).length} اليوم</span></div><div className="space-y-3">{events.map((event) => <div key={event.title} className={`flex items-center gap-3 rounded-xl p-4 ${event.active ? 'bg-secondary' : 'bg-secondary/40'}`}><span className="grid size-10 place-items-center rounded-xl bg-card text-accent"><event.icon size={18} /></span><div className="flex-1"><strong className="block text-sm">{event.title}</strong><small className="mt-1 block text-xs text-muted-foreground">{event.detail}</small></div>{event.active && <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-foreground"><Check size={14} /></span>}</div>)}</div></section>
      <div className="mt-5 rounded-2xl border border-accent/30 bg-secondary/50 p-4 text-sm leading-7"><strong className="text-accent">تنبيه لطيف</strong><p className="mt-1 text-xs text-muted-foreground">يُحسب التاريخ الهجري محليًا من إعدادات جهازك، ولا نرسل تاريخ موقعك أو بياناتك إلى أي خدمة.</p></div>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}