import { ArrowRight, Bookmark, BookOpen, ChevronLeft, Heart, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { shareOrCopy } from '@/lib/sakeena';

const articles = [
  { id: 'presence', category: 'تدبر', title: 'كيف نصنع لحظة حضور مع القرآن؟', excerpt: 'ليس المطلوب أن تنهي صفحات كثيرة؛ المطلوب أن تترك للآية فرصة أن تصل إلى قلبك.', body: 'ابدأ بدقائق قليلة، أوقف الإشعارات، واقرأ الآية ببطء. اسأل نفسك: ما الذي تقوله الآية لي اليوم؟ ثم اكتب معنى واحدًا ستأخذه معك إلى بقية اليوم.' },
  { id: 'small-deeds', category: 'تزكية', title: 'القليل الدائم أقرب إلى القلب', excerpt: 'ورد ثابت، ولو كان قصيرًا، يبني علاقة لا تنقطع.', body: 'اختر عادة واحدة قابلة للاستمرار: آيتان بعد الفجر، أو ذكر قبل النوم، أو صدقة أسبوعية. الاستمرار لا يحتاج إلى مثالية، بل إلى عودة هادئة بعد كل انقطاع.' },
  { id: 'questions', category: 'أسئلة إيمانية', title: 'ماذا أفعل عندما أشعر بالفتور؟', excerpt: 'الفتور لا يعني أن الطريق انتهى؛ أحيانًا يعني أنك تحتاج إلى خطوة أصغر.', body: 'خفف الحمل عن نفسك، وارجع إلى أصل بسيط تحبه. استعن بالصلاة والدعاء والصحبة الصالحة، ولا تجعل مقارنة نفسك بغيرك سببًا في ترك ما تستطيع.' },
  { id: 'dua', category: 'دعاء', title: 'أدب الدعاء في الأيام المزدحمة', excerpt: 'الدعاء ليس فقرة إضافية في اليوم، بل مساحة صدق قصيرة بينك وبين ربك.', body: 'سمِّ حاجتك بوضوح، وابدأ بالحمد والصلاة على النبي ﷺ، ثم ادعُ بيقين ورضا. اترك لنفسك دقيقة واحدة لا تطلب فيها إلا القرب.' },
];

export default function ArticlesPage() {
  const [selected, setSelected] = useState<(typeof articles)[number] | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const share = (article: (typeof articles)[number]) => void shareOrCopy({ title: article.title, text: article.excerpt });
  return (
    <div className="rise-in">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">إلهام يومي بلا ضجيج</p><h1 className="font-arabic text-3xl font-bold">التدبر والإلهام</h1></header>
      <section className="mb-5 rounded-[1.7rem] bg-accent p-6 text-accent-foreground"><p className="text-xs font-bold opacity-70">آية اليوم</p><p className="mt-3 font-arabic text-2xl leading-[2]">وَاذْكُر رَّبَّكَ إِذَا نَسِيتَ</p><p className="mt-2 text-xs opacity-70">الكهف · ٢٤</p></section>
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><Highlight icon={BookOpen} title="آية اليوم" text="واذكر ربك إذا نسيت" /><Highlight icon={Heart} title="حديث اليوم" text="أحب الأعمال أدومها" /><Highlight icon={Sparkles} title="دعاء اليوم" text="رب اشرح لي صدري" /></div>
      <div className="mb-4 flex items-center justify-between"><div><p className="text-xs text-accent">مختارات سَكينة</p><h2 className="mt-1 text-xl font-semibold">اقرأ وتأمل</h2></div><span className="text-xs text-muted-foreground">{articles.length} مقالات</span></div>
      <div className="space-y-3">{articles.map((article) => <article key={article.id} className="rounded-[1.35rem] border border-card-border bg-card p-5"><div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-secondary px-3 py-1 text-[0.625rem] text-accent">{article.category}</span><div className="flex gap-1"><button onClick={() => setSaved((current) => current.includes(article.id) ? current.filter((id) => id !== article.id) : [...current, article.id])} className={`rounded-lg p-2 ${saved.includes(article.id) ? 'text-accent' : 'text-muted-foreground'}`} aria-label="حفظ المقال"><Bookmark size={16} fill={saved.includes(article.id) ? 'currentColor' : 'none'} /></button><button onClick={() => share(article)} className="rounded-lg p-2 text-muted-foreground" aria-label="مشاركة المقال"><Share2 size={16} /></button></div></div><h3 className="text-lg font-bold">{article.title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{article.excerpt}</p><button onClick={() => setSelected(article)} className="mt-4 flex items-center gap-1 text-xs font-semibold text-accent">اقرأ المقال <ChevronLeft size={15} /></button></article>)}</div>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
      {selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-5 backdrop-blur"><div className="mx-auto max-w-2xl pt-8"><button onClick={() => setSelected(null)} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"><ArrowRight size={17} />إغلاق</button><span className="rounded-full bg-secondary px-3 py-1 text-xs text-accent">{selected.category}</span><h2 className="mt-5 font-arabic text-4xl leading-[1.5]">{selected.title}</h2><p className="mt-7 text-lg leading-[2.2] text-muted-foreground">{selected.body}</p><div className="mt-8 rounded-2xl border border-accent/30 bg-card p-5 text-center"><p className="font-arabic text-xl leading-[2]">اللهم انفعنا بما علمتنا وعلّمنا ما ينفعنا</p><button onClick={() => share(selected)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"><Share2 size={15} />شارك الفكرة</button></div></div></div>}
    </div>
  );
}

function Highlight({ icon: Icon, title, text }: { icon: typeof BookOpen; title: string; text: string }) {
  return <div className="rounded-2xl border border-card-border bg-card p-4"><Icon size={17} className="text-accent" /><p className="mt-3 text-[0.625rem] text-muted-foreground">{title}</p><p className="mt-1 text-sm font-semibold">{text}</p></div>;
}