import { ArrowRight, Clock3, Moon, Sunrise, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { DEFAULT_SETTINGS, fetchPrayerTimes, type PrayerTimes } from '@/lib/sakeena';

export default function RamadanPage() {
  const [prayer, setPrayer] = useState<PrayerTimes | null>(null);
  useEffect(() => { void fetchPrayerTimes(DEFAULT_SETTINGS).then(setPrayer); }, []);
  const rows = prayer ? [{ label: 'الإمساك', time: prayer.timings.Fajr, icon: Sunrise }, { label: 'الفجر', time: prayer.timings.Fajr, icon: Moon }, { label: 'المغرب والإفطار', time: prayer.timings.Maghrib, icon: Sun }, { label: 'العشاء والتراويح', time: prayer.timings.Isha, icon: Clock3 }] : [];
  return (
    <div className="rise-in mx-auto max-w-2xl">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">استعد للموسم الكريم</p><h1 className="font-arabic text-3xl font-bold">إمساكية رمضان</h1></header>
      <section className="mb-5 rounded-[1.7rem] bg-primary p-6 text-primary-foreground"><Moon className="text-accent" size={24} /><h2 className="mt-5 font-arabic text-3xl">رمضان شهر القرآن</h2><p className="mt-2 text-xs leading-6 opacity-70">المواقيت حسب مدينتك المحفوظة. غيّر المدينة من الإعدادات للحصول على جدول أدق.</p></section>
      <section className="rounded-[1.7rem] border border-card-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-accent">اليوم</p><h2 className="mt-1 text-xl font-semibold">{prayer?.date ?? 'جاري حساب المواقيت'}</h2></div><span className="rounded-full bg-secondary px-3 py-1 text-[0.625rem] text-accent">{prayer?.city ?? 'القاهرة'}</span></div><div className="space-y-3">{rows.map((row) => <div key={row.label} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4"><span className="grid size-10 place-items-center rounded-xl bg-card text-accent"><row.icon size={18} /></span><span className="flex-1 text-sm font-semibold">{row.label}</span><span className="font-mono-app text-sm text-accent">{row.time}</span></div>)}</div></section>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}