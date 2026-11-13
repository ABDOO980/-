import { ArrowRight, Check, RotateCcw, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useStoredState } from '@/app/common';

type KidSurah = { id: string; name: string; meaning: string; ayat: string[] };

const surahs: KidSurah[] = [
  { id: 'fatiha', name: 'الفاتحة', meaning: 'نحمد الله ونطلب منه أن يهدينا الطريق المستقيم.', ayat: ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'الرَّحْمَٰنِ الرَّحِيمِ', 'مَالِكِ يَوْمِ الدِّينِ', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ'] },
  { id: 'ikhlas', name: 'الإخلاص', meaning: 'الله واحد، لا شريك له ولا يشبهه أحد.', ayat: ['قُلْ هُوَ اللَّهُ أَحَدٌ', 'اللَّهُ الصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ'] },
  { id: 'falaq', name: 'الفلق', meaning: 'نطلب من الله أن يحفظنا من كل شر.', ayat: ['قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', 'مِن شَرِّ مَا خَلَقَ', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'] },
  { id: 'nas', name: 'الناس', meaning: 'نلجأ إلى الله ربّ الناس ليحمينا من الوسوسة.', ayat: ['قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'مَلِكِ النَّاسِ', 'إِلَٰهِ النَّاسِ', 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', 'مِنَ الْجِنَّةِ وَالنَّاسِ'] },
  { id: 'kawthar', name: 'الكوثر', meaning: 'الله أعطى نبيَّه الخير الكثير، فنصلّي له ونشكره.', ayat: ['إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ'] },
  { id: 'asr', name: 'العصر', meaning: 'الوقت غالٍ، فلنعمل الصالحات ونتعاون على الحق والصبر.', ayat: ['وَالْعَصْرِ', 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ'] },
  { id: 'nasr', name: 'النصر', meaning: 'إذا جاء نصر الله نسبّحه ونستغفره.', ayat: ['إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ', 'وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا', 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا'] },
];

const manners = [
  ['نقول «بسم الله» قبل الأكل و«الحمد لله» بعده.', 'الأكل'],
  ['نسلّم على من نلقاه: السلام عليكم.', 'السلام'],
  ['نبرّ والدينا ونقول لهما كلامًا لطيفًا.', 'الوالدان'],
  ['نصدق في كلامنا ولا نكذب.', 'الصدق'],
  ['نحافظ على نظافة أيدينا وملابسنا.', 'النظافة'],
  ['نساعد من يحتاج ونشارك ألعابنا.', 'المشاركة'],
];

const questions = [
  { q: 'كم عدد الصلوات المفروضة في اليوم؟', options: ['3', '5', '7'], answer: 1 },
  { q: 'ما هو أول أركان الإسلام؟', options: ['الصلاة', 'الصيام', 'الشهادتان'], answer: 2 },
  { q: 'في أي شهر نصوم؟', options: ['رمضان', 'رجب', 'محرم'], answer: 0 },
  { q: 'كم عدد آيات سورة الفاتحة؟', options: ['5', '7', '9'], answer: 1 },
  { q: 'ما اسم نبيّنا الذي أُرسل إلى الناس جميعًا؟', options: ['موسى', 'عيسى', 'محمد ﷺ'], answer: 2 },
  { q: 'ماذا نقول قبل أن نبدأ الأكل؟', options: ['بسم الله', 'سبحان الله', 'الله أكبر'], answer: 0 },
];

const levels = [[0, 'بذرة صغيرة'], [5, 'نجمة ساطعة'], [15, 'بطل سَكينة'], [30, 'حافظ صغير']] as const;

export default function KidsCornerPage() {
  const [stars, setStars] = useStoredState<number>('sakeena.kids.stars', 0);
  const [done, setDone] = useStoredState<Record<string, number>>('sakeena.kids.surahs', {});
  const [open, setOpen] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const level = [...levels].reverse().find(([min]) => stars >= min)?.[1] ?? levels[0][1];
  const question = questions[qIndex];

  const markRead = (id: string) => {
    navigator.vibrate?.(15);
    setDone((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setStars((current) => current + 1);
  };
  const choose = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    if (index === question.answer) { setScore((s) => s + 1); setStars((s) => s + 1); }
  };
  const next = () => {
    if (qIndex >= questions.length - 1) { setFinished(true); return; }
    setQIndex((i) => i + 1);
    setPicked(null);
  };
  const restart = () => { setQIndex(0); setPicked(null); setScore(0); setFinished(false); };

  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <h1 className="font-arabic text-[1.75rem] font-bold">ركن الأطفال</h1>
      </header>

      <section className="mb-5 flex items-center justify-between rounded-[1.4rem] bg-primary p-4 text-primary-foreground" data-testid="card-kids-stars">
        <div><p className="text-xs opacity-80">مستواك</p><strong className="text-lg">{level}</strong></div>
        <div className="flex items-center gap-2 text-2xl font-bold"><Star size={26} fill="currentColor" />{stars}</div>
      </section>

      <h2 className="mb-3 text-lg font-bold">سور قصيرة</h2>
      <div className="mb-6 space-y-3">
        {surahs.map((surah) => (
          <div key={surah.id} className="rounded-[1.25rem] border border-card-border bg-card p-4">
            <button type="button" onClick={() => setOpen(open === surah.id ? null : surah.id)} className="flex w-full items-center justify-between text-right" data-testid={`button-kids-surah-${surah.id}`}>
              <strong className="font-arabic text-xl">سورة {surah.name}</strong>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {(done[surah.id] ?? 0) > 0 && <span className="flex items-center gap-1 text-accent"><Star size={14} fill="currentColor" />{done[surah.id]}</span>}
                {open === surah.id ? 'إغلاق' : 'افتح'}
              </span>
            </button>
            {open === surah.id && (
              <div className="mt-4">
                <p className="font-arabic text-[1.5rem] leading-[2.2] text-center">{surah.ayat.map((ayah, i) => <span key={i}>{ayah} <span className="text-accent">﴿{i + 1}﴾</span> </span>)}</p>
                <p className="mt-3 rounded-xl bg-secondary p-3 text-sm leading-7 text-secondary-foreground">معناها ببساطة: {surah.meaning}</p>
                <button type="button" onClick={() => markRead(surah.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-bold text-accent-foreground" data-testid={`button-kids-read-${surah.id}`}><Check size={18} />قرأتها! خذ نجمة</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">أخلاق وآداب</h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {manners.map(([text, title]) => (
          <div key={title} className="rounded-[1.1rem] border border-card-border bg-card p-3">
            <strong className="mb-1 block text-accent">{title}</strong>
            <p className="text-sm leading-7">{text}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">اختبر نفسك</h2>
      <section className="rounded-[1.4rem] border border-accent bg-card p-4" data-testid="card-kids-quiz">
        {finished ? (
          <div className="text-center">
            <p className="mb-1 text-lg font-bold">أحسنت! أجبت {score} من {questions.length}</p>
            <p className="mb-4 text-sm text-muted-foreground">كل إجابة صحيحة أعطتك نجمة.</p>
            <button type="button" onClick={restart} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-primary-foreground"><RotateCcw size={16} />جولة جديدة</button>
          </div>
        ) : (
          <>
            <p className="mb-1 text-xs text-muted-foreground">سؤال {qIndex + 1} من {questions.length}</p>
            <p className="mb-3 text-lg font-bold">{question.q}</p>
            <div className="space-y-2">
              {question.options.map((option, index) => {
                const isRight = picked !== null && index === question.answer;
                const isWrong = picked === index && index !== question.answer;
                return (
                  <button key={option} type="button" onClick={() => choose(index)} className={`w-full rounded-xl border px-4 py-3 text-right ${isRight ? 'border-accent bg-accent/20' : isWrong ? 'border-destructive bg-destructive/10' : 'border-card-border bg-background'}`}>{option}</button>
                );
              })}
            </div>
            {picked !== null && (
              <button type="button" onClick={next} className="mt-3 w-full rounded-full bg-primary py-3 font-bold text-primary-foreground">{qIndex >= questions.length - 1 ? 'النتيجة' : 'التالي'}</button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
