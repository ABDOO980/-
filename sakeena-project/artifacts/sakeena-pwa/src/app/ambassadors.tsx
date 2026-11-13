import { BarChart3, Share2 } from 'lucide-react';
import { useState } from 'react';
import { shareOrCopy } from '@/lib/sakeena';
import { Header } from '@/app/layout';

export function Ambassadors() {
  const [copied, setCopied] = useState(false);
  const referral = 'sakeena.app/join/نور-الهدى';
  const copyReferral = async () => {
    await navigator.clipboard?.writeText(referral);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="rise-in">
      <Header title="سفراء سَكينة" />
      <section className="featured-card rounded-[1.7rem] border bg-card p-7 text-center">
        <span className="mx-auto grid size-10 place-items-center text-accent">◆</span>
        <h2 className="mt-4 text-xl font-bold">دلالات مؤيدة</h2>
        <p className="mt-4 text-lg font-bold text-accent">مشارك <span className="text-foreground">♥</span></p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-3/5 rounded-full bg-accent" /></div>
        <p className="mt-4 text-xs text-muted-foreground">الرتبة التالية: برونزي - باقي ٥</p>
      </section>
      <h2 className="more-section-rule mb-3 mt-8 text-base">أرقامي</h2>
      <section className="rounded-[1.5rem] border border-card-border bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">قافلة النور 🏮</h2><BarChart3 size={19} className="text-accent" /></div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">سفراء سَكينة أوصلوا النور إلى ٦٠ شخصاً من ١٠٠ هذا الشهر</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-3/5 rounded-full bg-primary" /></div>
      </section>
      <section className="mt-4 rounded-[1.5rem] border border-card-border bg-card p-5 text-center">
        <p className="text-sm leading-7 text-muted-foreground">تختسب بعد ٣ أيام قراءة متفرقة خلال أسبوعين - عشان التكريم يبقى للناس حقيقية</p>
      </section>
      <h2 className="more-section-rule mb-3 mt-8 text-base">الدعوة</h2>
      <section className="rounded-[1.5rem] border border-card-border bg-card p-5">
        <button onClick={() => void shareOrCopy({ title: 'سَكينة', text: `انضم إلى سَكينة عبر ${referral}` })} className="flex w-full items-center justify-center gap-2 rounded-[1rem] bg-primary py-3.5 text-sm font-bold text-primary-foreground" data-testid="button-invite-good"><Share2 size={18} />ادعُ إلى الخير</button>
        <button onClick={copyReferral} className="mt-4 w-full text-center font-mono-app text-xs text-primary" data-testid="button-copy-referral">{copied ? 'تم نسخ الرابط' : `https://${referral}`}</button>
        <p className="mt-2 text-center text-xs text-muted-foreground">اضغط على الرابط لنسخه</p>
      </section>
    </div>
  );
}
