import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { useStoredState } from '@/app/common';

type Fields = { goldPrice: string; cash: string; goldGrams: string; trade: string; owed: string; debts: string };
const empty: Fields = { goldPrice: '', cash: '', goldGrams: '', trade: '', owed: '', debts: '' };
const NISAB_GOLD_GRAMS = 85; // nisab = 85 g of 24k gold
const RATE = 0.025;

const num = (value: string) => {
  const n = parseFloat(value.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const rows: [keyof Fields, string, string][] = [
  ['cash', 'النقد والمدخرات', 'ما في يدك وحسابك البنكي'],
  ['goldGrams', 'الذهب (بالجرام)', 'ذهب الادخار والزينة التي تزيد عن الاستعمال المعتاد، عيار 24 أو ما يعادله'],
  ['trade', 'عروض التجارة', 'قيمة البضاعة المعدّة للبيع'],
  ['owed', 'ديون لك عند الناس', 'التي ترجو سدادها'],
  ['debts', 'ديون عليك حالّة', 'تُخصم من المجموع'],
];

export default function ZakatPage() {
  const [f, setF] = useStoredState<Fields>('sakeena.zakat', empty);
  const set = (key: keyof Fields, value: string) => setF((current) => ({ ...current, [key]: value }));

  const price = num(f.goldPrice);
  const total = num(f.cash) + num(f.goldGrams) * price + num(f.trade) + num(f.owed) - num(f.debts);
  const nisab = NISAB_GOLD_GRAMS * price;
  const ready = price > 0;
  const due = ready && total >= nisab && total > 0;
  const fmt = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <h1 className="font-arabic text-[1.75rem] font-bold">حاسبة الزكاة</h1>
      </header>

      <label className="mb-4 block rounded-[1.25rem] border border-accent bg-card p-4">
        <strong className="block">سعر جرام الذهب اليوم (بعملتك)</strong>
        <span className="mb-2 block text-xs text-muted-foreground">مطلوب لحساب النصاب ({NISAB_GOLD_GRAMS} جرامًا من الذهب). اكتب السعر من محل الصاغة أو موقع موثوق.</span>
        <input inputMode="decimal" value={f.goldPrice} onChange={(e) => set('goldPrice', e.target.value)} className="w-full rounded-xl border border-card-border bg-background px-3 py-3 text-lg" placeholder="مثال: 3500" data-testid="input-zakat-gold-price" />
      </label>

      <div className="space-y-3">
        {rows.map(([key, title, hint]) => (
          <label key={key} className="block rounded-[1.25rem] border border-card-border bg-card p-4">
            <strong className="block">{title}</strong>
            <span className="mb-2 block text-xs text-muted-foreground">{hint}</span>
            <input inputMode="decimal" value={f[key]} onChange={(e) => set(key, e.target.value)} className="w-full rounded-xl border border-card-border bg-background px-3 py-3 text-lg" placeholder="0" data-testid={`input-zakat-${key}`} />
          </label>
        ))}
      </div>

      <section className="mt-5 rounded-[1.5rem] bg-primary p-5 text-primary-foreground" data-testid="card-zakat-result">
        <div className="mb-2 flex justify-between text-sm opacity-90"><span>صافي المال</span><strong>{fmt(Math.max(total, 0))}</strong></div>
        <div className="mb-3 flex justify-between text-sm opacity-90"><span>النصاب</span><strong>{ready ? fmt(nisab) : '—'}</strong></div>
        {!ready ? (
          <p className="text-center">أدخل سعر الذهب أولًا لنحسب لك.</p>
        ) : due ? (
          <div className="text-center"><p className="text-sm opacity-90">الزكاة الواجبة (2.5%)</p><p className="text-3xl font-bold">{fmt(total * RATE)}</p></div>
        ) : (
          <p className="text-center">مالك لم يبلغ النصاب، فلا زكاة عليك الآن.</p>
        )}
      </section>

      <p className="mt-4 text-xs leading-6 text-muted-foreground">تُخرَج الزكاة إذا بلغ المال النصاب ومضى عليه عام هجري كامل. هذه الحاسبة للتقدير فقط، وللأحوال الخاصة (الأسهم، العقارات، الديون المؤجلة) اسأل أهل العلم.</p>
    </div>
  );
}
