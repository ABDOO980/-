import { ArrowRight, Check, Download, FileText, Library, PenLine, RotateCcw, Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

type ToolKind = 'downloads' | 'tajweed' | 'memorization' | 'review' | 'reflections';

const toolContent: Record<ToolKind, {
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof Download;
  items: { title: string; detail: string; href?: string }[];
}> = {
  downloads: {
    title: 'التحميلات',
    eyebrow: 'المصحف والملفات المحفوظة',
    description: 'راجع ما حفظته على جهازك للوصول إليه عندما لا يتوفر اتصال.',
    icon: Download,
    items: [
      { title: 'القرآن المحفوظ', detail: 'افتح السور التي حفظتها للقراءة دون اتصال.', href: '/quran' },
      { title: 'الملفات الصوتية', detail: 'راجع الصوتيات المتاحة على جهازك.', href: '/radio' },
      { title: 'بيانات سَكينة', detail: 'صدّر أو استورد تقدمك وإعداداتك.', href: '/backup' },
    ],
  },
  tajweed: {
    title: 'دروس التجويد',
    eyebrow: 'تعلم القراءة الصحيحة',
    description: 'دروس قصيرة تبدأ من الأساسيات وتساعدك على تطبيق الحكم أثناء التلاوة.',
    icon: Library,
    items: [
      { title: 'ابدأ من المخارج', detail: 'تعرّف على مواضع الحروف وصفاتها.' },
      { title: 'المدود والغنة', detail: 'راجع أمثلة عملية قبل القراءة.' },
      { title: 'اختبر تطبيقك', detail: 'اقرأ مقطعًا قصيرًا ثم راجعه بهدوء.', href: '/recitation' },
    ],
  },
  memorization: {
    title: 'المحفظة',
    eyebrow: 'حفظ ومتابعة',
    description: 'خطة واضحة لحفظ الجديد ومراجعة ما سبق، بمقدار يناسب يومك.',
    icon: Target,
    items: [
      { title: 'اختر ورد الحفظ', detail: 'ابدأ بآيات قليلة ثابتة بدل تحميل نفسك ما لا تطيق.', href: '/tracker' },
      { title: 'افتح المقطع الحالي', detail: 'اقرأ المقطع المحدد من المصحف.', href: '/quran/1' },
      { title: 'سجّل ما أتممته', detail: 'احفظ تقدمك ثم عد للمراجعة في موعدها.', href: '/tracker' },
    ],
  },
  review: {
    title: 'مراجعة الحفظ',
    eyebrow: 'اختبر ذاكرتك',
    description: 'اقرأ من الذاكرة أولًا، ثم اكشف الآيات لتراجع مواضع الخطأ.',
    icon: RotateCcw,
    items: [
      { title: 'اختر السورة', detail: 'حدد السورة أو المقطع الذي تريد مراجعته.', href: '/recitation' },
      { title: 'اقرأ من الذاكرة', detail: 'سمّع بهدوء ولا تفتح النص قبل المحاولة.' },
      { title: 'صحح المواضع', detail: 'قارن قراءتك بالمصحف وسجّل ما يحتاج تكرارًا.', href: '/quran' },
    ],
  },
  reflections: {
    title: 'تدبراتي',
    eyebrow: 'أثر الآية في يومك',
    description: 'دوّن ما لامس قلبك من آية، وما تريد أن تحوله إلى عمل.',
    icon: PenLine,
    items: [
      { title: 'آية اليوم', detail: 'اكتب الآية أو المقطع الذي قرأته.', href: '/quran' },
      { title: 'ما الذي فهمته؟', detail: 'سجّل معنى عمليًا بكلماتك أنت.' },
      { title: 'خطوة سأعمل بها', detail: 'حوّل التدبر إلى عادة صغيرة قابلة للتنفيذ.' },
    ],
  },
};

export function NamedToolPage({ kind }: { kind: ToolKind }) {
  const content = toolContent[kind];
  const Icon = content.icon;
  const [completed, setCompleted] = useState<number[]>([]);
  const [reflection, setReflection] = useState('');
  const isReflections = kind === 'reflections';
  const toggle = (index: number) => setCompleted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return (
    <div className="rise-in mx-auto max-w-3xl">
      <Link href="/more" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"><ArrowRight size={17} />كل الأدوات</Link>
      <section className="featured-card rounded-[2rem] border bg-card p-7 md:p-10">
        <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><Icon size={25} /></span>
        <p className="mb-2 text-xs font-semibold tracking-[.16em] text-accent">سَكينة · {content.eyebrow}</p>
        <h1 className="font-arabic text-4xl">{content.title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{content.description}</p>
      </section>
      <section className="mt-6 rounded-[2rem] border border-card-border bg-card p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-accent">خطواتك داخل الأداة</p><h2 className="mt-1 text-xl font-semibold">{completed.length}/{content.items.length} مكتملة</h2></div><Check className="text-accent" size={20} /></div>
        <div className="space-y-3">
          {content.items.map((item, index) => {
            const done = completed.includes(index);
            return <article key={item.title} className={`rounded-xl p-4 ${done ? 'bg-secondary' : 'bg-secondary/45'}`}><button onClick={() => toggle(index)} className="flex w-full items-start gap-3 text-right"><span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border ${done ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{done ? <Check size={13} /> : index + 1}</span><span className="flex-1"><strong className={`block text-sm ${done ? 'text-muted-foreground line-through' : ''}`}>{item.title}</strong><small className="mt-1 block text-xs leading-6 text-muted-foreground">{item.detail}</small></span></button>{item.href && <Link href={item.href} className="mr-10 mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[0.625rem] font-bold text-primary-foreground">افتح الوجهة <ArrowRight size={13} /></Link>}</article>;
          })}
        </div>
        {isReflections && <div className="mt-5"><label className="mb-2 block text-xs text-accent">ملاحظة التدبر</label><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm leading-7 outline-none" placeholder="اكتب ما تريد الاحتفاظ به..." /><button onClick={() => setCompleted((current) => current.includes(1) ? current : [...current, 1])} className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"><FileText size={15} />احفظ التدبر على هذا الجهاز</button></div>}
      </section>
    </div>
  );
}