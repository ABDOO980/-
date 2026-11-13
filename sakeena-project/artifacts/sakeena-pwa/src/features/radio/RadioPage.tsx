import { ArrowRight, Headphones, Radio, Tv, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { requestSakeenaAudio } from '@/features/quran/FloatingAudioPlayer';

const stations = [
  { id: 'cairo', title: 'إذاعة القرآن الكريم من القاهرة', subtitle: 'تلاوات وبرامج علمية', src: 'https://stream.radiojar.com/8s5u5tpdtwzuv' },
  { id: 'makkah', title: 'إذاعة القرآن الكريم من مكة', subtitle: 'تلاوة مباشرة من الحرم', src: 'https://stream.radiojar.com/0tpy1h0kxtzuv' },
];

export default function RadioPage() {
  const [active, setActive] = useState('');
  return (
    <div className="rise-in mx-auto max-w-2xl">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">استماع صوتي متواصل</p><h1 className="font-arabic text-3xl font-bold">إذاعة القرآن</h1></header>
      <section className="mb-5 rounded-[1.7rem] bg-primary p-6 text-primary-foreground"><Radio className="text-accent" size={25} /><h2 className="mt-5 font-arabic text-3xl">صوت يرافق يومك</h2><p className="mt-2 text-xs leading-6 opacity-70">يمكنك ترك الإذاعة تعمل أثناء تصفح بقية سَكينة عبر الشريط الصوتي العائم.</p></section>
      <div className="space-y-3">{stations.map((station) => <article key={station.id} className={`rounded-2xl border p-5 ${active === station.id ? 'border-accent bg-secondary/60' : 'border-card-border bg-card'}`}><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-secondary text-accent"><Headphones size={19} /></span><div className="flex-1"><h2 className="text-sm font-bold">{station.title}</h2><p className="mt-1 text-xs text-muted-foreground">{station.subtitle}</p></div><button onClick={() => { setActive(station.id); requestSakeenaAudio({ src: station.src, title: station.title, subtitle: station.subtitle }); }} className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground" aria-label={`تشغيل ${station.title}`}><Volume2 size={17} /></button></div><audio controls preload="none" className="mt-4 h-9 w-full" src={station.src} onPlay={() => setActive(station.id)} /></article>)}</div>
      <Link href="/live" className="mt-5 flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card p-4 text-sm font-semibold" data-testid="link-radio-to-live"><Tv size={18} className="text-accent" />البث المباشر من الحرمين (مكة والمدينة)</Link>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}