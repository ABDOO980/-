import { ArrowRight, Check, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const passages = [
  ['الفاتحة', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'الفاتحة · ١–٦'],
  ['آية الكرسي', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', 'البقرة · ٢٥٥'],
  ['الإخلاص والمعوذتان', 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'الإخلاص والفلق والناس'],
];

export default function RuqyahPage() {
  const [completed, setCompleted] = useState<number[]>([]);
  const toggle = (index: number) => setCompleted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return (
    <div className="rise-in mx-auto max-w-3xl">
      <Link href="/more" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"><ArrowRight size={17} />كل الأدوات</Link>
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">قراءة هادئة بنية الاستشفاء والسكينة</p><h1 className="font-arabic text-3xl font-bold">الرقية الشرعية</h1></header>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent/30 bg-secondary/50 p-4 text-xs leading-6"><Shield className="mt-1 shrink-0 text-accent" size={18} /><p>اقرأ القرآن والأدعية المأثورة بإخلاص، مع الأخذ بالأسباب الطبية عند الحاجة. هذه صفحة تذكير وليست بديلًا عن الطبيب أو العالم الموثوق.</p></div>
      <div className="space-y-3">
        {passages.map(([title, text, source], index) => {
          const done = completed.includes(index);
          return <article key={title} className={`rounded-[1.5rem] border p-5 ${done ? 'border-accent/60 bg-secondary/60' : 'border-card-border bg-card'}`}><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-[0.625rem] text-accent">{source}</p></div><button onClick={() => toggle(index)} className={`grid size-9 place-items-center rounded-full border ${done ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`} aria-label={done ? `إلغاء إتمام ${title}` : `إتمام ${title}`}>{done ? <Check size={15} /> : index + 1}</button></div><p className="mt-4 font-arabic text-xl leading-[2.1]">{text}</p></article>;
        })}
      </div>
    </div>
  );
}