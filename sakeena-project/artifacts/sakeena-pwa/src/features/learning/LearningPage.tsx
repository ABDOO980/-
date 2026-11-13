import { ArrowRight, Check, ChevronLeft, Circle, Droplets, Hand, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { speakArabic } from '@/lib/sakeena';

const guides = {
  wudu: [
    ['النية', 'استحضر نية الطهارة بقلبك.'], ['غسل الكفين', 'اغسل كفيك ثلاث مرات.'], ['المضمضة والاستنشاق', 'تمضمض واستنشق ثم انثر الماء.'], ['غسل الوجه', 'اغسل وجهك من منابت الشعر إلى الذقن.'], ['اليدان', 'اغسل يديك إلى المرفقين.'], ['مسح الرأس والأذنين', 'امسح رأسك وأذنيك مرة.'], ['غسل القدمين', 'اغسل قدميك إلى الكعبين.'],
  ],
  salah: [
    ['القيام والنية', 'استقبل القبلة وانْوِ الصلاة.'], ['تكبيرة الإحرام', 'ارفع يديك وقل: الله أكبر.'], ['القراءة والركوع', 'اقرأ الفاتحة ثم اركع مطمئنًا.'], ['الرفع والسجود', 'ارفع ثم اسجد على الأعضاء السبعة.'], ['الجلوس بين السجدتين', 'اجلس وقل: رب اغفر لي.'], ['التشهد والسلام', 'أتم التشهد ثم سلّم عن يمينك ويسارك.'],
  ],
};

export default function LearningPage() {
  const [mode, setMode] = useState<'wudu' | 'salah'>('wudu');
  const [completed, setCompleted] = useState<number[]>([]);
  const steps = guides[mode];
  const toggle = (index: number) => setCompleted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return (
    <div className="rise-in">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">تعلم بالهدوء والتكرار</p><h1 className="font-arabic text-3xl font-bold">دليل الوضوء والصلاة</h1></header>
      <div className="mb-5 grid grid-cols-2 gap-3"><button onClick={() => { setMode('wudu'); setCompleted([]); }} className={`rounded-2xl border p-4 text-right ${mode === 'wudu' ? 'border-accent bg-secondary' : 'border-card-border bg-card'}`}><Droplets className="mb-3 text-accent" size={20} /><strong className="block text-sm">خطوات الوضوء</strong><small className="mt-1 block text-xs text-muted-foreground">طهارة قبل الصلاة</small></button><button onClick={() => { setMode('salah'); setCompleted([]); }} className={`rounded-2xl border p-4 text-right ${mode === 'salah' ? 'border-accent bg-secondary' : 'border-card-border bg-card'}`}><Hand className="mb-3 text-accent" size={20} /><strong className="block text-sm">صفة الصلاة</strong><small className="mt-1 block text-xs text-muted-foreground">من التكبير إلى السلام</small></button></div>
      <section className="rounded-[1.7rem] border border-card-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-accent">{mode === 'wudu' ? 'الوضوء' : 'الصلاة'}</p><h2 className="mt-1 text-xl font-semibold">خطوة بخطوة</h2></div><span className="rounded-full bg-secondary px-3 py-1 text-[0.625rem] text-accent">{completed.length}/{steps.length}</span></div><div className="space-y-3">{steps.map(([title, detail], index) => <button key={title} onClick={() => toggle(index)} className={`flex w-full items-start gap-3 rounded-xl p-4 text-right ${completed.includes(index) ? 'bg-secondary' : 'bg-secondary/40'}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full border ${completed.includes(index) ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}>{completed.includes(index) ? <Check size={14} /> : index + 1}</span><span className="flex-1"><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-6 text-muted-foreground">{detail}</span></span><ChevronLeft size={15} className="mt-1 text-muted-foreground" /></button>)}</div><button onClick={() => speakArabic(`${steps[completed.length < steps.length ? completed.length : steps.length - 1][0]}. ${steps[completed.length < steps.length ? completed.length : steps.length - 1][1]}`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 px-4 py-3 text-xs text-accent"><Play size={15} />استمع إلى شرح الخطوة</button><button onClick={() => setCompleted([])} className="mx-auto mt-3 flex items-center gap-2 text-[0.625rem] text-muted-foreground"><RotateCcw size={13} />إعادة الدليل</button></section>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}