import { ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from 'wouter';
import { useStoredState } from '@/app/common';

function Back({ title }: { title: string }) {
  return (
    <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
      <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
      <h1 className="font-arabic text-[1.75rem] font-bold">{title}</h1>
    </header>
  );
}

export function TawafCounterPage() {
  const [count, setCount] = useStoredState<number>('sakeena.hajj.tawaf', 0);
  const [mode, setMode] = useStoredState<'tawaf' | 'sai'>('sakeena.hajj.mode', 'tawaf');
  const total = 7;
  const finished = count >= total;
  const tap = () => { if (finished) return; navigator.vibrate?.(20); setCount((c) => c + 1); };
  return (
    <div className="rise-in pb-6" dir="rtl">
      <Back title="عداد الأشواط" />
      <div className="mb-5 flex gap-2 rounded-full bg-secondary p-1">
        {([['tawaf', 'الطواف'], ['sai', 'السعي']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setMode(id); setCount(0); }} className={`flex-1 rounded-full py-2 ${mode === id ? 'bg-primary text-primary-foreground' : ''}`}>{label}</button>
        ))}
      </div>
      <button type="button" onClick={tap} className="mx-auto mb-5 grid size-56 place-items-center rounded-full border-4 border-accent bg-card text-center active:scale-95" data-testid="button-tawaf-tap" aria-label="شوط جديد">
        <span><strong className="block font-mono-app text-6xl text-accent">{count}</strong><span className="text-sm text-muted-foreground">من {total} أشواط</span></span>
      </button>
      <p className="mb-4 text-center text-lg font-bold">{finished ? (mode === 'tawaf' ? 'أتممت الطواف، تقبّل الله منك' : 'أتممت السعي، تقبّل الله منك') : 'اضغط الدائرة عند إتمام كل شوط'}</p>
      <p className="mb-4 rounded-xl bg-secondary p-3 text-center text-sm leading-7">
        {mode === 'tawaf' ? 'يبدأ الطواف من الحجر الأسود وينتهي عنده. ومن الدعاء بين الركن اليماني والحجر الأسود: ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار.' : 'يبدأ السعي من الصفا وينتهي بالمروة. الذهاب من الصفا إلى المروة شوط، والعودة شوط آخر.'}
      </p>
      <button type="button" onClick={() => setCount(0)} className="mx-auto flex items-center gap-2 rounded-full border border-card-border px-5 py-2"><RotateCcw size={16} />تصفير</button>
    </div>
  );
}

const bag: [string, string[]][] = [
  ['الوثائق', ['جواز السفر والتأشيرة', 'تصريح الحج أو العمرة', 'حجز الطيران والسكن', 'نسخ ورقية وصور من الوثائق', 'بطاقة تعريف بالسكن والمجموعة']],
  ['الملابس', ['إحرام (للرجال) مع حزام', 'ملابس ساترة مريحة', 'حذاء مريح وشبشب', 'ملابس داخلية كافية', 'ملابس خفيفة للطقس الحار']],
  ['الصحة والنظافة', ['أدوية خاصة مع وصفاتها', 'مرهم لتشقق الجلد ولاصقات للجروح', 'مظلة ونظارة شمسية', 'معقم ومناديل ومنظفات غير معطرة', 'زجاجة ماء قابلة للتعبئة']],
  ['أخرى', ['شاحن وبطارية متنقلة', 'مصحف صغير وكتيب أدعية', 'حقيبة صغيرة للجسم', 'مبلغ نقدي صغير', 'سجادة خفيفة']],
];

export function HajjBagPage() {
  const [checked, setChecked] = useStoredState<Record<string, boolean>>('sakeena.hajj.bag', {});
  const all = bag.flatMap(([, items]) => items);
  const done = all.filter((item) => checked[item]).length;
  return (
    <div className="rise-in pb-6" dir="rtl">
      <Back title="شنطة الحاج" />
      <div className="mb-5 rounded-[1.25rem] bg-primary p-4 text-primary-foreground">
        <div className="mb-2 flex justify-between text-sm"><span>جاهزيتك</span><strong>{done} / {all.length}</strong></div>
        <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/25"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done / all.length) * 100}%` }} /></div>
      </div>
      {bag.map(([title, items]) => (
        <section key={title} className="mb-4">
          <h2 className="mb-2 font-bold text-accent">{title}</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3">
                <input type="checkbox" checked={!!checked[item]} onChange={(e) => setChecked((c) => ({ ...c, [item]: e.target.checked }))} className="size-5 accent-[hsl(var(--primary))]" />
                <span className={checked[item] ? 'text-muted-foreground line-through' : ''}>{item}</span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
